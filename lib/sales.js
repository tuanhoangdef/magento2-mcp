// Orders, invoices, shipments, credit memos, transactions, RMA returns,
// sales rules/coupons, and the revenue/sales-analytics reports built on
// top of them. GET-only, admin-token compatible. Excludes
// returns/{id}/labels (binary PDF, not analysis data). See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, deps) {
  const { z, callMagentoApi, buildSearchCriteriaQuery, fetchAllPages, zSearchCriteria, errorResult, jsonResult } = deps;
  const { parseDateExpression, buildDateRangeFilter, normalizeCountry, format } = deps.dates;
  const { formatProduct } = deps.products;

  server.tool(
    "search_orders",
    "Search for orders using a full Magento SearchCriteria object (filter_groups/sort_orders/" +
    "pagination) -- build the search_criteria argument yourself per " +
    "https://developer.adobe.com/commerce/webapi/reference/rest/paas; not a single-field shortcut.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const orderData = await callMagentoApi(`/orders?${query}`);
        return jsonResult({ total_count: orderData.total_count, items: orderData.items });
      } catch (error) {
        return errorResult("Error searching orders", error);
      }
    }
  );

  server.tool(
    "get_order",
    "Get one order's full record by id",
    { order_id: z.number().describe("The order (entity) id") },
    async ({ order_id }) => {
      try {
        const order = await callMagentoApi(`/orders/${order_id}`);
        return jsonResult(order);
      } catch (error) {
        return errorResult("Error fetching order", error);
      }
    }
  );

  server.tool(
    "get_order_comments",
    "Get the status-history comment thread for an order by id",
    { order_id: z.number().describe("The order id") },
    async ({ order_id }) => {
      try {
        const comments = await callMagentoApi(`/orders/${order_id}/comments`);
        return jsonResult(comments);
      } catch (error) {
        return errorResult("Error fetching order comments", error);
      }
    }
  );

  server.tool(
    "get_order_statuses",
    "Get the possible statuses for an order's current state (id)",
    { order_id: z.number().describe("The order id") },
    async ({ order_id }) => {
      try {
        const statuses = await callMagentoApi(`/orders/${order_id}/statuses`);
        return jsonResult(statuses);
      } catch (error) {
        return errorResult("Error fetching order statuses", error);
      }
    }
  );

  server.tool(
    "search_order_items",
    "Search order line items directly (not grouped by order) using a full Magento SearchCriteria " +
    "object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/orders/items?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching order items", error);
      }
    }
  );

  server.tool(
    "get_order_item",
    "Get one order line item by id",
    { item_id: z.number().describe("The order item id") },
    async ({ item_id }) => {
      try {
        const item = await callMagentoApi(`/orders/items/${item_id}`);
        return jsonResult(item);
      } catch (error) {
        return errorResult("Error fetching order item", error);
      }
    }
  );

  server.tool(
    "search_invoices",
    "Search invoices using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/invoices?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching invoices", error);
      }
    }
  );

  server.tool(
    "get_invoice",
    "Get one invoice's full record by id",
    { invoice_id: z.number().describe("The invoice id") },
    async ({ invoice_id }) => {
      try {
        const invoice = await callMagentoApi(`/invoices/${invoice_id}`);
        return jsonResult(invoice);
      } catch (error) {
        return errorResult("Error fetching invoice", error);
      }
    }
  );

  server.tool(
    "get_invoice_comments",
    "Get the comment thread for an invoice by id",
    { invoice_id: z.number().describe("The invoice id") },
    async ({ invoice_id }) => {
      try {
        const comments = await callMagentoApi(`/invoices/${invoice_id}/comments`);
        return jsonResult(comments);
      } catch (error) {
        return errorResult("Error fetching invoice comments", error);
      }
    }
  );

  server.tool(
    "search_shipments",
    "Search shipments using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/shipments?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching shipments", error);
      }
    }
  );

  server.tool(
    "get_shipment",
    "Get one shipment's full record by id",
    { shipment_id: z.number().describe("The shipment id") },
    async ({ shipment_id }) => {
      try {
        const shipment = await callMagentoApi(`/shipment/${shipment_id}`);
        return jsonResult(shipment);
      } catch (error) {
        return errorResult("Error fetching shipment", error);
      }
    }
  );

  server.tool(
    "get_shipment_comments",
    "Get the comment thread for a shipment by id",
    { shipment_id: z.number().describe("The shipment id") },
    async ({ shipment_id }) => {
      try {
        const comments = await callMagentoApi(`/shipment/${shipment_id}/comments`);
        return jsonResult(comments);
      } catch (error) {
        return errorResult("Error fetching shipment comments", error);
      }
    }
  );

  server.tool(
    "search_creditmemos",
    "Search credit memos (refunds) using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/creditmemos?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching credit memos", error);
      }
    }
  );

  server.tool(
    "get_creditmemo",
    "Get one credit memo's full record by id",
    { creditmemo_id: z.number().describe("The credit memo id") },
    async ({ creditmemo_id }) => {
      try {
        const creditmemo = await callMagentoApi(`/creditmemo/${creditmemo_id}`);
        return jsonResult(creditmemo);
      } catch (error) {
        return errorResult("Error fetching credit memo", error);
      }
    }
  );

  server.tool(
    "get_creditmemo_comments",
    "Get the comment thread for a credit memo by id",
    { creditmemo_id: z.number().describe("The credit memo id") },
    async ({ creditmemo_id }) => {
      try {
        const comments = await callMagentoApi(`/creditmemo/${creditmemo_id}/comments`);
        return jsonResult(comments);
      } catch (error) {
        return errorResult("Error fetching credit memo comments", error);
      }
    }
  );

  server.tool(
    "search_transactions",
    "Search payment transactions using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/transactions?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching transactions", error);
      }
    }
  );

  server.tool(
    "get_transaction",
    "Get one payment transaction's full record by id",
    { transaction_id: z.number().describe("The transaction id") },
    async ({ transaction_id }) => {
      try {
        const transaction = await callMagentoApi(`/transactions/${transaction_id}`);
        return jsonResult(transaction);
      } catch (error) {
        return errorResult("Error fetching transaction", error);
      }
    }
  );

  server.tool(
    "search_returns",
    "Search RMA returns using a full Magento SearchCriteria object -- if this store has no " +
    "returns module installed, this will error, which itself is a useful migration-analysis signal.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/returns?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching returns", error);
      }
    }
  );

  server.tool(
    "get_return",
    "Get one RMA return's full record by id",
    { return_id: z.number().describe("The return id") },
    async ({ return_id }) => {
      try {
        const rma = await callMagentoApi(`/returns/${return_id}`);
        return jsonResult(rma);
      } catch (error) {
        return errorResult("Error fetching return", error);
      }
    }
  );

  server.tool(
    "get_return_comments",
    "Get the comment thread for an RMA return by id",
    { return_id: z.number().describe("The return id") },
    async ({ return_id }) => {
      try {
        const comments = await callMagentoApi(`/returns/${return_id}/comments`);
        return jsonResult(comments);
      } catch (error) {
        return errorResult("Error fetching return comments", error);
      }
    }
  );

  server.tool(
    "get_return_tracking_numbers",
    "Get shipment tracking numbers attached to an RMA return by id",
    { return_id: z.number().describe("The return id") },
    async ({ return_id }) => {
      try {
        const tracking = await callMagentoApi(`/returns/${return_id}/tracking-numbers`);
        return jsonResult(tracking);
      } catch (error) {
        return errorResult("Error fetching return tracking numbers", error);
      }
    }
  );

  server.tool(
    "get_returns_attribute_metadata",
    "Get all RMA return attribute metadata (EAV) -- reveals custom return fields, or errors if " +
    "the returns module isn't installed on this store.",
    {},
    async () => {
      try {
        const metadata = await callMagentoApi('/returnsAttributeMetadata');
        return jsonResult(metadata);
      } catch (error) {
        return errorResult("Error fetching returns attribute metadata", error);
      }
    }
  );

  server.tool(
    "search_sales_rules",
    "Search cart price rules (sales rules / discounts / promotions) using a full Magento " +
    "SearchCriteria object -- rule structure often has no clean 1:1 Shopify discount equivalent.",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/salesRules/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching sales rules", error);
      }
    }
  );

  server.tool(
    "get_sales_rule",
    "Get one cart price rule's full definition by id",
    { rule_id: z.number().describe("The sales rule id") },
    async ({ rule_id }) => {
      try {
        const rule = await callMagentoApi(`/salesRules/${rule_id}`);
        return jsonResult(rule);
      } catch (error) {
        return errorResult("Error fetching sales rule", error);
      }
    }
  );

  server.tool(
    "search_coupons",
    "Search coupon codes using a full Magento SearchCriteria object",
    { search_criteria: zSearchCriteria },
    async ({ search_criteria }) => {
      try {
        const query = buildSearchCriteriaQuery(search_criteria);
        const data = await callMagentoApi(`/coupons/search?${query}`);
        return jsonResult({ total_count: data.total_count, items: data.items });
      } catch (error) {
        return errorResult("Error searching coupons", error);
      }
    }
  );

  server.tool(
    "get_coupon",
    "Get one coupon code's full record by id",
    { coupon_id: z.number().describe("The coupon id") },
    async ({ coupon_id }) => {
      try {
        const coupon = await callMagentoApi(`/coupons/${coupon_id}`);
        return jsonResult(coupon);
      } catch (error) {
        return errorResult("Error fetching coupon", error);
      }
    }
  );

  // --- Analytics reports built on top of /orders (pre-existing tools, relocated unchanged) ---

  server.tool(
    "get_revenue",
    "Get the total revenue for a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')"),
      include_tax: z.boolean().optional().describe("Whether to include tax in the revenue calculation (default: true)")
    },
    async ({ date_range, status, include_tax = true }) => {
      try {
        const dateRange = parseDateExpression(date_range);
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }
        const allOrders = await fetchAllPages('/orders', searchCriteria);

        let totalRevenue = 0;
        let totalTax = 0;
        let orderCount = 0;

        if (allOrders && Array.isArray(allOrders)) {
          orderCount = allOrders.length;
          allOrders.forEach(order => {
            totalRevenue += parseFloat(order.grand_total || 0);
            totalTax += parseFloat(order.tax_amount || 0);
          });
        }

        const revenueWithoutTax = totalRevenue - totalTax;
        const finalRevenue = include_tax ? totalRevenue : revenueWithoutTax;

        const result = {
          query: {
            date_range: dateRange.description,
            status: status || 'All',
            include_tax: include_tax,
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: {
            revenue: parseFloat(finalRevenue.toFixed(2)),
            currency: 'USD',
            order_count: orderCount,
            average_order_value: orderCount > 0 ? parseFloat((finalRevenue / orderCount).toFixed(2)) : 0,
            tax_amount: parseFloat(totalTax.toFixed(2))
          }
        };
        return jsonResult(result);
      } catch (error) {
        return errorResult("Error fetching revenue", error);
      }
    }
  );

  server.tool(
    "get_order_count",
    "Get the number of orders for a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')")
    },
    async ({ date_range, status }) => {
      try {
        const dateRange = parseDateExpression(date_range);
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }
        searchCriteria += `&searchCriteria[pageSize]=1&searchCriteria[currentPage]=1`;
        const ordersData = await callMagentoApi(`/orders?${searchCriteria}`);

        const result = {
          query: {
            date_range: dateRange.description,
            status: status || 'All',
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: { order_count: ordersData.total_count || 0 }
        };
        return jsonResult(result);
      } catch (error) {
        return errorResult("Error fetching order count", error);
      }
    }
  );

  server.tool(
    "get_product_sales",
    "Get statistics about the quantity of products sold in a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')"),
      country: z.string().optional().describe("Filter by country code (e.g., 'US', 'NL', 'GB') or country name (e.g., 'United States', 'The Netherlands', 'United Kingdom')")
    },
    async ({ date_range, status, country }) => {
      try {
        const dateRange = parseDateExpression(date_range);
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }
        const allOrders = await fetchAllPages('/orders', searchCriteria);

        let filteredOrders = allOrders;
        if (country) {
          const normalizedCountry = normalizeCountry(country);
          filteredOrders = filteredOrders.filter(order => {
            const billingCountry = order.billing_address?.country_id;
            const shippingCountry = order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address?.country_id;
            return normalizedCountry.includes(billingCountry) || normalizedCountry.includes(shippingCountry);
          });
        }

        let totalOrders = filteredOrders.length;
        let totalOrderItems = 0;
        let totalProductQuantity = 0;
        let totalRevenue = 0;
        let productCounts = {};

        filteredOrders.forEach(order => {
          totalRevenue += parseFloat(order.grand_total || 0);
          if (order.items && Array.isArray(order.items)) {
            totalOrderItems += order.items.length;
            order.items.forEach(item => {
              const quantity = parseFloat(item.qty_ordered || 0);
              totalProductQuantity += quantity;
              const sku = item.sku;
              if (sku) {
                if (!productCounts[sku]) {
                  productCounts[sku] = { name: item.name, quantity: 0, revenue: 0 };
                }
                productCounts[sku].quantity += quantity;
                productCounts[sku].revenue += parseFloat(item.row_total || 0);
              }
            });
          }
        });

        const topProducts = Object.entries(productCounts)
          .map(([sku, data]) => ({ sku, name: data.name, quantity: data.quantity, revenue: data.revenue }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        const result = {
          query: {
            date_range: dateRange.description,
            status: status || 'All',
            country: country || 'All',
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: {
            total_orders: totalOrders,
            total_order_items: totalOrderItems,
            total_product_quantity: totalProductQuantity,
            average_products_per_order: totalOrders > 0 ? parseFloat((totalProductQuantity / totalOrders).toFixed(2)) : 0,
            total_revenue: parseFloat(totalRevenue.toFixed(2)),
            average_revenue_per_product: totalProductQuantity > 0 ? parseFloat((totalRevenue / totalProductQuantity).toFixed(2)) : 0,
            top_products: topProducts
          }
        };
        return jsonResult(result);
      } catch (error) {
        return errorResult("Error fetching product sales", error);
      }
    }
  );

  server.tool(
    "get_revenue_by_country",
    "Get revenue filtered by country for a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      country: z.string().describe("Country code (e.g., 'US', 'NL', 'GB') or country name (e.g., 'United States', 'The Netherlands', 'United Kingdom')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')"),
      include_tax: z.boolean().optional().describe("Whether to include tax in the revenue calculation (default: true)")
    },
    async ({ date_range, country, status, include_tax = true }) => {
      try {
        const dateRange = parseDateExpression(date_range);
        const normalizedCountry = normalizeCountry(country);
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }
        const allOrders = await fetchAllPages('/orders', searchCriteria);

        let totalRevenue = 0;
        let totalTax = 0;
        let orderCount = 0;
        let filteredOrders = [];

        if (allOrders && Array.isArray(allOrders)) {
          filteredOrders = allOrders.filter(order => {
            const billingCountry = order.billing_address?.country_id;
            const shippingCountry = order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address?.country_id;
            return normalizedCountry.includes(billingCountry) || normalizedCountry.includes(shippingCountry);
          });
          orderCount = filteredOrders.length;
          filteredOrders.forEach(order => {
            totalRevenue += parseFloat(order.grand_total || 0);
            totalTax += parseFloat(order.tax_amount || 0);
          });
        }

        const revenueWithoutTax = totalRevenue - totalTax;
        const finalRevenue = include_tax ? totalRevenue : revenueWithoutTax;

        const result = {
          query: {
            date_range: dateRange.description,
            country: country,
            normalized_country: normalizedCountry.join(', '),
            status: status || 'All',
            include_tax: include_tax,
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: {
            revenue: parseFloat(finalRevenue.toFixed(2)),
            currency: 'USD',
            order_count: orderCount,
            average_order_value: orderCount > 0 ? parseFloat((finalRevenue / orderCount).toFixed(2)) : 0,
            tax_amount: parseFloat(totalTax.toFixed(2))
          }
        };
        return jsonResult(result);
      } catch (error) {
        return errorResult("Error fetching revenue by country", error);
      }
    }
  );

  server.tool(
    "get_customer_ordered_products_by_email",
    "Get all ordered products for a customer by email address",
    { email: z.string().email().describe("The email address of the customer") },
    async ({ email }) => {
      try {
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=email&` +
                              `searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(email)}&` +
                              `searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
        const customersData = await callMagentoApi(`/customers/search?${searchCriteria}`);
        if (!customersData.items || customersData.items.length === 0) {
          return jsonResult(`No customer found with email: ${email}`);
        }
        const customer = customersData.items[0];

        const orderSearchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=customer_email&` +
                                   `searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(email)}&` +
                                   `searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
        const allCustomerOrders = await fetchAllPages('/orders', orderSearchCriteria);
        if (!allCustomerOrders || allCustomerOrders.length === 0) {
          return jsonResult(`No orders found for customer with email: ${email}`);
        }

        const productSkus = new Set();
        allCustomerOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => { if (item.sku) productSkus.add(item.sku); });
          }
        });

        const productPromises = Array.from(productSkus).map(sku =>
          callMagentoApi(`/products/${sku}`)
            .then(product => formatProduct(product))
            .catch(err => ({ sku, error: err.message }))
        );
        const productDetails = await Promise.all(productPromises);

        const productMap = {};
        productDetails.forEach(product => {
          if (product.sku) productMap[product.sku] = product;
        });

        const result = {
          customer: {
            id: customer.id,
            email: customer.email,
            firstname: customer.firstname,
            lastname: customer.lastname
          },
          orders: allCustomerOrders.map(order => ({
            order_id: order.entity_id,
            increment_id: order.increment_id,
            created_at: order.created_at,
            status: order.status,
            total: order.grand_total,
            items: order.items.map(item => {
              const productDetail = productMap[item.sku] || {};
              return {
                sku: item.sku,
                name: item.name,
                price: item.price,
                qty_ordered: item.qty_ordered,
                product_details: productDetail
              };
            })
          }))
        };
        return jsonResult(result);
      } catch (error) {
        return errorResult("Error fetching customer ordered products", error);
      }
    }
  );
}

module.exports = { register };
