/** Small, readable data rules shared by every persistence mode.
 * Every controller builds an allowlisted object: extra client fields are discarded.
 * Throwing an HTTP error stops the request; errorHandler formats the response.
 */
export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
export function text(value, label, { min = 1, max = 200 } = {}) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(400, `${label} must contain ${min}–${max} characters.`);
  return value.trim();
}
export function optionalText(value, label, max = 2000) {
  return text(value ?? "", label, { min: 0, max });
}
export function email(value) {
  const result = text(value, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail(400, "Enter a valid email address.");
  return result;
}
export function number(value, label, min, max) {
  if (
    value === "" ||
    value == null ||
    typeof value === "boolean" ||
    !Number.isFinite(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    fail(400, `${label} must be between ${min} and ${max}.`);
  return Number(value);
}
export function choice(value, label, options) {
  if (!options.includes(value))
    fail(400, `${label} must be one of: ${options.join(", ")}.`);
  return value;
}
export function imagePath(value = "") {
  if (!value) return "";
  const result = text(value, "Image", { max: 1000 });
  // Local bundled images or HTTPS URLs only; no scripts or arbitrary data URLs.
  if (
    !/^\/assets\/[\w./-]+$/.test(result) &&
    !/^https:\/\/[^\s]+$/.test(result)
  )
    fail(400, "Use an HTTPS image URL or /assets/ path.");
  return result;
}
export function futureDate(value) {
  if (typeof value !== "string")
    fail(400, "Choose a valid future date and time.");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
    fail(400, "Choose a future date and time.");
  return date.toISOString();
}
export function stringList(value, label) {
  if (!Array.isArray(value) || value.length > 15)
    fail(400, `${label} must be a list with at most 15 items.`);
  return value.map((item) => text(item, label, { max: 80 }));
}

// A chef's contact details are stored privately. Public projections are separate.
export function chefValues(body) {
  return {
    name: text(body.name, "Name"),
    city: text(body.city, "City"),
    area: text(body.area, "Area"),
    state: text(body.state, "State"),
    country: text(body.country || "India", "Country"),
    address: text(body.address, "Address", { max: 500 }),
    pincode: text(body.pincode, "Pincode", { min: 6, max: 6 }),
    email: email(body.email),
    phone: text(body.phone, "Phone", { min: 10, max: 15 }),
    experience: number(body.experience, "Experience", 0, 60),
    price: number(body.price, "Price", 100, 100000),
    aboutCook: text(body.aboutCook, "About you", { min: 10, max: 2000 }),
    cuisines: stringList(body.cuisines || [], "Cuisines"),
    language: stringList(body.language || [], "Languages"),
    diet: choice(body.diet, "Food preference", ["Vegetarian", "Both"]),
    profilepic: imagePath(body.profilepic),
    availability: optionalText(body.availability, "Availability", 200),
  };
}

// Repeated marketing resources share a small schema instead of 14 copied controllers.
export const contentTypes = [
  "blogs",
  "testimonials",
  "services",
  "gallery",
  "carousel",
  "home",
  "food",
  "food-gallery",
  "investors",
  "join",
  "connect",
];
export function contentValues(body) {
  return {
    title: text(body.title, "Title"),
    content: text(body.content, "Content", { max: 10000 }),
    category: optionalText(body.category, "Category", 100),
    image: imagePath(body.image),
  };
}
export function leadValues(body) {
  const phone = optionalText(body.phone, "Phone", 15);
  if (phone && !/^\+?[\d\s-]{10,15}$/.test(phone))
    fail(400, "Enter a valid phone number.");
  return {
    name: text(body.name, "Name"),
    email: email(body.email),
    phone,
    city: text(body.city, "City"),
    area: optionalText(body.area, "Area", 150),
    message: text(body.message, "Message", { min: 5, max: 3000 }),
    type: choice(body.type || "contact", "Enquiry type", [
      "contact",
      "investor",
      "career",
    ]),
  };
}
