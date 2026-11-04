/** Account creation, sign-in, and the current-user endpoint. */
import bcrypt from "bcryptjs";
import { store } from "../services/store.js";
import { text, email, fail } from "../models/validation.js";
import { signToken, publicUser } from "../middleware/auth.js";

export async function signup(req, res) {
  const name = text(req.body.name, "Name");
  const address = email(req.body.email);
  const password = text(req.body.password, "Password", { min: 8, max: 72 });
  if ((await store.list("users")).some((user) => user.email === address))
    fail(409, "An account already exists with this email.");
  // A client cannot sign up as admin by adding a role field to JSON.
  const user = await store.create("users", {
    name,
    email: address,
    password: await bcrypt.hash(password, 12),
    role: "customer",
  });
  res.status(201).json({ data: publicUser(user), token: signToken(user) });
}
export async function login(req, res) {
  const address = email(req.body.email);
  const password = text(req.body.password, "Password", { max: 72 });
  const user = (await store.list("users")).find((row) => row.email === address);
  if (!user || !(await bcrypt.compare(password, user.password)))
    fail(401, "Incorrect email or password.");
  res.json({ data: publicUser(user), token: signToken(user) });
}
export function me(req, res) {
  res.json({ data: publicUser(req.user) });
}
