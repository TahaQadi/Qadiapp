
-- Split feedback and issues - Add priority column to issue_reports
-- Migration: 0007_split_feedback_issues.sql
-- Date: January 2025

-- Add priority column to issue_reports table
ALTER TABLE issue_reports
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add admin response fields to order_feedback table
ALTER TABLE order_feedback
ADD COLUMN IF NOT EXISTS admin_response TEXT,
ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS responded_by VARCHAR(255);

-- Create index on priority for better query performance
CREATE INDEX IF NOT EXISTS idx_issue_reports_priority ON issue_reports(priority);

-- Create index on admin responses
CREATE INDEX IF NOT EXISTS idx_order_feedback_admin_response ON order_feedback(admin_response_at) WHERE admin_response IS NOT NULL;
