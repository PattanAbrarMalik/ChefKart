// Student CRUD API: five REST routes in one server for easy reading.
const express = require("express");
const mongoose = require("mongoose");
const Student = require("./models/Student");
const app = express();

// Middleware turns a JSON request into req.body before any route runs.
app.use(express.json({ limit: "10kb" }));
app.get("/", (req, res) => res.json({ message: "Student CRUD API. Use /students." }));

// Reject invalid IDs early instead of letting them become a database cast error.
app.param("id", (req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({ message: "Use a 24-character MongoDB _id." });
  }
  next(); // Continue to the matching route.
});

// Allow only the four student fields, with their intended JSON types.
// This also stops a caller from changing _id or sending database operators.
function validateBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Send a JSON object." });
  }
  const fieldTypes = { name: "string", rollNo: "number", branch: "string", marks: "number" };
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !Object.hasOwn(fieldTypes, key))) {
    return res.status(400).json({ message: "Use only name, rollNo, branch and marks." });
  }
  for (const key of keys) {
    if (typeof body[key] !== fieldTypes[key] ||
        (fieldTypes[key] === "number" && !Number.isFinite(body[key]))) {
      return res.status(400).json({ message: `${key} must be a ${fieldTypes[key]}.` });
    }
  }
  next(); // The Mongoose schema checks required fields, min/max and empty strings.
}

// CREATE: POST /students. Example: { name: "Rahul", rollNo: 101, branch: "CSE", marks: 85 }
app.post("/students", validateBody, async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) { next(error); }
});

// READ ALL: find() returns an array, including [] when there are no students.
app.get("/students", async (req, res, next) => {
  try {
    const students = await Student.find().sort({ rollNo: 1 });
    res.json(students);
  } catch (error) { next(error); }
});

// READ ONE: req.params.id is the value in the URL after /students/.
app.get("/students/:id", async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    res.json(student);
  } catch (error) { next(error); }
});

// UPDATE: follows the slides' PUT example and accepts a partial set of fields.
app.put("/students/:id", validateBody, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // Change the supplied fields; keep the other fields.
      { new: true, runValidators: true }, // Return updated data and validate changes.
    );
    if (!student) return res.status(404).json({ message: "Student not found." });
    res.json(student);
  } catch (error) { next(error); }
});

// DELETE: removes one document identified by its _id.
app.delete("/students/:id", async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    res.json({ message: "Student deleted successfully" });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// Four arguments identify Express error middleware. All routes share this handler.
app.use((error, req, res, next) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: "This roll number already exists." });
  }
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map((item) => item.message).join(" ");
    return res.status(400).json({ message });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "The request body is not valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "The JSON body is too large." });
  }
  console.error(error.message);
  res.status(500).json({ message: "The server could not complete the request." });
});

// Connect FIRST, create the unique index, and only then accept HTTP requests.
async function start() {
  try {
    await mongoose.connect(process.env.STUDENT_MONGODB_URI || "mongodb://127.0.0.1:27017/studentDB", {
      serverSelectionTimeoutMS: 5000,
    });
    await Student.init();
    console.log("MongoDB Connected Successfully");
    const port = Number(process.env.STUDENT_PORT || 3001);
    const server = app.listen(port, "127.0.0.1", () => {
      console.log(`Student API: http://127.0.0.1:${port}`);
    });
    server.on("error", async (error) => {
      console.error(error.message);
      await mongoose.disconnect();
      process.exitCode = 1;
    });
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, () => server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      }));
    }
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    await mongoose.disconnect();
    process.exitCode = 1;
  }
}

if (require.main === module) start(); // Importing app in tests does not start a server.
module.exports = { app, Student };
