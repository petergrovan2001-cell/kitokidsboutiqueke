CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"total" integer NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"mpesa_code" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text DEFAULT '' NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '/placeholder.png' NOT NULL,
	"category" text DEFAULT 'Uncategorized' NOT NULL,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
INSERT INTO "products" ("name", "slug", "description", "short_description", "image", "category", "price", "stock", "featured") VALUES
('Floral Cotton Dress', 'floral-cotton-dress', 'Soft breathable cotton dress with a floral print, perfect for playdates and parties. Machine washable and gentle on sensitive skin.', 'Breathable cotton dress with floral print', 'https://images.unsplash.com/photo-1519457851522-2df1de19d857?w=800', 'Baby Girls', 2500, 25, true),
('Denim Overalls', 'denim-overalls', 'Durable denim overalls with adjustable straps, great for everyday adventures and easy to pair with any top.', 'Durable adjustable denim overalls', 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800', 'Baby Boys', 2800, 18, true),
('Striped Romper', 'striped-romper', 'Comfy striped romper made from soft jersey fabric with snap buttons for easy diaper changes.', 'Soft jersey romper with snap buttons', 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800', 'Baby Girls', 1800, 30, false),
('Toddler Sneakers', 'toddler-sneakers', 'Lightweight sneakers with a flexible sole and secure velcro straps, designed for first steps and running around.', 'Lightweight velcro sneakers for toddlers', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800', 'Shoes', 2200, 20, true),
('Knitted Baby Beanie', 'knitted-baby-beanie', 'Warm knitted beanie to keep little heads cosy during chilly mornings and evenings.', 'Warm knitted beanie for babies', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800', 'Accessories', 900, 40, false),
('Dinosaur Print Pajamas', 'dinosaur-print-pajamas', 'Fun dinosaur print pajama set in soft cotton blend, keeps kids comfortable all night long.', 'Cotton pajama set with dinosaur print', 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800', 'Baby Boys', 2100, 22, false),
('Sun Hat with Bow', 'sun-hat-with-bow', 'Wide-brim sun hat with an adorable bow, protects delicate skin from the sun on outdoor outings.', 'Wide-brim sun hat with bow detail', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800', 'Accessories', 1200, 15, false),
('Baby Booties Set', 'baby-booties-set', 'Soft-soled booties for newborns and infants, designed to keep tiny feet warm without restricting movement.', 'Soft-soled booties for newborns', 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800', 'Shoes', 1400, 28, false);