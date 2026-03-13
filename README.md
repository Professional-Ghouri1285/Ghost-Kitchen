Ghost Kitchen API — Phase 2
Backend API for a multi-brand ghost kitchen food ordering system. Built with Node.js, Express, and PostgreSQL (raw SQL).
Prerequisites
Node.js v18+
PostgreSQL 15+
npm
Setup
Clone and install dependencies:
```bash
   cd Phase2
   npm install
   ```
Create the database:
```bash
   psql -U postgres -c "CREATE DATABASE ghost_kitchen;"
   ```
Run the schema and seed:
```bash
   psql -U postgres -d ghost_kitchen -f schema.sql
   psql -U postgres -d ghost_kitchen -f seed.sql
   ```
Configure environment variables:
```bash
   cp .env.example .env
   ```
Edit `.env` and fill in your PostgreSQL password and a JWT secret.
Start the server:
```bash
   npm run dev
   ```
The API will be running at `http://localhost:3000`.
Test Accounts (from seed data)
Username	Password	Role
admin1	admin123	admin
kitchen1	kitchen123	kitchen_staff
kitchen2	kitchen456	kitchen_staff
ali	ali123	courier
ahmed	ahmed123	courier
sara	sara123	courier
All 10 couriers from Phase 1 have accounts (username = lowercase name, password = name + "123").
API Overview
Base URL: `http://localhost:3000/api/v1`
Authentication
`POST /auth/login` — returns JWT token
`POST /auth/register` — create new user
Resources (all require Bearer token)
`/hubs` — Kitchen Hubs (Admin)
`/brands` — Virtual Brands (Admin)
`/inventory` — Ingredients (Admin, KitchenStaff)
`/allocations` — Brand-Ingredient Allocations (Admin write, Admin+KS read)
`/menu-items` — Menu Items (Admin+KS)
`/orders` — Orders (Admin, KS read-only)
`/couriers` — Couriers (Admin, Courier own-only)
`/deliveries` — Deliveries (Admin, Courier own-only)
`/payouts` — Payouts (Admin, Courier /my)
`/reports/brand-sales` — Brand sales summary (Admin)
`/reports/inventory-usage` — Inventory allocation usage (Admin)
`/reports/courier-performance` — Courier performance (Admin)
Transaction Scenarios
POST /orders — Places an order with inventory deduction. Rolls back if brand allocation is exceeded or inventory is insufficient.
PATCH /deliveries/:id/complete — Completes delivery, updates order status, frees courier, and creates payout record. All atomic.
Project Structure
```
src/
  server.js          — Express app entry point
  config/db.js       — PostgreSQL connection pool
  middleware/
    auth.js          — JWT verification
    rbac.js          — Role-based access control
  models/            — Raw SQL query functions
  routes/            — Express route handlers
```
Tech Stack
Runtime: Node.js
Framework: Express
Database: PostgreSQL (raw SQL via `pg` library)
Auth: JWT (jsonwebtoken) + bcrypt
No ORM — all queries are raw parameterized SQL
