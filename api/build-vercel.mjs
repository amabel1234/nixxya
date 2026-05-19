import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

globalThis.require = createRequire(import.meta.url);

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

console.log("Bundling API for Vercel...");

await build({
  entryPoints: [path.resolve(rootDir, "artifacts/api-server/src/app.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: path.resolve(rootDir, "api/bundle.mjs"),
  external: [
    "*.node",
    "pg-native",
    "pino",
    "pino-http",
    "pino-pretty",
    "thread-stream",
    "sharp",
    "better-sqlite3",
    "canvas",
    "bcrypt",
    "@aws-sdk/*",
    "@azure/*",
    "@google-cloud/*",
  ],
  logLevel: "info",
  banner: {
    js: `import { createRequire as __req } from 'node:module';
import __pathMod from 'node:path';
import __urlMod from 'node:url';
globalThis.require = __req(import.meta.url);
globalThis.__filename = __urlMod.fileURLToPath(import.meta.url);
globalThis.__dirname = __pathMod.dirname(globalThis.__filename);
`,
  },
});

console.log("Bundle complete: api/bundle.mjs");
