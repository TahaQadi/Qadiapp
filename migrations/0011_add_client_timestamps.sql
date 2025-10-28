
-- Add missing timestamp columns to clients table
-- Migration: 0011_add_client_timestamps.sql
-- Date: 2025-01-28

-- Add created_at and updated_at columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Set timestamps for existing records
UPDATE clients 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add comment
COMMENT ON COLUMN clients.created_at IS 'Timestamp when the client was created';
COMMENT ON COLUMN clients.updated_at IS 'Timestamp when the client was last updated';
-- Add missing timestamp columns to clients table
-- Migration: 0011_add_client_timestamps.sql
-- Date: 2025-01-27

-- Add created_at column if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Add updated_at column if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Update existing records to have timestamps
UPDATE clients 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add comment
COMMENT ON COLUMN clients.created_at IS 'Timestamp when the client was created';
COMMENT ON COLUMN clients.updated_at IS 'Timestamp when the client was last updated';
