// Run with MONGOSH, not with node. See docs/EXERCISES_GUIDE.md for the full command.
// A separate practice database keeps these delete examples away from app data.
db = db.getSiblingDB("student_practice");
if (db.students.countDocuments({}) !== 0) {
  throw new Error("student_practice.students must be empty. Back up existing records first.");
}

print("1. CREATE: insertOne and insertMany");
db.students.insertOne({ name: "Rahul", rollNo: "CSE101", branch: "CSE", marks: 85 });
db.students.insertMany([
  { name: "Priya", rollNo: "CSE102", branch: "CSE", marks: 92 },
  { name: "Arjun", rollNo: "CSE103", branch: "CSE", marks: 76 },
  { name: "Meera", rollNo: "ECE101", branch: "ECE", marks: 80 },
]);

print("2. READ: all documents, one document, and a filter");
printjson(db.students.find().toArray());
db.students.find().pretty(); // In the interactive shell this formats the cursor output.
printjson(db.students.findOne({ rollNo: "CSE101" }));
printjson(db.students.find({ marks: { $gt: 80 } }).toArray());
printjson(db.students.find({ branch: "CSE" }).toArray());

print("3. QUERY OPERATORS: eq, gt, gte, lt, lte, ne, in");
print("eq 85: Rahul");
printjson(db.students.find({ marks: { $eq: 85 } }).toArray());
print("gt 80: Rahul, Priya");
printjson(db.students.find({ marks: { $gt: 80 } }).toArray());
print("gte 80: Rahul, Priya, Meera");
printjson(db.students.find({ marks: { $gte: 80 } }).toArray());
print("lt 80: Arjun");
printjson(db.students.find({ marks: { $lt: 80 } }).toArray());
print("lte 80: Arjun, Meera");
printjson(db.students.find({ marks: { $lte: 80 } }).toArray());
print("ne CSE: Meera");
printjson(db.students.find({ branch: { $ne: "CSE" } }).toArray());
print("in CSE/ECE: all four");
printjson(db.students.find({ branch: { $in: ["CSE", "ECE"] } }).toArray());

print("4. UPDATE: set Rahul to 90, then add 5; add a department to CSE records");
printjson(db.students.updateOne({ rollNo: "CSE101" }, { $set: { marks: 90 } }));
printjson(db.students.updateMany({ branch: "CSE" }, { $set: { department: "Computer Science" } }));
printjson(db.students.updateOne({ rollNo: "CSE101" }, { $inc: { marks: 5 } }));
printjson(db.students.findOne({ rollNo: "CSE101" })); // marks is now 95.

print("5. DELETE: one, many with a filter, then all remaining practice records");
printjson(db.students.deleteOne({ rollNo: "CSE101" })); // deletedCount: 1
printjson(db.students.deleteMany({ branch: "CSE" })); // deletedCount: 2
printjson(db.students.deleteMany({})); // deletedCount: 1 (only Meera remains).
print(`Final student count: ${db.students.countDocuments({})}`); // 0
