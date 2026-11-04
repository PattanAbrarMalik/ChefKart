// A schema defines each field and the rules that a document must follow.
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  rollNo: {
    type: Number,
    required: true,
    unique: true, // Creates a unique index; duplicate values produce error 11000.
    min: 1,
    validate: { validator: Number.isInteger, message: "rollNo must be a whole number." },
  },
  branch: { type: String, required: true, trim: true, maxlength: 30 },
  marks: { type: Number, required: true, min: 0, max: 100 },
});

// Model provides create(), find(), findById(), update and delete methods.
module.exports = mongoose.model("Student", studentSchema);
