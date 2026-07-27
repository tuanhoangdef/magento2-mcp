// Product catalog: search/lookup, attributes/attribute-sets, media,
// custom options, links (related/upsell/crosssell), group prices,
// downloadable links, and configurable/bundle product structure.
// GET-only, admin-token compatible. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function formatProduct(product) {
  if (!product) return "Product not found";

  const customAttributes = {};
  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
    product.custom_attributes.forEach(attr => {
      customAttributes[attr.attribute_code] = attr.value;
    });
  }

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    status: product.status,
    visibility: product.visibility,
    type_id: product.type_id,
    created_at: product.created_at,
    updated_at: product.updated_at,
    extension_attributes: product.extension_attributes,
    custom_attributes: customAttributes
  };
}

function formatSearchResults(results) {
  if (!results || !results.items || !Array.isArray(results.items)) {
    return "No products found";
  }

  return {
    total_count: results.total_count,
    items: results.items.map(item => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      price: item.price,
      status: item.status,
      type_id: item.type_id
    }))
  };
}

function register(server, { z, callMagentoApi, buildSearchCriteriaQuery, zSearchCriteria, errorResult, jsonResult }) {
  server.tool(
    "get_product_by_sku",
    "Get detailed information about a product by its SKU",
    { sku: z.string().describe("The SKU (Stock Keeping Unit) of the product") },
    async ({ sku }) => {
      try {
        const productData = await callMagentoApi(`/rest/V1/products/${sku}`);
        return jsonResult(formatProduct(productData));
      } catch (error) {
        return errorResult("Error fetching product", error);
      }
    }
  );

  server.tool(
    "search_products",
    "Search for products using a full Magento SearchCriteria object (filter_groups/sort_orders/" +
    "pagination) -- build the search_criteria argument yourself per " +
    "https://developer.adobe.com/commerce/webapi/reference/rest/paas; not a single-field shortcut.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const productData = await callMagentoApi(`/rest/V1/products?${query}`);
        return jsonResult(formatSearchResults(productData));
      } catch (error) {
        return errorResult("Error searching products", error);
      }
    }
  );

  server.tool(
    "get_product_by_id",
    "Get detailed information about a product by its ID",
    { id: z.number().describe("The ID of the product") },
    async ({ id }) => {
      try {
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=entity_id&` +
                              `searchCriteria[filter_groups][0][filters][0][value]=${id}&` +
                              `searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
        const searchResults = await callMagentoApi(`/rest/V1/products?${searchCriteria}`);
        if (!searchResults.items || searchResults.items.length === 0) {
          return jsonResult(`No product found with ID: ${id}`);
        }
        const sku = searchResults.items[0].sku;
        const productData = await callMagentoApi(`/rest/V1/products/${sku}`);
        return jsonResult(formatProduct(productData));
      } catch (error) {
        return errorResult("Error fetching product", error);
      }
    }
  );

  server.tool(
    "get_product_categories",
    "Get categories for a specific product by SKU",
    { sku: z.string().describe("The SKU (Stock Keeping Unit) of the product") },
    async ({ sku }) => {
      try {
        const productData = await callMagentoApi(`/rest/V1/products/${sku}`);
        const categoryAttribute = productData.custom_attributes?.find(
          attr => attr.attribute_code === 'category_ids'
        );
        if (!categoryAttribute || !categoryAttribute.value) {
          return jsonResult(`No categories found for product with SKU: ${sku}`);
        }
        let categoryIds = categoryAttribute.value;
        if (typeof categoryIds === 'string') {
          try {
            categoryIds = JSON.parse(categoryIds);
          } catch (e) {
            categoryIds = categoryIds.split(',').map(id => id.trim());
          }
        }
        if (!Array.isArray(categoryIds)) {
          categoryIds = [categoryIds];
        }
        const categoryPromises = categoryIds.map(id =>
          callMagentoApi(`/rest/V1/categories/${id}`).catch(err => ({ id, error: err.message }))
        );
        const categories = await Promise.all(categoryPromises);
        return jsonResult(categories);
      } catch (error) {
        return errorResult("Error fetching product categories", error);
      }
    }
  );

  server.tool(
    "get_related_products",
    "Get products related to a specific product by SKU",
    { sku: z.string().describe("The SKU (Stock Keeping Unit) of the product") },
    async ({ sku }) => {
      try {
        const relatedProducts = await callMagentoApi(`/rest/V1/products/${sku}/links/related`);
        if (!relatedProducts || relatedProducts.length === 0) {
          return jsonResult(`No related products found for SKU: ${sku}`);
        }
        const productPromises = relatedProducts.map(related =>
          callMagentoApi(`/rest/V1/products/${related.linked_product_sku}`)
            .then(product => formatProduct(product))
            .catch(err => ({ sku: related.linked_product_sku, error: err.message }))
        );
        const products = await Promise.all(productPromises);
        return jsonResult(products);
      } catch (error) {
        return errorResult("Error fetching related products", error);
      }
    }
  );

  server.tool(
    "get_product_links",
    "Get a product's linked items of a specific link type (e.g. related, upsell, crosssell). " +
    "Use list_product_link_types to see which types this store defines.",
    {
      sku: z.string().describe("The SKU of the product"),
      type: z.string().describe("Link type code, e.g. 'related', 'upsell', 'crosssell'")
    },
    async ({ sku, type }) => {
      try {
        const links = await callMagentoApi(`/rest/V1/products/${sku}/links/${type}`);
        return jsonResult(links);
      } catch (error) {
        return errorResult("Error fetching product links", error);
      }
    }
  );

  server.tool(
    "list_product_link_types",
    "List the product link type codes this Magento instance supports (e.g. related, upsell, " +
    "crosssell), and the attributes each type carries.",
    {},
    async () => {
      try {
        const types = await callMagentoApi('/rest/V1/products/links/types');
        return jsonResult(types);
      } catch (error) {
        return errorResult("Error fetching product link types", error);
      }
    }
  );

  server.tool(
    "get_product_stock",
    "Get stock information for a product by SKU",
    { sku: z.string().describe("The SKU (Stock Keeping Unit) of the product") },
    async ({ sku }) => {
      try {
        const stockData = await callMagentoApi(`/rest/V1/stockItems/${sku}`);
        return jsonResult(stockData);
      } catch (error) {
        return errorResult("Error fetching stock information", error);
      }
    }
  );

  server.tool(
    "get_product_attributes",
    "Get all attributes for a product by SKU",
    { sku: z.string().describe("The SKU (Stock Keeping Unit) of the product") },
    async ({ sku }) => {
      try {
        const productData = await callMagentoApi(`/rest/V1/products/${sku}`);
        const attributes = {
          base_attributes: {
            id: productData.id,
            sku: productData.sku,
            name: productData.name,
            price: productData.price,
            status: productData.status,
            visibility: productData.visibility,
            type_id: productData.type_id
          },
          custom_attributes: {}
        };
        if (productData.custom_attributes && Array.isArray(productData.custom_attributes)) {
          productData.custom_attributes.forEach(attr => {
            attributes.custom_attributes[attr.attribute_code] = attr.value;
          });
        }
        return jsonResult(attributes);
      } catch (error) {
        return errorResult("Error fetching product attributes", error);
      }
    }
  );

  server.tool(
    "update_product_attribute",
    "Update a specific attribute of a product by SKU",
    {
      sku: z.string().describe("The SKU (Stock Keeping Unit) of the product"),
      attribute_code: z.string().describe("The code of the attribute to update"),
      value: z.any().describe("The new value for the attribute")
    },
    async ({ sku, attribute_code, value }) => {
      try {
        const productData = await callMagentoApi(`/rest/V1/products/${sku}`).catch(() => null);
        if (!productData) {
          return { content: [{ type: "text", text: `Product with SKU '${sku}' not found` }], isError: true };
        }
        const updateData = { product: {} };
        const isCustomAttribute = productData.custom_attributes &&
          productData.custom_attributes.some(attr => attr.attribute_code === attribute_code);
        if (isCustomAttribute) {
          updateData.product.custom_attributes = [{ attribute_code, value }];
        } else {
          updateData.product[attribute_code] = value;
        }
        const result = await callMagentoApi(`/rest/V1/products/${sku}`, 'PUT', updateData);
        return jsonResult(formatProduct(result));
      } catch (error) {
        return errorResult("Error updating product attribute", error);
      }
    }
  );

  server.tool(
    "get_attribute_options",
    "Get the option id -> label mappings for a product attribute (e.g. color, size)",
    { attribute_code: z.string().describe("The attribute code (e.g. 'color', 'size')") },
    async ({ attribute_code }) => {
      try {
        const options = await callMagentoApi(`/rest/V1/products/attributes/${attribute_code}/options`);
        const formattedOptions = Array.isArray(options)
          ? options.map(opt => ({ value: opt.value, label: opt.label }))
          : [];
        return jsonResult(formattedOptions);
      } catch (error) {
        return errorResult("Error fetching attribute options", error);
      }
    }
  );

  server.tool(
    "list_product_attributes",
    "List product attributes (EAV) using a full Magento SearchCriteria object -- reveals custom " +
    "attributes beyond Magento's stock set, relevant to judging Shopify metafield mapping effort.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/products/attributes?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing product attributes", error);
      }
    }
  );

  server.tool(
    "get_product_attribute",
    "Get one product attribute's full definition by code (frontend_input, is_required, scope, etc.)",
    { attribute_code: z.string().describe("The attribute code") },
    async ({ attribute_code }) => {
      try {
        const attribute = await callMagentoApi(`/rest/V1/products/attributes/${attribute_code}`);
        return jsonResult(attribute);
      } catch (error) {
        return errorResult("Error fetching product attribute", error);
      }
    }
  );

  server.tool(
    "list_product_attribute_types",
    "List the input types available for product attributes (text, select, price, etc.)",
    {},
    async () => {
      try {
        const types = await callMagentoApi('/rest/V1/products/attributes/types');
        return jsonResult(types);
      } catch (error) {
        return errorResult("Error fetching attribute types", error);
      }
    }
  );

  server.tool(
    "list_attribute_sets",
    "List product attribute sets using a full Magento SearchCriteria object -- reveals custom EAV " +
    "structure (attribute sets beyond Magento's 'Default') that often has no clean Shopify " +
    "metafield equivalent. GET /V1/products/attribute-sets/sets/list.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/products/attribute-sets/sets/list?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing attribute sets", error);
      }
    }
  );

  server.tool(
    "get_attribute_set_attributes",
    "Get all attributes belonging to a specific attribute set by id -- use with list_attribute_sets " +
    "to see the full custom EAV shape for a set. GET /V1/products/attribute-sets/{id}/attributes.",
    { attribute_set_id: z.number().describe("The attribute set id (from list_attribute_sets)") },
    async ({ attribute_set_id }) => {
      try {
        const attributes = await callMagentoApi(`/rest/V1/products/attribute-sets/${attribute_set_id}/attributes`);
        return jsonResult(attributes);
      } catch (error) {
        return errorResult("Error fetching attribute set attributes", error);
      }
    }
  );

  server.tool(
    "get_attribute_set",
    "Get one attribute set's own metadata by id (name, sort_order, entity_type)",
    { attribute_set_id: z.number().describe("The attribute set id") },
    async ({ attribute_set_id }) => {
      try {
        const attributeSet = await callMagentoApi(`/rest/V1/products/attribute-sets/${attribute_set_id}`);
        return jsonResult(attributeSet);
      } catch (error) {
        return errorResult("Error fetching attribute set", error);
      }
    }
  );

  server.tool(
    "list_attribute_set_groups",
    "List attribute groups (sub-sections within an attribute set, e.g. 'General', 'Prices') using a " +
    "full Magento SearchCriteria object.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/products/attribute-sets/groups/list?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing attribute set groups", error);
      }
    }
  );

  server.tool(
    "list_product_types",
    "List the product type codes this Magento instance supports (simple, configurable, bundle, " +
    "grouped, virtual, downloadable) -- directly relevant to judging Shopify variant/bundle mapping.",
    {},
    async () => {
      try {
        const types = await callMagentoApi('/rest/V1/products/types');
        return jsonResult(types);
      } catch (error) {
        return errorResult("Error fetching product types", error);
      }
    }
  );

  server.tool(
    "get_product_media",
    "Get all media gallery entries (images/videos) for a product by SKU",
    { sku: z.string().describe("The SKU of the product") },
    async ({ sku }) => {
      try {
        const media = await callMagentoApi(`/rest/V1/products/${sku}/media`);
        return jsonResult(media);
      } catch (error) {
        return errorResult("Error fetching product media", error);
      }
    }
  );

  server.tool(
    "get_product_media_entry",
    "Get one specific media gallery entry for a product by SKU and entry id",
    {
      sku: z.string().describe("The SKU of the product"),
      entry_id: z.number().describe("The media gallery entry id")
    },
    async ({ sku, entry_id }) => {
      try {
        const entry = await callMagentoApi(`/rest/V1/products/${sku}/media/${entry_id}`);
        return jsonResult(entry);
      } catch (error) {
        return errorResult("Error fetching product media entry", error);
      }
    }
  );

  server.tool(
    "list_product_media_types",
    "List which media attribute roles (image, small_image, thumbnail, swatch_image) exist for a " +
    "given attribute set name.",
    { attribute_set_name: z.string().describe("The attribute set name (not id)") },
    async ({ attribute_set_name }) => {
      try {
        const types = await callMagentoApi(`/rest/V1/products/media/types/${encodeURIComponent(attribute_set_name)}`);
        return jsonResult(types);
      } catch (error) {
        return errorResult("Error fetching product media types", error);
      }
    }
  );

  server.tool(
    "get_product_custom_options",
    "Get all custom options (e.g. engraving text, gift wrap) for a product by SKU",
    { sku: z.string().describe("The SKU of the product") },
    async ({ sku }) => {
      try {
        const options = await callMagentoApi(`/rest/V1/products/${sku}/options`);
        return jsonResult(options);
      } catch (error) {
        return errorResult("Error fetching product custom options", error);
      }
    }
  );

  server.tool(
    "get_product_custom_option",
    "Get one specific custom option for a product by SKU and option id",
    {
      sku: z.string().describe("The SKU of the product"),
      option_id: z.number().describe("The custom option id")
    },
    async ({ sku, option_id }) => {
      try {
        const option = await callMagentoApi(`/rest/V1/products/${sku}/options/${option_id}`);
        return jsonResult(option);
      } catch (error) {
        return errorResult("Error fetching product custom option", error);
      }
    }
  );

  server.tool(
    "list_product_custom_option_types",
    "List the custom-option input types this Magento instance supports (field, area, file, " +
    "drop_down, radio_buttons, checkbox, date, etc.)",
    {},
    async () => {
      try {
        const types = await callMagentoApi('/rest/V1/products/options/types');
        return jsonResult(types);
      } catch (error) {
        return errorResult("Error fetching custom option types", error);
      }
    }
  );

  server.tool(
    "get_product_downloadable_links",
    "Get downloadable links (files) for a downloadable-type product by SKU",
    { sku: z.string().describe("The SKU of the product") },
    async ({ sku }) => {
      try {
        const links = await callMagentoApi(`/rest/V1/products/${sku}/downloadable-links`);
        return jsonResult(links);
      } catch (error) {
        return errorResult("Error fetching downloadable links", error);
      }
    }
  );

  server.tool(
    "get_product_downloadable_samples",
    "Get downloadable sample files for a downloadable-type product by SKU",
    { sku: z.string().describe("The SKU of the product") },
    async ({ sku }) => {
      try {
        const samples = await callMagentoApi(`/rest/V1/products/${sku}/downloadable-links/samples`);
        return jsonResult(samples);
      } catch (error) {
        return errorResult("Error fetching downloadable samples", error);
      }
    }
  );

  server.tool(
    "get_product_tier_prices",
    "Get tier (quantity-break) prices for a product by SKU, scoped to a customer group id",
    {
      sku: z.string().describe("The SKU of the product"),
      customer_group_id: z.number().describe("The customer group id (see list_customer_groups)")
    },
    async ({ sku, customer_group_id }) => {
      try {
        const tiers = await callMagentoApi(`/rest/V1/products/${sku}/group-prices/${customer_group_id}/tiers`);
        return jsonResult(tiers);
      } catch (error) {
        return errorResult("Error fetching tier prices", error);
      }
    }
  );

  server.tool(
    "get_configurable_product_children",
    "Get the simple-product children (variations) of a configurable product by SKU",
    { sku: z.string().describe("The SKU of the configurable product") },
    async ({ sku }) => {
      try {
        const children = await callMagentoApi(`/rest/V1/configurable-products/${sku}/children`);
        return jsonResult(children);
      } catch (error) {
        return errorResult("Error fetching configurable product children", error);
      }
    }
  );

  server.tool(
    "get_configurable_product_options",
    "Get all configurable options (e.g. color/size axes) for a configurable product by SKU",
    { sku: z.string().describe("The SKU of the configurable product") },
    async ({ sku }) => {
      try {
        const options = await callMagentoApi(`/rest/V1/configurable-products/${sku}/options/all`);
        return jsonResult(options);
      } catch (error) {
        return errorResult("Error fetching configurable product options", error);
      }
    }
  );

  server.tool(
    "get_configurable_product_option",
    "Get one specific configurable option for a configurable product by SKU and option id",
    {
      sku: z.string().describe("The SKU of the configurable product"),
      option_id: z.number().describe("The configurable option id")
    },
    async ({ sku, option_id }) => {
      try {
        const option = await callMagentoApi(`/rest/V1/configurable-products/${sku}/options/${option_id}`);
        return jsonResult(option);
      } catch (error) {
        return errorResult("Error fetching configurable product option", error);
      }
    }
  );

  server.tool(
    "get_bundle_product_children",
    "Get the linked child products of a bundle product by SKU",
    {
      sku: z.string().describe("The SKU of the bundle product"),
      option_id: z.number().optional().describe("Optionally restrict to one bundle option's children")
    },
    async ({ sku, option_id }) => {
      try {
        const query = option_id !== undefined ? `?optionId=${option_id}` : '';
        const children = await callMagentoApi(`/rest/V1/bundle-products/${sku}/children${query}`);
        return jsonResult(children);
      } catch (error) {
        return errorResult("Error fetching bundle product children", error);
      }
    }
  );

  server.tool(
    "get_bundle_product_options",
    "Get all bundle options for a bundle product by SKU",
    { sku: z.string().describe("The SKU of the bundle product") },
    async ({ sku }) => {
      try {
        const options = await callMagentoApi(`/rest/V1/bundle-products/${sku}/options/all`);
        return jsonResult(options);
      } catch (error) {
        return errorResult("Error fetching bundle product options", error);
      }
    }
  );

  server.tool(
    "get_bundle_product_option",
    "Get one specific bundle option for a bundle product by SKU and option id",
    {
      sku: z.string().describe("The SKU of the bundle product"),
      option_id: z.number().describe("The bundle option id")
    },
    async ({ sku, option_id }) => {
      try {
        const option = await callMagentoApi(`/rest/V1/bundle-products/${sku}/options/${option_id}`);
        return jsonResult(option);
      } catch (error) {
        return errorResult("Error fetching bundle product option", error);
      }
    }
  );

  server.tool(
    "list_bundle_option_types",
    "List the bundle-option input types this Magento instance supports (select, radio, checkbox, " +
    "multi, etc.)",
    {},
    async () => {
      try {
        const types = await callMagentoApi('/rest/V1/bundle-products/options/types');
        return jsonResult(types);
      } catch (error) {
        return errorResult("Error fetching bundle option types", error);
      }
    }
  );
}

module.exports = { register, formatProduct, formatSearchResults };
