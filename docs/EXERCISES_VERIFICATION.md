# ChefKart Exercises Verification

Completed 13 October 2026. Checks used sample records and temporary databases.

| Check | Observed Result |
|---|---|
| Exercise 1 (MongoDB shell) | Three services inserted; available services returned; S02 availability updated to true; S03 deleted; two records remained from the run. |
| Exercise 2 (Node.js CRUD) | Connected to MongoDB; created and read a cook; updated price from 499 to 549 and availability to false; deleted exactly one record; final read returned null. |
| Database isolation | Unrelated sentinel service and cook records remained unchanged. |
| Flask test suite | All 13 tests passed, including validation, exact money values, CRUD, saved staff, restart persistence, escaped HTML, bound SQL and form tokens. |
| Flask startup | The `services/forms/app.py` entry point started successfully on port 5001. |
| Browser forms | Empty cook form displayed errors; valid cook and appointment forms displayed the expected confirmation. |
| Browser cook records | Create, list, pre-filled edit, saved fee/availability and confirmed deletion all worked. |
| Browser staff | Saved staff appeared with the correct salary; refresh retained the row without duplicating it. |
| Responsive pages | Home, both form pages, chef list, new-chef form and staff page had no horizontal overflow at 1280px and 375px. No JavaScript page errors occurred. |

Tools used: actual MongoDB 7.0.14, mongosh 2.5.6, Node.js 24.19.0, Python 3.12, Flask 3.1.2, SQLite and Chromium 134 with Playwright 1.51.1. MongoDB was a standalone database process, not a JavaScript mock. Browser screenshots were used only for internal layout review and are not part of the deliverables.

Recorded output:

- `verification/week6-results.txt`
- `verification/week7-results.txt`
- `verification/week7-browser-results.txt`

The original React/Express source was not changed by this addition. Its earlier tests and build results are documented in `VERIFICATION.md`.
