/** Explicit MongoDB launcher. The app stops if MongoDB cannot be reached.
 * npm run dev:mongo / start:mongo / admin:mongo all use the same database.
 */
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "backend/.env") });
const programs = {
  dev: "scripts/dev.mjs",
  start: "backend/server.js",
  admin: "backend/scripts/create-admin.js",
};
const program = programs[process.argv[2]];
if (!program) throw new Error("Choose dev, start or admin.");
const child = spawn(process.execPath, [program], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chefkart",
  },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code || 0; });
