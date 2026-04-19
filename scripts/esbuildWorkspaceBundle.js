const path = require("path");
const esbuild = require("esbuild");

const workspaceRoot = path.resolve(__dirname, "..");

const workspaceAliases = {
  "@pretty-go-errors/vscode-formatter": path.resolve(
    workspaceRoot,
    "packages/vscode-formatter/src/index.ts"
  ),
  "@pretty-go-errors/formatter": path.resolve(
    workspaceRoot,
    "packages/formatter/src/index.ts"
  ),
  "@pretty-go-errors/utils": path.resolve(
    workspaceRoot,
    "packages/utils/src/index.ts"
  ),
};

function buildWorkspaceBundle(options) {
  return esbuild.build({
    bundle: true,
    format: "cjs",
    logLevel: "info",
    platform: "node",
    target: "node16",
    alias: workspaceAliases,
    ...options,
  });
}

module.exports = {
  buildWorkspaceBundle,
  workspaceAliases,
  workspaceRoot,
};