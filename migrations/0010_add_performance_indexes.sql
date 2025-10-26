-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_products_category_ar ON products(category_ar);
CREATE INDEX IF NOT EXISTS idx_products_category_en ON products(category_en);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_feedback_order_id ON order_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON order_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON order_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issue_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issue_reports(priority);
