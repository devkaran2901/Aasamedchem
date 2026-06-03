# AasaMedChem — Inventory & Order Management System

A full-stack inventory and order management system for a medical chemistry business. Built with Next.js 14, Neon PostgreSQL (via Prisma), NextAuth.js, and Tailwind CSS. Deployed on Vercel.

---

## Live Demo

> **URL**: _(add your Vercel URL here after deploying)_

**Test credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aasachemchem.com | admin123 |
| Seller | seller@aasachemchem.com | seller123 |

---

## Features

### Admin Panel
- Dashboard with stats (product count, pending orders, total revenue, categories)
- Create, edit, soft-delete products with full metadata (name, SKU, category, description)
- Configure base unit (GRAM / MILLILITER / UNIT) and price per base unit (in paise)
- View all incoming orders/quotations with full details
- Expand each order to see line items, ordered units, base-unit equivalents, and pricing
- Update order status: PENDING → CONFIRMED → FULFILLED / CANCELLED

### Seller Panel
- Browse and search products by name
- Filter by category
- View prices in all supported units (g, kg, mL, L, unit)
- Add products to cart, choose any supported unit, enter quantity with decimal precision
- See live price calculation per line item and cart total (in INR)
- Place orders with optional notes
- View own order history with expandable line-item details

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (REST) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4 (JWT + Credentials) |
| Deployment | Vercel |
| Language | TypeScript |

### System Design

```
Browser (React)
     │
     ▼
Next.js App Router (Vercel Edge/Node)
     │
     ├── /app/api/* ──────────► Prisma Client ──► Neon PostgreSQL
     │
     └── /app/(admin|seller)/* ─► Server Components fetch from DB directly
                                   Client Components call /api/* via fetch
```

Authentication uses JWT sessions (stored in a cookie). Every API route and layout checks the session; role-based access (ADMIN vs SELLER) is enforced both in middleware (`src/middleware.ts`) and in each API handler.

---

## Database Schema

### `User`
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| email | String | unique |
| passwordHash | String | bcrypt, cost 12 |
| role | Enum (ADMIN, SELLER) | |

### `Product`
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| sku | String | unique |
| description | String? | |
| category | String? | |
| baseUnit | Enum (GRAM, MILLILITER, UNIT) | internal storage unit |
| pricePerBaseUnit | Int | **paise** per base unit |
| stockInBaseUnit | Decimal(20,6) | quantity in base unit |
| isActive | Boolean | soft-delete flag |

### `Order`
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| status | Enum (PENDING, CONFIRMED, FULFILLED, CANCELLED) | |
| totalPaise | Int | order total in paise |
| notes | String? | |

### `OrderItem`
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| orderId | String | FK → Order |
| productId | String | FK → Product |
| orderedUnit | String | e.g. "kg", "L", "unit" |
| orderedQty | Decimal(20,6) | qty in the ordered unit |
| qtyInBaseUnit | Decimal(20,6) | equivalent in base unit |
| unitPricePaise | Int | price per ordered unit at time of order |
| lineTotalPaise | Int | unitPricePaise × orderedQty (in base) |

---

## Unit Storage & Conversion Strategy

### Internal Base Units
Every product is assigned one of three **base units**:

| Dimension | Base Unit | Enum value |
|-----------|-----------|-----------|
| Weight | Gram (g) | `GRAM` |
| Volume | Milliliter (mL) | `MILLILITER` |
| Count | Unit | `UNIT` |

All stock quantities and order quantities (in `qtyInBaseUnit`) are stored in these base units.

### Supported Display Units
Users interact with products in any of the following display units:

| Display Unit | Dimension | Conversion to base |
|-------------|-----------|-------------------|
| g | Weight | 1 g = 1 GRAM |
| kg | Weight | 1 kg = 1,000 GRAM |
| mL | Volume | 1 mL = 1 MILLILITER |
| L | Volume | 1 L = 1,000 MILLILITER |
| unit | Count | 1 unit = 1 UNIT |

### Price Storage
- Prices are stored as **integers in paise** (1 INR = 100 paise).
- `pricePerBaseUnit` = paise per gram, per mL, or per unit.
- This avoids all floating-point precision issues (e.g. `0.1 + 0.2 ≠ 0.3` in JavaScript).

### Conversion factors (defined in `src/lib/units.ts`)
```ts
const CONVERSION_FACTORS: Record<DisplayUnit, number> = {
  g: 1,      // 1 g = 1 gram (identity)
  kg: 1000,  // 1 kg = 1000 grams
  mL: 1,     // 1 mL = 1 mL (identity)
  L: 1000,   // 1 L = 1000 mL
  unit: 1,   // 1 unit = 1 unit (identity)
};
```

### Where conversions are applied

1. **Before display** (`src/lib/units.ts → pricePerDisplayUnit`):
   ```ts
   // e.g. pricePerBaseUnit = 2 paise/g
   // pricePerKg = 2 × 1000 = 2000 paise = ₹20/kg
   pricePerDisplayUnit(unit, pricePerBaseUnit) = CONVERSION_FACTORS[unit] × pricePerBaseUnit
   ```

2. **Before saving an order** (`src/app/api/orders/route.ts`):
   ```ts
   qtyInBaseUnit = orderedQty × CONVERSION_FACTORS[orderedUnit]
   lineTotalPaise = round(qtyInBaseUnit × pricePerBaseUnit)
   ```

3. **Stock display** (seller browse page): stock in base units is converted to the largest display unit before showing.

### Rounding
`Math.round()` is applied to all paise calculations to produce integer totals. Quantities are stored at up to 6 decimal places (DECIMAL(20,6)) to handle precise sub-milligram or sub-microliter orders.

### PostgreSQL data types
- `Int` for paise (prices, totals): safe up to ~21 billion paise (~₹210 million per field), sufficient for individual orders. Use `BigInt` if needed for aggregate reporting.
- `Decimal(20,6)` for quantities: 20 significant digits with 6 decimal places — handles anything from micrograms to industrial-scale tonnes.

---

## Local Setup

### 1. Clone and install
```bash
git clone <your-repo-url>
cd aasa-medchem
npm install
```

### 2. Create a Neon database
1. Go to [console.neon.tech](https://console.neon.tech) and create a project.
2. Copy the **connection string** (it looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`).

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
DATABASE_URL="postgresql://..." # from Neon dashboard
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push schema and seed data
```bash
npm run db:push    # creates tables in Neon
npm run db:seed    # seeds products + admin/seller accounts
```

### 5. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Add the three environment variables in Vercel's project settings:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel URL, e.g. `https://aasa-medchem.vercel.app`)
4. Click **Deploy**. Vercel auto-detects Next.js.
5. After deploy, run the seed once:
   ```bash
   # locally, pointing at the production DB:
   DATABASE_URL="your-neon-url" npm run db:seed
   ```

---

## How to Use

### Admin Flow
1. Log in as admin (`admin@aasachemchem.com` / `admin123`).
2. Go to **Products** → click **+ Add Product**.
3. Choose base unit (GRAM for chemicals sold by weight, MILLILITER for liquids, UNIT for items).
4. Enter price in **paise** (e.g. `200` = ₹2.00 per base unit).
5. Go to **Orders** to view and manage incoming quotations.

### Seller Flow
1. Log in as seller (`seller@aasachemchem.com` / `seller123`).
2. Go to **Browse Products** — search or filter by category.
3. Each product card shows prices in all valid units (e.g. ₹2.00/g and ₹2,000.00/kg).
4. Click **Add to Cart**, choose your preferred unit (e.g. kg), enter quantity (e.g. 2.5).
5. The cart shows live price calculation and total in INR.
6. Click **Place Order** — order appears in Admin's Orders panel.

---

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout + auth guard
│   │   ├── page.tsx            # Dashboard
│   │   ├── products/page.tsx   # Product CRUD
│   │   └── orders/page.tsx     # Order management
│   ├── seller/
│   │   ├── layout.tsx          # Seller layout + auth guard
│   │   ├── browse/page.tsx     # Product browsing + cart
│   │   └── orders/page.tsx     # Order history
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   ├── products/           # GET list, POST create
│   │   ├── products/[id]/      # GET, PATCH, DELETE
│   │   └── orders/             # GET list, POST create
│   │       └── [id]/           # PATCH status
│   ├── auth/login/page.tsx     # Login page
│   └── layout.tsx
├── components/ui/
│   └── Navbar.tsx
├── lib/
│   ├── auth.ts                 # NextAuth options
│   ├── prisma.ts               # Prisma singleton
│   └── units.ts                # Unit conversion utilities
├── middleware.ts               # Route protection
prisma/
├── schema.prisma               # DB schema
└── seed.ts                     # Seed script
```
