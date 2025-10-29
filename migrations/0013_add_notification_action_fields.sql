
-- Add action_url and action_type columns to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_type TEXT;
