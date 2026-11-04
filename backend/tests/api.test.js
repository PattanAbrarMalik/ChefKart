/** Integration tests use real HTTP + temporary persistent storage.
 * They never read or overwrite backend/data or the user's configured MongoDB.
 * Run from the project root with npm test.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "chefkart-test-"));
process.env.DATA_DIR = temp;
const testMongoUri = process.env.CHEFKART_TEST_MONGODB_URI || "";
// Mongo tests only accept the disposable database names created by our runner.
if (testMongoUri && !/^\/chefkart_test_[a-z0-9_]+$/.test(new URL(testMongoUri).pathname))
  throw new Error("Mongo tests require a fresh chefkart_test_ database.");
process.env.MONGODB_URI = testMongoUri;
process.env.JWT_SECRET =
  "test-only-secret-with-more-than-thirty-two-characters";
const { app } = await import("../app.js");
const { store, connectStore, closeStore } = await import("../services/store.js");
const { seedData } = await import("../services/seed.js");
await connectStore();
await seedData();
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;

// One helper keeps tests focused on behaviour instead of fetch boilerplate.
async function request(url, method = "GET", body, token) {
  const response = await fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
  };
}
const nextDay = (offset) =>
  new Date(Date.now() + offset * 86400000).toISOString();

test("complete REST application", async (t) => {
  try {
    let alice, bob, admin, chef, booking;
    await t.test("health, seed idempotence, and privacy", async () => {
      assert.equal((await request("/health")).body.data.status, "ok");
      await seedData();
      const list = await request("/chefs");
      assert.equal(list.body.data.length, 4);
      chef = list.body.data[0];
      assert.equal(chef.email, undefined);
      assert.equal(chef.address, undefined);
      assert.equal(
        (await request("/chefs?city=Bengaluru")).body.data.length,
        3,
      );
      assert.equal(
        (await request("/chefs?q=not-a-real-chef")).body.data.length,
        0,
      );
      assert.equal((await request("/chefs/missing")).status, 404);
    });
    await t.test(
      "signup, duplicate email, login, and no self-promotion",
      async () => {
        const created = await request("/auth/signup", "POST", {
          name: "Alice",
          email: "ALICE@example.com",
          password: "password123",
          role: "admin",
        });
        assert.equal(created.status, 201);
        alice = created.body.token;
        assert.equal(created.body.data.role, "customer");
        assert.equal(created.body.data.password, undefined);
        assert.equal(
          (
            await request("/auth/signup", "POST", {
              name: "A",
              email: "alice@example.com",
              password: "password123",
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request("/auth/login", "POST", {
              email: "alice@example.com",
              password: "wrong",
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request("/auth/login", "POST", {
              email: "alice@example.com",
              password: "password123",
            })
          ).status,
          200,
        );
        bob = (
          await request("/auth/signup", "POST", {
            name: "Bob",
            email: "bob@example.com",
            password: "password123",
          })
        ).body.token;
        await store.create("users", {
          name: "Administrator",
          email: "admin@example.com",
          password: await bcrypt.hash("adminpassword", 4),
          role: "admin",
        });
        admin = (
          await request("/auth/login", "POST", {
            email: "admin@example.com",
            password: "adminpassword",
          })
        ).body.token;
        assert.equal(
          (await request("/auth/me", "GET", undefined, alice)).body.data.email,
          "alice@example.com",
        );
        assert.equal(
          (await request("/bookings", "GET", undefined, "invalid")).status,
          401,
        );
        assert.equal(
          (await request("/leads", "GET", undefined, alice)).status,
          403,
        );
      },
    );
    await t.test(
      "booking create/read/update and record ownership",
      async () => {
        const body = {
          chef: chef._id,
          bookingDate: nextDay(2),
          service: "one-time",
          address: "123 Test Road, Bengaluru",
          guests: 2,
          notes: "Less spicy",
        };
        assert.equal((await request("/bookings", "POST", body)).status, 401);
        assert.equal(
          (
            await request(
              "/bookings",
              "POST",
              { ...body, bookingDate: "2020-01-01" },
              alice,
            )
          ).status,
          400,
        );
        assert.equal(
          (await request("/bookings", "POST", { ...body, guests: 2.5 }, alice))
            .status,
          400,
        );
        const created = await request(
          "/bookings",
          "POST",
          { ...body, estimatedPrice: 1, user: "fake", status: "completed" },
          alice,
        );
        assert.equal(created.status, 201);
        booking = created.body.data;
        assert.equal(booking.status, "booked");
        assert.equal(booking.estimatedPrice, chef.price);
        assert.equal(
          (await request(`/bookings/${booking._id}`, "GET", undefined, alice))
            .status,
          200,
        );
        assert.equal(
          (await request("/bookings", "GET", undefined, bob)).body.data.length,
          0,
        );
        for (const method of ["GET", "PUT", "DELETE"])
          assert.equal(
            (
              await request(
                `/bookings/${booking._id}`,
                method,
                method === "PUT" ? { notes: "bad" } : undefined,
                bob,
              )
            ).status,
            403,
          );
        assert.equal(
          (await request("/bookings", "POST", body, bob)).status,
          409,
        );
        const edited = await request(
          `/bookings/${booking._id}`,
          "PUT",
          {
            bookingDate: nextDay(3),
            service: "monthly",
            notes: "Updated preferences",
          },
          alice,
        );
        assert.equal(edited.status, 200);
        assert.equal(edited.body.data.estimatedPrice, chef.price * 26);
        assert.equal(
          (
            await request(
              `/bookings/${booking._id}`,
              "PUT",
              { status: "completed" },
              alice,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/bookings/${booking._id}`,
              "DELETE",
              undefined,
              alice,
            )
          ).status,
          409,
        );
      },
    );
    await t.test(
      "booking cancellation, delete, and persistence",
      async () => {
        assert.equal(
          (
            await request(
              `/bookings/${booking._id}`,
              "PUT",
              { status: "cancelled" },
              alice,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/bookings/${booking._id}`,
              "PUT",
              { status: "booked" },
              alice,
            )
          ).status,
          409,
        );
        const saved = testMongoUri ? {
          bookings: await mongoose.connection.db.collection("bookings").find().toArray(),
          users: await mongoose.connection.db.collection("users").find().toArray(),
        } : JSON.parse(fs.readFileSync(path.join(temp, "database.json"), "utf8"));
        assert.equal(
          saved.bookings.find((row) => row._id === booking._id).status,
          "cancelled",
        );
        assert.notEqual(saved.users[0].password, "password123");
        // Reconnect and read again: data must survive a store connection closing.
        await closeStore();
        await connectStore();
        assert.equal((await store.get("bookings", booking._id)).status, "cancelled");
        assert.equal(
          (
            await request(
              `/bookings/${booking._id}`,
              "DELETE",
              undefined,
              alice,
            )
          ).status,
          204,
        );
        assert.equal(
          (await request(`/bookings/${booking._id}`, "GET", undefined, alice))
            .status,
          404,
        );
      },
    );
    await t.test(
      "chef registration, read, edit, verification protection, and delete",
      async () => {
        const body = {
          name: "Test Cook",
          email: "cook@example.com",
          phone: "9876543210",
          city: "Test City",
          area: "Area",
          state: "State",
          country: "India",
          address: "Private address",
          pincode: "560001",
          experience: 3,
          price: 450,
          aboutCook: "I enjoy cooking healthy home meals.",
          cuisines: ["South Indian"],
          language: ["Kannada"],
          diet: "Vegetarian",
          verified: true,
        };
        const created = await request("/chefs", "POST", body, alice);
        assert.equal(created.status, 201);
        const id = created.body.data._id;
        assert.equal(created.body.data.verified, false);
        assert.equal(
          (await request("/chefs", "POST", body, alice)).status,
          409,
        );
        assert.equal(
          (await request("/chefs/mine", "GET", undefined, alice)).body.data
            .address,
          "Private address",
        );
        assert.equal(
          (
            await request(
              `/chefs/${id}`,
              "PUT",
              { name: "Updated Cook", verified: true },
              alice,
            )
          ).body.data.verified,
          false,
        );
        assert.equal(
          (await request(`/chefs/${id}`, "PUT", { price: 600 }, bob)).status,
          403,
        );
        assert.equal(
          (await request(`/chefs/${id}`, "DELETE", undefined, bob)).status,
          403,
        );
        assert.equal(
          (await request(`/chefs/${id}`, "PUT", { verified: true }, admin)).body
            .data.verified,
          true,
        );
        assert.equal(
          (await request("/chefs/manage", "GET", undefined, alice)).status,
          403,
        );
        assert.equal(
          (await request("/chefs/manage", "GET", undefined, admin)).status,
          200,
        );
        assert.equal(
          (await request(`/chefs/${id}`, "DELETE", undefined, alice)).status,
          204,
        );
      },
    );
    for (const type of [
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
    ]) {
      await t.test(`${type}: full admin CRUD and public reads`, async () => {
        const url = `/content/${type}`;
        assert.equal((await request(url)).status, 200);
        assert.equal(
          (
            await request(
              url,
              "POST",
              { title: "Test", content: "Text" },
              alice,
            )
          ).status,
          403,
        );
        const created = await request(
          url,
          "POST",
          {
            title: "Test title",
            content: "Example content",
            image: "/assets/kitchen.png",
          },
          admin,
        );
        assert.equal(created.status, 201);
        const id = created.body.data._id;
        assert.equal(
          (await request(`${url}/${id}`)).body.data.title,
          "Test title",
        );
        const updated = await request(
          `${url}/${id}`,
          "PUT",
          { title: "Edited title" },
          admin,
        );
        assert.equal(updated.body.data.title, "Edited title");
        assert.equal(updated.body.data.image, "/assets/kitchen.png");
        assert.equal(
          (
            await request(
              `${url}/${id}`,
              "PUT",
              { image: "javascript:alert(1)" },
              admin,
            )
          ).status,
          400,
        );
        assert.equal(
          (await request(`${url}/${id}`, "DELETE", undefined, admin)).status,
          204,
        );
        assert.equal((await request(`${url}/${id}`)).status, 404);
      });
    }
    await t.test("private contact, investor and career enquiries", async () => {
      for (const type of ["contact", "investor", "career"]) {
        const created = await request("/leads", "POST", {
          name: "Visitor",
          email: "visitor@example.com",
          city: "Bengaluru",
          message: "I have a question.",
          type,
        });
        assert.equal(created.status, 201);
        const id = created.body.data._id;
        assert.equal(created.body.data.email, undefined);
        assert.equal((await request(`/leads/${id}`)).status, 401);
        assert.equal(
          (await request(`/leads/${id}`, "GET", undefined, admin)).body.data
            .type,
          type,
        );
        assert.equal(
          (await request(`/leads/${id}`, "PUT", { status: "resolved" }, admin))
            .body.data.status,
          "resolved",
        );
        assert.equal(
          (await request(`/leads/${id}`, "DELETE", undefined, admin)).status,
          204,
        );
      }
    });
    await t.test(
      "validation, unknown endpoints, JSON syntax, and CORS",
      async () => {
        assert.equal(
          (await request("/leads", "POST", { email: "invalid" })).status,
          400,
        );
        assert.equal((await request("/not-real")).status, 404);
        assert.equal((await request("/content/not-real")).status, 404);
        const malformed = await fetch(base + "/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{invalid",
        });
        assert.equal(malformed.status, 400);
        const crossOrigin = await fetch(base + "/health", {
          headers: { Origin: "https://untrusted.example" },
        });
        assert.equal(crossOrigin.status, 403);
      },
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (testMongoUri) await mongoose.connection.dropDatabase();
    await closeStore();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
