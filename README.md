# Commerce Order Console

> **Fynd Hiring Hackathon – November 2026**  
> **Track:** Full Stack Developer (SDE 1)  
> **Role:** Senior Full-Stack Engineer Submission  

A production-ready, browser-based order and inventory management system designed for store operations staff. Built with strict transaction atomicity, inventory safeguards, state-machine validated fulfillment workflows, and a modern, high-performance UI.

---

## 1. Executive Summary & Highlights

- **Strict Database Transactions:** Fully atomic multi-item order placement and cancellation with automatic rollback on stock depletion using SQLite `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK`.
- **Zero Frontend Price Trust:** All line totals, subtotals, and grand totals are verified and calculated server-side using trusted database prices.
- **Defensive Inventory Management:** Conditional updates (`WHERE id = ? AND stock >= ?`) eliminate race conditions and overselling. Out-of-stock items are strictly unorderable.
- **Atomic Cancellation & Double-Restoration Prevention:** Cancellations atomically restore stock back to products and record timestamps; repeated cancellations are rejected immediately.
- **Validated Fulfilment State Machine:** Validates transitions (`Placed` → `Packed` → `Shipped`, `Placed`/`Packed` → `Cancelled`), strictly rejecting invalid leaps (e.g., `Placed` → `Shipped`, `Shipped` → `Cancelled`).
- **Comprehensive Automated Tests:** 100% passing automated test suite with Vitest and Supertest running against isolated in-memory test databases.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router v6, Lucide React Icons |
| **Design System** | Dominant Primary Teal Green (`#02968A`), Deep Dark Teal Navigation (`#013531`), Semantic Blue Orders (`#2563EB`), Emerald In-Stock (`#10B981`), Amber Low-Stock (`#F59E0B`), Red Danger (`#EF4444`) |
| **Backend** | Node.js (v24), Express.js (v4), REST API, CORS middleware |
| **Database** | SQLite with Better-SQLite3 interface (WAL mode, Foreign Keys ON) |
| **Testing** | Vitest, Supertest |
| **API Format** | JSON REST API with centralized error handler |

---

## 3. Architecture & Project Structure

```
CommerceOrder/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── dashboardController.js   # Real-time metrics controller
│   │   │   ├── orderController.js       # Order creation, search, status, cancel
│   │   │   └── productController.js     # Products and inventory endpoints
│   │   ├── database/
│   │   │   ├── db.js                    # SQLite connection & WAL pragma configuration
│   │   │   ├── schema.sql               # Relational DDL schema with constraints & indexes
│   │   │   └── seed.js                  # Synthetic products seeder with sequence reset
│   │   ├── middleware/
│   │   │   └── errorHandler.js          # Centralized error & 404 response handler
│   │   ├── routes/
│   │   │   ├── dashboardRoutes.js       # /api/dashboard/*
│   │   │   ├── orderRoutes.js           # /api/orders/*
│   │   │   └── productRoutes.js         # /api/products/*, /api/inventory
│   │   ├── services/
│   │   │   ├── orderService.js          # Atomic business logic & state transitions
│   │   │   └── productService.js        # Catalog queries & stock calculations
│   │   ├── app.js                       # Express app factory with dependency injection
│   │   └── server.js                    # HTTP server entrypoint
│   ├── tests/
│   │   └── orders.test.js               # 9 automated tests (all 8 mandatory + stats)
│   ├── commerce.db                      # SQLite database file (WAL mode)
│   ├── verify-e2e.js                    # End-to-end integration verification script
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Navigation bar with branding & active routes
│   │   │   ├── StatusBadge.jsx          # Color-coded order & stock status badges
│   │   │   └── Toast.jsx                # Auto-dismissing success/error toast alerts
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Live store operations overview & KPIs
│   │   │   ├── Products.jsx             # Product catalog & stock inventory table
│   │   │   ├── CreateOrder.jsx          # Multi-item cart, duplicate row aggregation
│   │   │   ├── Orders.jsx               # Orders table with search & status filters
│   │   │   └── OrderDetailsModal.jsx    # Order items, line totals & fulfilment actions
│   │   ├── services/
│   │   │   └── api.js                   # Fetch API client
│   │   ├── App.jsx                      # Client router & toast provider
│   │   ├── index.css                    # Tailwind CSS directives
│   │   └── main.jsx                     # React entrypoint
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── screenshots/                         # Captured application screenshots
├── package.json                         # Root helper scripts
├── .gitignore
└── README.md
```

---

## 4. Database Schema Design

### Products Table (`products`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique product identifier |
| `sku` | TEXT | UNIQUE NOT NULL | Stock keeping unit (e.g., `WM-001`) |
| `name` | TEXT | NOT NULL | Product name |
| `price` | REAL | NOT NULL CHECK(price >= 0) | Unit price in INR (₹) |
| `stock` | INTEGER | NOT NULL DEFAULT 0 CHECK(stock >= 0) | Available warehouse stock |
| `created_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### Orders Table (`orders`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique order identifier |
| `order_reference` | TEXT | UNIQUE NOT NULL | Reference string (e.g., `ORD-XXXXXX-XXXX`) |
| `status` | TEXT | NOT NULL CHECK(status IN ('Placed', 'Packed', 'Shipped', 'Cancelled')) | Current fulfillment state |
| `total_amount` | REAL | NOT NULL DEFAULT 0 CHECK(total_amount >= 0) | Trusted grand total |
| `created_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last transition timestamp |
| `cancelled_at` | TEXT | NULLABLE | Cancellation timestamp |

### Order Items Table (`order_items`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique item line identifier |
| `order_id` | INTEGER | REFERENCES orders(id) ON DELETE CASCADE | Associated order |
| `product_id` | INTEGER | REFERENCES products(id) | Associated product |
| `quantity` | INTEGER | NOT NULL CHECK(quantity > 0) | Number of units ordered |
| `unit_price` | REAL | NOT NULL CHECK(unit_price >= 0) | Unit price at time of purchase |
| `line_total` | REAL | NOT NULL CHECK(line_total >= 0) | `quantity * unit_price` |

### Database Indexes
- `idx_orders_reference` on `orders(order_reference)`
- `idx_orders_status` on `orders(status)`
- `idx_orders_created_at` on `orders(created_at)`
- `idx_order_items_order_id` on `order_items(order_id)`
- `idx_order_items_product_id` on `order_items(product_id)`

---

## 5. Seed Catalogue

The application initializes with the exact specified synthetic products:

| ID | Product Name | SKU | Price (₹) | Initial Stock | Stock Status |
|---|---|---|---:|---:|---|
| 1 | Wireless Mouse | WM-001 | 599 | 25 | In Stock |
| 2 | Mechanical Keyboard | MK-002 | 1,499 | 10 | In Stock |
| 3 | USB-C Hub | UCH-003 | 899 | 15 | In Stock |
| 4 | Laptop Stand | LS-004 | 799 | 8 | Low Stock |
| 5 | Webcam HD | WHD-005 | 1,299 | 0 | **Out of Stock** (Unorderable) |

---

## 6. Fulfilment State Machine

Fulfilment transitions are strictly enforced on both the backend and frontend:

```
          [Placed]
         /        \
   (Pack)          (Cancel)
       v              v
   [Packed]      [Cancelled] (Terminal, Stock Restored)
    /     \
(Ship)   (Cancel)
  v         v
[Shipped] [Cancelled]
    |
(Terminal)
```

| Current Status | Target Status | Endpoint | Allowed? | Behavior |
|---|---|---|:---:|---|
| `Placed` | `Packed` | `PATCH /api/orders/:id/status` | **YES** | Order transitions to Packed |
| `Packed` | `Shipped` | `PATCH /api/orders/:id/status` | **YES** | Order transitions to Shipped |
| `Placed` | `Cancelled` | `POST /api/orders/:id/cancel` | **YES** | Stock restored, status Cancelled |
| `Packed` | `Cancelled` | `POST /api/orders/:id/cancel` | **YES** | Stock restored, status Cancelled |
| `Placed` | `Shipped` | `PATCH /api/orders/:id/status` | **NO** | 400 Bad Request (Must pack first) |
| `Shipped` | `Cancelled` | `POST /api/orders/:id/cancel` | **NO** | 400 Bad Request (Shipped cannot cancel) |
| `Cancelled` | *Any* | *Any* | **NO** | 400 Bad Request (Terminal state) |

---

## 7. REST API Reference

All responses return standard JSON. Errors use the standardized structure:
```json
{
  "success": false,
  "message": "Insufficient stock for Wireless Mouse"
}
```

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/products` | Retrieve all catalogue products with stock levels |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `GET` | `/api/inventory` | Inventory summary with reserved and available units |
| `GET` | `/api/orders` | List orders with optional `?search=` and `?status=` filters |
| `GET` | `/api/orders/:id` | Full order details with line items, SKU, unit price, totals |
| `POST` | `/api/orders` | Place multi-item order atomically with stock deduction |
| `PATCH` | `/api/orders/:id/status` | Advance fulfillment status (`Placed` → `Packed` → `Shipped`) |
| `POST` | `/api/orders/:id/cancel` | Atomically cancel eligible order and restore inventory |
| `GET` | `/api/dashboard/stats` | Aggregated real-time metrics for operations dashboard |

---

## 8. Exact Setup & Run Instructions

### Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### Installation
Clone or navigate to the workspace directory:
```bash
cd CommerceOrder
```

Install backend dependencies:
```bash
npm install --prefix backend
```

Install frontend dependencies:
```bash
npm install --prefix frontend
```

### Seeding the Database
Initialize and seed the SQLite database with the standard 5 products:
```bash
node backend/src/database/seed.js --force
```

### Starting Backend & Frontend

#### Option A: Start using Root Helper Scripts
In Terminal 1 (Backend):
```bash
npm run dev:backend
# Server starts on http://localhost:5000
```

In Terminal 2 (Frontend):
```bash
npm run dev:frontend
# Vite starts on http://localhost:5173
```

#### Option B: Direct Commands
Backend:
```bash
cd backend
node src/server.js
```

Frontend:
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 9. Automated Testing & Verification

The test suite runs against an isolated in-memory SQLite database (`:memory:`), ensuring zero pollution of development data.

Run the automated test suite:
```bash
npm test --prefix backend
```

### Test Suite Results

```
 RUN  v3.2.7 C:/Users/samut/CommerceOrder/backend

 ✓ tests/orders.test.js (12 tests) 1471ms
   ✓ TEST 1: Successful order placement - verifies order creation and stock deduction
   ✓ TEST 2: Insufficient stock - verifies rejection and unchanged inventory
   ✓ TEST 3: Multi-product atomicity - one item unavailable => no order and all stock unchanged
   ✓ TEST 4: Successful cancellation - verifies stock restoration
   ✓ TEST 5: Duplicate cancellation - verifies stock is not restored again
   ✓ TEST 6: Invalid status transition - attempt Placed -> Shipped verifies rejection
   ✓ TEST 7: Shipped order cancellation - verifies rejection and unchanged inventory
   ✓ TEST 8: Valid fulfilment transitions - verifies Placed -> Packed -> Shipped
   ✓ ADDITIONAL: Dashboard statistics returns accurate real-time metrics
   ✓ TEST 9: Multi-product order calculation - verifies totals are calculated from database unit prices, ignoring frontend tampered prices
   ✓ TEST 10: Failed transaction rollback - verifies database transaction rolls back if an operation fails mid-transaction
   ✓ TEST 11: Database persistence - verifies orders and inventory survive closing and reopening the SQLite connection (restart simulation)

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Duration  2.57s
```

All 8 mandatory requirements plus rollback, persistence, price verification, and metrics tests pass with 100% compliance.

---

## 10. Application Screenshots

| Screen | Description | File |
|---|---|---|
| **Dashboard** | Real-time counts of orders, fulfillment states, and low-stock alerts | `screenshots/01-dashboard.png` |
| **Product Catalogue** | Warehouse stock table with SKU, prices, and Out-of-Stock indicators | `screenshots/02-products.png` |
| **Create Order** | Multi-item cart, live subtotals, stock cap guards, duplicate row merging | `screenshots/03-create-order.png` |
| **Orders Management** | Filterable orders table with live search and status badges | `screenshots/04-orders.png` |
| **Order Details & Fulfilment** | Line-item invoice breakdown, transition buttons (`Packed`/`Shipped`/`Cancel`) | `screenshots/05-order-details.png` |
