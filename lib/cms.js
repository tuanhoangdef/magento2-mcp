// CMS pages and blocks. GET-only, admin-token compatible. Custom CMS
// content commonly needs a bespoke Shopify page/theme-section, relevant
// to kind=theme/feature migration items. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, buildSearchCriteriaQuery, zSearchCriteria, errorResult, jsonResult }) {
  server.tool(
    "search_cms_pages",
    "Search CMS pages using a full Magento SearchCriteria object -- custom CMS content commonly " +
    "needs a bespoke Shopify page/theme-section, relevant to kind=theme/feature migration items. " +
    "GET /V1/cmsPage/search.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/cmsPage/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching CMS pages", error);
      }
    }
  );

  server.tool(
    "get_cms_page",
    "Get one CMS page's full record by id",
    { page_id: z.number().describe("The CMS page id") },
    async ({ page_id }) => {
      try {
        const page = await callMagentoApi(`/rest/V1/cmsPage/${page_id}`);
        return jsonResult(page);
      } catch (error) {
        return errorResult("Error fetching CMS page", error);
      }
    }
  );

  server.tool(
    "search_cms_blocks",
    "Search CMS blocks using a full Magento SearchCriteria object -- same rationale as " +
    "search_cms_pages. GET /V1/cmsBlock/search.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/cmsBlock/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching CMS blocks", error);
      }
    }
  );

  server.tool(
    "get_cms_block",
    "Get one CMS block's full record by id",
    { block_id: z.number().describe("The CMS block id") },
    async ({ block_id }) => {
      try {
        const block = await callMagentoApi(`/rest/V1/cmsBlock/${block_id}`);
        return jsonResult(block);
      } catch (error) {
        return errorResult("Error fetching CMS block", error);
      }
    }
  );
}

module.exports = { register };
