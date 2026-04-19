const { defineConfig } = require("vitest/config");
const { workspaceAliases } = require("./scripts/esbuildWorkspaceBundle");

module.exports = defineConfig({
  resolve: {
    alias: workspaceAliases,
  },
});
