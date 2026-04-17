const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["src/extension.ts"],
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
