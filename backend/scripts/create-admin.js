/** Explicit local admin provisioning. Public signup always creates a customer.
 * Passwords are read interactively, not passed through shell command history.
 */
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { connectStore, closeStore, store } from "../services/store.js";
import { text, email } from "../models/validation.js";
const prompt = readline.createInterface({ input: stdin, output: stdout });
try {
  await connectStore();
  const name = text(await prompt.question("Admin name: "), "Name");
  const address = email(await prompt.question("Admin email: "));
  console.log(
    "Password input is visible in this terminal. Use a unique local-development password.",
  );
  const password = text(
    await prompt.question("Admin password (8–72 characters): "),
    "Password",
    { min: 8, max: 72 },
  );
  const existing = (await store.list("users")).find(
    (row) => row.email === address,
  );
  if (existing)
    throw new Error(
      "This email already exists. Use a new email; existing accounts are not silently promoted.",
    );
  await store.create("users", {
    name,
    email: address,
    password: await bcrypt.hash(password, 12),
    role: "admin",
  });
  console.log("Admin created. Sign in through the website, then open Admin.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  prompt.close();
  await closeStore();
}
