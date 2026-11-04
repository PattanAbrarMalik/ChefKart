/** The public website reads content; only administrators can change it. */
import { store } from "../services/store.js";
import { contentTypes, contentValues, fail } from "../models/validation.js";
function collection(req) {
  if (!contentTypes.includes(req.params.type))
    fail(404, "Content collection not found.");
  return `content_${req.params.type}`;
}
export async function list(req, res) {
  res.json({ data: await store.list(collection(req)) });
}
export async function detail(req, res) {
  const row = await store.get(collection(req), req.params.id);
  if (!row) fail(404, "Content not found.");
  res.json({ data: row });
}
export async function create(req, res) {
  res.status(201).json({
    data: await store.create(collection(req), contentValues(req.body)),
  });
}
export async function update(req, res) {
  const name = collection(req);
  const row = await store.get(name, req.params.id);
  if (!row) fail(404, "Content not found.");
  res.json({
    data: await store.update(
      name,
      row._id,
      contentValues({ ...row, ...req.body }),
    ),
  });
}
export async function remove(req, res) {
  if (!(await store.remove(collection(req), req.params.id)))
    fail(404, "Content not found.");
  res.status(204).end();
}
