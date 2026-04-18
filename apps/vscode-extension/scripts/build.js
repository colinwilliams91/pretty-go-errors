const path = require("path");
const esbuild = require("esbuild");

const extensionRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(extensionRoot, "..", "..");

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

esbuild
  .build({
    absWorkingDir: extensionRoot,
    entryPoints: ["src/extension.ts"],
    alias: workspaceAliases,
    bundle: true,
    outfile: "dist/extension.js",
    platform: "node",
    format: "cjs",
    target: "node16",
    external: ["vscode"],
    sourcemap: true,
    logLevel: "info",
  })
  .catch(() => process.exit(1));
