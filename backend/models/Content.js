/** The same schema can serve multiple explicitly allowed content collections. */
import mongoose from "mongoose";
import { recordFields, schemaOptions } from "./common.js";

const contentSchema = new mongoose.Schema({
  ...recordFields,
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 10000 },
  category: String,
  image: String,
}, schemaOptions);

export function createContentModel(type) {
  return mongoose.model(`Content_${type}`, contentSchema, `content_${type}`);
}
