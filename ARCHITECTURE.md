# ARCHITECTURE.md - FloraCraft Technical Architecture Blueprint

This document outlines the technical design, request-response flows, structural division, and operational workflows of the FloraCraft application. It is designed to help new engineers understand the codebase in under 10 minutes.

---

## High Level Architecture

FloraCraft is designed using a **decoupled Client-Server Architecture** utilizing the **MERN (MongoDB, Express, React, Node) stack**.

```
  +-------------------------------------------------------+
  |                   Browser Client                      |
  |  +--------------------+       +--------------------+  |
  |  |  React App SPA     | <---> | LocalStorage State |  |
  |  +--------------------+       +--------------------+  |
  +-------------------------------------------------------+
                             |
                             | HTTPS / REST API
                             v
  +-------------------------------------------------------+
  |                   Express Backend                     |
  |  +-------------------------------------------------+  |
  |  |  [Helmet / CORS / API rate-limiters]            |  |
  |  +-------------------------------------------------+  |
  |  |  [Express Router Dispatchers]                   |  |
  |  +-------------------------------------------------+  |
  |  |  [Middlewares (userAuth / adminAuth / validate)]|  |
  |  +-------------------------------------------------+  |
  |  |  [Controllers & Mongoose Models]                |  |
  |  +-------------------------------------------------+  |
  +-------------------------------------------------------+
                             |
                             | MongoDB Connection
                             v
  +-------------------------------------------------------+
  |                     Database                          |
  |               +------------------+                    |
  |               |  MongoDB Atlas   |                    |
  |               +------------------+                    |
  +-------------------------------------------------------+
```

### High-Level Components
1.  **Frontend (React Single Page App):** Interacts with the backend via a standardized promise-based fetch API layer. Uses React State and Contexts to manage active customer shopping carts and authenticated sessions.
2.  **Backend (Express REST Server):** Listens on Port 4000. It acts as the business logic coordinator, verifying JWT signatures, executing rate limits, sanitizing inputs, and writing security console logs.
3.  **Database (MongoDB Atlas / Mongoose ODM):** Stores collections for Plants, Users, Carts, and Orders. Uses nested subdocuments (addresses, reviews) to minimize database joins.

---

## Folder Structure

```
leafLoft/
├── backend/
│   ├── src/
│   │   ├── config/       # Houses startup configurations (e.g. env checks)
│   │   ├── middleware/   # Request interceptors (JWT auth checkpoints, rate limits)
│   │   ├── models/       # Mongoose data declarations and pre-save hooks
│   │   ├── routes/       # Endpoint routing logic grouped by feature
│   │   ├── db.js         # MongoDB connection lifecycle manager
│   │   └── index.js      # App setup, security initialization, and error boundaries
├── frontend/
│   ├── src/
│   │   ├── components/   # Pure presentational React structures (buttons, filters)
│   │   ├── context/      # Application-wide state hubs (Toasts alerts, Session carts)
│   │   ├── pages/        # Routing destinations (Catalog, Checkout wizard, Admin stats)
│   │   ├── api.js        # Normalized client fetch library
│   │   ├── main.jsx      # Client renderer injection site
│   │   └── styles.css    # Central styling sheets containing the CSS design tokens
```

*   **Why backend/src/routes exists:** Isolates paths (e.g., `/api/cart`) from the core Express startup lifecycle in `index.js`, making it modular.
*   **Why frontend/src/context exists:** Avoids prop-drilling by providing a central location for states like current user sessions and global toast alerts.
*   **Why frontend/src/components exists:** Holds isolated, reusable visual components (e.g., `PlantCard`) to keep routing page files clean.

---

## Data Flow

The following diagrams illustrate how data travels through the system layers:

### 🛒 Shopping Action Flow (e.g. Adding plant to cart)

```
[Browser Action: Click "Add to Cart"]
       │
       ▼
[React component: ProductDetails.jsx] ─► Calls API helper function
       │
       ▼
[API Layer: api.js (addToCart)] ─► Serializes payload & attaches User JWT header
       │
       ▼
[Express HTTP Gateway: index.js] ─► Directs to /api/cart Router
       │
       ▼
[Middleware: rateLimiter.js -> userAuth.js] ─► Decodes JWT token & confirms customer user
       │
       ▼
[Controller/Route: cart.js (POST /add)] ─► Checks stock limits in Mongoose model
       │
       ▼
[Database: MongoDB (Cart Collection)] ─► Increments quantity & saves changes
       │
       ▼
[Express returns: Status 200 JSON] ─► UI updates state, Toast Context triggers success alert
```

---

## Authentication Flow

### Isolated Roles Pattern

FloraCraft isolates customer users from admin control panel actions. Both profiles use completely different verification schemes.

```
                  +-----------------------------------+
                  |      Browser Request Headers      |
                  +-----------------------------------+
                                    |
                                    v
                       [Bearer token extract check]
                                    |
                  +-----------------+-----------------+
                  |                                   |
                  v                                   v
          (User JWT token)                    (Admin JWT token)
                  |                                   |
                  v                                   v
         [userAuth Middleware]               [adminAuth Middleware]
                  |                                   |
      (Decodes token with HS256)          (Decodes token with HS256)
                  |                                   |
      [Queries User collection]           [Compares claims with Env variables]
                  |                                   |
                  v                                   v
         (Saves req.user)                    (Saves req.admin)
```

1.  **Admin Verification:** Checks token signatures against `JWT_SECRET` and verifies that the payload contains `{ role: "admin" }`. Credentials reside in environment variables (`ADMIN_PASSWORD_HASH`).
2.  **Customer Verification:** Decodes the token to retrieve the database user ID (`{ id: userId }`). Queries MongoDB to fetch active customer records, attaching them to `req.user`.
3.  **Expiry & Invalidations:** Tokens expire in **2 hours**. If expired, verification middleware returns `401 Unauthorized`. The API wrapper detects this, purges tokens from `localStorage`, and dispatches the global event `auth-session-expired` to prompt a re-login.

---

## Database Design

FloraCraft uses nested subdocuments to optimize read speed and maintain document integrity.

```
User (Collection)
 ├── Name, Email, Password, Phone
 ├── addresses [Subdocument Array]
 └── wishlist [Referential Array -> Plant]

Plant (Collection)
 ├── Name, Price, Categories, Stock, Description, Image
 └── reviews [Subdocument Array]
      └── user (ref: User), userName, rating, comment
```

*   **Plant Reviews (Nested Subdocuments):** Nested directly inside the `Plant` collection. This allows fetching products along with their customer ratings and review comments in a single database query, avoiding costly aggregate operations.
*   **User Addresses (Nested Subdocuments):** Embedded inside the `User` document. This allows checkout routes to easily look up delivery locations by address ID.
*   **Orders Collection:** Creates copies of product items and addresses at the time of purchase. This prevents previous purchases from changing if the admin edits plant prices or a user updates their default profile address.

---

## API Architecture

FloraCraft routes are structured logically by resource type:

```
[Server Entry Point: index.js]
 ├── /api/plants  ──────► plants.js router  ───► Details, catalog queries & reviews
 ├── /api/auth    ──────► userAuth.js router ───► Registration, profile, addresses, & wishlist
 ├── /api/cart    ──────► cart.js router   ───► Persistent quantity controls
 ├── /api/orders  ──────► orders.js router ───► Step checkout & payments
 └── /api/admin   ──────► admin.js router  ───► Analytics stats & status updates
```

### Layer Responsibilities
*   **Routing Layer:** Declares endpoints, rate limits, input sanitization rules, and matches controllers.
*   **Validation Layer (`express-validator`):** Runs before route execution, parsing lengths, string data types, and required parameters, returning `400 Bad Request` if checks fail.
*   **Authentication Checkpoints:** Intercepts endpoints (e.g. `/checkout`) to verify tokens.
*   **Error Catching boundary:** Standardized `(err, req, res, next)` catcher prints stack traces to the console and formats error payloads cleanly.

---

## Security Architecture

*   **JWT Integrity:** Signs tokens explicitly using the `HS256` HMAC algorithm. The verification middleware limits validation checks to this algorithm to prevent signature evasion attacks.
*   **Obscurity Protections:** Hides admin links from shoppers, so the admin page is only accessible via direct URL navigation (`/admin`).
*   **Helmet Headers:** Employs standard browser security headers (XSS filters, Clickjacking, MIME sniffing blocks).
*   **NoSQL Injection Prevention:** Sanitizes database filters. Express validator enforces strict parameters and trims string inputs, preventing queries like `{"$gt": ""}` from bypassing credentials checks.
*   **Secure CORS:** Mirrors request origins only in local development, enforcing strict `FRONTEND_URL` mappings in production.

---

## File Upload Flow

To support future scalability, the system is designed to allow easy migration from storing Unsplash image URLs to direct file uploads using **Cloudinary**.

### Planned Cloudinary Integration Flow

```
[Frontend Form: Choose image file] 
       │
       ▼
[Upload POST multipart/form-data]
       │
       ▼
[Express Server: Multer Middleware] ─► Buffers file to memory
       │
       ▼
[Cloudinary SDK Upload Stream] ─► Sends binary to Cloudinary CDN
       │
       ▼
[Cloudinary CDN API] ─► Processes asset and returns HTTPS URL (e.g. res.secure_url)
       │
       ▼
[Mongoose Controller] ─► Saves the secure HTTPS URL to plant.image
```

---

## Future Scalability

*   **Database Sharding:** As order volume increases, the `Orders` collection can be sharded using `user` as the shard key, distributing order records across multiple MongoDB instances.
*   **Stateless Server Scaling:** The Express backend is completely stateless (session details are stored in client-side JWTs instead of server memory). This allows the API server to scale horizontally behind a load balancer (such as Nginx or AWS ALB).
*   **Cache Layering:** High-traffic endpoints (such as `GET /api/plants`) can be cached using a Redis layer to reduce direct database load on the MongoDB cluster.

---

## Performance Optimizations

*   **Database Indexing:** Enforces unique indexes on `user.email` and search indexes on `plant.name` and `plant.categories` to keep query speeds fast as data grows.
*   **Paginated Catalog:** Product searches return results in pages (limited to 12 items by default), preventing heavy database queries and slow page load times.
*   **Lazy Loading:** React pages (Product Details, Cart, Profile, Admin) are dynamically loaded when visited, reducing the size of the initial JS bundle.

---

## Coding Standards

*   **Naming Conventions:**
    *   *JavaScript files / Folders:* camelCase or lowercase-hyphens (e.g., `userAuth.js`, `rateLimiter.js`).
    *   *React Components / Pages:* PascalCase (e.g., `ProductDetails.jsx`, `PlantCard.jsx`).
*   **Express API Responses:** API errors return standardized JSON formats:
    *   *Validation failure:* `{ errors: [{ msg: "Error description", path: "field" }] }`
    *   *Operational error:* `{ error: "Descriptive error message" }`
*   **HTTP Status Code Map:**
    *   `200 OK` / `201 Created` for successful requests.
    *   `400 Bad Request` for validation failures.
    *   `401 Unauthorized` for missing/expired auth tokens.
    *   `403 Forbidden` for permissions errors (e.g. shoppers requesting admin routes).
    *   `429 Too Many Requests` when rate limits are exceeded.
    *   `500 Internal Server Error` for unhandled exceptions.
