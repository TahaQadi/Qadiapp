
-- Add admin response capability to feedback
ALTER TABLE order_feedback 
ADD COLUMN IF NOT EXISTS admin_response TEXT,
ADD COLUMN IF NOT EXISTS admin_response_at INTEGER,
ADD COLUMN IF NOT EXISTS responded_by TEXT REFERENCES users(id);

-- Add priority field to issue reports for better management
ALTER TABLE issue_reports
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_order_feedback_responded ON order_feedback(admin_response_at);
CREATE INDEX IF NOT EXISTS idx_issue_reports_priority ON issue_reports(priority);
