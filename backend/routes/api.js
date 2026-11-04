/** Route table: URL -> middleware -> controller. Keep business rules out of here. */
import { Router } from "express";
import * as auth from "../controllers/authController.js";
import * as chefs from "../controllers/chefController.js";
import * as bookings from "../controllers/bookingController.js";
import * as content from "../controllers/contentController.js";
import * as leads from "../controllers/leadController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler as run } from "../middleware/errors.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { store } from "../services/store.js";

export const api = Router();

// ── Health & readiness probes (Kubernetes / load balancer compatible) ────────
api.get("/health", (req, res) =>
  res.json({
    data: {
      status: "ok",
      storage: store.mode(),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "4.0.0",
    },
  }),
);
const authLimit = rateLimit(40);
api.post("/auth/signup", authLimit, run(auth.signup));
api.post("/auth/login", authLimit, run(auth.login));
api.get("/auth/me", requireAuth, auth.me);

// Static /mine must precede /:id, or Express would treat "mine" as an ID.
api.get("/chefs/manage", requireAuth, requireAdmin, run(chefs.manage));
api.get("/chefs/mine", requireAuth, run(chefs.mine));
api.get("/chefs", run(chefs.list));
api.get("/chefs/:id", run(chefs.detail));
api.post("/chefs", requireAuth, run(chefs.create));
api.put("/chefs/:id", requireAuth, run(chefs.update));
api.delete("/chefs/:id", requireAuth, run(chefs.remove));

api.get("/bookings", requireAuth, run(bookings.list));
api.get("/bookings/:id", requireAuth, run(bookings.detail));
api.post("/bookings", requireAuth, run(bookings.create));
api.put("/bookings/:id", requireAuth, run(bookings.update));
api.delete("/bookings/:id", requireAuth, run(bookings.remove));

api.get("/content/:type", run(content.list));
api.get("/content/:type/:id", run(content.detail));
api.post("/content/:type", requireAuth, requireAdmin, run(content.create));
api.put("/content/:type/:id", requireAuth, requireAdmin, run(content.update));
api.delete(
  "/content/:type/:id",
  requireAuth,
  requireAdmin,
  run(content.remove),
);

api.post("/leads", rateLimit(15), run(leads.create));
api.get("/leads", requireAuth, requireAdmin, run(leads.list));
api.get("/leads/:id", requireAuth, requireAdmin, run(leads.detail));
api.put("/leads/:id", requireAuth, requireAdmin, run(leads.update));
api.delete("/leads/:id", requireAuth, requireAdmin, run(leads.remove));
