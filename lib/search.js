// Low-level full-text search-engine query (Elasticsearch/OpenSearch),
// distinct from the per-entity SearchCriteria search tools elsewhere.
// Requires a configured search request name (e.g. quick_search_container)
// -- less commonly useful for migration analysis than the entity-specific
// search tools, but included for completeness. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, buildSearchCriteriaQuery, zSearchCriteria, errorResult, jsonResult }) {
  server.tool(
    "full_text_search",
    "Run a low-level full-text search-engine query (GET /V1/search) against a configured search " +
    "request (e.g. 'quick_search_container' for the storefront quick-search index). Distinct " +
    "from the entity-specific search_products/search_customers/etc. tools -- this hits the " +
    "search engine (Elasticsearch/OpenSearch) directly and requires the request_name to exist.",
    {
      request_name: z.string().describe("The configured search request name, e.g. 'quick_search_container'"),
      search_criteria: zSearchCriteria
    },
    async ({ request_name, search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const separator = query ? '&' : '';
        const data = await callMagentoApi(
          `/search?searchCriteria[requestName]=${encodeURIComponent(request_name)}${separator}${query}`
        );
        return jsonResult(data);
      } catch (error) {
        return errorResult("Error running full-text search", error);
      }
    }
  );
}

module.exports = { register };
