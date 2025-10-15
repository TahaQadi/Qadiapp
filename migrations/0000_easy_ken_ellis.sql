CREATE TABLE "client_departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"department_type" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text
);
--> statement-breakpoint
CREATE TABLE "client_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"address_en" text NOT NULL,
	"address_ar" text NOT NULL,
	"city" text,
	"country" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"is_headquarters" boolean DEFAULT false,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "client_pricing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"imported_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"phone" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "clients_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "clients_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lta_id" uuid,
	"document_type" text NOT NULL,
	"pdf_file_name" text NOT NULL,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lta_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lta_id" uuid NOT NULL,
	"client_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lta_clients_lta_id_client_id_unique" UNIQUE("lta_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "lta_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lta_id" uuid NOT NULL,
	"product_id" varchar NOT NULL,
	"contract_price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lta_products_lta_id_product_id_unique" UNIQUE("lta_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "ltas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar,
	"type" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"message_en" text NOT NULL,
	"message_ar" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"items" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"lta_id" uuid,
	"items" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"pipefy_card_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_number" text NOT NULL,
	"client_id" varchar NOT NULL,
	"lta_id" uuid NOT NULL,
	"price_request_notification_id" varchar,
	"status" text DEFAULT 'draft' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"items" jsonb NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL,
	"notes" text,
	"pdf_file_name" text,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"responded_at" timestamp,
	"response_note" text,
	"generated_by" varchar,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_offer_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "price_offers_offer_number_unique" UNIQUE("offer_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"category_num" text,
	"unit_type" text,
	"unit" text,
	"unit_per_box" text,
	"cost_price_per_box" numeric(10, 2),
	"specifications_ar" text,
	"vendor_id" varchar,
	"main_category" text,
	"category" text,
	"cost_price_per_piece" numeric(10, 2),
	"selling_price_pack" numeric(10, 2),
	"selling_price_piece" numeric(10, 2),
	"image_url" text,
	"image_urls" jsonb,
	"description_en" text,
	"description_ar" text,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_number" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_vendor_number_unique" UNIQUE("vendor_number")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_lta_id_ltas_id_fk" FOREIGN KEY ("lta_id") REFERENCES "public"."ltas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lta_clients" ADD CONSTRAINT "lta_clients_lta_id_ltas_id_fk" FOREIGN KEY ("lta_id") REFERENCES "public"."ltas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lta_clients" ADD CONSTRAINT "lta_clients_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lta_products" ADD CONSTRAINT "lta_products_lta_id_ltas_id_fk" FOREIGN KEY ("lta_id") REFERENCES "public"."ltas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lta_products" ADD CONSTRAINT "lta_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lta_id_ltas_id_fk" FOREIGN KEY ("lta_id") REFERENCES "public"."ltas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_offers" ADD CONSTRAINT "price_offers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_offers" ADD CONSTRAINT "price_offers_lta_id_ltas_id_fk" FOREIGN KEY ("lta_id") REFERENCES "public"."ltas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_offers" ADD CONSTRAINT "price_offers_price_request_notification_id_notifications_id_fk" FOREIGN KEY ("price_request_notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_offers" ADD CONSTRAINT "price_offers_generated_by_clients_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");