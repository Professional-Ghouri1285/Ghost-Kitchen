# Ghost Kitchen — Multi-Brand Food Ordering System

> Group 10 | Advanced Database Management Course | CS 4th Semester

**Team Members:**

* Member 1 Muhammad Bin Asghar
* Member 2 Muhammad Asif

\---

## 1\. Project Overview

Ghost Kitchen is a multi-brand virtual food ordering and delivery platform. A single physical kitchen hub operates multiple virtual restaurant brands (e.g., Burger Lab, Pasta Point, Pizza Hub) sharing the same inventory. The system manages brand-level inventory allocation, order placement with atomic inventory deduction, courier assignment, delivery tracking, and automated payout processing.

**Problem it solves:** Efficient management of shared kitchen resources across multiple virtual brands, ensuring no brand over-consumes its allocated inventory share while maintaining accurate financial records for couriers.

\---

## 2\. Tech Stack

|Layer|Technology|
|-|-|
|Frontend|React 19 (Vite), React Router v7, Recharts|
|Backend|Node.js, Express.js|
|Database|PostgreSQL 17|
|Authentication|JWT (jsonwebtoken), bcrypt password hashing|
|HTTP Client|Axios|
|API Spec|OpenAPI 3.0 (Swagger)|

\---

## 3\. System Architecture

```
┌──────────────┐     HTTP/JSON     ┌──────────────┐     SQL (pg)     ┌──────────────┐
│   React SPA  │ ◄──────────────► │  Express API  │ ◄─────────────► │  PostgreSQL   │
│  (port 5173) │   Axios + JWT    │  (port 3000)  │   Connection    │  ghost\_kitchen│
│              │                   │               │     Pool        │               │
│  - Auth      │                   │  - JWT Auth   │                 │  - 10 tables  │
│  - CRUD UIs  │                   │  - RBAC MW    │                 │  - 2 triggers │
│  - Charts    │                   │  - Raw SQL    │                 │  - 3 views    │
│  - Tx Demo   │                   │  - Tx Mgmt    │                 │  - 4 indexes  │
└──────────────┘                   └──────────────┘                 └──────────────┘
```

1. User logs in via React → backend validates credentials → returns JWT
2. Frontend stores JWT in localStorage, attaches it to every API request via Axios interceptor
3. Backend middleware verifies JWT and checks role-based permissions
4. All database operations use raw SQL through the `pg` connection pool
5. Critical operations (order placement, delivery completion) use `BEGIN/COMMIT/ROLLBACK` transactions

\---

## 4\. UI Examples

### Login Page

The login page authenticates users and redirects them to their respective role-based dashboard. It validates credentials against the backend and stores the JWT token for subsequent requests. Required because all API endpoints are protected.

### Admin Dashboard

The admin dashboard displays system analytics: order counts by status, brand revenue charts (bar + pie), and courier performance metrics. Uses Recharts for data visualization. Required for monitoring overall system health and making business decisions.

### Order Placement (Transaction Demo)

The order placement page demonstrates the atomic transaction process. When placing an order, users see step-by-step transaction progress (BEGIN → Insert Order → Add Items → Deduct Inventory → COMMIT/ROLLBACK). If inventory is insufficient or allocation is exceeded, the entire transaction rolls back with clear error feedback. Required to demonstrate ACID compliance visually.



\---

## 5\. Setup \& Installation

### Prerequisites

* Node.js v18+ (tested on v22.18.0)
* npm v9+
* PostgreSQL 14+ (tested on 17)

### Step 1: Clone and Setup Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE ghost\_kitchen;"

# Load schema (creates tables, triggers, views, indexes)
psql -U postgres -d ghost\_kitchen -f database/schema.sql

# Load seed data (13 users, 5 brands, 18 menu items, 40 orders, etc.)
psql -U postgres -d ghost\_kitchen -f database/seed.sql
```

### Step 2: Configure Backend

```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

Edit `backend/.env`:

```
DB\_USER=postgres           # PostgreSQL username
DB\_HOST=localhost          # Database host
DB\_NAME=ghost\_kitchen      # Database name
DB\_PASSWORD=your\_password  # Your PostgreSQL password
DB\_PORT=5432               # PostgreSQL port
JWT\_SECRET=your\_secret\_key # Any random string for JWT signing
PORT=3000                  # Backend server port
```

```bash
# Start backend
npm start
# Backend runs at http://localhost:3000
```

### Step 3: Configure Frontend

```bash
cd frontend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

Edit `frontend/.env`:

```
VITE\_API\_URL=http://localhost:3000/api/v1
```

```bash
# Start frontend dev server
npm run dev
# Frontend runs at http://localhost:5173
```

\---

## 6\. User Roles

|Role|Can Do|Cannot Do|Test Credentials|
|-|-|-|-|
|**admin**|Full CRUD on all entities, place orders, assign deliveries, view all reports and payouts, manage couriers|N/A — full access|`admin1` / `admin123`|
|**kitchen\_staff**|View/create/update inventory and menu items, view allocations (read-only), view orders (read-only)|Delete inventory/menu items, manage hubs/brands/couriers, place orders, manage deliveries/payouts|`kitchen1` / `kitchen123`|
|**courier**|View own dashboard, view/complete own deliveries, view own payouts|Access any admin or kitchen pages, view other couriers' data, manage any entity|`ali` / `ali123`|

\---

## 7\. Feature Walkthrough

|Feature|Role|Page/Route|API Endpoint|
|-|-|-|-|
|Login/Register|All|`/login`, `/register`|`POST /auth/login`, `POST /auth/register`|
|Admin Dashboard (analytics)|Admin|`/`|Multiple report endpoints|
|Kitchen Hubs CRUD|Admin|`/hubs`|`GET/POST/PUT/DELETE /hubs`|
|Virtual Brands CRUD|Admin|`/brands`|`GET/POST/PUT/DELETE /brands`|
|Inventory Management|Admin, Kitchen Staff|`/inventory`|`GET/POST/PUT/DELETE /inventory`|
|Brand Allocations|Admin (CRUD), Kitchen Staff (read)|`/allocations`|`GET/POST/PUT/DELETE /allocations/:brandId/:ingredientId`|
|Menu Items Management|Admin, Kitchen Staff|`/menu-items`|`GET/POST/PUT/DELETE /menu-items`|
|Order Placement (Tx Demo)|Admin|`/orders`|`POST /orders`|
|Order Cancellation|Admin|`/orders`|`PATCH /orders/:id/cancel`|
|Courier Management|Admin|`/couriers`|`GET/POST/PUT/DELETE /couriers`|
|Delivery Assignment|Admin|`/deliveries`|`POST /deliveries`|
|Delivery Completion (Tx Demo)|Admin, Courier (own)|`/deliveries`|`PATCH /deliveries/:id/complete`|
|Payout Viewing|Admin (all), Courier (own)|`/payouts`, `/my-payouts`|`GET /payouts`, `GET /payouts/my`|
|Reports (Brand Sales, Inventory, Courier Perf)|Admin|`/reports`|`GET /reports/brand-sales`, etc.|
|Search \& Filtering|All (per role)|Every CRUD page|Client-side filtering|

**Complex Features Implemented:**

1. **Analytics Dashboard with Charts** — Admin dashboard with bar charts (brand revenue, courier performance) and pie chart (revenue distribution) using Recharts
2. **Advanced Search \& Filtering** — Every CRUD page has a search bar with real-time text filtering + dropdown filters (e.g., filter menu items by brand, filter orders by status)

\---

## 8\. Transaction Scenarios

### Scenario 1: Order Placement with Inventory Deduction

* **Trigger:** Admin clicks "Place Order" on the Orders page
* **Atomic Operations:**

  1. `INSERT INTO Orders` (new order with status PLACED)
  2. `INSERT INTO OrderItems` for each item (triggers `check\_brand\_inventory\_allocation` BEFORE INSERT trigger)
  3. `UPDATE Inventory SET total\_quantity = total\_quantity - quantity` for each ingredient
* **Rollback Conditions:** Brand allocation exceeded (trigger raises exception), insufficient inventory, invalid item
* **API Endpoint:** `POST /api/v1/orders`
* **Code:** `backend/models/order.model.js` → `placeOrder()` method
* **Frontend:** Order placement modal shows step-by-step transaction progress with COMMIT/ROLLBACK feedback

### Scenario 2: Delivery Completion with Payout Processing

* **Trigger:** Courier or Admin clicks "Complete" on a delivery
* **Atomic Operations:**

  1. `UPDATE Deliveries SET delivery\_status = 'COMPLETED'`
  2. `UPDATE Orders SET order\_status = 'DELIVERED'` (triggers `enforce\_order\_status\_transition` BEFORE UPDATE trigger)
  3. `UPDATE Couriers SET status = 'AVAILABLE'`
  4. Calculate payout: `SUM(price × quantity) × 0.15`
  5. `INSERT INTO Payouts`
* **Rollback Conditions:** Delivery already completed, order already delivered/cancelled, invalid state transition
* **API Endpoint:** `PATCH /api/v1/deliveries/:id/complete`
* **Code:** `backend/models/delivery.model.js` → `completeDelivery()` method
* **Frontend:** Delivery completion shows transaction progress with payout amount on success

\---

## 9\. ACID Compliance

|Property|Order Placement|Delivery Completion|
|-|-|-|
|**Atomicity**|All inserts (order + items) and inventory deduction succeed or all rollback. If one ingredient is insufficient, nothing persists.|Delivery status + order status + courier update + payout insert all succeed or all rollback.|
|**Consistency**|CHECK constraints (quantity > 0, inventory >= 0), FK constraints, trigger `check\_brand\_inventory\_allocation` enforces allocation limits.|CHECK constraints (valid status values), FK constraints, trigger `enforce\_order\_status\_transition` prevents invalid transitions.|
|**Isolation**|READ COMMITTED isolation level. Row-level locks during UPDATE prevent concurrent orders from overselling inventory.|Row-level locks prevent duplicate delivery completion and duplicate payout creation.|
|**Durability**|PostgreSQL WAL (Write-Ahead Logging) ensures committed orders persist through crashes.|Committed payouts are permanent — system failure after COMMIT doesn't revert payment.|

\---

## 10\. Indexing \& Performance

|Index|Table|Columns|Reason|
|-|-|-|-|
|`idx\_orders\_brand\_id`|Orders|brand\_id|Fast order lookup by brand for reports|
|`idx\_deliveries\_courier\_id`|Deliveries|courier\_id|Fast delivery lookup for courier performance|
|`idx\_inventory\_name`|Inventory|name|Quick ingredient search/validation|
|`idx\_orderitems\_order\_item`|OrderItems|(order\_id, item\_id)|Composite index for order detail queries|

### Performance Results (from `performance.sql`)

|Query|Before Index|After Index|Improvement|
|-|-|-|-|
|Orders by brand|0.259 ms|0.054 ms|**79% faster**|
|Deliveries by courier|0.535 ms|0.051 ms|**90% faster**|
|Brand revenue (4-table join)|4.780 ms|1.088 ms|**77% faster**|

\---

## 11\. API Reference

|Method|Route|Auth|Purpose|
|-|-|-|-|
|POST|`/api/v1/auth/register`|No|Register new user|
|POST|`/api/v1/auth/login`|No|Login, get JWT token|
|GET|`/api/v1/hubs`|Yes (Admin)|List all kitchen hubs|
|POST|`/api/v1/hubs`|Yes (Admin)|Create hub|
|PUT|`/api/v1/hubs/:id`|Yes (Admin)|Update hub|
|DELETE|`/api/v1/hubs/:id`|Yes (Admin)|Delete hub|
|GET|`/api/v1/brands`|Yes (Admin)|List all brands|
|POST|`/api/v1/brands`|Yes (Admin)|Create brand|
|PUT|`/api/v1/brands/:id`|Yes (Admin)|Update brand|
|DELETE|`/api/v1/brands/:id`|Yes (Admin)|Delete brand|
|GET|`/api/v1/inventory`|Yes (Admin, Kitchen)|List ingredients|
|POST|`/api/v1/inventory`|Yes (Admin, Kitchen)|Add ingredient|
|PUT|`/api/v1/inventory/:id`|Yes (Admin, Kitchen)|Update ingredient|
|DELETE|`/api/v1/inventory/:id`|Yes (Admin)|Delete ingredient|
|GET|`/api/v1/allocations`|Yes (Admin, Kitchen)|List allocations|
|POST|`/api/v1/allocations`|Yes (Admin)|Create allocation|
|PUT|`/api/v1/allocations/:bid/:iid`|Yes (Admin)|Update allocation|
|DELETE|`/api/v1/allocations/:bid/:iid`|Yes (Admin)|Delete allocation|
|GET|`/api/v1/menu-items`|Yes (Admin, Kitchen)|List menu items|
|POST|`/api/v1/menu-items`|Yes (Admin, Kitchen)|Create menu item|
|PUT|`/api/v1/menu-items/:id`|Yes (Admin, Kitchen)|Update menu item|
|DELETE|`/api/v1/menu-items/:id`|Yes (Admin)|Delete menu item|
|GET|`/api/v1/orders`|Yes (Admin, Kitchen)|List orders|
|GET|`/api/v1/orders/:id`|Yes (Admin, Kitchen)|Get order details|
|POST|`/api/v1/orders`|Yes (Admin)|Place order (Tx)|
|PATCH|`/api/v1/orders/:id/cancel`|Yes (Admin)|Cancel order|
|GET|`/api/v1/couriers`|Yes (Admin)|List couriers|
|POST|`/api/v1/couriers`|Yes (Admin)|Create courier|
|PUT|`/api/v1/couriers/:id`|Yes (Admin)|Update courier|
|DELETE|`/api/v1/couriers/:id`|Yes (Admin)|Delete courier|
|GET|`/api/v1/deliveries`|Yes (Admin/Courier)|List deliveries|
|POST|`/api/v1/deliveries`|Yes (Admin)|Assign delivery|
|PATCH|`/api/v1/deliveries/:id/complete`|Yes (Admin/Courier)|Complete delivery (Tx)|
|GET|`/api/v1/payouts`|Yes (Admin)|List all payouts|
|GET|`/api/v1/payouts/my`|Yes (Courier)|Get own payouts|
|GET|`/api/v1/reports/brand-sales`|Yes (Admin)|Brand revenue report|
|GET|`/api/v1/reports/inventory-usage`|Yes (Admin)|Inventory allocation report|
|GET|`/api/v1/reports/courier-performance`|Yes (Admin)|Courier stats report|

Full API documentation: see `docs/swagger.yaml`

\---

## 12\. Known Issues \& Limitations

* **No password reset** — password management (reset/change) is not implemented
* **No real-time updates** — data refreshes require page reload or manual action; WebSocket integration not implemented
* **Single kitchen hub in seed data** — the system supports multiple hubs but seed data only includes one
* **No image uploads** — menu items and brands don't have image support
* **Frontend filtering is client-side** — for small datasets this is fine, but won't scale to thousands of records
* **No pagination** — all records are loaded at once from the API
* **Courier can only view own data** — no inter-courier communication
* **No order editing** — once placed, an order can only be cancelled, not modified

