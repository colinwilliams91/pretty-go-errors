const path = require("path");
const {
  buildWorkspaceBundle,
} = require("../../../scripts/esbuildWorkspaceBundle");

const extensionRoot = path.resolve(__dirname, "..");

buildWorkspaceBundle({
  absWorkingDir: extensionRoot,
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.js",
  external: ["vscode"],
  sourcemap: true,
}).catch(() => process.exit(1));
