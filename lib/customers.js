// Customers, addresses, customer groups, and customer/customer-address
// attribute metadata. GET-only, admin-token compatible. Excludes
// customers/me/* (customer's own session, not accessible via admin token)
// and the password reset-link-token validator (a security utility, not
// analysis data). See https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, buildSearchCriteriaQuery, zSearchCriteria, errorResult, jsonResult }) {
  server.tool(
    "search_customers",
    "Search for customers using a full Magento SearchCriteria object (filter_groups/sort_orders/" +
    "pagination) -- build the search_criteria argument yourself per " +
    "https://developer.adobe.com/commerce/webapi/reference/rest/paas; not a single-field shortcut.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const customerData = await callMagentoApi(`/rest/V1/customers/search?${query}`);
        return jsonResult({ total_count: customerData.total_count, items: customerData.items });
      } catch (error) {
        return errorResult("Error searching customers", error);
      }
    }
  );

  server.tool(
    "get_customer",
    "Get one customer's full record by id",
    { customer_id: z.number().describe("The customer id") },
    async ({ customer_id }) => {
      try {
        const customer = await callMagentoApi(`/rest/V1/customers/${customer_id}`);
        return jsonResult(customer);
      } catch (error) {
        return errorResult("Error fetching customer", error);
      }
    }
  );

  server.tool(
    "get_customer_address",
    "Get one customer address by address id",
    { address_id: z.number().describe("The address id") },
    async ({ address_id }) => {
      try {
        const address = await callMagentoApi(`/rest/V1/customers/addresses/${address_id}`);
        return jsonResult(address);
      } catch (error) {
        return errorResult("Error fetching customer address", error);
      }
    }
  );

  server.tool(
    "get_customer_billing_address",
    "Get a customer's default billing address by customer id",
    { customer_id: z.number().describe("The customer id") },
    async ({ customer_id }) => {
      try {
        const address = await callMagentoApi(`/rest/V1/customers/${customer_id}/billingAddress`);
        return jsonResult(address);
      } catch (error) {
        return errorResult("Error fetching customer billing address", error);
      }
    }
  );

  server.tool(
    "get_customer_shipping_address",
    "Get a customer's default shipping address by customer id",
    { customer_id: z.number().describe("The customer id") },
    async ({ customer_id }) => {
      try {
        const address = await callMagentoApi(`/rest/V1/customers/${customer_id}/shippingAddress`);
        return jsonResult(address);
      } catch (error) {
        return errorResult("Error fetching customer shipping address", error);
      }
    }
  );

  server.tool(
    "get_customer_confirmation_status",
    "Check whether a customer's account (email) is confirmed",
    { customer_id: z.number().describe("The customer id") },
    async ({ customer_id }) => {
      try {
        const status = await callMagentoApi(`/rest/V1/customers/${customer_id}/confirm`);
        return jsonResult(status);
      } catch (error) {
        return errorResult("Error fetching customer confirmation status", error);
      }
    }
  );

  server.tool(
    "list_customer_groups",
    "List customer groups (e.g. General, Wholesale, Retailer) using a full Magento " +
    "SearchCriteria object -- relevant to judging Shopify B2B/customer-tag mapping.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/customerGroups/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing customer groups", error);
      }
    }
  );

  server.tool(
    "get_customer_group",
    "Get one customer group by id",
    { group_id: z.number().describe("The customer group id") },
    async ({ group_id }) => {
      try {
        const group = await callMagentoApi(`/rest/V1/customerGroups/${group_id}`);
        return jsonResult(group);
      } catch (error) {
        return errorResult("Error fetching customer group", error);
      }
    }
  );

  server.tool(
    "get_default_customer_group",
    "Get the store's default customer group (optionally for a specific store id)",
    { store_id: z.number().optional().describe("Store id (default: default store)") },
    async ({ store_id }) => {
      try {
        const endpoint = store_id !== undefined ? `/customerGroups/default/${store_id}` : '/customerGroups/default';
        const group = await callMagentoApi(endpoint);
        return jsonResult(group);
      } catch (error) {
        return errorResult("Error fetching default customer group", error);
      }
    }
  );

  server.tool(
    "get_customer_attribute_metadata",
    "Get all customer attribute metadata (EAV) -- reveals custom customer fields beyond " +
    "Magento's stock set.",
    {},
    async () => {
      try {
        const metadata = await callMagentoApi('/rest/V1/attributeMetadata/customer');
        return jsonResult(metadata);
      } catch (error) {
        return errorResult("Error fetching customer attribute metadata", error);
      }
    }
  );

  server.tool(
    "get_customer_custom_attribute_metadata",
    "Get only the CUSTOM (non-stock) customer attribute metadata",
    {},
    async () => {
      try {
        const metadata = await callMagentoApi('/rest/V1/attributeMetadata/customer/custom');
        return jsonResult(metadata);
      } catch (error) {
        return errorResult("Error fetching customer custom attribute metadata", error);
      }
    }
  );

  server.tool(
    "get_customer_address_attribute_metadata",
    "Get all customer-address attribute metadata (EAV) -- reveals custom address fields beyond " +
    "Magento's stock set.",
    {},
    async () => {
      try {
        const metadata = await callMagentoApi('/rest/V1/attributeMetadata/customerAddress');
        return jsonResult(metadata);
      } catch (error) {
        return errorResult("Error fetching customer address attribute metadata", error);
      }
    }
  );

  server.tool(
    "get_customer_address_custom_attribute_metadata",
    "Get only the CUSTOM (non-stock) customer-address attribute metadata",
    {},
    async () => {
      try {
        const metadata = await callMagentoApi('/rest/V1/attributeMetadata/customerAddress/custom');
        return jsonResult(metadata);
      } catch (error) {
        return errorResult("Error fetching customer address custom attribute metadata", error);
      }
    }
  );
}

module.exports = { register };
