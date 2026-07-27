// Store/website/store-view configuration and the module list. GET-only,
// admin-token compatible. Multi-store/multi-website setups often need a
// corresponding Shopify markets/multi-currency plan-tier decision. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, errorResult, jsonResult }) {
  server.tool(
    "get_store_config",
    "Get store/website/store-view configuration -- multi-store or multi-website setups often need " +
    "a corresponding Shopify markets/multi-currency plan tier decision. Combines GET " +
    "/V1/store/websites, /V1/store/storeGroups, /V1/store/storeViews, and /V1/store/storeConfigs.",
    {
      store_codes: z.array(z.string()).optional().describe(
        "Specific store view codes to get config for (default: all store views)"
      )
    },
    async ({ store_codes }) => {
      try {
        const storeCodesQuery = store_codes && store_codes.length
          ? `?${store_codes.map((code, i) => `storeCodes[${i}]=${encodeURIComponent(code)}`).join('&')}`
          : '';

        const [websites, storeGroups, storeViews, storeConfigs] = await Promise.all([
          callMagentoApi('/rest/V1/store/websites'),
          callMagentoApi('/rest/V1/store/storeGroups'),
          callMagentoApi('/rest/V1/store/storeViews'),
          callMagentoApi(`/rest/V1/store/storeConfigs${storeCodesQuery}`)
        ]);

        return jsonResult({ websites, storeGroups, storeViews, storeConfigs });
      } catch (error) {
        return errorResult("Error fetching store config", error);
      }
    }
  );

  server.tool(
    "list_websites",
    "List Magento websites (the top level of the website/store-group/store-view hierarchy)",
    {},
    async () => {
      try {
        const websites = await callMagentoApi('/rest/V1/store/websites');
        return jsonResult(websites);
      } catch (error) {
        return errorResult("Error fetching websites", error);
      }
    }
  );

  server.tool(
    "list_store_groups",
    "List Magento store groups (the middle level of the website/store-group/store-view hierarchy)",
    {},
    async () => {
      try {
        const groups = await callMagentoApi('/rest/V1/store/storeGroups');
        return jsonResult(groups);
      } catch (error) {
        return errorResult("Error fetching store groups", error);
      }
    }
  );

  server.tool(
    "list_store_views",
    "List Magento store views (the leaf level of the website/store-group/store-view hierarchy -- " +
    "usually one per language/locale)",
    {},
    async () => {
      try {
        const views = await callMagentoApi('/rest/V1/store/storeViews');
        return jsonResult(views);
      } catch (error) {
        return errorResult("Error fetching store views", error);
      }
    }
  );

  server.tool(
    "list_modules",
    "List all installed Magento modules (core + third-party/custom) -- the fastest single signal " +
    "for how customized this store is, and which vendor namespaces (app/code/Vendor/*) to expect " +
    "when reading the store's codebase for kind=feature/code items.",
    {},
    async () => {
      try {
        const modules = await callMagentoApi('/rest/V1/modules');
        return jsonResult(modules);
      } catch (error) {
        return errorResult("Error fetching modules", error);
      }
    }
  );
}

module.exports = { register };
