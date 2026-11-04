/** Cross-platform launcher: one command starts API + Vite, Ctrl+C stops both. */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [
  spawn(process.execPath, ["--watch", "backend/server.js"], {
    cwd: root,
    stdio: "inherit",
  }),
  spawn(
    process.execPath,
    [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1"],
    { cwd: path.join(root, "frontend"), stdio: "inherit" },
  ),
];
// Vite is hoisted by npm workspaces, so its executable uses an absolute path.
function stop() {
  for (const child of children) child.kill();
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stop();
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stop();
      process.exitCode = code;
    }
  });
}
