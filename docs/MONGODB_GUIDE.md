# MongoDB & Mongoose — Completed Practical Guide

MongoDB, Mongoose, Student CRUD and integration into ChefKart

Based on the supplied 52-slide WAF presentation dated 06-10-2026. This guide covers all practical examples and explains the introductory topics. Full runnable code is in the project.

## 1. What was completed

| Slides | Topic | Completed material |
|---|---|---|
| 1-11 | NoSQL, types, terminology, document structure and features | Section 2 below |
| 12-14 | Windows installation and connection | Section 3 and services/student-api/README |
| 15-23 | Shell CRUD and seven query operators | backend/scripts/student-shell-demo.js |
| 24-29 | Mongoose, schemas, models and validation | Sections 5-6; both Student model files |
| 30-35 | First Express connection and POST with CGPA | services/student-api/connectivity/ |
| 36-46 | Complete Student CRUD API | services/student-api/ |
| 47-52 | Thunder Client POST, GET, PUT and DELETE | docs/THUNDER_CLIENT.md and requests.http |
| Application to supplied project | Mongoose-backed ChefKart CRUD | backend/models/ and backend/services/store.js |

The slide deck is a teaching sequence rather than a numbered assignment sheet. Nothing in it asks for payment processing or a deployed website. The examples here use actual MongoDB for the database practicals.

Read the small Student lab first. Then read the ChefKart models to see how the same ideas work in a larger application. Comments describe the purpose of functions and important blocks. The original frontend/backend walkthrough is in CODE_WALKTHROUGH.md.

## 2. NoSQL concepts in simple language

**NoSQL** means Not Only SQL. These databases use models such as documents, key-value pairs, wide-column records and graphs. Choose a model based on the data and access patterns. A flexible schema does not mean data should have no rules.

| Type | Data arrangement | Examples from the slides |
|---|---|---|
| Document | Objects containing named fields and nested values | MongoDB, CouchDB |
| Key-value | One value looked up by a key | Redis, DynamoDB |
| Column-family | Related columns grouped within records | Cassandra, HBase |
| Graph | Nodes connected through relationships | Neo4j, Neptune |

**MongoDB** is a document database. Applications often show its documents as JSON-like objects. MongoDB stores them internally as BSON, which supports additional types such as dates and ObjectIds.

| Relational term | MongoDB term |
|---|---|
| Database | Database |
| Table | Collection |
| Row/record | Document |
| Column | Field |
| Primary key | _id |

A database contains collections. A collection contains documents. A document contains fields. For example, `studentDB` contains `students`, and one student document contains `name`, `rollNo`, `branch` and `marks`.

| SQL databases | MongoDB/document databases |
|---|---|
| Organize records into tables and rows | Organize records into collections and documents |
| Usually declare columns and constraints | Can store varying document shapes; application/database validation can impose rules |
| Often use joins and foreign keys | Often embed related data or store references |
| Use SQL | Use database-specific APIs and query syntax |

The slides' scaling comparison is a simplified tendency, not an absolute rule. Relational systems can scale horizontally, and document databases can also scale vertically. SQL and NoSQL systems both support useful relationships and consistency mechanisms.

**Other features named in the slides:** indexes can speed up suitable queries; aggregation processes documents through stages to calculate summaries; replica sets maintain copies for availability; sharding partitions data across servers. The class practical uses a single MongoDB server and does not configure a replica set or sharded cluster.

## 3. Install and run on Windows

Install Node.js with npm, VS Code, MongoDB Community Server, MongoDB Compass and MongoDB Shell (`mongosh`). Pick a MongoDB release supported by your Windows version. In the Windows MongoDB installer, use Complete installation and install MongoDB as a service. Compass is a viewer, while the server actually stores and serves data. `mongosh` may require a separate installation.

In Compass, create a connection using:

```text
mongodb://127.0.0.1:27017
```

Extract the ZIP. Open the extracted ChefKart folder in VS Code and its terminal. Run:

```powershell
npm install
npm run student-api
```

Expected startup messages:

```text
MongoDB Connected Successfully
Student API: http://127.0.0.1:3001
```

Keep the terminal open and send API requests through Thunder Client. The Student API deliberately uses port 3001 so it does not conflict with ChefKart's frontend on 3000. The connection-only exercise uses 3002. ChefKart's backend remains on 8000.

For ChefKart with MongoDB, open another root terminal and run `npm run dev:mongo`. Open `http://127.0.0.1:3000`. For an administrator, stop the app, run `npm run admin:mongo`, enter a new account, restart and sign in.

PowerShell accepts `cd "C:\path\to\ChefKart"`. CMD accepts `cd /d "C:\path\to\ChefKart"`. Replace the example path with your extracted folder. If PowerShell blocks npm.ps1, use `npm.cmd` in place of `npm`.

## 4. Shell CRUD and query operators

The shell and Node.js run different kinds of JavaScript environments. Run the shell file with **mongosh**, not `node`:

```powershell
mongosh "mongodb://127.0.0.1:27017" --file backend/scripts/student-shell-demo.js
```

It selects `student_practice`, checks that its students collection is empty, inserts four records, demonstrates every operation, and deletes those practice records. Application databases remain separate.

In an interactive mongosh session, the corrected selection commands are:

```javascript
use college
db.createCollection("students")
```

`use` is lowercase and selects a **database**. `Use students` in slide 18 is incorrect. You do not use `use` to select a collection. `db.students` accesses the collection; the first insert can create it automatically, so explicit createCollection is optional. In a script file, use `db = db.getSiblingDB("college")` instead of the interactive `use` helper.

### Create

```javascript
db.students.insertOne({
  name: "Rahul", rollNo: "CSE101", branch: "CSE", marks: 85
});
db.students.insertMany([
  { name: "Priya", rollNo: "CSE102", branch: "CSE", marks: 92 },
  { name: "Arjun", rollNo: "CSE103", branch: "CSE", marks: 76 },
  { name: "Meera", rollNo: "ECE101", branch: "ECE", marks: 80 }
]);
```

The script inserts Rahul once. Copying slides 18 and 19 consecutively would insert Rahul twice because that shell example has no unique roll-number index.

### Read

```javascript
db.students.find();
db.students.find().pretty();
db.students.findOne({ rollNo: "CSE101" });
db.students.find({ marks: { $gt: 80 } });
db.students.find({ branch: "CSE" });
```

`find()` returns a cursor over matching documents. `findOne()` returns one document or null. The runnable script converts cursors to arrays for clear printed output. `pretty()` changes display, not the stored data.

| Operator/filter before updates | Meaning | Matching students |
|---|---|---|
| `{ marks: { $eq: 85 } }` | Equal to 85 | Rahul |
| `{ marks: { $gt: 80 } }` | Greater than 80 | Rahul, Priya |
| `{ marks: { $gte: 80 } }` | At least 80 | Rahul, Priya, Meera |
| `{ marks: { $lt: 80 } }` | Less than 80 | Arjun |
| `{ marks: { $lte: 80 } }` | At most 80 | Arjun, Meera |
| `{ branch: { $ne: "CSE" } }` | Not CSE | Meera |
| `{ branch: { $in: ["CSE", "ECE"] } }` | In either listed branch | All four |

### Update

```javascript
db.students.updateOne(
  { rollNo: "CSE101" }, { $set: { marks: 90 } }
);
db.students.updateMany(
  { branch: "CSE" }, { $set: { department: "Computer Science" } }
);
db.students.updateOne(
  { rollNo: "CSE101" }, { $inc: { marks: 5 } }
);
```

The first argument selects records. The second describes changes. `$set` assigns a value; `$inc` adds to a number. Rahul starts at 85, becomes 90 and ends at **95**. The department field is added to all three CSE documents.

### Delete

```javascript
db.students.deleteOne({ rollNo: "CSE101" });
db.students.deleteMany({ branch: "CSE" });
db.students.deleteMany({});
```

In this sequence, the deleted counts are **1, 2, 1**. Rahul is removed first, Priya and Arjun next, then Meera. The final count is **0**. An empty filter matches every document, so the complete script confines this example to its dedicated practice database.

## 5. First Express and Mongoose example

**Mongoose** is an Object Data Modeling library. A schema describes fields and validation. A model uses that schema to read and write documents. Express handles HTTP requests. MongoDB stores the documents.

The first example from slides 28-35 is in `services/student-api/connectivity/`. Its schema uses a **text** rollNo such as `23CSE101`, and **cgpa** between 0 and 10. Start it with:

```powershell
npm run student-api:connect
```

Send POST to `http://127.0.0.1:3002/students` with:

```json
{
  "name": "Ravi Kumar",
  "rollNo": "23CSE101",
  "branch": "CSE",
  "cgpa": 8.7
}
```

The route picks these four fields from req.body, creates `new Student(...)`, then calls `await student.save()`. It returns status 201 and the saved document. Compass shows it in `collegeDB.students`.

`mongoose.connect()` must succeed before the HTTP server starts. `await` pauses that async function until the operation finishes. A connection error produces a visible message instead of claiming the database is ready.

The second example is a separate lab. It uses numeric rollNo, marks from 0 to 100, database studentDB and port 3001. Keeping both examples avoids mixing the two schemas used by the slides.

## 6. Understand the Student model

The complete file is `services/student-api/models/Student.js`.

| Field/rule | Explanation |
|---|---|
| name: String, required, trim | Requires a non-empty name and removes edge spaces |
| rollNo: Number, required, unique | Requires a roll number and creates a unique index |
| rollNo min 1, Number.isInteger | Rejects zero, negatives and fractions |
| branch: String, required | Requires a non-empty branch |
| marks: Number, required, min 0, max 100 | Enforces the allowed mark range |
| mongoose.model("Student", studentSchema) | Creates the Student model; default collection name is students |

MongoDB gives the document an `_id`; Mongoose normally uses an ObjectId for this schema. Its string representation contains **24 hexadecimal characters**. Copy the returned ID. The shortened example IDs in the slides are illustrations, not valid IDs to reuse.

`unique: true` is an index instruction rather than a normal Mongoose validator. Startup waits for `Student.init()` so the index is ready. Error code 11000 is converted to HTTP **409 Conflict**. Field validation errors produce **400 Bad Request**.

JSON numbers must not be in quotation marks in this API. Use `"rollNo": 101` and `"marks": 85`. The initial CGPA example intentionally uses `"rollNo": "23CSE101"` instead.

## 7. Understand the Student server

The complete file is `services/student-api/server.js`. The five routes are kept together so a beginner can read the whole request flow in one place.

| Code or function | Purpose |
|---|---|
| require("express") and require("mongoose") | Load the two installed packages |
| express() | Creates the web application |
| express.json() | Parses an incoming JSON body into req.body |
| app.param("id", ...) | Rejects malformed IDs before a database lookup |
| validateBody | Allows only known fields and expected JSON types |
| app.post/get/put/delete | Connects an HTTP method and URL to a function |
| try/catch and next(error) | Passes failed operations to the common error handler |
| app.use((error, req, res, next) => ...) | Formats readable JSON errors |
| start() | Connects MongoDB, waits for the index, starts HTTP and handles shutdown |
| require.main === module | Starts when run directly; permits importing app in tests |

`req` is the request, `res` sends the response, and `next()` continues to the next matching middleware. `next(error)` switches to the error handler. `req.body` holds submitted JSON. `req.params.id` holds the ID from the URL. A response such as `res.status(201).json(student)` sends a status code and a JSON document.

| Operation | HTTP request | Mongoose method | Success |
|---|---|---|---|
| Create | POST /students | Student.create(req.body) | 201 |
| Read all | GET /students | Student.find() | 200 |
| Read one | GET /students/:id | Student.findById(id) | 200 |
| Update | PUT /students/:id | Student.findByIdAndUpdate(...) | 200 |
| Delete | DELETE /students/:id | Student.findByIdAndDelete(id) | 200 |

For update, the important code is:

```javascript
const student = await Student.findByIdAndUpdate(
  req.params.id,
  { $set: req.body },
  { new: true, runValidators: true }
);
```

`new: true` returns the updated document. `runValidators: true` checks changed fields, including the marks range. Without it, update validation is not automatically enabled. A valid but missing ID produces null, which the route changes into a 404 response.

This lab follows the slides' partial update with PUT. Only submitted fields change. A production API might choose PATCH for partial updates, but the learning exercise keeps the exact method requested by the slides.

## 8. Thunder Client demonstration

Start `npm run student-api`. Install/open Thunder Client in VS Code, choose New Request, and use the following sequence. Select Body -> JSON for POST and PUT.

1. POST `http://127.0.0.1:3001/students` with the JSON below. Expect 201 and copy `_id`.
2. GET the same URL. Expect 200 and an array containing Rahul.
3. GET `http://127.0.0.1:3001/students/YOUR_ID`. Expect 200 and one document.
4. PUT to that ID URL with `{ "marks": 92 }`. Expect 200 and updated marks.
5. GET again. Confirm the persisted value is 92.
6. DELETE that ID URL. Expect 200 and the deletion message.
7. GET that ID again. Expect 404.

```json
{
  "name": "Rahul",
  "rollNo": 101,
  "branch": "CSE",
  "marks": 85
}
```

Before deleting, also try marks 101 and a repeated roll number. The first returns 400; the second returns 409. Open Compass to inspect studentDB.students while the record exists. Save your own screenshots if your teacher requires submission evidence.

The full, copyable steps are in `docs/THUNDER_CLIENT.md`. The `services/student-api/requests.http` file is a request reference; sending it directly requires VS Code REST Client. Thunder Client can use the same URLs and bodies through its normal request editor.

## 9. How the same work is applied to ChefKart

The supplied ChefKart app already had a React frontend and Express CRUD routes. Its old MongoDB adapter used raw collections through Mongoose's connection. The update adds explicit Mongoose schemas and models, then uses model methods in the existing store. This makes schema/model/validation/CRUD visible in the actual project.

| New file in backend/models | Collection or responsibility |
|---|---|
| User.js | Account names, emails, password hashes, roles; unique email |
| Chef.js | Cook profiles, prices, cuisine lists and contact fields; unique owner |
| Booking.js | Customer/cook references, date, service, guests, estimate and status |
| Lead.js | Private contact, career and investor enquiries |
| Content.js | Shared content schema for the eleven allowed content collections |
| Metadata.js | Remembers whether starter content has been inserted |
| common.js | Shared string ID and timestamp fields |
| index.js | Maps the allowed collection names to their models |

ChefKart retains its existing string IDs and ISO timestamp strings so the frontend and existing v2 records keep the same field formats. The standalone Student lab demonstrates MongoDB ObjectIds. A schema's `ref` records a relationship for Mongoose; it does not automatically enforce a database foreign key. Controllers check existence and permissions.

`backend/services/store.js` now uses `Model.create()`, `find().lean()`, `findById().lean()`, `findByIdAndUpdate()` and `findByIdAndDelete()` in MongoDB mode. `lean()` returns plain JavaScript objects that the existing controllers expect. The update method enables validators. Index initialization finishes before startup accepts requests.

The same cook cannot have two active bookings at the same exact start time. A unique partial index checks only records whose status is booked. Cancelling a booking releases that exact slot. This does not calculate duration overlaps or reserve a repeating monthly calendar.

### Follow one booking through the code

1. React's BookingForm collects service, date, address, guests and notes.
2. The shared frontend API helper sends POST /api/bookings with the login token.
3. Express parses JSON. requireAuth verifies the token and loads the user.
4. bookingController validates fields and finds the cook.
5. The controller calculates the price estimate and selects the owner/status itself.
6. store.create chooses the Booking model in MongoDB mode.
7. Mongoose validates the document. MongoDB inserts it and enforces the unique index.
8. Express returns 201. React displays the saved booking under My bookings.

Read CODE_WALKTHROUGH.md for every existing controller, middleware, component and page. API.md lists the ChefKart routes. The new scripts/mongo.mjs ensures dev:mongo, start:mongo and admin:mongo use the same configured MongoDB database.

## 10. Run and check the completed project

| Purpose | Root command |
|---|---|
| Install all workspace dependencies | npm install |
| Student API | npm run student-api |
| Initial connection exercise | npm run student-api:connect |
| ChefKart with MongoDB | npm run dev:mongo |
| Create MongoDB administrator | npm run admin:mongo |
| ChefKart local JSON demo | npm run dev |
| Build frontend | npm run build |
| Serve built app with MongoDB on port 8000 | npm run start:mongo |
| Check local ChefKart behaviour | npm test |
| Check ChefKart against MongoDB | npm run test:mongo |
| Check both student examples against MongoDB | npm run test:student |

Use MongoDB mode for the assignment. Open `http://127.0.0.1:8000/api/health` and check for `storage: "mongodb"`. The local JSON demo is a separate convenience option; it does not demonstrate MongoDB persistence. Changing modes does not migrate records between them.

The automated tests use new test databases with random names and remove those databases after the run. They cover create/read/update/delete, validation and missing records. ChefKart additionally checks authentication, ownership, private data, content management and slot conflicts. See VERIFICATION.md for the checks actually completed for this revision.

## 11. Common errors and viva answers

| Symptom | Fix |
|---|---|
| `Use students` syntax error | Use lowercase `use college`; access records through db.students |
| mongosh is not recognized | Install MongoDB Shell separately, add its bin folder to PATH, reopen terminal |
| Connection refused on 27017 | Start MongoDB Server; connecting Compass alone does not start it |
| npm cannot find package.json | Run commands in the extracted ChefKart root |
| EADDRINUSE | Stop the older process using that port, or set STUDENT_PORT/CONNECTIVITY_PORT |
| POST returns duplicate rollNo | Use another number or delete the previous record |
| An ID request returns 400 | Copy the real 24-character _id returned by POST |
| ChefKart works but Compass shows no records | Check health storage and start dev:mongo for database work |
| No admin link | Create an admin in the same storage mode, then sign in with it |

**Why use a schema?** To define field types and validation rules. **Why use a model?** It provides methods to work with the collection. **Why express.json()?** HTTP bodies arrive as bytes; the middleware parses JSON into req.body. **Why async/await?** Database operations finish asynchronously. **Why validate on the server?** A caller can send HTTP requests without using your form. **What does 201 mean?** Created. **400?** Invalid request. **404?** No matching route/record. **409?** A conflict such as a duplicate roll number.

**What is middleware?** Code that runs during request processing before a response, or in the error path. Express middleware and Mongoose middleware are different: Express handles HTTP requests; Mongoose hooks run around model operations. Mongoose runs validation before save by default. The models here need no extra custom pre-save hook because password hashing remains explicit in ChefKart's auth controller.

## 12. Source references

Primary course source: the uploaded WAF presentation dated 06-10-2026, slides 1-52. The runnable examples correct its shell capitalization, collection selection, duplicated insertion sequence and illustrative short IDs.

- MongoDB Windows installation: https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-windows/
- MongoDB Shell download: https://www.mongodb.com/try/download/shell
- Mongoose 8 validation: https://mongoosejs.com/docs/8.x/docs/validation.html
- Mongoose update behaviour: https://mongoosejs.com/docs/tutorials/findoneandupdate.html
- Thunder Client: https://docs.thunderclient.com/get-started

The ZIP includes the complete commented source. Installation on your Windows computer and screenshots taken in your own Thunder Client session must be performed there. The verification report distinguishes executed checks from those local steps.
