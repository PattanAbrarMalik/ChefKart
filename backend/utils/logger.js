/** Structured logger with request correlation, log levels, and ISO timestamps.
 * Production: JSON lines for log aggregators (ELK, Datadog, CloudWatch).
 * Development: human-readable colored output.
 */
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || "info"] ?? LOG_LEVELS.info;
const isProduction = process.env.NODE_ENV === "production";

function formatMessage(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (meta.requestId) entry.requestId = meta.requestId;
  if (meta.duration !== undefined) entry.durationMs = meta.duration;

  if (isProduction) return JSON.stringify(entry);

  const colors = { error: "\x1b[31m", warn: "\x1b[33m", info: "\x1b[36m", debug: "\x1b[90m" };
  const reset = "\x1b[0m";
  const color = colors[level] || "";
  const metaStr = Object.keys(meta).length
    ? ` ${JSON.stringify(meta)}`
    : "";
  return `${color}[${entry.timestamp}] ${level.toUpperCase()}${reset}: ${message}${metaStr}`;
}

function log(level, message, meta) {
  if (LOG_LEVELS[level] > currentLevel) return;
  const output = formatMessage(level, message, meta);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

export const logger = {
  error: (msg, meta) => log("error", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  info: (msg, meta) => log("info", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),

  /** Create a child logger with preset metadata (e.g., requestId). */
  child(defaults) {
    return {
      error: (msg, meta) => log("error", msg, { ...defaults, ...meta }),
      warn: (msg, meta) => log("warn", msg, { ...defaults, ...meta }),
      info: (msg, meta) => log("info", msg, { ...defaults, ...meta }),
      debug: (msg, meta) => log("debug", msg, { ...defaults, ...meta }),
    };
  },
};

