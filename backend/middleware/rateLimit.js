/** A simple per-IP limiter for login and public forms. In-memory, single-process.
 * The reverse proxy is not trusted by default; clients cannot spoof X-Forwarded-For.
 */
export function rateLimit(max = 30, windowMs = 15 * 60 * 1000) {
  const hits = new Map();
  const timer = setInterval(() => {
    for (const [key, value] of hits)
      if (value.reset <= Date.now()) hits.delete(key);
  }, windowMs);
  timer.unref();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    const current =
      entry && entry.reset > now ? entry : { count: 0, reset: now + windowMs };
    current.count++;
    hits.set(req.ip, current);
    if (current.count > max) {
      res.set("Retry-After", String(Math.ceil((current.reset - now) / 1000)));
      return res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
    }
    next();
  };
}
