# TASKS.md - FloraCraft Project Work Tracker

This document tracks completed features, active work items, priority backlogs, bug reports, and security checklists throughout the lifetime of the FloraCraft project.

---

## Completed

- `[x]` **Phase 1: Catalog & Admin Core**
  - `[x]` Database initialization & Seeding script (populated with sample plant data)
  - `[x]` Search catalog filters, category toggles, sorting, and pagination
  - `[x]` Presentational components (grids, cards, load state indicators)
  - `[x]` Basic plant upload form for catalog insertion
- `[x]` **Phase 2: Core E-Commerce & Operations**
  - `[x]` Customer Registration & Login (fully isolated from admin credentials)
  - `[x]` Account Settings (change display name, contact phone number, profile image URL)
  - `[x]` Profile Password Changing (with old password verification)
  - `[x]` Persistent Cart (database-backed cart loading, stock-limited quantity controls)
  - `[x]` Wishlist (saving items, toggling icons, direct cart transfers)
  - `[x]` Product Details View (`/product/:id` routing, image carousel, related plants grid)
  - `[x]` Review system (ratings, comments submission, edit/delete actions, average rating auto-sync)
  - `[x]` Address Manager (multiple addresses, default tagging, browser GPS geolocation reverse geocoding via OSM Nominatim API)
  - `[x]` Multi-Step Checkout Wizard (billing selection, order review, payment choices)
  - `[x]` Mock Payments (Cash on Delivery + Online payment gateway simulator with loader delays & fake txn tracking)
  - `[x]` Order History tracker (customer details display, expansion details card, cancellations to restore inventory)
- `[x]` **Phase 2: Administrative Panel Extensions**
  - `[x]` Gatekeeped Admin login (isolating admin tokens from shopper sessions)
  - `[x]` Obscuring entry links (hiding portal buttons from guests in header/footer)
  - `[x]` Stats Dashboard widgets (revenue counter, total products, orders, and user logs)
  - `[x]` Platform Orders Tracker (viewing order details, status change selections)
  - `[x]` Products Catalog CRUD Table (edit stock counts, status states, prices, or delete entries)
  - `[x]` Customer User Registry listing (viewing registration data)

---

## In Progress

- `[ ]` Monitoring backend server logs & performance benchmarks
- `[ ]` Resolving local warnings on development console

---

## High Priority (Required before Production launch)

- `[ ]` **HTTPS Enforcements & Secure Cookies:** Migrate JWT storage from LocalStorage to `Secure`, `HttpOnly`, `SameSite=Strict` cookies.
- `[ ]` **Robust Secret Generation:** Replace local environment `JWT_SECRET` placeholders with cryptographically generated 256-bit keys.

---

## Medium Priority (Important Improvements)

- `[ ]` **SMTP Email Service Integration:** Send registration welcome letters and transaction receipt updates (using Nodemailer or SendGrid).
- `[ ]` **Real Image Storage uploads:** Replace URL text inputs on `AdminForm.jsx` with direct file uploading endpoints mapped to Cloudinary CDN storage.

---

## Low Priority (Future Enhancements)

- `[ ]` **Real Payment Gateways:** Replace simulated payment loaders with Razorpay, Stripe, or PayPal SDK integrations.
- `[ ]` **Search Autocomplete:** Add a dropdown offering matching queries as shoppers type in search bars.
- `[ ]` **Rich Analytics charts:** Add interactive graphs (e.g. Chart.js) tracking daily sales figures on the Admin Dashboard.

---

## Bugs

- *None currently reported.* All inputs verification rules block bad payloads, and routing boundaries gracefully handle missing IDs.

---

## Technical Debt

- `[ ]` **Context-to-Zustand migration:** Move state sync (Cart, Toast, Session) to Zustand for cleaner component renderings as catalog complexity grows.
- `[ ]` **Nodemon-to-Vite backend runner:** Align build steps under unified script setups.

---

## Security Checklist

- `[x]` **Helmet headers:** Enabled and configured to block XSS and MIME sniffing.
- `[x]` **JWT hardiness:** Algorithms restricted to `"HS256"` explicitly. Expiration set to 2 hours.
- `[x]` **Password encryption:** Customer credentials hashed using Bcrypt.
- `[x]` **Backend validations:** Enforced types, lengths, and matching logic server-side via `express-validator`.
- `[x]` **Rate limiting:** 5 attempts limit on auth routes, 100 queries limit on endpoints.
- `[x]` **CORS lock:** Production origin matches `FRONTEND_URL` strictly.
- `[x]` **Authorization checkpoints:** Isolated `userAuth` and `adminAuth` middlewares gatekeep correct actions.
- `[x]` **NoSQL Injection Defense:** Express validator trims and verifies inputs before passing filter objects.

---

## Deployment Checklist

- `[ ]` **Environment configuration:** Define `NODE_ENV=production`, `FRONTEND_URL`, `JWT_SECRET`, and database endpoints in hosting containers.
- `[ ]` **MongoDB Atlas provisioning:** Scale cluster tier to support production load.
- `[ ]` **HTTPS setup:** Configure TLS certificates on server deployment nodes.
- `[ ]` **Production validation test:** Start Express server to confirm it successfully boots when all required variables exist.
- `[ ]` **Vite production compilation:** Run `npm run build` to output optimized static HTML/JS bundle directory assets.

---

## Future Ideas

- **User Loyalty Points:** Award buyers credits on every order that can be redeemed for discounts.
- **Plant Care Reminders:** Set up automated scheduler alerts notifying buyers when to water their specific plant varieties.
