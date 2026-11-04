// Service Catalogue: MongoDB shell CRUD operations on a cooking_services collection.
// Run with: mongosh "mongodb://127.0.0.1:27017/chefkart_catalog" --file backend/scripts/service-catalog.mongosh.js
db = db.getSiblingDB("chefkart_catalog");
const runId = new ObjectId().toHexString();
const services = db.cooking_services;

// A service ID identifies one record, just as a book ID identifies one book.
services.createIndex({ serviceId: 1 }, { unique: true });

// CREATE: insert several cooking services. available is a Boolean, not a string.
services.insertMany([
  { serviceId: `${runId}-S01`, title: "Daily home cooking", chefName: "Meera Sharma",
    category: "Monthly", price: 12974, available: true, demoRun: runId },
  { serviceId: `${runId}-S02`, title: "One-time meal preparation", chefName: "Arjun Kumar",
    category: "One-time", price: 599, available: false, demoRun: runId },
  { serviceId: `${runId}-S03`, title: "Family dinner party", chefName: "Priya Singh",
    category: "Party", price: 2097, available: true, demoRun: runId },
]);
print("INSERT: three cooking services saved.");

// READ: this run initially has two available services.
print("READ: available cooking services");
printjson(services.find({ demoRun: runId, available: true }).toArray());

// UPDATE: the second service is now available.
print("UPDATE: make the one-time service available");
printjson(services.updateOne({ serviceId: `${runId}-S02` }, { $set: { available: true } }));
printjson(services.findOne({ serviceId: `${runId}-S02` }));

// DELETE: remove exactly the third service, leaving the first two for Compass.
print("DELETE: remove the party service");
printjson(services.deleteOne({ serviceId: `${runId}-S03` }));
print(`Remaining records from this run: ${services.countDocuments({ demoRun: runId })}`);
print(`Run ID: ${runId}`);
print("Inspect chefkart_catalog.cooking_services in Compass. Sample records remain saved.");
