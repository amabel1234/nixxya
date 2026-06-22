import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const adminSrc = resolve(root, "artifacts/unix-admin/dist/public");
const adminDest = resolve(root, "artifacts/nixx-ai/dist/admin");

console.log("📦 Merging admin panel into nixx-ai dist...");
mkdirSync(adminDest, { recursive: true });
cpSync(adminSrc, adminDest, { recursive: true });
console.log("✅ Admin panel merged at /admin/");
