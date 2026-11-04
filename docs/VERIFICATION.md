# MongoDB integration verification — completed 13 October 2026

For the added ChefKart exercise work, see [EXERCISES_VERIFICATION.md](EXERCISES_VERIFICATION.md). The results below describe the earlier MongoDB integration checks.

Core database/build checks were performed on 08 October; actual launch-command checks were completed on 13 October.

## Checks performed for this revision

| Check | Result |
|---|---|
| ChefKart local JSON API suite, npm test | 19 test entries passed, zero failed (18 scenarios plus parent) |
| The same ChefKart API suite using actual MongoDB | 19 test entries passed, zero failed |
| Student CRUD and initial CGPA connectivity integration tests | Both test entries passed, zero failed |
| Complete mongosh CRUD/operator script | Executed successfully; Rahul ended at marks 95; delete counts 1, 2, 1; final count 0 |
| React production build, npm run build | Succeeded |
| Actual root commands: dev:mongo, unit4, unit4:connect | All started; frontend proxy confirmed MongoDB; student POSTs returned 201 |

The tests used Node.js 24.19.0, npm 11.9.0, MongoDB Community Server 7.0.14, mongosh 2.5.6, Express 4.21.2 and Mongoose 8.8.3 on Linux. An actual standalone MongoDB server ran with temporary storage, not an in-memory JavaScript mock. Tests connected over localhost and the server was stopped afterward. Dependencies retain the supplied project's versions.

## What the checks exercise

The ChefKart suite tests health and sample data, signup/login, duplicate email handling, role protection, booking CRUD and ownership, price estimates, duplicate active slots, cancellation, chef CRUD, verification permissions, all eleven content collections, private enquiries, malformed JSON, CORS and unknown routes. It inspects persisted data and reconnects the store before reading a saved booking again. MongoDB tests use the Mongoose models and their indexes.

The Student suite sends real HTTP requests for all five CRUD endpoints and confirms an updated value directly in MongoDB. It tests duplicate roll numbers, missing fields, out-of-range marks, incorrect JSON types, unknown/operator fields, malformed JSON, invalid IDs, absent records and deletion. The second test exercises the initial POST/save example with text rollNo and CGPA, including rejection of CGPA above 10.

The shell exercise was run with mongosh. Its printed results are included, so expected values can be compared with actual output.

## Recorded output

- `verification/chefkart-json-results.txt`
- `verification/chefkart-mongo-results.txt`
- `verification/student-mongo-results.txt`
- `verification/shell-results.txt`
- `verification/build-results.txt`
- `verification/startup-results.txt`

## Boundaries

Windows installation and manual Thunder Client clicks were not performed in this environment. The package provides the steps and HTTP requests for those local tasks. Automated tests send equivalent requests to the real APIs. No screenshots are presented as evidence of your own machine.

The frontend source was preserved and its build was checked. The previous upload's browser/viewport report and screenshots are retained in `PREVIOUS_VERIFICATION.md` and `previews/` as historical material; those broad UI checks were not repeated in this revision.

This remains a teaching project. It does not process payments, send emails/SMS, dispatch real cooks, calculate booking-duration overlaps, or create recurring calendars. No production load test or new dependency security audit is claimed. Local JSON mode supports one writing process; use MongoDB mode for the assignment.

## Repeat the checks locally

With MongoDB Server running on localhost:27017, run these commands from the extracted ChefKart root:

```powershell
npm install
npm test
npm run test:mongo
npm run test:student
npm run build
mongosh "mongodb://127.0.0.1:27017" --file backend/scripts/student-shell-demo.js
```

Database integration tests create fresh, uniquely named test databases and remove them after testing. They do not use the app's MONGODB_URI or its customer records. Use TEST_MONGODB_URI only if your test server has a different address; use a dedicated development server.
