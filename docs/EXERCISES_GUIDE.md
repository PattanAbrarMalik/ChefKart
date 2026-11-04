# ChefKart — Practical Exercises

Completed practicals with simple code explanations. Open the extracted **ChefKart** folder in VS Code before running commands.

## 1. Corrected Aims

**Exercise 1 — Cooking service catalogue.** Design a MongoDB database for ChefKart containing service ID, service title, chef name, category, price, and availability. Write MongoDB commands to insert multiple cooking services, retrieve available services, update service availability, and delete a service.

**Exercise 2 — Node.js cook records.** Develop a Node.js program to establish a MongoDB connection and perform insert, retrieve, update, and delete operations on a collection of ChefKart cook records containing chef ID, name, cuisine, city, visit price, and availability.

**Exercise 3 — Cook details form.** Develop a Python web application for ChefKart using Flask. Accept the cook's name and cuisine or specialization through an HTML form. Validate the input and display the entered cook details.

**Exercise 4 — Cooking appointment form.** Develop a Python web application for ChefKart using Flask. Accept customer name, preferred cook, appointment date, and contact number through a form. Validate the input and display an appointment-details confirmation.

**Exercise 5 — Cook profile CRUD.** Design and implement a database-driven ChefKart Cook Information Management System using Flask, SQLite, and HTML forms. Provide Create, Read, Update, and Delete operations for profiles containing name, cuisine, city, visit fee, and availability.

**Exercise 6 — Kitchen staff records.** Design a Python web application for ChefKart Kitchen Staff Management using Flask and SQLite. Accept staff name, role, contact number, and monthly salary through a form, validate and store the details, and display the saved staff records.

The appointment exercise validates and displays details; it does not reserve a slot or save appointments. The CRUD exercises use a real SQLite database and retain their records after restarting.

All six exercises are included. The main React/Express application and the student management API remain in the project. Full executable source is in the repository; this guide explains the important code in short pieces.

## 2. Run the Exercises

### MongoDB and Node.js Exercises

Install Node.js 20 or later, MongoDB Community Server, and MongoDB Shell (`mongosh`). Start MongoDB Server before running either example. Compass is a database viewer; installing Compass alone does not start a database server.

From the extracted ChefKart root, run:

```powershell
npm install
mongosh "mongodb://127.0.0.1:27017/chefkart_catalog" --file backend/scripts/service-catalog.mongosh.js
npm run db:chef-crud
```

Both programs use the separate database `chefkart_catalog`. The shell file selects that database explicitly. For Node.js, an optional `MONGODB_URI` environment variable can override the default URI.

### Flask and SQLite Exercises

Use Python 3.10 or later. From the same extracted ChefKart root, run:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/forms/requirements.txt
.\.venv\Scripts\python.exe services/forms/app.py
```

Open **http://127.0.0.1:5001**. Keep the terminal open; press Ctrl+C to stop. The commands call the virtual environment directly, so activation is unnecessary.

SQLite comes with Python. The application creates its tables automatically in `services/forms/instance/chefkart.sqlite3`. MongoDB is not needed for these exercises. This separate Flask practice app has no login and is intended to run locally with sample data.

### Existing ChefKart Website

After `npm install`, use `npm run dev` for the JSON-backed website, or `npm run dev:mongo` with MongoDB running. Open **http://127.0.0.1:3000**. Its records are separate from the exercises.

## 3. Code Structure

| File or Folder | Purpose |
|---|---|
| `docs/PRACTICAL_AIMS.md` | The six corrected aims. |
| `backend/scripts/service-catalog.mongosh.js` | MongoDB shell commands for cooking services. |
| `backend/scripts/chef-crud-demo.cjs` | Node.js console program with connection, schema and CRUD. |
| `services/forms/app.py` | Flask routes: receive requests, validate, query and render pages. |
| `services/forms/validation.py` | Reusable functions for text, date, phone and money checks. |
| `services/forms/db.py` | Open and close SQLite connections; create tables. |
| `services/forms/schema.sql` | The chefs and employees table definitions. |
| `services/forms/templates/` | HTML pages and shared form fields. |
| `services/forms/static/style.css` | Responsive ChefKart colours, spacing and forms. |
| `services/forms/tests/test_app.py` | Thirteen tests using temporary databases. |

### Follow One Form from Start to Finish

1. A browser GET request opens a route such as `/chefs/new`.
2. Flask uses `render_template()` to display the HTML form.
3. The browser sends the completed form as a POST request.
4. The route reads `request.form` and calls a validation function.
5. If input is invalid, the same form displays errors and keeps the entered values.
6. If input is valid, display-only exercises show a confirmation; CRUD exercises execute SQL and call `commit()`.
7. After saving, Flask redirects to the records page, which reads the saved rows with SELECT.

`create_app()` builds the application and creates missing tables. `if __name__ == "__main__"` starts the server only when you run `app.py` directly. This also lets tests create a separate app with a temporary database.

## 4. Exercise 1: MongoDB Commands

**File:** `backend/scripts/service-catalog.mongosh.js`

A cooking service catalogue. Each record has a service ID, title, chef name, category, price, and availability.

| MongoDB Field | Example and Meaning |
|---|---|
| `serviceId` | Generated run ID plus S01; unique service identifier. |
| `title` | Daily home cooking; service description. |
| `chefName` | Meera Sharma; the cook providing the service. |
| `category` | Monthly, One-time or Party. |
| `price` | 12974; numeric price in INR for that service category. |
| `available` | Boolean true or false. |
| `demoRun` | Generated tag used to select only this run's sample records. |

### The Four Operations

The full file uses `insertMany()` to insert three complete service documents. Its two initially available services have IDs ending in S01 and S03.

```javascript
// READ: retrieve the available services inserted by this run.
services.find({ demoRun: runId, available: true }).toArray();

// UPDATE: change availability for one selected service.
services.updateOne(
  { serviceId: `${runId}-S02` },
  { $set: { available: true } }
);

// DELETE: remove the selected party service.
services.deleteOne({ serviceId: `${runId}-S03` });
```

`$set` changes the named field without replacing the complete document. A unique index on `serviceId` prevents duplicate IDs. Every execution generates a fresh `runId`, so repeating the file adds a new sample set without deleting unrelated records.

### Expected Result

The terminal shows three inserted services, two initially available services, one successful availability update and one deletion. **Two records remain from that run.** In Compass, open `chefkart_catalog` and the `cooking_services` collection.

Run this file with **mongosh**, not with Node.js. Commands such as `db.getSiblingDB()` and `printjson()` belong to the MongoDB shell.

## 5. Exercise 2: Node.js Connection and CRUD

**File:** `backend/scripts/chef-crud-demo.cjs`

A cook collection named `chefs`. Mongoose is the Node.js library used to describe the fields and communicate with MongoDB.

### Read the Program in Order

| Code | Simple Explanation |
|---|---|
| `new mongoose.Schema(...)` | Defines chef ID, name, cuisine, city, price and availability. |
| `mongoose.model(..., "chefs")` | Creates a model connected to the chefs collection. |
| `await mongoose.connect(uri)` | Waits for the database connection before running CRUD. |
| `await Chef.init()` | Waits for the unique chef ID index. |
| `await Chef.create(...)` | Inserts the sample cook. |
| `await Chef.find({ chefId }).lean()` | Retrieves matching records as plain JavaScript objects. |
| `await Chef.findOneAndUpdate(...)` | Updates the matching cook and returns the new values. |
| `await Chef.deleteOne({ chefId })` | Deletes only the cook inserted by the current run. |
| `finally { await mongoose.disconnect(); }` | Closes the database connection even if an error occurs. |

### Expected Console Sequence

```text
CONNECTED: MongoDB is ready.
INSERT: cook with price 499 and available true
RETRIEVE: array containing that cook
UPDATE: same cook with price 549 and available false
DELETE count: 1
RETRIEVE after delete: null
```

## 6. Exercises 3-4: Validate and Display Forms

### Exercise 3: Cook Details

Open **http://127.0.0.1:5001/cook-form**. Enter a cook name and cuisine. The confirmation page displays the cleaned values.

The route is `cook_form()` in `app.py`. `validate_cook()` in `validation.py` trims both fields and requires 2 to 80 characters.

### Exercise 4: Cooking Appointment

Open **http://127.0.0.1:5001/appointment**. Enter a customer name, select a sample cook, choose today or a future date, and enter a ten-digit contact number.

| Field | Server Validation |
|---|---|
| Customer name | Trim spaces; require 2 to 80 characters. |
| Preferred cook | Must match one of the three sample cook choices. |
| Appointment date | Must be a real YYYY-MM-DD date, today or later. |
| Contact number | Exactly ten digits, without spaces or a country prefix. |

These exercises are about form handling and validation. Neither form inserts a database record.

## 7. Exercise 5: Cook Profile CRUD

Open **http://127.0.0.1:5001/chefs**. Choose **Add a cook**, enter the fields and select **Save cook profile**.

| Operation | Flask Route | Database Statement |
|---|---|---|
| Create | GET/POST `/chefs/new` | INSERT INTO chefs |
| Read | GET `/chefs` | SELECT * FROM chefs |
| Update | GET/POST `/chefs/<id>/edit` | UPDATE chefs ... WHERE id = ? |
| Delete | POST `/chefs/<id>/delete` | DELETE FROM chefs WHERE id = ? |

### Create a Record with Bound Values

```python
db = get_db()
db.execute(
    "INSERT INTO chefs (name, cuisine, city, fee_paise, available) "
    "VALUES (?, ?, ?, ?, ?)",
    (values["name"], values["cuisine"], values["city"],
     values["fee_paise"], values["available"]),
)
db.commit()
```

Each `?` is a placeholder. SQLite receives the values separately from the SQL statement. The database stores fees as whole **paise**: INR 499.95 becomes 49995.

## 8. Exercise 6: Kitchen Staff Database

Open **http://127.0.0.1:5001/employees**. Enter the details and choose **Save staff record**.

| Field | Example and Validation |
|---|---|
| Staff name | Ravi Kumar; 2 to 80 characters. |
| Role | Cook, Kitchen assistant, Kitchen coordinator or Customer support. |
| Contact number | 9876543210; exactly ten digits. |
| Monthly salary | INR 18,000.50; enter 18000.50, without commas. Allowed range: 1 to 1,000,000. |

Salary is stored as integer paise. Phone numbers are stored as text. The database creates the staff ID.

## 9. Tests and Troubleshooting

### Run Flask Tests

```powershell
.\.venv\Scripts\python.exe -m pytest services/forms/tests/ -v
```

The tests create and remove their own temporary databases; they do not edit your saved records.

### Common Fixes

| Symptom | What to Do |
|---|---|
| MongoDB connection refused | Start MongoDB Server; check the URI and port. |
| mongosh is not recognised | Install MongoDB Shell and reopen the terminal. |
| No module named flask | Install requirements with the same .venv Python used to run app.py. |
| Port 5001 already in use | Stop the earlier Flask process. |
| Form says reload and submit again | Reload the page after restarting Flask; its session key changes on restart. |
| Flask records do not appear in React | Expected: these independent exercises use different databases. |

## 10. Database Summary

| Program | Default Data Location |
|---|---|
| Service catalogue (MongoDB shell) | MongoDB: `chefkart_catalog` |
| Chef CRUD demo (Node.js) | MongoDB: `chefkart_catalog` |
| Flask form exercises | `services/forms/instance/chefkart.sqlite3` |
| ChefKart website, JSON mode | `backend/data/database.json` |
| ChefKart website, MongoDB mode | MongoDB: `chefkart` |

Switching between programs does not copy records. The shell leaves two services per run; the Node.js demo removes its own sample cook.

### Official Learning References

Flask routing and form handling: https://flask.palletsprojects.com/en/stable/quickstart/

Flask SQLite tutorial: https://flask.palletsprojects.com/en/stable/tutorial/database/
