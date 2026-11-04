/** Run the same complete ChefKart API suite against a disposable MongoDB database.
 * Never uses the application's MONGODB_URI or its saved customer records.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uri = new URL(process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017");
if (uri.username && !uri.searchParams.has("authSource")) {
  uri.searchParams.set("authSource", uri.pathname.slice(1) || "admin");
}
uri.pathname = `/chefkart_test_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
const child = spawn(process.execPath, ["--test", "backend/tests/api.test.js"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, CHEFKART_TEST_MONGODB_URI: uri.toString() },
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code || 0; });
