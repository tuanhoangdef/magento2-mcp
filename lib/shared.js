// Shared config, HTTP helper, and SearchCriteria (de)serialization used by
// every domain module (products, categories, customers, sales, cms, tax,
// inventory, store-config, eav-directory, search). Load this once from
// mcp-server.js and pass its exports into each module's register(server, ...).

const axios = require('axios');
const { z } = require('zod');

const MAGENTO_BASE_URL = process.env.MAGENTO_BASE_URL || 'https://your-magento-store.com/rest/V1';
const MAGENTO_API_TOKEN = process.env.MAGENTO_API_TOKEN;

if (!MAGENTO_API_TOKEN) {
  console.error('ERROR: MAGENTO_API_TOKEN environment variable is required');
  process.exit(1);
}

// Helper function to make authenticated requests to Magento 2 API
async function callMagentoApi(endpoint, method = 'GET', data = null) {
  try {
    const url = `${MAGENTO_BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${MAGENTO_API_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const config = {
      method,
      url,
      headers,
      data: data ? JSON.stringify(data) : undefined,
      // Bypass SSL certificate verification for development
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Magento API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Serializes a full Magento SearchCriteriaInterface object into the
// bracket-notation query string the REST API expects. Mirrors the real
// shape documented at https://developer.adobe.com/commerce/webapi/reference/rest/paas
// (framework-search-criteria-interface / framework-search-filter-group /
// framework-filter): filter_groups is an array of groups ANDed together;
// each group's filters are ORed together; each filter is
// {field, value, condition_type}. No flattening to a single field/value --
// the caller (the agent) builds the full nested object itself so it can
// express arbitrary multi-condition queries, not just one filter.
function buildSearchCriteriaQuery(searchCriteria = {}) {
  const parts = [];

  (searchCriteria.filter_groups || []).forEach((group, groupIndex) => {
    (group.filters || []).forEach((filter, filterIndex) => {
      const prefix = `searchCriteria[filter_groups][${groupIndex}][filters][${filterIndex}]`;
      if (filter.field !== undefined) {
        parts.push(`${prefix}[field]=${encodeURIComponent(filter.field)}`);
      }
      if (filter.value !== undefined) {
        parts.push(`${prefix}[value]=${encodeURIComponent(filter.value)}`);
      }
      if (filter.condition_type !== undefined) {
        parts.push(`${prefix}[condition_type]=${encodeURIComponent(filter.condition_type)}`);
      }
    });
  });

  (searchCriteria.sort_orders || []).forEach((sort, sortIndex) => {
    const prefix = `searchCriteria[sort_orders][${sortIndex}]`;
    if (sort.field !== undefined) {
      parts.push(`${prefix}[field]=${encodeURIComponent(sort.field)}`);
    }
    if (sort.direction !== undefined) {
      parts.push(`${prefix}[direction]=${encodeURIComponent(sort.direction)}`);
    }
  });

  if (searchCriteria.page_size !== undefined) {
    parts.push(`searchCriteria[pageSize]=${encodeURIComponent(searchCriteria.page_size)}`);
  }
  if (searchCriteria.current_page !== undefined) {
    parts.push(`searchCriteria[currentPage]=${encodeURIComponent(searchCriteria.current_page)}`);
  }

  return parts.join('&');
}

// Helper function to fetch all pages for a given search criteria (query
// string already built via buildSearchCriteriaQuery or equivalent).
async function fetchAllPages(endpoint, baseSearchCriteria) {
  const pageSize = 100;
  let currentPage = 1;
  let allItems = [];
  let totalCount = 0;

  do {
    let currentPageSearchCriteria = baseSearchCriteria;
    if (!currentPageSearchCriteria.includes('searchCriteria[pageSize]')) {
      currentPageSearchCriteria += `&searchCriteria[pageSize]=${pageSize}`;
    }
    if (!currentPageSearchCriteria.includes('searchCriteria[currentPage]')) {
      currentPageSearchCriteria += `&searchCriteria[currentPage]=${currentPage}`;
    } else {
      currentPageSearchCriteria = currentPageSearchCriteria.replace(
        /searchCriteria\[currentPage\]=\d+/,
        `searchCriteria[currentPage]=${currentPage}`
      );
    }

    const responseData = await callMagentoApi(`${endpoint}?${currentPageSearchCriteria}`);

    if (responseData.items && Array.isArray(responseData.items)) {
      allItems = allItems.concat(responseData.items);
    }

    if (currentPage === 1) {
      totalCount = responseData.total_count || 0;
    }

    if (totalCount <= allItems.length || !responseData.items || responseData.items.length < pageSize) {
      break;
    }

    currentPage++;
  } while (true);

  return allItems;
}

// Zod schema for one Magento SearchCriteria filter: {field, value, condition_type}.
const zFilter = z.object({
  field: z.string().describe("Attribute/field name to filter on, e.g. 'email', 'status', 'created_at'"),
  value: z.string().describe("Filter value (as a string; Magento coerces per field type)"),
  condition_type: z.string().optional().describe(
    "Comparison operator: eq, neq, like, nlike, gt, lt, gteq, lteq, in, nin, null, notnull, moreq, finset (default: eq)"
  )
});

// Zod schema for the full SearchCriteriaInterface object the agent builds
// itself -- filter_groups (AND between groups, OR within a group's
// filters), optional sort_orders, and pagination. Matches
// framework-search-criteria-interface exactly; no simplification.
const zSearchCriteria = z.object({
  filter_groups: z.array(
    z.object({
      filters: z.array(zFilter).describe("Filters in this group, combined with OR")
    })
  ).optional().describe("Filter groups, combined with AND between groups; omit to match all records"),
  sort_orders: z.array(
    z.object({
      field: z.string(),
      direction: z.enum(["ASC", "DESC"]).optional()
    })
  ).optional().describe("Sort order(s) to apply"),
  page_size: z.number().optional().describe("Number of results per page (Magento default: 20)"),
  current_page: z.number().optional().describe("Page number, 1-indexed (default: 1)")
}).describe(
  "Full Magento SearchCriteria object -- see " +
  "https://developer.adobe.com/commerce/webapi/reference/rest/paas for the complete " +
  "reference. Build filter_groups/sort_orders yourself; nothing here is auto-simplified."
);

// Standard MCP tool error-response shape used across every domain module.
function errorResult(prefix, error) {
  return {
    content: [
      {
        type: "text",
        text: `${prefix}: ${error.response?.data?.message || error.message}`
      }
    ],
    isError: true
  };
}

// Standard MCP tool success-response shape (JSON payload as pretty text).
function jsonResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

module.exports = {
  MAGENTO_BASE_URL,
  MAGENTO_API_TOKEN,
  callMagentoApi,
  buildSearchCriteriaQuery,
  fetchAllPages,
  zFilter,
  zSearchCriteria,
  errorResult,
  jsonResult,
  z
};
