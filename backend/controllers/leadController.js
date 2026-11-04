/** Contact, career, and investor enquiries are private records, not public content. */
import { store } from "../services/store.js";
import { leadValues, choice, fail } from "../models/validation.js";
export async function create(req, res) {
  const row = await store.create("leads", {
    ...leadValues(req.body),
    status: "new",
  });
  // Return a receipt only; the public endpoint never lists private submissions.
  res.status(201).json({
    data: { _id: row._id },
    message:
      "Your enquiry has been saved. Our team can review it in the dashboard.",
  });
}
export async function list(req, res) {
  res.json({ data: await store.list("leads") });
}
export async function detail(req, res) {
  const row = await store.get("leads", req.params.id);
  if (!row) fail(404, "Enquiry not found.");
  res.json({ data: row });
}
export async function update(req, res) {
  const row = await store.get("leads", req.params.id);
  if (!row) fail(404, "Enquiry not found.");
  res.json({
    data: await store.update("leads", row._id, {
      status: choice(req.body.status, "Status", ["new", "resolved"]),
    }),
  });
}
export async function remove(req, res) {
  if (!(await store.remove("leads", req.params.id)))
    fail(404, "Enquiry not found.");
  res.status(204).end();
}
