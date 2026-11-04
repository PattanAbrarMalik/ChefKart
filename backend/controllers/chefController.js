/** Directory reads are public. Profile writes belong to the owner or an admin. */
import { store } from "../services/store.js";
import { chefValues, fail } from "../models/validation.js";
import { requireOwner } from "../middleware/auth.js";

export function publicChef(chef) {
  const { email, phone, address, pincode, ownerId, ...visible } = chef;
  return visible;
}
async function findChef(id) {
  const chef = await store.get("chefs", id);
  if (!chef) fail(404, "Chef not found.");
  return chef;
}
export async function list(req, res) {
  let chefs = await store.list("chefs");
  const query = String(req.query.q || "").toLowerCase();
  const city = String(req.query.city || "").toLowerCase();
  const cuisine = String(req.query.cuisine || "").toLowerCase();
  chefs = chefs.filter(
    (chef) =>
      `${chef.name} ${chef.city} ${chef.area} ${chef.cuisines.join(" ")}`
        .toLowerCase()
        .includes(query) &&
      (!city || chef.city.toLowerCase() === city) &&
      (!cuisine ||
        chef.cuisines.some((item) => item.toLowerCase() === cuisine)) &&
      (!req.query.diet || chef.diet === req.query.diet),
  );
  if (req.query.sort === "price") chefs.sort((a, b) => a.price - b.price);
  else chefs.sort((a, b) => b.experience - a.experience);
  res.json({ data: chefs.map(publicChef) });
}
export async function detail(req, res) {
  res.json({ data: publicChef(await findChef(req.params.id)) });
}
export async function mine(req, res) {
  res.json({
    data:
      (await store.list("chefs")).find(
        (chef) => chef.ownerId === req.user._id,
      ) || null,
  });
}
export async function create(req, res) {
  const values = chefValues(req.body);
  if (
    !/^\d{6}$/.test(values.pincode) ||
    !/^\+?[\d\s-]{10,15}$/.test(values.phone)
  )
    fail(400, "Enter a valid phone and six-digit pincode.");
  if ((await store.list("chefs")).some((chef) => chef.ownerId === req.user._id))
    fail(409, "You already have a chef profile. Edit your existing profile.");
  const chef = await store.create("chefs", {
    ...values,
    ownerId: req.user._id,
    verified: false,
    starRating: 0,
    totalRatings: 0,
  });
  res.status(201).json({ data: chef });
}
export async function update(req, res) {
  const chef = await findChef(req.params.id);
  requireOwner(req.user, chef.ownerId);
  const values = chefValues({ ...chef, ...req.body });
  if (
    !/^\d{6}$/.test(values.pincode) ||
    !/^\+?[\d\s-]{10,15}$/.test(values.phone)
  )
    fail(400, "Enter a valid phone and six-digit pincode.");
  // Verification and ratings cannot be forged by submitting a registration form.
  if (req.user.role === "admin" && typeof req.body.verified === "boolean")
    values.verified = req.body.verified;
  res.json({ data: await store.update("chefs", chef._id, values) });
}
export async function remove(req, res) {
  const chef = await findChef(req.params.id);
  requireOwner(req.user, chef.ownerId);
  if ((await store.list("bookings")).some((row) => row.chef === chef._id))
    fail(
      409,
      "This chef has booking records. Delete those records before removing the profile.",
    );
  await store.remove("chefs", chef._id);
  res.status(204).end();
}

// Admin-only route: private fields are needed to edit existing profiles.
export async function manage(req, res) {
  res.json({ data: await store.list("chefs") });
}
