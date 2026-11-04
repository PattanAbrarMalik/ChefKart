// Chef CRUD Demo: Node.js + Mongoose standalone program demonstrating database operations.
// Run with: node backend/scripts/chef-crud-demo.cjs
const mongoose = require("mongoose");

// A schema describes the values accepted in the chefs collection.
const chefSchema = new mongoose.Schema({
  chefId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  cuisine: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 100, max: 100000 },
  available: { type: Boolean, required: true },
});
const Chef = mongoose.model("DemoChef", chefSchema, "chefs");

async function main() {
  try {
    // A separate demo database keeps sample operations away from production data.
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chefkart_catalog";
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    await Chef.init(); // Wait for the unique chefId index before inserting.
    console.log("CONNECTED: MongoDB is ready.");

    // INSERT: a fresh ID makes the program safe to repeat.
    const chefId = `CK-${new mongoose.Types.ObjectId()}`;
    const created = await Chef.create({
      chefId, name: "Meera Sharma", cuisine: "South Indian", city: "Bengaluru",
      price: 499, available: true,
    });
    console.log("INSERT:", JSON.stringify(created.toObject()));

    // RETRIEVE: find() returns an array of matching documents.
    const records = await Chef.find({ chefId }).lean();
    console.log("RETRIEVE:", JSON.stringify(records));

    // UPDATE: change only the selected fields and validate their new values.
    const updated = await Chef.findOneAndUpdate(
      { chefId }, { $set: { price: 549, available: false } },
      { new: true, runValidators: true },
    ).lean();
    console.log("UPDATE:", JSON.stringify(updated));

    // DELETE: remove only the record created by this run.
    const removed = await Chef.deleteOne({ chefId });
    console.log("DELETE count:", removed.deletedCount);
    console.log("RETRIEVE after delete:", await Chef.findOne({ chefId }));
  } catch (error) {
    console.error("Chef CRUD demo failed:", error.message);
    process.exitCode = 1;
  } finally {
    // Close the connection on success as well as failure, so Node can exit.
    await mongoose.disconnect();
  }
}

main();
