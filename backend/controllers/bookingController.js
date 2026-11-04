/** Booking CRUD. Ownership is checked on EVERY read, edit, and delete. */
import { store } from "../services/store.js";
import {
  choice,
  futureDate,
  optionalText,
  text,
  number,
  fail,
} from "../models/validation.js";
import { requireOwner } from "../middleware/auth.js";
export const serviceNames = ["one-time", "monthly", "party"];

async function ownedBooking(req) {
  const row = await store.get("bookings", req.params.id);
  if (!row) fail(404, "Booking not found.");
  requireOwner(req.user, row.user);
  return row;
}
function bookingValues(body) {
  return {
    bookingDate: futureDate(body.bookingDate),
    service: choice(body.service, "Service", serviceNames),
    address: text(body.address, "Cooking address", { min: 8, max: 500 }),
    guests: number(body.guests, "Guests", 1, 100),
    notes: optionalText(body.notes, "Notes"),
  };
}
async function withChef(row) {
  const chef = await store.get("chefs", row.chef);
  return {
    ...row,
    chefName: chef?.name || "Removed chef",
    chefCity: chef?.city || "",
  };
}
export async function list(req, res) {
  const rows = (await store.list("bookings")).filter(
    (row) => req.user.role === "admin" || row.user === req.user._id,
  );
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ data: await Promise.all(rows.map(withChef)) });
}
export async function detail(req, res) {
  res.json({ data: await withChef(await ownedBooking(req)) });
}
export async function create(req, res) {
  const values = bookingValues(req.body);
  const chef = await store.get("chefs", text(req.body.chef, "Chef ID"));
  if (!chef) fail(404, "Chef not found.");
  if (chef.ownerId === req.user._id)
    fail(400, "You cannot book your own profile.");
  if (!Number.isInteger(values.guests))
    fail(400, "Guests must be a whole number.");
  // Pricing is an estimate, calculated on the server; no payment is collected.
  const multiplier = { "one-time": 1, monthly: 26, party: 3 }[values.service];
  const row = await store.create("bookings", {
    ...values,
    user: req.user._id,
    chef: chef._id,
    status: "booked",
    estimatedPrice: chef.price * multiplier,
  });
  res.status(201).json({ data: await withChef(row) });
}
export async function update(req, res) {
  const row = await ownedBooking(req);
  const status = choice(req.body.status ?? row.status, "Status", [
    "booked",
    "cancelled",
    "completed",
  ]);
  if (
    req.user.role !== "admin" &&
    status === "completed" &&
    row.status !== "completed"
  )
    fail(403, "Only an administrator can complete a booking.");
  if (row.status !== "booked" && status !== row.status)
    fail(409, "A closed booking cannot be reopened.");
  const changes = { status };
  if (
    row.status !== "booked" &&
    Object.keys(req.body).some((key) => key !== "status")
  )
    fail(409, "Closed bookings cannot be edited.");
  // Cancelling a past booking works without revalidating its old date.
  if (
    row.status === "booked" &&
    Object.keys(req.body).some((key) => key !== "status")
  ) {
    Object.assign(changes, bookingValues({ ...row, ...req.body }));
    if (!Number.isInteger(changes.guests))
      fail(400, "Guests must be a whole number.");
    const chef = await store.get("chefs", row.chef);
    changes.estimatedPrice =
      chef.price * { "one-time": 1, monthly: 26, party: 3 }[changes.service];
  }
  res.json({
    data: await withChef(await store.update("bookings", row._id, changes)),
  });
}
export async function remove(req, res) {
  const row = await ownedBooking(req);
  if (row.status === "booked")
    fail(409, "Cancel the booking before deleting it.");
  await store.remove("bookings", row._id);
  res.status(204).end();
}
