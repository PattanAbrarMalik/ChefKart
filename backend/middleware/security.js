/** Production-grade security headers (lightweight helmet alternative).
 * Covers OWASP recommendations without adding external dependencies.
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME-type sniffing
  res.set("X-Content-Type-Options", "nosniff");
  // Deny framing (clickjacking protection)
  res.set("X-Frame-Options", "DENY");
  // Control referrer information leakage
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Restrict browser features
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Prevent XSS in older browsers (modern CSP is preferred)
  res.set("X-XSS-Protection", "0");
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

