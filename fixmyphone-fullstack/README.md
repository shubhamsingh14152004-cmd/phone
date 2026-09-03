# FixMyPhone — Frontend + Backend (separated)

This project is now split into two independent halves:

```
fixmyphone-fullstack/
├── backend/     ← Node.js + Express REST API + JSON-file database
└── frontend/    ← Static HTML/CSS/JS site that talks to the API over fetch()
```

The backend also serves the frontend's static files by default, so for local
use you only need to run **one command** and open **one URL**. They stay
architecturally separate (frontend never touches data directly — everything
goes through `/api/...`), so you can later split them onto different hosts
(e.g. frontend on Vercel/Netlify, backend on Render/Railway) just by setting
`window.API_BASE` in `frontend/index.html` to the backend's URL and enabling
CORS for that origin (already on by default via the `cors` package).

## How to Run

### Option 1: Run Both Concurrently (Recommended)
From the project root (`fixmyphone-fullstack`):
```bash
npm run install:all
npm run dev
```
- **Backend API**: Runs at [http://localhost:3000](http://localhost:3000)
- **Frontend App**: Runs at [http://localhost:5173](http://localhost:5173) (with Vite Hot Reload)

---

### Option 2: Run Frontend & Backend Separately

**Terminal 1 — Backend API:**
```bash
cd backend
npm install
npm run dev
```
Runs the Express REST API at `http://localhost:3000/api`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs the Vite frontend development server at `http://localhost:5173`.

---

### Credentials
- **Admin login** (`/#login`): `admin@fixmyphone.com` / `Sagar@123` (configured in `backend/.env`).

## What actually changed vs. the single-file version

- **Data lives on the server now**, not in the browser. `frontend/js/db.js`
  calls `fetch()` against `/api/brands`, `/api/prices`, `/api/bookings`,
  `/api/technicians`, `/api/settings`, `/api/services` instead of using
  `window.storage`.
- **Admin writes require a real JWT.** `POST /api/auth/login` checks the
  credentials in `backend/.env` and returns a signed token; the admin panel
  sends it as `Authorization: Bearer <token>` on every save. Requests without
  a valid token get `401` (see `backend/src/middleware/auth.js`).
- **Seeding moved server-side.** `backend/src/data/build.js` builds the
  brand→series→model→price tree and sample bookings once, at first boot;
  `backend/src/data/seed-data.js` holds the source brand/service/technician
  lists admins would edit to change what ships by default.
- Every collection is a flat JSON array/object stored in
  `backend/storage/database.json` via `backend/src/data/store.js`. It's
  intentionally simple — swap that one file for a real database client
  (Postgres, MongoDB, etc.) when you outgrow it; nothing else needs to change
  since every route only calls `getCollection()` / `setCollection()`.

## Design decisions worth knowing about (and what to change before real production use)

- **`bookings` is a public, unauthenticated `PUT`.** That's what lets the
  public booking form save a new repair without logging in. A stricter setup
  would split this into `POST /api/bookings` (public, creates one booking)
  and `PATCH /api/bookings/:id` (admin-only, for status/payment/technician
  updates) — see the comment in
  `backend/src/routes/collections.routes.js`.
- **Whole-collection `PUT` instead of per-record REST routes.** `brands`,
  `prices`, `technicians`, and `settings` are each saved by overwriting the
  entire array/object, mirroring how the admin panel already edits its local
  copy and calls `persist(key)`. It's simple and it works, but a larger
  system would want `POST /api/brands`, `PATCH /api/prices/:id`, etc.
- **One shared admin login**, not a per-admin users table. Good enough for a
  single shop; add a `users` collection + per-user hashed passwords if you
  need multiple admin accounts with an audit trail.
- **JSON-file storage, not a real database.** Fine for a demo or a small
  single-location shop; move to Postgres/MongoDB for concurrent writers or
  any real scale (again, only `store.js` needs to change).
- **SMS/WhatsApp/Email are not actually sent anywhere.** Wire up
  Twilio/WhatsApp Business API/SendGrid from the backend (never from the
  frontend, so the API keys stay secret) when you're ready.

## Folder details

See `backend/README` inline comments in `server.js` and `frontend/index.html`
for where to point things if you split hosting later.
