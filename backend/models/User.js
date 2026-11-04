/** Schema = account rules. Model = methods that read/write the users collection. */
import mongoose from "mongoose";
import { recordFields, schemaOptions } from "./common.js";

const userSchema = new mongoose.Schema({
  ...recordFields,
  name: { type: String, required: true, trim: true, maxlength: 200 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  // authController hashes the password before this model receives it.
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "admin"], required: true },
}, schemaOptions);

export const User = mongoose.model("User", userSchema, "users");
