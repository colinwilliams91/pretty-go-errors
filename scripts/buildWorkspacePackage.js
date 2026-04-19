const { buildWorkspaceBundle } = require("./esbuildWorkspaceBundle");

buildWorkspaceBundle({
  absWorkingDir: process.cwd(),
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
}).catch(() => process.exit(1));