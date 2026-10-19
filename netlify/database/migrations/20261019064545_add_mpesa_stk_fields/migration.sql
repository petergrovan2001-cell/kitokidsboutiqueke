ALTER TABLE "orders" ADD COLUMN "mpesa_phone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_request_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "merchant_request_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_message" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp;