# FloraCraft 


- Client Storefront: `/`
- Admin: `/admin`

## Features
- Catalog grid: name, price, categories, availability, rating, image
- Search (name or category keyword, case-insensitive), category filter, availability filter, sort, pagination
- Admin add plant form with validation (multiple categories)
- Debounced inputs (no full-page refreshes)
- 50+ seeded plants, 30+ per-plant Unsplash image mappings
- Responsive, reusable React components
- Node/Express + MongoDB (Mongoose), CORS, Helmet, Morgan, express-validator

## Run

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev    # http://localhost:4000
# seed once:
npm run seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
# Storefront: http://localhost:5173/
# Admin:      http://localhost:5173/admin
