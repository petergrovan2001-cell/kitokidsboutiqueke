import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text().notNull().default(""),
  shortDescription: text("short_description").notNull().default(""),
  image: text().notNull().default("/placeholder.png"),
  category: text().notNull().default("Uncategorized"),
  price: integer().notNull(),
  stock: integer().notNull().default(0),
  featured: boolean().notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial().primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text().notNull(),
  address: text().notNull().default(""),
  total: integer().notNull(),
  status: text().notNull().default("pending_payment"),
  mpesaCode: text("mpesa_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial().primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text().notNull(),
  price: integer().notNull(),
  quantity: integer().notNull(),
});
