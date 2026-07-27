// Multi-source inventory (MSI) structure: stocks, sources, source items,
// stock-source links, plus legacy single-source stock status/low-stock.
// GET-only, admin-token compatible. Multi-source inventory has no direct
// Shopify equivalent below the Plus/Markets tier, so this structure
// directly informs migration difficulty. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, buildSearchCriteriaQuery, zSearchCriteria, errorResult, jsonResult }) {
  server.tool(
    "list_stocks",
    "List Magento's multi-source-inventory (MSI) stocks using a full Magento SearchCriteria " +
    "object -- more than one stock usually means a multi-warehouse/region setup, relevant to " +
    "Shopify Markets/plan-tier fit.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/inventory/stocks?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing stocks", error);
      }
    }
  );

  server.tool(
    "get_stock",
    "Get one MSI stock's full definition by id",
    { stock_id: z.number().describe("The stock id") },
    async ({ stock_id }) => {
      try {
        const stock = await callMagentoApi(`/rest/V1/inventory/stocks/${stock_id}`);
        return jsonResult(stock);
      } catch (error) {
        return errorResult("Error fetching stock", error);
      }
    }
  );

  server.tool(
    "list_inventory_sources",
    "List Magento's multi-source-inventory (MSI) sources (physical/virtual warehouses) using a " +
    "full Magento SearchCriteria object.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/inventory/sources?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing inventory sources", error);
      }
    }
  );

  server.tool(
    "get_inventory_source",
    "Get one MSI source's full definition by source code",
    { source_code: z.string().describe("The source code") },
    async ({ source_code }) => {
      try {
        const source = await callMagentoApi(`/rest/V1/inventory/sources/${encodeURIComponent(source_code)}`);
        return jsonResult(source);
      } catch (error) {
        return errorResult("Error fetching inventory source", error);
      }
    }
  );

  server.tool(
    "list_source_items",
    "List MSI source items (per-source, per-SKU quantity/status rows) using a full Magento " +
    "SearchCriteria object.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/inventory/source-items?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing source items", error);
      }
    }
  );

  server.tool(
    "list_stock_source_links",
    "List MSI stock<->source assignment links (which sources feed which stock, and priority) " +
    "using a full Magento SearchCriteria object.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/rest/V1/inventory/stock-source-links?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error listing stock-source links", error);
      }
    }
  );

  server.tool(
    "get_low_stock_items",
    "Get products at or below a quantity threshold (legacy single-source stock registry)",
    {
      scope_id: z.number().optional().describe("Website scope id (default: 0, default website)"),
      qty: z.number().optional().describe("Quantity threshold (default: Magento's configured value)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ scope_id, qty, current_page }) => {
      try {
        const params = [];
        if (scope_id !== undefined) params.push(`scopeId=${scope_id}`);
        if (qty !== undefined) params.push(`qty=${qty}`);
        if (current_page !== undefined) params.push(`currentPage=${current_page}`);
        const query = params.length ? `?${params.join('&')}` : '';
        const items = await callMagentoApi(`/rest/V1/stockItems/lowStock/${query}`);
        return jsonResult(items);
      } catch (error) {
        return errorResult("Error fetching low stock items", error);
      }
    }
  );

  server.tool(
    "get_stock_status_by_sku",
    "Get the legacy single-source stock status (in/out of stock, qty) for a product by SKU",
    {
      sku: z.string().describe("The product SKU"),
      scope_id: z.number().optional().describe("Website scope id (default: 0, default website)")
    },
    async ({ sku, scope_id }) => {
      try {
        const query = scope_id !== undefined ? `?scopeId=${scope_id}` : '';
        const status = await callMagentoApi(`/rest/V1/stockStatuses/${sku}${query}`);
        return jsonResult(status);
      } catch (error) {
        return errorResult("Error fetching stock status", error);
      }
    }
  );
}

module.exports = { register };
