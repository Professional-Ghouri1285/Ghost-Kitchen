# Backend Explanation — Ghost Kitchen API

## 1. System Architecture & Request Lifecycle

The Ghost Kitchen backend follows a layered MVC-style architecture built on Node.js and Express. The application is organized into four distinct layers:

**Server Layer (server.js):** The entry point initializes Express, loads environment variables via dotenv, sets up CORS and JSON body parsing, then mounts all route modules under the `/api/v1` prefix. Each resource gets its own route file to keep things manageable.

**Route Layer (routes/):** Express routers that define HTTP endpoints. Each route applies middleware (authentication and authorization) before delegating to the model layer. Routes handle input validation, call the appropriate model function, and format the HTTP response with proper status codes.

**Middleware Layer (middleware/):** Two middleware functions sit between routes and business logic. The auth middleware verifies JWT tokens and attaches user info to the request object. The RBAC middleware checks if the authenticated user's role is in the allowed list for that endpoint.

**Model Layer (models/):** Plain JavaScript modules that export async functions. Each function runs raw parameterized SQL queries against the PostgreSQL connection pool. For simple operations, they use `pool.query()`. For transactions, they acquire a dedicated client via `pool.connect()` and manage BEGIN/COMMIT/ROLLBACK manually.

**Request Lifecycle:**
A typical request flows through: Express receives HTTP request → JSON body parser extracts payload → auth middleware verifies JWT and attaches `req.user` → RBAC middleware checks role permissions → route handler validates input → model function executes SQL → response is sent back as JSON with appropriate status code. If any step fails, the chain short-circuits with an error response.

## 2. Authentication Flow & RBAC Enforcement

**Registration:** When a user registers via POST `/auth/register`, the server validates the input, hashes the password using bcrypt with 10 salt rounds, and inserts a new record into the Users table. The password is never stored in plaintext.

**Login:** POST `/auth/login` looks up the user by username, compares the provided password against the stored bcrypt hash using `bcrypt.compare()`, and if valid, generates a JWT containing the user_id, username, and role. The token expires after 24 hours.

**Token Verification:** Every protected endpoint passes through the `authenticate` middleware. It extracts the Bearer token from the Authorization header, verifies it using `jwt.verify()` with the server's secret key, and attaches the decoded payload to `req.user`. For courier users, it also queries the Couriers table to find their courier_id and attaches it—this avoids repeated lookups in courier-specific endpoints.

**Role-Based Access Control:** The `authorize()` function is a middleware factory. It takes a list of allowed roles and returns a middleware that checks `req.user.role` against that list. For example, `authorize('admin', 'kitchen_staff')` allows only those two roles. If the role doesn't match, a 403 Forbidden response is returned.

**Courier Data Isolation:** Beyond role checks, some endpoints enforce ownership. For instance, when a courier requests their deliveries, the route filters by `req.user.courier_id`. If a courier tries to access a delivery belonging to another courier, the handler returns 403. This is done in the route handler itself since it requires reading the resource first.

The three roles from Phase 1 are enforced as follows:
- **Admin** — full CRUD access to all resources, can place orders and assign deliveries
- **KitchenStaff** — read/write access to inventory and menu items, read-only for orders
- **Courier** — read-only access to own deliveries and payouts, can complete own deliveries

## 3. Transaction Flows & Rollback Conditions

We implemented two transaction scenarios from our Phase 1 ACID documentation.

**Transaction 1 — Order Placement with Inventory Deduction:**

This transaction handles placing a new order with multiple items. The flow works like this:

1. Acquire a dedicated database client from the pool
2. BEGIN the transaction
3. INSERT into Orders table with status PLACED
4. For each item in the order:
   - INSERT into OrderItems — at this point, the database trigger `trg_check_brand_inventory_allocation` fires and validates that the brand's allocated inventory percentage is not exceeded
   - UPDATE Inventory to deduct the quantity from shared stock, with a check that `total_quantity >= requested_quantity`
5. COMMIT if everything succeeds

Rollback happens automatically if:
- The trigger raises an exception because brand allocation is exceeded
- The inventory UPDATE finds insufficient stock (0 rows affected, we throw an error)
- A foreign key violation occurs (invalid item_id or brand_id)
- Any unexpected database error

The CATCH block issues ROLLBACK, and the FINALLY block always releases the client back to the pool.

**Transaction 2 — Delivery Completion & Payout Processing:**

This transaction atomically completes a delivery and processes courier payment:

1. Acquire a dedicated client, BEGIN transaction
2. SELECT the delivery record and verify it exists, isn't already completed, and belongs to the requesting courier (if the request comes from a courier)
3. UPDATE Deliveries to set status to COMPLETED
4. UPDATE Orders to set status to DELIVERED — the trigger `trg_enforce_order_status_transition` validates the state transition
5. UPDATE Couriers to set status back to AVAILABLE
6. Calculate payout as 15% of the order total (SUM of item prices × quantities)
7. INSERT into Payouts with the calculated amount
8. COMMIT

Rollback happens if:
- The delivery doesn't exist or was already completed
- The order status trigger rejects the transition (e.g., order already DELIVERED or CANCELLED)
- The courier isn't authorized for this delivery
- Any payout insertion failure

Both transactions use the same pattern: `pool.connect()` for a dedicated client, `try/catch/finally` with BEGIN/COMMIT/ROLLBACK, and `client.release()` in the finally block.

## 4. Raw SQL & Connection Pooling Strategy

**Why Raw SQL:** The project requirements explicitly prohibit ORM-only implementations. All queries across the entire application use raw parameterized SQL via the `pg` library. This means writing queries like `SELECT * FROM Orders WHERE order_id = $1` with parameter arrays instead of using an ORM's query builder.

**Parameterized Queries:** Every query uses positional parameters ($1, $2, etc.) instead of string concatenation. This prevents SQL injection attacks. For example, user input is never interpolated into query strings—it's always passed as a separate parameter array.

**Connection Pooling:** We use `pg.Pool` which maintains a pool of reusable database connections. The pool is configured via environment variables (host, port, database, user, password). When the application needs to run a query, the pool transparently checks out an available connection, executes the query, and returns the connection to the pool.

For simple queries (single SELECT/INSERT/UPDATE/DELETE), model functions call `pool.query()` directly—the pool handles connection checkout and return automatically.

For transactions that require multiple queries on the same connection, model functions call `pool.connect()` to get a dedicated client. This is critical because transaction state (BEGIN/COMMIT/ROLLBACK) is tied to a specific connection. The client is always released in a finally block to prevent connection leaks.

## 5. Key Design Decisions & Tradeoffs

**Flat Architecture:** We chose not to use abstract base classes or generic CRUD factories. Each model file independently exports its own functions. This makes the code more readable and easier to debug, even though it means some repetition across model files. For a project of this size, readability outweighs DRY concerns.

**No Validation Library:** Input validation is done with simple if-checks in route handlers, combined with database-level constraints (CHECK, NOT NULL, UNIQUE, FK). This keeps dependencies minimal. The database constraints serve as the real safety net—even if the application layer misses something, the database rejects invalid data.

**Courier-User Linking:** We added a `user_id` column to the Couriers table (FK to Users) so couriers can log in and access their own data. This was a schema addition from Phase 1, but it was the minimal change needed to support authentication for the courier role.

**Payout Calculation:** We chose to calculate payout as 15% of the order total rather than using a fixed amount. This ties the payout to actual order value, which is more realistic. The calculation happens inside the transaction to ensure the payout amount is consistent with the order data.

**Error Handling Strategy:** Database errors are caught and returned as JSON with appropriate HTTP status codes. PostgreSQL error codes (like 23505 for unique violations) are mapped to semantic HTTP responses (409 Conflict). Trigger exceptions are caught and returned as 400 Bad Request. This gives the client useful error information without exposing internal details.

**JWT over Sessions:** We chose JWT-based authentication because it's stateless and doesn't require server-side session storage. The tradeoff is that tokens can't be individually revoked before expiry, but for a project of this scope, the simplicity of JWT is worth it.
