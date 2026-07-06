# 🌿 FloraCraft (aka LeafLoft)

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**FloraCraft** is a premium, production-ready MERN-stack e-commerce catalog and ordering platform specialized in house plants. Featuring an organic, olive-green Lukani-inspired design language, robust security headers, Google OAuth 2.0 authentication, GPS-based auto-address locator, and a multi-step checkout workflow.

---

## ✨ Features

### 🛒 Shopper Storefront
*   **Authentication & Profiles:** Secure registration, password changing (with old password verification), custom profile picture, and contact information.
*   **Google OAuth 2.0:** Integrated Google Client authentication allowing seamless registration and login.
*   **Search & Multi-Filters:** Instant catalog search with category toggling, price/rating sorting, availability filters, and smooth pagination.
*   **Persistent Shopping Cart:** Device-independent cart synced to the database with server-side stock-checking.
*   **Wishlist Manager:** One-click toggles to add plants to a wishlist and seamlessly transfer them to the shopping cart.
*   **GPS Reverse-Geocoding:** Leverages browser Geolocation API and OpenStreetMap Nominatim reverse-API to auto-detect and prefill shipping addresses.
*   **Multi-Step Checkout:** Standard address validation, billing choices, and a Payment Simulator supporting COD and Online transaction logs.

### 🛡️ Admin Dashboard (`/admin`)
*   **Metrics Widget:** Live counters tracking cumulative revenue, total orders, users registry, and catalog inventory.
*   **Products CRUD Catalog:** A comprehensive table to add new plants, edit pricing/stock counts, toggle active/inactive states, or delete items.
*   **Orders Pipeline:** View billing info, payment methods, transaction IDs, and update order statuses (*Pending*, *Processing*, *Shipped*, *Delivered*, *Cancelled*).
*   **User Registry:** Complete directory of registered customers and their dates of registration.

### 🔒 Security Framework
*   **HTTP Security Headers:** Configured using Express `Helmet` to defend against XSS, clickjacking, and MIME-sniffing attacks.
*   **Token Isolation:** Distinct user and admin claim verifications using JWT algorithms explicitly restricted to `HS256`.
*   **API Rate Limiting:** Brute-force protection on authentication routes (5 queries/15m) and general endpoints (100 queries/15m).
*   **Validation Guard:** Enforced request body validation on the server using `express-validator` to neutralize SQL/NoSQL injection attempts.

---

## 🛠️ Architecture & Tech Stack

```
leafLoft/
├── backend/            # Express, Node, and Mongoose controllers
└── frontend/           # React, Vite, and Vanilla CSS components
```

*   **Frontend:** React (Hooks, Contexts), React Router DOM v6, Vite, Vanilla CSS.
*   **Backend:** Node.js, Express, MongoDB (via Mongoose ODM).
*   **Third-party Services:** Google Identity Services, OpenStreetMap Nominatim API, FontAwesome.

---

## 🚀 Installation & Local Development

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local Community Server or Atlas Cluster URL)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/leafloft.git
cd leafloft
```

### 2. Setup Backend Server
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder based on `.env.example`:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_bcrypt_admin_password_hash
JWT_SECRET=your_jwt_signing_key
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
```

Run seed script once to populate sample plants:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```
*The server will start on [http://localhost:4000](http://localhost:4000).*

---

### 3. Setup Frontend Client
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_BASE=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the Vite development build:
```bash
npm run dev
```
*The client site will boot up on [http://localhost:5173](http://localhost:5173).*

---

## 🧭 Core API Endpoints

### 🔐 Auth & Account Routes
*   `POST /api/auth/register` - Create customer credentials.
*   `POST /api/auth/login` - Secure login (returns JWT).
*   `POST /api/auth/google` - Verifies Google token, links account, logs user in.
*   `GET /api/auth/verify` - Check current JWT state.
*   `PUT /api/auth/addresses` - Add a saved shipping address.

### 🌿 Catalog Routes
*   `GET /api/plants` - Query plants catalog (with filters, pagination, search).
*   `GET /api/plants/:id` - Fetch details of a single plant.
*   `POST /api/plants/:id/reviews` - Post customer review & rating.

### 🛒 Cart & Checkout Routes
*   `GET /api/cart` - Load customer cart items.
*   `POST /api/cart/add` - Sync additions to database cart.
*   `POST /api/orders/checkout` - Deducts stock, creates invoice, resets cart.

### 👑 Admin Metrics
*   `GET /api/admin/stats` - Total revenue, orders, inventory counters.
*   `GET /api/admin/orders` - Load master list of system orders.
*   `PUT /api/admin/orders/:id/status` - Update shipping states.

---

## 🎨 Design System & Aesthetics
FloraCraft features a cohesive, premium brand aesthetic:
*   **Primary Accent:** `#78a206` (Organic Olive Green)
*   **Typography:** Playfair Display (Serif headings) paired with Inter (Sans-serif content).
*   **Styling Structure:** Custom CSS variables declared in `frontend/src/styles.css` enabling fluid transitions, clean shadows, and custom hover states.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
