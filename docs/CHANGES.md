# Platform exercises update — 13 October 2026

- Adapted all six supplied aims to the ChefKart cooking-service theme.
- Added a MongoDB service-catalogue shell exercise and a Node.js cook CRUD console program.
- Added a Flask form processing service with cook and appointment validation forms, SQLite cook CRUD and saved kitchen staff records.
- Kept validation, database helpers, HTML templates and styles in separate readable files with comments.
- Added server validation, bound SQL values, exact money storage in paise and form session tokens.
- Added corrected aims, Windows run instructions, a code guide and a combined practical PDF.
- Verified both MongoDB programs and all 13 Flask tests; see the exercises verification report.

## MongoDB and Student API update — 08 October 2026

- Added all shell CRUD and query-operator examples.
- Added the first CGPA connection example and the full marks-based Student API.
- Added Mongoose schemas and model CRUD to ChefKart while preserving its frontend and existing ID format.
- Added explicit MongoDB launch commands, test commands, request examples, explanations and the PDF guide.
- Corrected invalid shell capitalization, collection selection, duplicate sample insertion and short illustrative IDs in the teaching examples.
- Verified both ChefKart storage modes, the student APIs, the shell sequence and the frontend build. See VERIFICATION.md.

## Earlier revision notes from the supplied ZIP

# What changed from the supplied project

## Interface fixes

- Replaced the oversized fixed black navigation with a compact sticky header. The mobile menu appears only at the mobile breakpoint.
- Removed overflowing widths, fixed-size carousel layouts and large blank hero sections.
- Replaced unavailable remote decorative assets with the supplied local kitchen image, initials and inline SVG icons.
- Added consistent form fields, buttons, cards, typography, spacing, focus indicators, loading/error/empty states and mobile layouts.
- Fixed the registration link: `/register-chef` now redirects to the actual `/register` page.
- Added sign-in/signup, booking forms, My bookings and a usable admin workspace.
- Preserved all original public page paths; added a proper 404 screen.

## Backend fixes

- Removed the `new: tru` booking-update typo and corrected missing-record handling.
- Removed unsafe delete-all routes. Deletes require an explicit record ID and permission.
- Applied ownership checks to booking reads, edits and deletes, not only creation.
- Added role-based authorization for private enquiries, content changes and verification.
- Corrected contact routing: enquiry forms now write to the enquiry schema, not the unrelated marketing-content schema.
- Replaced inconsistent controllers/response shapes with `{ data }` and consistent errors.
- Fixed case-sensitive import issues by using one consistent naming convention.
- Removed the wrong model reference in investor deletion by sharing a validated content controller.
- Preserved an existing image on partial edits instead of replacing it with an empty string.
- Added server-side validation, duplicate checks, safe field selection, JSON limits and request limiting.
- Removed embedded real environment settings and insecure shared JWT fallback values from the deliverable.
- Waited for storage readiness before listening for requests.
- Separated application creation from server listening so integration tests can run safely.

## Structure changes

Original folders `ChefkarFrontend1` and `ChefkartBackend` become readable `frontend` and `backend` directories in one npm workspace. React and Express are retained. Plain CSS replaces Tailwind-dependent copied layouts. Browser fetch replaces Axios. Form handling uses React and native form validation instead of several overlapping libraries.

Duplicate marketing controllers are combined into one straightforward content controller; data rules are shared across local JSON and optional MongoDB. Source files include comments; CODE_WALKTHROUGH.md explains every application module. JSON config files are explained in documentation because JSON does not allow comments.

## Original resource mapping

| Original API family | New resource |
|---|---|
| `/auth` | `/api/auth/signup`, `/api/auth/login`, `/api/auth/me` |
| `/chef` | `/api/chefs` |
| `/booking` | `/api/bookings` |
| `/blog` | `/api/content/blogs` |
| `/testimonial` | `/api/content/testimonials` |
| `/gallery` | `/api/content/gallery` |
| `/crousel` | `/api/content/carousel` |
| `/home` | `/api/content/home` |
| `/food` | `/api/content/food` |
| `/foodGall` | `/api/content/food-gallery` |
| `/ser` | `/api/content/services` |
| `/investor` | `/api/content/investors` |
| `/join` | `/api/content/join` |
| `/connect` marketing text | `/api/content/connect` |
| Contact forms / investor contact | `/api/leads` with type `contact` / `investor` |
| Career interest | `/api/leads` with type `career` |

## Intentional simplifications and compatibility

- Content now uses common `title`, `content`, `category`, `image` fields. A gallery entry is one image with a caption; multiple gallery entries form a collection.
- Chef profiles use `address`, `cuisines`, `diet`, `price` and plain-text availability. The old nested cuisine-rating and availability schemas are simplified. Ratings are not editable customer claims.
- Data migration from an existing MongoDB is not automatic. Use a new database. No uploaded database contents were provided or altered.
- Old API paths are not backward-compatible; the complete revised frontend uses the new API. See API.md for request bodies.
- Local JSON mode allows immediate testing without external database credentials. It is limited to one writing process and modest data volumes.
- External image uploads are replaced with optional URLs and initials. No Cloudinary account is needed.
- App-store download CTAs, unverified business statistics and certification claims are replaced with actions that work inside this project.
- Payments, notifications, job placement, real cook dispatch, real verification and recurring-calendar scheduling are not integrated. Saved bookings and enquiries work locally.
