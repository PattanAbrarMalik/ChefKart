// Connectivity demo model: text roll number and CGPA (0-10).
// The CRUD service uses a separate studentDB database and numeric rollNo/marks.
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  cgpa: { type: Number, required: true, min: 0, max: 10 },
});
module.exports = mongoose.model("ConnectivityStudent", schema, "students");
