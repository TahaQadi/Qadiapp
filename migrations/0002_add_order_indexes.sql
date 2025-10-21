
-- Add indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_lta_id ON orders(lta_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_status ON orders(client_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Add indexes for order_modifications table
CREATE INDEX IF NOT EXISTS idx_modifications_order_id ON order_modifications(order_id);
CREATE INDEX IF NOT EXISTS idx_modifications_status ON order_modifications(status);
CREATE INDEX IF NOT EXISTS idx_modifications_created_at ON order_modifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modifications_order_status ON order_modifications(order_id, status);
