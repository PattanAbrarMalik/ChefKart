/** A short lookup table lets the existing controllers keep their collection names. */
import { User } from "./User.js";
import { Chef } from "./Chef.js";
import { Booking } from "./Booking.js";
import { Lead } from "./Lead.js";
import { Metadata } from "./Metadata.js";
import { createContentModel } from "./Content.js";
import { contentTypes } from "./validation.js";

export const models = {
  users: User, chefs: Chef, bookings: Booking, leads: Lead, metadata: Metadata,
};
for (const type of contentTypes) models[`content_${type}`] = createContentModel(type);

export function getModel(collection) {
  if (!Object.hasOwn(models, collection)) throw new Error("Unknown collection.");
  return models[collection];
}
