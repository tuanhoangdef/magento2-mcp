// Tax classes, rates, and rules. GET-only, admin-token compatible.
// Multi-jurisdiction tax rule complexity is directly relevant to judging
// Shopify Tax/plan-tier fit. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, buildSearchCriteriaQuery, zSearchCriteria, errorResult, jsonResult }) {
  server.tool(
    "search_tax_classes",
    "Search tax classes using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/taxClasses/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching tax classes", error);
      }
    }
  );

  server.tool(
    "get_tax_class",
    "Get one tax class by id",
    { tax_class_id: z.number().describe("The tax class id") },
    async ({ tax_class_id }) => {
      try {
        const taxClass = await callMagentoApi(`/taxClasses/${tax_class_id}`);
        return jsonResult(taxClass);
      } catch (error) {
        return errorResult("Error fetching tax class", error);
      }
    }
  );

  server.tool(
    "search_tax_rates",
    "Search tax rates using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/taxRates/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching tax rates", error);
      }
    }
  );

  server.tool(
    "get_tax_rate",
    "Get one tax rate by id",
    { rate_id: z.number().describe("The tax rate id") },
    async ({ rate_id }) => {
      try {
        const rate = await callMagentoApi(`/taxRates/${rate_id}`);
        return jsonResult(rate);
      } catch (error) {
        return errorResult("Error fetching tax rate", error);
      }
    }
  );

  server.tool(
    "search_tax_rules",
    "Search tax rules (the class/rate/customer-group combinations that decide which rate applies) " +
    "using a full Magento SearchCriteria object -- multi-jurisdiction rule complexity is relevant " +
    "to judging Shopify Tax/plan-tier fit.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/taxRules/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching tax rules", error);
      }
    }
  );

  server.tool(
    "get_tax_rule",
    "Get one tax rule's full definition by id",
    { rule_id: z.number().describe("The tax rule id") },
    async ({ rule_id }) => {
      try {
        const rule = await callMagentoApi(`/taxRules/${rule_id}`);
        return jsonResult(rule);
      } catch (error) {
        return errorResult("Error fetching tax rule", error);
      }
    }
  );
}

module.exports = { register };
