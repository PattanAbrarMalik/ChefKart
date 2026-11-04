/** Persistence boundary: controllers use these same five methods in either mode.
 * JSON mode is durable and intended for ONE local Node process and small datasets.
 * MongoDB mode uses real Mongoose schemas/models from models/index.js.
 * Controllers validate input in both modes; MongoDB also enforces model rules.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { config, dataDir } from "../config/env.js";
import { models, getModel } from "../models/index.js";

const filename = path.join(dataDir, "database.json");
let database = {};
let mongo = false;

// Await database readiness before starting HTTP; a failed connection is never ignored.
export async function connectStore() {
  if (config.mongoUri) {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    // Wait for unique indexes before accepting requests. unique is an index rule.
    await Promise.all(Object.values(models).map((model) => model.init()));
    mongo = true;
  } else if (fs.existsSync(filename)) {
    // Do not replace a damaged database silently: let startup fail visibly.
    database = JSON.parse(fs.readFileSync(filename, "utf8"));
  }
}

// Write a temporary file and rename it to avoid partially written JSON after a crash.
function persist() {
  fs.writeFileSync(`${filename}.tmp`, JSON.stringify(database, null, 2));
  fs.renameSync(`${filename}.tmp`, filename);
}
const copy = (value) => structuredClone(value);
export const store = {
  mode: () => (mongo ? "mongodb" : "local-json"),
  async list(collection) {
    return mongo
      ? getModel(collection).find().lean().exec()
      : copy(database[collection] || []);
  },
  async get(collection, id) {
    return mongo
      ? getModel(collection).findById(id).lean().exec()
      : copy(
          (database[collection] || []).find((row) => row._id === id) || null,
        );
  },
  async create(collection, values) {
    const now = new Date().toISOString();
    const row = {
      ...values,
      _id: crypto.randomBytes(12).toString("hex"),
      createdAt: now,
      updatedAt: now,
    };
    if (mongo) return (await getModel(collection).create(row)).toObject();
    else {
      const rows = (database[collection] ||= []);
      // Check uniqueness immediately before writing, including competing requests.
      const duplicate = rows.some(
        (old) =>
          (collection === "users" && old.email === row.email) ||
          (collection === "chefs" && old.ownerId === row.ownerId) ||
          (collection === "bookings" &&
            row.status === "booked" &&
            old.status === "booked" &&
            old.chef === row.chef &&
            old.bookingDate === row.bookingDate),
      );
      if (duplicate)
        throw Object.assign(
          new Error("This record or booking slot already exists."),
          { status: 409 },
        );
      rows.push(row);
      persist();
    }
    return copy(row);
  },
  async update(collection, id, values) {
    // IDs and timestamps are server-owned; callers can never change them.
    const { _id, createdAt, updatedAt, ...safe } = values;
    const changes = { ...safe, updatedAt: new Date().toISOString() };
    if (mongo)
      return getModel(collection)
        .findByIdAndUpdate(
          id,
          { $set: changes },
          // Return the changed record and check min/max/required rules on updates.
          { new: true, runValidators: true },
        ).lean().exec();
    const rows = database[collection] || [];
    const index = rows.findIndex((row) => row._id === id);
    if (index < 0) return null;
    const next = { ...rows[index], ...changes };
    if (
      collection === "bookings" &&
      next.status === "booked" &&
      rows.some(
        (row) =>
          row._id !== id &&
          row.status === "booked" &&
          row.chef === next.chef &&
          row.bookingDate === next.bookingDate,
      )
    ) {
      throw Object.assign(
        new Error("That chef is already booked at this time."),
        { status: 409 },
      );
    }
    rows[index] = next;
    persist();
    return copy(next);
  },
  async remove(collection, id) {
    if (mongo)
      return Boolean(await getModel(collection).findByIdAndDelete(id).lean().exec());
    const rows = database[collection] || [];
    const index = rows.findIndex((row) => row._id === id);
    if (index < 0) return false;
    rows.splice(index, 1);
    persist();
    return true;
  },
};
export async function closeStore() {
  if (mongo) await mongoose.disconnect();
  mongo = false;
}
