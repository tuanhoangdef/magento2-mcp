#!/usr/bin/env node
// Thin entrypoint: creates the MCP server, loads shared helpers, and
// registers every domain module's tools. Domain logic lives in lib/ --
// see that directory for the actual tool implementations, grouped by
// Magento REST API area (products, categories, customers, sales, cms,
// tax, inventory, store-config, eav-directory, search).

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const dotenv = require('dotenv');

dotenv.config();

const shared = require('./lib/shared.js');
const dates = require('./lib/dates.js');
const products = require('./lib/products.js');
const categories = require('./lib/categories.js');
const customers = require('./lib/customers.js');
const sales = require('./lib/sales.js');
const cms = require('./lib/cms.js');
const tax = require('./lib/tax.js');
const inventory = require('./lib/inventory.js');
const storeConfig = require('./lib/store-config.js');
const eavDirectory = require('./lib/eav-directory.js');
const search = require('./lib/search.js');

const server = new McpServer({
  name: "magento-mcp-server",
  version: "1.0.0"
});

// Every domain module's register(server, deps) gets the same base deps
// (shared.js exports) plus module-specific cross-references it needs
// (sales.js needs dates.js's parsing helpers and products.js's
// formatProduct to build its analytics reports and the customer-ordered-
// products lookup).
const baseDeps = { ...shared };

products.register(server, baseDeps);
categories.register(server, baseDeps);
customers.register(server, baseDeps);
sales.register(server, { ...baseDeps, dates, products });
cms.register(server, baseDeps);
tax.register(server, baseDeps);
inventory.register(server, baseDeps);
storeConfig.register(server, baseDeps);
eavDirectory.register(server, baseDeps);
search.register(server, baseDeps);

async function main() {
  try {
    console.error('Starting Magento MCP Server...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Magento MCP Server running on stdio');
  } catch (error) {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
