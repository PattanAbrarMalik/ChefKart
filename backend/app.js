/** Build the Express application separately from listen(), so tests use a real app
 * on an available port without launching the development server.
 *
 * Middleware pipeline (order matters):
 *   1. Security headers        — hardened response headers on every request
 *   2. Request ID              — unique correlation ID for distributed tracing
 *   3. Request logger          — structured HTTP access logs with timing
 *   4. CORS                    — origin whitelist for browser clients
 *   5. Body parser             — JSON with size limit and shape validation
 *   6. API routes              — business logic behind auth/rate-limit guards
 *   7. Static frontend         — production build served from Express
 *   8. Error handler           — centralized error formatting (must be last)
 */
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { config, backendDir } from "./config/env.js";
import { api } from "./routes/api.js";
import { notFound, errorHandler } from "./middleware/errors.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { securityHeaders } from "./middleware/security.js";

export const app = express();

// ── 1. Global middleware ────────────────────────────────────────────────────
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(securityHeaders);
app.use(requestId);
app.use(requestLogger);

// Vite normally proxies /api. CORS also supports direct Postman/frontend clients.
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        config.origins.includes(origin) ||
        /^https?:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)
      )
        return callback(null, true);
      callback(
        Object.assign(new Error("This browser origin is not allowed."), {
          status: 403,
        }),
      );
    },
  }),
);

app.use(express.json({ limit: "100kb" }));

// Reject arrays/null before controllers read fields from a request body.
app.use("/api", (req, res, next) => {
  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
  ) {
    return res
      .status(400)
      .json({ message: "Send a JSON object as the request body." });
  }
  next();
});

// ── 2. API routes ───────────────────────────────────────────────────────────
app.use(
  "/api",
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  api,
);
app.use("/api", notFound);

// ── 3. Static frontend (production build) ───────────────────────────────────
const frontend = path.resolve(backendDir, "../frontend/dist");
if (fs.existsSync(path.join(frontend, "index.html"))) {
  app.use(express.static(frontend, { maxAge: "1d", etag: true }));
  app.get("*", (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(frontend, "index.html"));
  });
}

// ── 4. Catch-all ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler); // Error middleware must be last and have four arguments.
