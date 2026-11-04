/** Centralized error handling with structured logging.
 * Express 4 does not forward rejected async promises automatically.
 */
import { logger } from "../utils/logger.js";

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ message: "This API endpoint does not exist." });
}

// All errors have {message}; unexpected implementation details stay server-side.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (["ValidationError", "CastError", "StrictModeError"].includes(error.name))
    return res.status(400).json({ message: "The record does not match the allowed fields and values." });

  if (error.code === 11000)
    return res
      .status(409)
      .json({ message: "This record or booking slot already exists." });

  const status = error.status || 500;

  if (status >= 500) {
    logger.error(`Unhandled error: ${error.message}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      stack: error.stack,
    });
  }

  res.status(status).json({
    message:
      status >= 500
        ? "The server could not complete this request."
        : error.message,
  });
}
