// Directory reference data (countries, currency). GET-only, admin-token
// compatible. Relevant to judging Shopify Markets/localization fit. See
// https://developer.adobe.com/commerce/webapi/reference/rest/paas

function register(server, { z, callMagentoApi, errorResult, jsonResult }) {
  server.tool(
    "list_countries",
    "List all countries Magento knows about, with region/subdivision data",
    {},
    async () => {
      try {
        const countries = await callMagentoApi('/rest/V1/directory/countries');
        return jsonResult(countries);
      } catch (error) {
        return errorResult("Error fetching countries", error);
      }
    }
  );

  server.tool(
    "get_country",
    "Get one country's info (including its regions/subdivisions) by ISO country id",
    { country_id: z.string().describe("ISO country code, e.g. 'US', 'GB'") },
    async ({ country_id }) => {
      try {
        const country = await callMagentoApi(`/rest/V1/directory/countries/${country_id}`);
        return jsonResult(country);
      } catch (error) {
        return errorResult("Error fetching country", error);
      }
    }
  );

  server.tool(
    "get_currency_config",
    "Get the store's configured base/default/allowed currencies and current exchange rates -- " +
    "relevant to judging Shopify multi-currency/Markets plan-tier fit.",
    {},
    async () => {
      try {
        const currency = await callMagentoApi('/rest/V1/directory/currency');
        return jsonResult(currency);
      } catch (error) {
        return errorResult("Error fetching currency config", error);
      }
    }
  );
}

module.exports = { register };
