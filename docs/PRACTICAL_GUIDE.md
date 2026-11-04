# ChefKart — Practical Exercises Guide

Read [PRACTICAL_AIMS.md](PRACTICAL_AIMS.md) for the corrected project-themed aims and the main [README](../README.md) for full platform documentation.

## MongoDB Shell Operations

From the ChefKart root, with MongoDB Server running:

```powershell
npm install
mongosh "mongodb://127.0.0.1:27017/chefkart_catalog" --file backend/scripts/service-catalog.mongosh.js
npm run db:chef-crud
```

## Flask Form Processing Service

MongoDB is **not** needed for this service:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/forms/requirements.txt
.\.venv\Scripts\python.exe services/forms/app.py
```

Open **http://127.0.0.1:5001** and choose an exercise.

| Exercise | File / Page |
|---|---|
| Service Catalogue (MongoDB shell) | `backend/scripts/service-catalog.mongosh.js` |
| Node.js Cook CRUD | `backend/scripts/chef-crud-demo.cjs` |
| Cook Details Form | `/cook-form` |
| Appointment Booking Form | `/appointment` |
| Cook Profile CRUD | `/chefs` |
| Kitchen Staff Management | `/employees` |

The form exercises display validated details; the CRUD exercises persist data in `services/forms/instance/chefkart.sqlite3`. These are separate educational examples and do not share records with the main React/Express platform. Use sample data locally.
