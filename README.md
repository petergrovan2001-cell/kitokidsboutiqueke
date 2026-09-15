# Kito Kids Boutique

A full e-commerce storefront for a children's clothing boutique. Shoppers browse products by category, add items to a cart, check out, and pay via M-Pesa by sending money to the shop's number and submitting the confirmation code. Shop owners manage the product catalog and track orders from a passcode-protected admin dashboard.

## Key features

- Product catalog with categories, images, pricing in KES, and stock levels, stored in a managed Postgres database
- Persistent shopping cart (multiple products, quantities) that survives page reloads
- Checkout flow that captures customer name, phone, and delivery address, then creates an order
- M-Pesa "pay to number" flow: the order confirmation page shows the till/phone number and total due, the buyer sends payment on their phone and submits the M-Pesa confirmation code, and the order status updates to "pending confirmation"
- Admin dashboard (passcode-protected) to add, edit, and delete products, and to review orders and update their status (pending payment → pending confirmation → confirmed → shipped → delivered)

## Tech stack

- TanStack Start (React 19 + TanStack Router) for routing, server functions, and SSR
- Tailwind CSS 4 for styling
- Zustand (with localStorage persistence) for cart state
- Netlify Database (managed Postgres) with Drizzle ORM for products and orders
- Deployed on Netlify

## Running locally

```bash
pnpm install
pnpm dev
```

Or, to get the full Netlify platform emulation (database, functions):

```bash
netlify dev --port 8889
```

## Environment variables

- `ADMIN_PASSCODE` — passcode required to access `/admin`. Defaults to `kito2024` if unset; set a real value in Netlify site settings before going live.

## M-Pesa payments

This project uses a manual M-Pesa flow (no Safaricom Daraja API credentials required): the customer sends payment to **0143279060** from their phone and enters the M-Pesa confirmation code on the order page. The shop owner then verifies the payment against their M-Pesa statement and updates the order status in the admin dashboard. To automate this later with STK Push, integrate the Safaricom Daraja API in `src/lib/orders.ts`.
