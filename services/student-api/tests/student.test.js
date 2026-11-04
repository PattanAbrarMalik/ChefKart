// Real MongoDB + real HTTP requests. Only the newly generated test database is removed.
const { test, after, before } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const { app, Student } = require("../server");
let server, base;
const dbName = `student_test_${crypto.randomBytes(8).toString("hex")}`;

before(async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017", {
    dbName, serverSelectionTimeoutMS: 5000,
  });
  await Student.init();
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
async function request(method, url, body) {
  const response = await fetch(base + url, {
    method, headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test("Student CRUD, persistence, validation, duplicate roll numbers and missing IDs", async () => {
  const values = { name: "Rahul", rollNo: 101, branch: "CSE", marks: 85 };
  const created = await request("POST", "/students", values);
  assert.equal(created.status, 201);
  const id = created.body._id;
  assert.match(id, /^[a-f0-9]{24}$/);
  assert.equal((await request("POST", "/students", values)).status, 409);
  assert.equal((await request("GET", "/students")).body.length, 1);
  assert.equal((await request("GET", `/students/${id}`)).body.name, "Rahul");
  const edited = await request("PUT", `/students/${id}`, { marks: 92 });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.marks, 92);
  // Read through the driver as well, proving MongoDB actually contains the update.
  const saved = await mongoose.connection.db.collection("students").findOne({ _id: new mongoose.Types.ObjectId(id) });
  assert.equal(saved.marks, 92);
  for (const invalid of [{ marks: 101 }, { marks: -1 }, { name: " " }, { rollNo: 1.5 },
    { marks: null }, { marks: true }, { marks: "92" }, { $set: { marks: 10 } }, { _id: id }, {}, []]) {
    assert.equal((await request("PUT", `/students/${id}`, invalid)).status, 400);
  }
  assert.equal((await request("POST", "/students", { name: "Missing fields" })).status, 400);
  assert.equal((await request("GET", "/students/not-an-id")).status, 400);
  const absentId = new mongoose.Types.ObjectId().toString();
  assert.equal((await request("GET", `/students/${absentId}`)).status, 404);
  assert.equal((await request("PUT", `/students/${absentId}`, { marks: 50 })).status, 404);
  assert.equal((await request("DELETE", `/students/${absentId}`)).status, 404);
  const malformed = await fetch(base + "/students", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops",
  });
  assert.equal(malformed.status, 400);
  assert.equal((await request("GET", "/unknown")).status, 404);
  assert.equal((await request("GET", `/students/${id}`)).body.marks, 92);
  assert.equal((await request("DELETE", `/students/${id}`)).status, 200);
  assert.equal((await request("GET", `/students/${id}`)).status, 404);
  assert.deepEqual((await request("GET", "/students")).body, []);
});

test("Connectivity demo uses text rollNo, CGPA and save()", async () => {
  const { app: demo, Student: DemoStudent } = require("../connectivity/server");
  const demoServer = demo.listen(0, "127.0.0.1");
  await new Promise((resolve) => demoServer.once("listening", resolve));
  try {
    const url = `http://127.0.0.1:${demoServer.address().port}/students`;
    const values = { name: "Ravi Kumar", rollNo: "23CSE101", branch: "CSE", cgpa: 8.7 };
    const response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
    });
    assert.equal(response.status, 201);
    const row = await response.json();
    assert.equal(row.cgpa, 8.7);
    assert.equal((await DemoStudent.findById(row._id)).rollNo, "23CSE101");
    const invalid = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, cgpa: 11 }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    await new Promise((resolve) => demoServer.close(resolve));
  }
});
