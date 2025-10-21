
CREATE TABLE IF NOT EXISTS "order_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" varchar NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "status" text NOT NULL,
  "changed_by" varchar NOT NULL,
  "changed_at" timestamp DEFAULT now() NOT NULL,
  "notes" text,
  "is_admin_note" boolean DEFAULT false NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_order_history_order_id" ON "order_history"("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_history_changed_at" ON "order_history"("changed_at");
