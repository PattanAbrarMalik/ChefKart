# Test every request in Thunder Client

Start MongoDB, open the extracted ChefKart folder, run `npm install` once, then run `npm run student-api`. Wait for both the MongoDB connection message and the Student API URL. Keep that terminal open.

In VS Code, install the **Thunder Client** extension if needed. Open its sidebar icon and select **New Request**. For POST and PUT, choose **Body -> JSON**. Copy only the JSON, without Markdown fences. All IDs below must be replaced with the `_id` actually returned by your POST request.

## 1. CREATE

Method: **POST**. URL: `http://127.0.0.1:3001/students`

```json
{
  "name": "Rahul",
  "rollNo": 101,
  "branch": "CSE",
  "marks": 85
}
```

Click Send. Expect **201 Created**, the four submitted fields, an automatically generated 24-character `_id`, and Mongoose's `__v` field. Copy the real `_id`. A repeated roll number returns **409 Conflict**; either use another number or delete your previous record first.

## 2. READ ALL

Method: **GET**. URL: `http://127.0.0.1:3001/students`

No body. Expect **200 OK** and an array. Rahul appears in it. An empty database returns `[]`, which is a successful response.

## 3. READ ONE

Method: **GET**. URL: `http://127.0.0.1:3001/students/YOUR_CREATED_ID`

No body. Replace `YOUR_CREATED_ID` before sending. Expect **200 OK** and Rahul's document.

## 4. UPDATE

Method: **PUT**. URL: `http://127.0.0.1:3001/students/YOUR_CREATED_ID`

```json
{ "marks": 92 }
```

Expect **200 OK** with `marks: 92`. Name, branch and rollNo stay unchanged. GET the same URL again to verify persistence. This exercise accepts partial updates with PUT to follow the slides.

## 5. DELETE

Method: **DELETE**. URL: `http://127.0.0.1:3001/students/YOUR_CREATED_ID`

No body. Expect **200 OK**:

```json
{ "message": "Student deleted successfully" }
```

Repeat GET for that ID. Expect **404 Not Found**. GET all again: `[]` if this was your only record.

## 6. Check errors before deleting, or create a fresh record

| Request | Expected result |
|---|---|
| POST the same rollNo twice | 409, duplicate roll number |
| POST without name/rollNo/branch/marks | 400, required field errors |
| PUT `{ "marks": 101 }` | 400, maximum is 100 |
| PUT `{ "marks": -1 }` | 400, minimum is 0 |
| PUT `{ "marks": "92" }` | 400, use a JSON number |
| PUT `{ "rollNo": 1.5 }` | 400, whole number required |
| GET `/students/not-an-id` | 400, malformed ObjectId |
| GET a well-formed ID that does not exist | 404, student not found |
| POST malformed JSON | 400, invalid JSON |
| GET `/unknown` | 404, route not found |

## 7. Connectivity demo

Start a second terminal at the same ChefKart root and run `npm run student-api:connect`. Use **POST** `http://127.0.0.1:3002/students`:

```json
{
  "name": "Ravi Kumar",
  "rollNo": "23CSE101",
  "branch": "CSE",
  "cgpa": 8.7
}
```

Expect **201 Created**. This is the separate `collegeDB.students` example using `new Student()` and `save()`. Its rollNo is a string and its score is CGPA from 0 to 10. Do not send this body to the later marks-based API on port 3001.

## Evidence to capture on your computer

For a lab submission, capture the running server terminal, each of the five CRUD responses, the 404 after deletion, and MongoDB Compass showing a saved document before deletion. These are instructions for your own screenshots; the package does not invent screenshots of your Windows machine or your Thunder Client session.
