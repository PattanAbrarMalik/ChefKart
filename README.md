# ChefKart — Home Cook Discovery & Booking Platform

A production-grade full-stack web application connecting customers with professional home cooks. Built with **React**, **Express.js**, **MongoDB**, **Flask**, and **SQLite** as an integrated multi-service platform.

## Architecture Overview

For a comprehensive deep-dive into the architectural specification, threat model, domain invariants, and design patterns, see **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

```text
ChefKart/
├── frontend/                   React 18 SPA (Vite, React Router, Context API)
│   ├── src/
│   │   ├── components/         Reusable UI components (Layout, BookingForm, ChefForm)
│   │   ├── context/            Global state management (AuthContext)
│   │   ├── hooks/              Custom hooks (useApi)
│   │   ├── pages/              Route-level views (Home, Directory, Admin, etc.)
│   │   └── services/           API client layer
│   └── vite.config.js          Build config with dev proxy
│
├── backend/                    Express 4 API Server
│   ├── config/env.js           Centralized configuration management
│   ├── controllers/            Business logic (auth, chef, booking, content, lead)
│   ├── middleware/
│   │   ├── auth.js             JWT authentication + RBAC authorization
│   │   ├── errors.js           Centralized error handling with structured logging
│   │   ├── rateLimit.js        Per-IP sliding window rate limiter
│   │   ├── requestId.js        UUID correlation IDs for distributed tracing
│   │   ├── requestLogger.js    Structured HTTP access logs with timing
│   │   └── security.js         OWASP security headers (XSS, clickjacking, HSTS)
│   ├── models/                 Mongoose ODM schemas with validation
│   │   ├── User.js             bcrypt hashing, unique email, role enum
│   │   ├── Chef.js             Owner binding, price/experience bounds
│   │   ├── Booking.js          Status FSM, compound uniqueness index
│   │   ├── Lead.js             Multi-type enquiry (contact/career/investor)
│   │   ├── Content.js          Dynamic 11-collection CMS factory
│   │   └── validation.js       Shared validators (text, email, number, date, choice)
│   ├── routes/api.js           Route table with middleware pipeline
│   ├── services/
│   │   ├── store.js            Repository pattern: MongoDB ↔ JSON dual persistence
│   │   └── seed.js             Idempotent sample data provisioning
│   ├── utils/logger.js         Structured logger (JSON in prod, colored in dev)
│   ├── scripts/                DB tools (service catalog, chef CRUD, admin provisioning)
│   ├── tests/                  19 automated API integration tests
│   └── server.js               Production startup with graceful shutdown
│
├── services/
│   ├── forms/                  Flask 3 Form Processing Microservice
│   │   ├── app.py              Factory pattern, CSRF, route handlers
│   │   ├── validation.py       Input sanitization (text, date, phone, money)
│   │   ├── db.py               SQLite connection management
│   │   ├── templates/          Jinja2 server-rendered UI
│   │   ├── Dockerfile          Production container image
│   │   └── tests/              13 automated tests
│   └── student-api/            Student CRUD Microservice
│       ├── server.js           Express REST API (5 endpoints + validation)
│       ├── models/Student.js   Mongoose schema with unique rollNo index
│       ├── connectivity/       MongoDB connectivity demo service
│       └── tests/              Integration tests against real MongoDB
│
├── Dockerfile                  Multi-stage production build (frontend + backend)
├── docker-compose.yml          Full-stack orchestration (app + MongoDB + Flask)
├── .editorconfig               Cross-IDE code style enforcement
├── .dockerignore               Optimized Docker build context
├── docs/                       API reference, code walkthrough, guides
├── scripts/                    Development launchers (dev, mongo, test)
└── package.json                npm workspace monorepo configuration
```

## Quick Start

### Prerequisites
- **Node.js 20+** (tested with 24.19.0)
- **MongoDB Server** (for database mode; optional for local JSON mode)
- **Python 3.10+** (for the Flask form service)

### 1. Install & Run (Local JSON mode — no MongoDB needed)

```powershell
npm install
npm run dev
```

Open **http://127.0.0.1:3000**. The React frontend proxies API calls to the Express backend on port 8000.

### 2. Run with MongoDB

```powershell
npm run dev:mongo
```

Uses `mongodb://127.0.0.1:27017/chefkart` by default. Configure via `backend/.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/chefkart
```

### 3. Flask Form Processing Service

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/forms/requirements.txt
.\.venv\Scripts\python.exe services/forms/app.py
```

Open **http://127.0.0.1:5001** — serves cook details form, appointment booking, chef profile CRUD, and kitchen staff management.

### 4. Student Management API

```powershell
npm run student-api
```

Open **http://127.0.0.1:3001/students** — full CRUD REST API for student records with MongoDB.

### 5. MongoDB Shell Operations

```powershell
mongosh "mongodb://127.0.0.1:27017/chefkart_catalog" --file backend/scripts/service-catalog.mongosh.js
mongosh "mongodb://127.0.0.1:27017" --file backend/scripts/student-shell-demo.js
```

### 6. Node.js Chef CRUD Demo

```powershell
npm run db:chef-crud
```

### 7. Create an Admin Account

```powershell
npm run admin          # Local JSON mode
npm run admin:mongo    # MongoDB mode
```

### 8. Production Build

```powershell
npm run build
npm start
```

Open **http://127.0.0.1:8000**. Express serves both the built frontend and `/api`.

### 9. Enterprise Production Deployment (Render & Docker)

- **Render 1-Click Deployment Guide**: **[RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md)** (uses included `render.yaml` Blueprint)
- **Container & VM Deployment Guide**: **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** (Docker Compose, Nginx reverse proxy, CI/CD)

```powershell
# Run production multi-container stack with Nginx edge proxy locally
docker compose -f docker-compose.prod.yml up -d --build
```

## Platform Features

| Module | Capabilities |
|---|---|
| **Chef Directory** | Search by city/cuisine/area, filter by diet, sort by price/experience |
| **Booking System** | One-time, monthly, party bookings with server-side pricing engine |
| **Authentication** | JWT tokens (8h expiry), bcrypt hashing, session-based management |
| **Authorization** | Role-based access control (customer/admin), ownership verification |
| **Admin Dashboard** | Manage chefs, bookings, CMS content (11 types), enquiries |
| **Content CMS** | Blogs, testimonials, services, gallery, carousel, and more |
| **Enquiry System** | Contact, career, investor forms with status tracking |
| **Form Service** | Flask-based form validation, SQLite CRUD, CSRF protection |
| **Student API** | Express + Mongoose CRUD microservice with validation |
| **Rate Limiting** | Per-IP throttling (40 auth, 15 public enquiry requests) |
| **Responsive UI** | CSS breakpoints at 1100/850/600px, mobile hamburger navigation |

## API Reference (26 endpoints)

Base URL: `http://127.0.0.1:8000/api`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Server status + storage mode |
| POST | `/auth/signup` | Public | Create customer account |
| POST | `/auth/login` | Public | Authenticate, receive JWT |
| GET | `/auth/me` | Auth | Current user profile |
| GET | `/chefs` | Public | Search/filter/sort directory |
| POST | `/chefs` | Auth | Register chef profile |
| PUT/DELETE | `/chefs/:id` | Owner/Admin | Update or remove profile |
| GET/POST | `/bookings` | Auth | List or create bookings |
| PUT/DELETE | `/bookings/:id` | Owner/Admin | Edit, cancel, or delete |
| CRUD | `/content/:type[/:id]` | Public read / Admin write | 11 CMS collections |
| POST | `/leads` | Public | Submit enquiry |
| CRUD | `/leads[/:id]` | Admin | Manage enquiries |

## Testing

```powershell
npm test              # 19 API tests against temporary JSON store
npm run test:mongo    # Same suite against disposable MongoDB database
npm run test:student  # Student CRUD tests against MongoDB
```

Flask form service tests:

```powershell
.\.venv\Scripts\python.exe -m pytest services/forms/tests/ -v
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Vite 6, CSS (custom design tokens) |
| Backend API | Node.js, Express 4, JWT, bcryptjs, CORS, rate limiting |
| Database | MongoDB + Mongoose 8, local JSON fallback |
| Form Service | Python Flask 3, SQLite, Jinja2, CSRF tokens |
| Student API | Node.js, Express 4, Mongoose 8 |
| Testing | Node.js test runner (19 + student tests), pytest (13 tests) |
| Version Control | Git + GitHub |

## Security

- JWT authentication with HS256 signing and 8-hour expiry
- bcrypt password hashing (12 salt rounds)
- Role-based authorization on every endpoint
- Ownership verification — users access only their own records
- Per-IP rate limiting on authentication and public forms
- CORS origin whitelist, JSON body size limits (100KB)
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy headers
- CSRF session tokens on Flask forms
- Parameterized SQL queries (no string interpolation)
- HTML escaping via Jinja2 auto-escape

## Database Models

| Model | Collection | Key Fields |
|---|---|---|
| User | `users` | name, email (unique), password (bcrypt), role |
| Chef | `chefs` | ownerId (unique), name, city, cuisines, price, diet, verified |
| Booking | `bookings` | user, chef, bookingDate, service, guests, status, estimatedPrice |
| Lead | `leads` | name, email, city, message, type, status |
| Content | `content_<type>` | title, content, category, image (11 types) |
| Student | `students` | name, rollNo (unique), branch, marks (0-100) |

## Common Issues

- **Blank data:** check backend terminal says it is listening. Open `http://127.0.0.1:8000/api/health`.
- **Port in use:** close older project terminals. Frontend: 3000, Backend: 8000, Flask: 5001, Student API: 3001.
- **Cannot find package:** run `npm install` from the root folder.
- **Session expired:** sign in again. Tokens expire after 8 hours.
- **MongoDB unavailable:** leave `MONGODB_URI` blank to use local JSON mode.
