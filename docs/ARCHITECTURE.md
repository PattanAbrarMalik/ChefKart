# ChefKart — Enterprise Software Architecture & System Design Specification

This document details the high-level architecture, design patterns, security model, data tier, and operational infrastructure of the ChefKart multi-service platform.

---

## 1. System Design & Architectural Overview

ChefKart is designed as a modular, cloud-ready multi-service architecture balancing decoupled responsibilities, high availability, and operational simplicity.

```
                              ┌─────────────────────────────────────────┐
                              │           Client Layer                  │
                              │  (React 18 SPA / Vite / Responsive UI)   │
                              └────────────────────┬────────────────────┘
                                                   │
                                            HTTPS / REST API
                                                   │
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   API Gateway / Edge                                   │
│  - Reverse Proxy (Nginx / Cloudflare / Ingress)                                        │
│  - SSL Termination & Strict-Transport-Security                                         │
│  - Distributed Tracing (X-Request-Id injection)                                        │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ChefKart Core API (Node.js/Express)                      │
│                                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Security Headers │  │ Request Tracer   │  │ Structured Log   │  │ CORS & Rate    │  │
│  │ (OWASP Hardening)│  │ (UUID Correlator)│  │ (JSON / Streams) │  │ Limiting       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           └─────────────────────┴───────────┬─────────┴────────────────────┘           │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Controller Tier                                     │  │
│  │  - AuthController (JWT HS256, bcrypt salted rounds=12, RBAC)                     │  │
│  │  - ChefController (Discovery, Search, Filter, Geo-location, Ownership checks)     │  │
│  │  - BookingController (Booking FSM, Server-side Pricing Engine, Slot Uniqueness)  │  │
│  │  - ContentController (Dynamic 11-collection Content Management Engine)           │  │
│  │  - LeadController (Private CRM Enquiries: Contact, Career, Investor)             │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          Domain Validation & Sanitization Tier                   │  │
│  │  - Strict allowlisting (discards unverified incoming parameters)                 │  │
│  │  - Boundary validators (type enforcement, length limits, regex sanitizers)       │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      Data Access Tier (Repository Pattern)                       │  │
│  │                                                                                  │  │
│  │       ┌──────────────────────────────────────────────────────────────┐           │  │
│  │       │             Dual-Mode Persistence Abstraction (store.js)     │           │  │
│  │       └──────────────┬───────────────────────────────┬───────────────┘           │  │
│  └──────────────────────┼───────────────────────────────┼───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┼──────────────────────────────┘
                          │                               │
                          ▼                               ▼
       ┌─────────────────────────────────────┐  ┌──────────────────────────────────────┐
       │     MongoDB 7.0 + Mongoose ODM      │  │       Atomic JSON Fallback Engine    │
       │  - Compound Unique Indexes          │  │  - Zero-dependency local persistence│
       │  - Partial Filter Expressions       │  │  - Atomic temp-file write + rename   │
       │  - Schema Rules & Validation hooks  │  │  - Crash-consistent durability       │
       └─────────────────────────────────────┘  └──────────────────────────────────────┘
                          ▲
                          │ Internal Bridge
                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Auxiliary Specialized Services                            │
│                                                                                        │
│  ┌──────────────────────────────────────────────┐ ┌─────────────────────────────────┐  │
│  │   Forms Microservice (Python / Flask 3)      │ │ Student CRUD Service            │  │
│  │   - Jinja2 auto-escaped templating           │ │ - Express + Mongoose REST API   │  │
│  │   - Cryptographic CSRF session tokens        │ │ - Standalone port 3001          │  │
│  │   - Parameterized SQLite durability          │ │ - Isolated collection sandbox   │  │
│  └──────────────────────────────────────────────┘ └─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Architectural Patterns

### 2.1. Repository Pattern (Dual-Mode Persistence)
- **Design Philosophy**: Business logic controllers interact exclusively with a 5-method contract (`list`, `get`, `create`, `update`, `remove`).
- **Production Mode (MongoDB)**: Backed by Mongoose models featuring:
  - Strong schema constraints (`trim`, `maxlength`, `min/max` bounds).
  - Index-enforced compound uniqueness (e.g., preventing double-booking of a chef on the same slot).
  - Explicit projection via `.lean()` for high-throughput zero-overhead JSON serialization.
- **Development/Offline Mode (JSON Store)**:
  - Atomic persistence using POSIX-compliant temp-file writes followed by atomic renames (`fs.renameSync`). This eliminates partial file corruption on power loss or process kill.
  - In-memory deep cloning (`structuredClone`) preventing reference pollution across requests.

### 2.2. Distributed Request Tracing & Correlation
- Every incoming HTTP request passes through `requestId` middleware:
  - If upstream proxies (Cloudflare, AWS ALB, Nginx) provide an `X-Request-Id`, it is adopted.
  - Otherwise, a cryptographically secure UUIDv4 is generated.
  - Attached to `req.id` and echoed back in `X-Request-Id` response header.
  - Propagated into structured application logs for end-to-end trace auditing.

### 2.3. Enterprise Structured Logging
- Handled by `backend/utils/logger.js`:
  - **Production**: Emits single-line JSON (`{"timestamp":"...","level":"info","message":"...","requestId":"..."}`) ideal for log aggregators (Elasticsearch, Datadog, AWS CloudWatch, Promtail/Loki).
  - **Development**: Emits human-readable ANSI color-coded text for fast developer feedback.
  - Latency profiling: Uses high-resolution timer (`process.hrtime.bigint()`) to track execution time down to millisecond accuracy.

---

## 3. Security Architecture & Threat Mitigation

| Security Concern | Defensive Implementation |
|---|---|
| **MIME-Type Sniffing** | `X-Content-Type-Options: nosniff` header |
| **Clickjacking** | `X-Frame-Options: DENY` header |
| **Referrer Leakage** | `Referrer-Policy: strict-origin-when-cross-origin` |
| **Protocol Downgrade** | `Strict-Transport-Security: max-age=31536000; includeSubDomains` in production |
| **Credential Storage** | `bcryptjs` with 12 salt rounds (adaptive cost factor resistant to GPU rainbow tables) |
| **Token Hijacking & Replay** | Signed JWTs using HMAC-SHA256 with 8-hour expiry and persistent high-entropy 48-byte random secret keys |
| **Role Escalation** | Strict RBAC in middleware (`requireAdmin`, `requireOwner`); client-supplied role keys in registration bodies are discarded |
| **Horizontal Privilege Escalation** | Explicit resource owner validation comparing authenticated user identity (`req.user._id`) against stored owner ID |
| **Denial of Service (DoS)** | In-memory sliding-window rate limiters per IP (40 requests on auth endpoints, 15 on public leads); payload size clamped to 100KB |
| **NoSQL Injection** | Request body type verification rejecting non-object or array roots; strict allowlist transformation discarding operator keys (`$gt`, `$where`) |
| **Cross-Site Request Forgery (CSRF)** | Session tokens validated on every POST submission in the Flask microservice; Express API is stateless Bearer-authenticated |

---

## 4. Booking Engine & Pricing Finite State Machine (FSM)

```
        ┌──────────┐
        │  Draft   │
        └────┬─────┘
             │ POST /bookings (Customer)
             ▼
        ┌──────────┐
   ┌───►│  Booked  │◄───┐
   │    └────┬─────┘    │ PUT /bookings/:id (Customer edit)
   │         │          │
   └─────────┘          │
             ├──────────┴────────────────────────┐
             │ PUT status="cancelled" (Customer) │ PUT status="completed" (Admin)
             ▼                                   ▼
      ┌─────────────┐                     ┌─────────────┐
      │  Cancelled  │                     │  Completed  │
      └──────┬──────┘                     └──────┬──────┘
             │ DELETE (Customer/Admin)           │ DELETE (Admin)
             ▼                                   ▼
        [ Purged ]                          [ Purged ]
```

- **Price Calculation Invariant**: Client-supplied prices are strictly ignored. The server derives pricing directly from the verified chef profile fee multiplied by the service tier constant:
  $$\text{Price}_{\text{one-time}} = \text{Chef Fee} \times 1$$
  $$\text{Price}_{\text{monthly}} = \text{Chef Fee} \times 26$$
  $$\text{Price}_{\text{party}} = \text{Chef Fee} \times 3$$
- **Slot Uniqueness Invariant**: Two active (`status = "booked"`) reservations cannot book the same chef at the exact ISO date-time.

---

## 5. Microservices Decomposition

### 5.1. Core API (Node.js/Express) — Port 8000
- Manages authentication, discovery, reservations, CMS content collections, and customer enquiries.
- Dual-mode persistence: MongoDB (production) or local JSON (development).
- Direct static file server for compiled frontend assets in production.

### 5.2. Forms Microservice (Python/Flask 3) — Port 5001
- Server-side rendered interface with Jinja2 auto-escaping.
- Independent SQLite database (`chefkart.sqlite3`) for kitchen staff roster and isolated chef profiles.
- Validates financial numbers using exact integers (paise) to prevent IEEE-754 floating-point rounding errors.

### 5.3. Student API Microservice (Node.js/Express) — Port 3001
- Clean CommonJS REST implementation with dedicated Mongoose ODM schema.
- Port-isolated to eliminate port collision with React Vite dev server (port 3000) or Express backend (port 8000).

---

## 6. Containerization & Operational Runbook

### 6.1. Docker Multi-Stage Build
The multi-stage `Dockerfile` guarantees a minimal attack surface and small image footprint:
1. **Stage 1 (`frontend-build`)**: Compiles React 18 SPA via Vite with full tree-shaking and gzip optimization.
2. **Stage 2 (`production`)**: Alpine Linux base with non-root security context (`USER chefkart:1001`), production-only dependencies (`npm ci --omit=dev`), and built static assets copied from Stage 1.
3. Built-in `HEALTHCHECK` probing `http://127.0.0.1:8000/api/health`.

### 6.2. Local Container Orchestration
Run the complete stack with:
```powershell
docker compose up --build
```
This spins up:
- `chefkart-mongodb`: MongoDB 7.0 database with named persistent volume.
- `chefkart-app`: Core API and React frontend on port 8000.
- `chefkart-forms`: Python Flask microservice on port 5001.

