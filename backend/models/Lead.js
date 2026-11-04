/** Contact, career and investor enquiries share these fields. */
import mongoose from "mongoose";
import { recordFields, schemaOptions } from "./common.js";

const leadSchema = new mongoose.Schema({
  ...recordFields,
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  city: { type: String, required: true },
  area: String,
  message: { type: String, required: true, minlength: 5, maxlength: 3000 },
  type: { type: String, enum: ["contact", "investor", "career"], required: true },
  status: { type: String, enum: ["new", "resolved"], required: true },
}, schemaOptions);

export const Lead = mongoose.model("Lead", leadSchema, "leads");
