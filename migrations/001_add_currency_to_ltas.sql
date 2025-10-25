-- Migration: Add currency field to ltas table
-- Date: 2024-12-19
-- Description: Adds currency field to ltas table to support price offer creation workflow

-- Add currency column to ltas table
ALTER TABLE ltas ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Update existing records to have USD as default currency
UPDATE ltas SET currency = 'USD' WHERE currency IS NULL;

-- Add comment to document the change
COMMENT ON COLUMN ltas.currency IS 'Currency code for the LTA (e.g., USD, EUR, SAR)';