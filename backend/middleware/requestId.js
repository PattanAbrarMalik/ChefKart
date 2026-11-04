/** Assign a unique request ID to every inbound request for distributed tracing.
 * Respects X-Request-Id from upstream load balancers (AWS ALB, nginx, Cloudflare).
 * Downstream services and log entries use this ID for correlation.
 */
import crypto from "node:crypto";

export function requestId(req, res, next) {
  const id = req.get("X-Request-Id") || crypto.randomUUID();
  req.id = id;
  res.set("X-Request-Id", id);
  next();
}

