// Connectivity demo: Express -> Mongoose model -> collegeDB.students.
const express = require("express");
const mongoose = require("mongoose");
const Student = require("./Student");
const app = express();
app.use(express.json({ limit: "10kb" }));

app.post("/students", async (req, res) => {
  try {
    if (!req.body || Array.isArray(req.body) || typeof req.body !== "object") {
      return res.status(400).json({ message: "Send a JSON object." });
    }
    // Pick known fields so incoming IDs or operators are never stored.
    const { name, rollNo, branch, cgpa } = req.body;
    const student = new Student({ name, rollNo, branch, cgpa });
    await student.save(); // save() validates and inserts this new document.
    res.status(201).json(student);
  } catch (error) {
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ message: status === 400 ? error.message : "Database operation failed." });
  }
});

app.use((req, res) => res.status(404).json({ message: "Use POST /students for this first exercise." }));
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ message: "Check the JSON request body." });
});

async function start() {
  try {
    await mongoose.connect(process.env.CONNECTIVITY_MONGODB_URI || "mongodb://127.0.0.1:27017/collegeDB", {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected Successfully");
    const port = Number(process.env.CONNECTIVITY_PORT || 3002);
    const server = app.listen(port, "127.0.0.1", () => console.log(`Connection demo: http://127.0.0.1:${port}`));
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
    console.error(`Connection failed: ${error.message}`);
    await mongoose.disconnect();
    process.exitCode = 1;
  }
}
if (require.main === module) start();
module.exports = { app, Student };
