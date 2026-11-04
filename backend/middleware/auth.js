/** Authentication asks WHO is calling; authorization asks WHAT they may do. */
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { store } from "../services/store.js";
import { fail } from "../models/validation.js";

export function signToken(user) {
  return jwt.sign({}, config.jwtSecret, {
    subject: user._id,
    expiresIn: "8h",
    algorithm: "HS256",
  });
}
export async function requireAuth(req, res, next) {
  try {
    const header = req.get("Authorization") || "";
    if (!header.startsWith("Bearer ")) fail(401, "Please sign in to continue.");
    let payload;
    try {
      payload = jwt.verify(header.slice(7), config.jwtSecret, {
        algorithms: ["HS256"],
      });
    } catch {
      fail(401, "Your session has expired. Please sign in again.");
    }
    const user = await store.get("users", payload.sub);
    if (!user) fail(401, "This account is no longer available.");
    req.user = user; // Downstream controllers use the database identity, never body.user.
    next();
  } catch (error) {
    next(error);
  }
}
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return next(
      Object.assign(new Error("Administrator access is required."), {
        status: 403,
      }),
    );
  next();
}
export function requireOwner(user, ownerId) {
  if (user.role !== "admin" && user._id !== ownerId)
    fail(403, "You cannot change another person’s record.");
}
// Never expose password hashes, even to the frontend that owns the account.
export function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email, role: user.role };
}
