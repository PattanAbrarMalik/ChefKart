# REST API guide

Base URL during development or built local use: **http://127.0.0.1:8000/api**.

Send JSON with `Content-Type: application/json`. Protected endpoints also need `Authorization: Bearer YOUR_TOKEN`. Use the token returned by login/signup. In Postman, choose Authorization → Bearer Token and paste the value.

All successful data responses use `{ "data": ... }`. Login/signup also return `token`. Errors use `{ "message": "What went wrong" }`. Successful deletes return **204 with no body**. Empty lists return **200 and `data: []`**, not 404.

## HTTP methods

| Method | Meaning |
|---|---|
| GET | Read records; does not change them |
| POST | Create a new record |
| PUT | Update the provided editable fields; omitted values are retained in this application |
| DELETE | Remove one record by ID |

This revision uses PUT as a partial-update operation for straightforward compatibility with the original frontend pattern. It does not implement JSON Patch.

## Endpoints and access

| Method | Path | Access | Behaviour |
|---|---|---|---|
| GET | `/health` | Public | Backend status and selected storage mode |
| POST | `/auth/signup` | Public, rate limited | Create a customer |
| POST | `/auth/login` | Public, rate limited | Verify credentials; return user/token |
| GET | `/auth/me` | Signed in | Current safe account details |
| GET | `/chefs` | Public | Searchable directory; private contacts omitted |
| GET | `/chefs/:id` | Public | One public profile |
| GET | `/chefs/mine` | Signed in | Own full profile, or null |
| GET | `/chefs/manage` | Admin | All full profiles for editing |
| POST | `/chefs` | Signed in | Create own profile; one per account |
| PUT | `/chefs/:id` | Owner/admin | Edit profile; verification admin-only |
| DELETE | `/chefs/:id` | Owner/admin | Delete if no booking references remain |
| GET | `/bookings` | Signed in | Own bookings; admins see all |
| GET | `/bookings/:id` | Owner/admin | One booking |
| POST | `/bookings` | Signed in | Create booking; server derives owner, status and estimate |
| PUT | `/bookings/:id` | Owner/admin | Edit active booking/cancel; admins can complete |
| DELETE | `/bookings/:id` | Owner/admin | Remove cancelled/completed record |
| GET | `/content/:type` | Public | List content in a collection |
| GET | `/content/:type/:id` | Public | Read one content record |
| POST | `/content/:type` | Admin | Create content |
| PUT | `/content/:type/:id` | Admin | Edit content |
| DELETE | `/content/:type/:id` | Admin | Delete one content record |
| POST | `/leads` | Public, rate limited | Submit contact/investor/career enquiry |
| GET | `/leads` | Admin | List private enquiries |
| GET | `/leads/:id` | Admin | Read one enquiry |
| PUT | `/leads/:id` | Admin | Set status to new/resolved |
| DELETE | `/leads/:id` | Admin | Delete one enquiry |

## Authentication examples

POST `/auth/signup`:

```json
{
  "name": "Harish",
  "email": "harish@example.com",
  "password": "choose-your-own-password"
}
```

POST `/auth/login`:

```json
{
  "email": "harish@example.com",
  "password": "choose-your-own-password"
}
```

Passwords must contain 8–72 characters for signup. Public signup ignores any supplied role. Tokens expire after eight hours. Logout removes the browser's token; there is no server-side token-revocation list in this teaching project.

## Chef directory

GET `/chefs?city=Bengaluru&q=South&diet=Vegetarian&sort=price`

- `q` matches name, city, area or cuisines, case-insensitively.
- `city` and `cuisine` are optional case-insensitive exact matches.
- `diet` is `Vegetarian` or `Both`.
- `sort=price` sorts ascending; default sorts experience descending.

POST `/chefs` (Bearer token required):

```json
{
  "name": "Harish",
  "email": "harish@example.com",
  "phone": "9876543210",
  "city": "Bengaluru",
  "area": "Yelahanka",
  "state": "Karnataka",
  "country": "India",
  "address": "12 Example Road",
  "pincode": "560064",
  "experience": 2,
  "price": 499,
  "aboutCook": "I prepare fresh South Indian and North Indian home meals.",
  "cuisines": ["South Indian", "North Indian"],
  "language": ["Kannada", "Hindi", "English"],
  "diet": "Vegetarian",
  "availability": "Mornings 7–10 AM",
  "profilepic": ""
}
```

`profilepic` may be empty, an HTTPS image URL, or a local `/assets/...` image. There is no binary image-upload endpoint. `verified`, `ownerId`, ratings, IDs and timestamps are not customer-editable. Admins can PUT `verified: true/false` after their own verification process.

PUT `/chefs/ID`:

```json
{ "price": 599, "availability": "Mornings 8–11 AM" }
```

The response includes the saved editable record for the authorized owner/admin. Public directory endpoints never expose email, phone, street address, pincode or owner ID.

## Bookings

First GET `/chefs`, copy an actual `_id`, then POST `/bookings`:

```json
{
  "chef": "COPY_AN_ACTUAL_CHEF_ID",
  "bookingDate": "2027-01-20T04:30:00.000Z",
  "service": "one-time",
  "address": "12 Example Road, Yelahanka, Bengaluru",
  "guests": 2,
  "notes": "Vegetarian breakfast. Less spicy."
}
```

Choose a date in the future when you test. The frontend date picker uses your device timezone; the backend stores UTC ISO timestamps. `guests` must be a whole number from 1–100. Services are `one-time`, `monthly`, `party`.

The server chooses `user` from the token and `status=booked`. It ignores client-supplied totals. Estimates: one-time = chef price; monthly = 26 × chef price; party = 3 × chef price. These are simple project estimates, not actual bills.

PUT `/bookings/ID` to edit:

```json
{ "notes": "Please prepare dinner instead.", "guests": 4 }
```

PUT `/bookings/ID` to cancel:

```json
{ "status": "cancelled" }
```

Then DELETE `/bookings/ID` returns 204. Customers cannot set `completed`; only admins can. Closed bookings cannot be reopened or edited. You cannot book your own chef profile.

Two active bookings cannot use the same chef and exact start timestamp. Duration overlaps, recurring monthly dates and real cook acceptance/dispatch are outside this project's scheduling model.

## Content collections

Allowed types:

`blogs`, `testimonials`, `services`, `gallery`, `carousel`, `home`, `food`, `food-gallery`, `investors`, `join`, `connect`.

Each supports all five REST operations. Example POST `/content/blogs` as an admin:

```json
{
  "title": "A calmer kitchen",
  "content": "Plan your meals and prepare your ingredients before the visit.",
  "category": "Kitchen notes",
  "image": "/assets/kitchen.png"
}
```

Required: `title`, `content`. Optional: `category`, `image`. Text is displayed as plain text, not HTML. The `services` collection uses categories `monthly`, `one-time`, `party` to match service pages. All content is publicly readable at `/explore/TYPE` on the frontend; admin “View collection” links there. Supporting collections remain available as a CMS preview rather than automatically replacing every fixed home-page design element.

## Enquiries

POST `/leads`:

```json
{
  "name": "Harish",
  "email": "harish@example.com",
  "phone": "9876543210",
  "city": "Bengaluru",
  "area": "Yelahanka",
  "message": "I would like help finding a cook for next month.",
  "type": "contact"
}
```

Types: `contact`, `investor`, `career`. Phone/area are optional. A successful public response returns a record ID and saved-message confirmation, not the private enquiry body. No email/SMS is sent.

An admin can PUT `/leads/ID` with `{ "status": "resolved" }` or `{ "status": "new" }`.

## Status codes

| Code | Meaning |
|---|---|
| 200 | Read/update succeeded |
| 201 | Record created |
| 204 | Record deleted, empty response |
| 400 | Invalid input/date/enum/JSON |
| 401 | Missing/invalid/expired authentication or incorrect login |
| 403 | Signed-in caller lacks permission, or browser origin denied |
| 404 | Resource/endpoint does not exist |
| 409 | Duplicate email/profile/booking slot or protected record state |
| 413 | Request body exceeds size limit |
| 429 | Rate limit reached; respect Retry-After |
| 500 | Unexpected server error, details logged only by backend |

## Quick manual test order

1. Start the application, GET `/health`.
2. Signup a customer; save the returned token.
3. GET `/chefs`; save a chef ID.
4. POST a booking; save its ID.
5. GET the booking, PUT new notes, PUT cancelled, DELETE it.
6. POST your own chef profile; PUT a price change; DELETE it.
7. POST a contact enquiry.
8. Create an admin locally, log in through `/auth/login`, then GET private enquiries.
9. POST/GET/PUT/DELETE a blog record with the admin token.
10. Repeat an admin-only operation using the customer token and confirm 403.

The original mixed endpoints such as `/blog/getAll` and `/booking/createBook` are replaced by the routes above. The updated frontend already uses the new routes. External Postman collections must be updated; no silent legacy aliases are provided.
