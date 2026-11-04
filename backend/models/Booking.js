/** References store IDs linking a booking to its customer and cook.
 * ref describes the relationship; controllers still check that records exist.
 */
import mongoose from "mongoose";
import { recordFields, schemaOptions } from "./common.js";

const bookingSchema = new mongoose.Schema({
  ...recordFields,
  user: { type: String, ref: "User", required: true },
  chef: { type: String, ref: "Chef", required: true },
  bookingDate: { type: String, required: true },
  service: { type: String, enum: ["one-time", "monthly", "party"], required: true },
  address: { type: String, required: true, minlength: 8, maxlength: 500 },
  guests: { type: Number, min: 1, max: 100, required: true, validate: Number.isInteger },
  notes: String,
  status: { type: String, enum: ["booked", "cancelled", "completed"], required: true },
  estimatedPrice: { type: Number, min: 0, required: true },
}, schemaOptions);

// Two active bookings cannot use the same cook and exact start time.
// Cancelled/completed records are excluded from this unique index.
bookingSchema.index({ chef: 1, bookingDate: 1 }, {
  unique: true,
  partialFilterExpression: { status: "booked" },
});
export const Booking = mongoose.model("Booking", bookingSchema, "bookings");
