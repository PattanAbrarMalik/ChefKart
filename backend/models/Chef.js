/** One cook profile per owner. Contact fields stay private in the controller. */
import mongoose from "mongoose";
import { recordFields, schemaOptions } from "./common.js";

const chefSchema = new mongoose.Schema({
  ...recordFields,
  ownerId: { type: String, ref: "User", required: true, unique: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  area: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true, maxlength: 500 },
  pincode: { type: String, required: true, match: /^\d{6}$/ },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  experience: { type: Number, min: 0, max: 60, required: true },
  price: { type: Number, min: 100, max: 100000, required: true },
  aboutCook: { type: String, required: true, minlength: 10, maxlength: 2000 },
  cuisines: [String],
  language: [String],
  diet: { type: String, enum: ["Vegetarian", "Both"], required: true },
  profilepic: String,
  availability: String,
  verified: { type: Boolean, required: true },
  starRating: { type: Number, min: 0, max: 5 },
  totalRatings: { type: Number, min: 0 },
  sample: Boolean,
}, schemaOptions);

export const Chef = mongoose.model("Chef", chefSchema, "chefs");
