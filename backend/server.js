/** Production server startup with:
 *   - Ordered initialization: config → database → seed → HTTP listener
 *   - Graceful shutdown with configurable drain timeout
 *   - Process-level error boundaries (uncaughtException, unhandledRejection)
 *   - Structured logging throughout the lifecycle
 */
import { app } from "./app.js";
import { config } from "./config/env.js";
import { connectStore, closeStore, store } from "./services/store.js";
import { seedData } from "./services/seed.js";
import { logger } from "./utils/logger.js";

const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000);

// ── Process-level error boundaries ──────────────────────────────────────────
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception — shutting down", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    error: reason instanceof Error ? reason.message : String(reason),
  });
});

// ── Startup sequence ────────────────────────────────────────────────────────
try {
  await connectStore();
  logger.info(`Database connected (${store.mode()})`);

  if (config.seed) await seedData();

  const server = app.listen(config.port, config.host, () =>
    logger.info(`ChefKart listening on http://${config.host}:${config.port}`, {
      storage: store.mode(),
      nodeVersion: process.version,
      pid: process.pid,
    }),
  );

  server.on("error", (error) => {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — draining connections`, { signal });

    // Force exit if drain takes too long
    const forceTimer = setTimeout(() => {
      logger.warn("Shutdown timeout reached — forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceTimer.unref();

    server.close(async () => {
      logger.info("HTTP server closed");
      await closeStore();
      logger.info("Database disconnected — clean shutdown");
      clearTimeout(forceTimer);
      process.exit(0);
    });
  }

  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => shutdown(signal));
  }
} catch (error) {
  logger.error(`Startup failed: ${error.message}`, { stack: error.stack });
  process.exit(1);
}
