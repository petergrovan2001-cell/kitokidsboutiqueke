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

Checkout creates an order with status `pending_payment`. The confirmation page (`/orders/$orderId`) offers M-Pesa Express (STK Push) via the Safaricom Daraja API:

1. The buyer enters their Safaricom number; `requestStkPush` (`src/lib/orders.ts`) calls Daraja and stores the `CheckoutRequestID` on the order (`payment_status = pending`).
2. Safaricom posts the result to `/api/mpesa/callback` (`src/routes/api/mpesa/callback.ts`). Callbacks are unsigned, so a success is re-verified with an STK query and the amount is checked before the order is marked `paid` and moved to `confirmed` with the M-Pesa receipt number.
3. The page polls `getPaymentStatus`, which also queries Daraja directly if the callback is slow, so payments resolve even when callbacks are lost.

Daraja helpers live in `src/lib/mpesa.ts`; order updates from payment results live in `src/lib/mpesa-orders.ts`. Both are server-only.

Environment variables: `MPESA_ENV` (`sandbox` | `production`, default sandbox), `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, optional `MPESA_TRANSACTION_TYPE` (`CustomerPayBillOnline` default, or `CustomerBuyGoodsOnline` for tills), `MPESA_PARTY_B` (till number when using Buy Goods), `MPESA_CALLBACK_URL` (override the auto-detected callback URL). In sandbox the shortcode/passkey default to Safaricom's public test values. STK Push is hidden until the consumer key and secret are set.

The original manual flow (send money to `0143279060`, paste the confirmation code → `pending_confirmation`, staff verify) is kept as a fallback on the same page.

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
