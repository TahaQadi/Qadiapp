
-- Fix duplicate vendor_number values before adding unique constraint
-- Migration: 0012_fix_vendor_duplicates.sql

-- Update duplicate vendor numbers by appending a suffix
WITH ranked_vendors AS (
  SELECT 
    id,
    vendor_number,
    ROW_NUMBER() OVER (PARTITION BY vendor_number ORDER BY created_at) as rn
  FROM vendors
)
UPDATE vendors
SET vendor_number = vendors.vendor_number || '-' || ranked_vendors.rn
FROM ranked_vendors
WHERE vendors.id = ranked_vendors.id
  AND ranked_vendors.rn > 1;

-- Now add the unique constraint
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_vendor_number_unique;
ALTER TABLE vendors ADD CONSTRAINT vendors_vendor_number_unique UNIQUE (vendor_number);
