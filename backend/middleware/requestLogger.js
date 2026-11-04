/** HTTP request/response logging with duration tracking and correlation.
 * Logs method, URL, status code, response time, and request ID.
 */
import { logger } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const originalEnd = res.end;

  res.end = function (...args) {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs / 1_000_000n);
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: durationMs,
      ip: req.ip,
    };
    if (req.id) meta.requestId = req.id;
    if (req.user?._id) meta.userId = req.user._id;

    const level = res.statusCode >= 500 ? "error"
      : res.statusCode >= 400 ? "warn"
      : "info";

    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`, meta);
    originalEnd.apply(res, args);
  };

  next();
}

