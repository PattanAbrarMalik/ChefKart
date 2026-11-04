/** Remembers whether sample data was already inserted. */
import mongoose from "mongoose";
import { recordFields, schemaOptions } from "./common.js";

const metadataSchema = new mongoose.Schema({
  ...recordFields,
  key: { type: String, required: true, unique: true },
}, schemaOptions);

export const Metadata = mongoose.model("Metadata", metadataSchema, "metadata");
