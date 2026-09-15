# AGENTS.md

Architecture notes for AI agents and developers working on this codebase.

## Project overview

Kito Kids Boutique is a full e-commerce site: product catalog, cart, checkout, and a manual M-Pesa payment flow, plus an admin dashboard for managing products and orders. Built with TanStack Start and deployed on Netlify.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Client state | Zustand (persisted to localStorage) |
| Database | Netlify Database (Postgres) via Drizzle ORM |
| Deployment | Netlify |

## Directory structure

```
├── db
│   ├── schema.ts        # Drizzle schema: products, orders, order_items
│   └── index.ts         # Drizzle client (Netlify Database adapter)
├── netlify/database/migrations/  # SQL migrations, generated with drizzle-kit; includes seed data for demo products
├── src
│   ├── components
│   │   ├── Header.tsx           # Site header: logo, nav, cart badge
│   │   ├── ProductCard.tsx      # Product grid card
│   │   └── AddToCartButton.tsx  # Adds a product to the cart store
│   ├── lib
│   │   ├── cart.ts       # Zustand cart store (persisted)
│   │   ├── format.ts     # KES currency formatting
│   │   ├── products.ts   # Server functions: list/get/create/update/delete products, admin passcode check
│   │   └── orders.ts     # Server functions: create order, get order, submit M-Pesa code, admin order list/status update
│   ├── routes
│   │   ├── __root.tsx              # Root layout: Header, footer, global styles
│   │   ├── index.tsx                # Home: hero + category filter + product grid
│   │   ├── products/$productSlug.tsx # Product detail page
│   │   ├── cart.tsx                  # Cart page (quantities, totals)
│   │   ├── checkout.tsx              # Checkout form, creates the order
│   │   ├── orders/$orderId.tsx       # Order confirmation + M-Pesa payment instructions/code submission
│   │   └── admin.tsx                 # Passcode-gated dashboard: product CRUD + order status management
│   └── router.tsx
└── drizzle.config.ts
```

## Data model

- `products`: name, slug, description, short_description, image (URL), category, price (KES, integer), stock, featured
- `orders`: customer_name, phone, address, total, status, mpesa_code
- `order_items`: line items tied to an order, snapshotting product name/price at time of purchase

Product prices and order totals are stored as plain integers in Kenyan Shillings (no decimals/cents).

## Payments

There is no Safaricom Daraja API integration. Checkout creates an order with status `pending_payment`, then the confirmation page (`/orders/$orderId`) displays the M-Pesa number (`0143279060`) and instructs the buyer to send money and paste the resulting M-Pesa confirmation code into a form. Submitting that code moves the order to `pending_confirmation`. Shop staff verify the payment manually against their M-Pesa statement and advance the order to `confirmed` → `shipped` → `delivered` from `/admin`.

If real-time STK Push confirmation is needed later, add Safaricom Daraja credentials as environment variables and extend `src/lib/orders.ts`.

## Admin access

`/admin` is protected by a shared passcode checked server-side against `process.env.ADMIN_PASSCODE` (defaults to `kito2024`). This is a lightweight gate, not a full auth system — the passcode is passed with every server function call rather than stored in a session/cookie.

## Conventions

- Routes: kebab-case / TanStack file-based routing under `src/routes`
- Components: PascalCase
- Server-side data access always goes through `createServerFn` in `src/lib/*.ts`, never directly from route components
- Import paths use the `@/` alias for `src/*`
- Currency is always formatted with `formatKES()` from `src/lib/format.ts`
- Schema changes require a new Drizzle migration: `npx drizzle-kit generate --name <description>`

## Development commands

```bash
pnpm dev              # Start dev server
netlify dev --port 8889   # Full Netlify platform emulation (database, functions)
```
