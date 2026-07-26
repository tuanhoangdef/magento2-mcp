// Category tree, category attributes (EAV), and category<->product
// assignment. GET-only, admin-token compatible. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, buildSearchCriteriaQuery, zSearchCriteria, errorResult, jsonResult }) {
  server.tool(
    "get_category_tree",
    "Get the full category tree (not just categories for one product) -- " +
    "GET /V1/categories, per https://developer.adobe.com/commerce/webapi/reference/rest/paas",
    {
      root_category_id: z.number().optional().describe("Root category id to start from (default: store root)"),
      depth: z.number().optional().describe("Maximum depth to return (default: full depth)")
    },
    async ({ root_category_id, depth }) => {
      try {
        const params = [];
        if (root_category_id !== undefined) params.push(`rootCategoryId=${encodeURIComponent(root_category_id)}`);
        if (depth !== undefined) params.push(`depth=${encodeURIComponent(depth)}`);
        const query = params.length ? `?${params.join('&')}` : '';
        const tree = await callMagentoApi(`/categories${query}`);
        return jsonResult(tree);
      } catch (error) {
        return errorResult("Error fetching category tree", error);
      }
    }
  );

  server.tool(
    "get_category",
    "Get one category's own details by id",
    { category_id: z.number().describe("The category id") },
    async ({ category_id }) => {
      try {
        const category = await callMagentoApi(`/categories/${category_id}`);
        return jsonResult(category);
      } catch (error) {
        return errorResult("Error fetching category", error);
      }
    }
  );

  server.tool(
    "list_categories",
    "List categories (flat, not tree) using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/categories/list?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing categories", error);
      }
    }
  );

  server.tool(
    "get_category_products",
    "Get the products assigned to a category by category id",
    { category_id: z.number().describe("The category id") },
    async ({ category_id }) => {
      try {
        const products = await callMagentoApi(`/categories/${category_id}/products`);
        return jsonResult(products);
      } catch (error) {
        return errorResult("Error fetching category products", error);
      }
    }
  );

  server.tool(
    "list_category_attributes",
    "List category attributes (EAV) using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/categories/attributes?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing category attributes", error);
      }
    }
  );

  server.tool(
    "get_category_attribute",
    "Get one category attribute's full definition by code",
    { attribute_code: z.string().describe("The attribute code") },
    async ({ attribute_code }) => {
      try {
        const attribute = await callMagentoApi(`/categories/attributes/${attribute_code}`);
        return jsonResult(attribute);
      } catch (error) {
        return errorResult("Error fetching category attribute", error);
      }
    }
  );

  server.tool(
    "get_category_attribute_options",
    "Get the option id -> label mappings for a category attribute",
    { attribute_code: z.string().describe("The attribute code") },
    async ({ attribute_code }) => {
      try {
        const options = await callMagentoApi(`/categories/attributes/${attribute_code}/options`);
        return jsonResult(options);
      } catch (error) {
        return errorResult("Error fetching category attribute options", error);
      }
    }
  );
}

module.exports = { register };
