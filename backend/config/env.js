/** Read settings once, before middleware or controllers import them. */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import crypto from "node:crypto";

export const backendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
dotenv.config({ path: path.join(backendDir, ".env") });
export const dataDir = path.resolve(
  process.env.DATA_DIR || path.join(backendDir, "data"),
);
fs.mkdirSync(dataDir, { recursive: true });

// Local installs get a private, persistent signing key; no shared hard-coded secret.
// Production must supply its own secret so separate server instances can agree.
let secret = process.env.JWT_SECRET;
if (!secret) {
  if (process.env.NODE_ENV === "production")
    throw new Error("Set JWT_SECRET in production.");
  const secretFile = path.join(dataDir, ".jwt-secret");
  if (!fs.existsSync(secretFile))
    fs.writeFileSync(secretFile, crypto.randomBytes(48).toString("hex"), {
      mode: 0o600,
    });
  secret = fs.readFileSync(secretFile, "utf8").trim();
}
if (secret.length < 32)
  throw new Error("JWT_SECRET must contain at least 32 characters.");
export const config = {
  port: Number(process.env.PORT || 8000),
  host: process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  jwtSecret: secret,
  mongoUri: process.env.MONGODB_URI || "",
  seed: process.env.SEED_DATA !== "false",
  origins: (
    process.env.CLIENT_ORIGIN ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
  )
    .split(",")
    .map((s) => s.trim())
    .concat(
      process.env.RENDER_EXTERNAL_URL
        ? [process.env.RENDER_EXTERNAL_URL.trim()]
        : [],
    ),
};
