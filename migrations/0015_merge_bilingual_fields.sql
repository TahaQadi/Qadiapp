-- Merge bilingual fields to single entry fields
-- Migration: 0015_merge_bilingual_fields.sql
-- Date: 2025-01-28
-- Description: Merges nameEn/nameAr to name, addressEn/addressAr to address, descriptionEn/descriptionAr to description
-- Strategy: Prefer Arabic values, fallback to English

-- ============================================
-- CLIENTS TABLE
-- ============================================
-- Add new name column
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE clients 
SET name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed')
WHERE name IS NULL;

-- Set NOT NULL constraint
ALTER TABLE clients 
ALTER COLUMN name SET NOT NULL;

-- Drop old columns
ALTER TABLE clients 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_ar;

-- ============================================
-- COMPANY_USERS TABLE
-- ============================================
-- Add new name column
ALTER TABLE company_users 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE company_users 
SET name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed')
WHERE name IS NULL;

-- Set NOT NULL constraint
ALTER TABLE company_users 
ALTER COLUMN name SET NOT NULL;

-- Drop old columns
ALTER TABLE company_users 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_ar;

-- ============================================
-- CLIENT_LOCATIONS TABLE
-- ============================================
-- Add new name and address columns
ALTER TABLE client_locations 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE client_locations 
SET 
  name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed'),
  address = COALESCE(NULLIF(TRIM(address_ar), ''), NULLIF(TRIM(address_en), ''), 'No address')
WHERE name IS NULL OR address IS NULL;

-- Set NOT NULL constraints
ALTER TABLE client_locations 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN address SET NOT NULL;

-- Drop old columns
ALTER TABLE client_locations 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_ar,
DROP COLUMN IF EXISTS address_en,
DROP COLUMN IF EXISTS address_ar;

-- ============================================
-- VENDORS TABLE
-- ============================================
-- Add new name column
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE vendors 
SET name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed')
WHERE name IS NULL;

-- Set NOT NULL constraint
ALTER TABLE vendors 
ALTER COLUMN name SET NOT NULL;

-- Drop old columns
ALTER TABLE vendors 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_ar;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
-- Add new name and description columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE products 
SET 
  name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed'),
  description = COALESCE(NULLIF(TRIM(description_ar), ''), NULLIF(TRIM(description_en), ''), NULL)
WHERE name IS NULL;

-- Set NOT NULL constraint for name (description remains nullable)
ALTER TABLE products 
ALTER COLUMN name SET NOT NULL;

-- Drop old columns
ALTER TABLE products 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_ar,
DROP COLUMN IF EXISTS description_en,
DROP COLUMN IF EXISTS description_ar;

-- ============================================
-- LTAS TABLE
-- ============================================
-- Add new name and description columns
ALTER TABLE ltas 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE ltas 
SET 
  name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed'),
  description = COALESCE(NULLIF(TRIM(description_ar), ''), NULLIF(TRIM(description_en), ''), NULL)
WHERE name IS NULL;

-- Set NOT NULL constraint for name (description remains nullable)
ALTER TABLE ltas 
ALTER COLUMN name SET NOT NULL;

-- Drop old columns
ALTER TABLE ltas 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_ar,
DROP COLUMN IF EXISTS description_en,
DROP COLUMN IF EXISTS description_ar;

-- ============================================
-- LTA_DOCUMENTS TABLE
-- ============================================
-- Add new name column
ALTER TABLE lta_documents 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE lta_documents 
SET name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed')
WHERE name IS NULL;

-- Set NOT NULL constraint
ALTER TABLE lta_documents 
ALTER COLUMN name SET NOT NULL;

-- Drop old columns
ALTER TABLE lta_documents 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_ar;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
-- Add new title and message columns
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS message TEXT;

-- Migrate data: prefer Arabic, fallback to English
UPDATE notifications 
SET 
  title = COALESCE(NULLIF(TRIM(title_ar), ''), NULLIF(TRIM(title_en), ''), 'Notification'),
  message = COALESCE(NULLIF(TRIM(message_ar), ''), NULLIF(TRIM(message_en), ''), '')
WHERE title IS NULL OR message IS NULL;

-- Set NOT NULL constraints
ALTER TABLE notifications 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN message SET NOT NULL;

-- Drop old columns
ALTER TABLE notifications 
DROP COLUMN IF EXISTS title_en,
DROP COLUMN IF EXISTS title_ar,
DROP COLUMN IF EXISTS message_en,
DROP COLUMN IF EXISTS message_ar;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN clients.name IS 'Company name (language-agnostic)';
COMMENT ON COLUMN company_users.name IS 'User name (language-agnostic)';
COMMENT ON COLUMN client_locations.name IS 'Location name (language-agnostic)';
COMMENT ON COLUMN client_locations.address IS 'Location address (language-agnostic)';
COMMENT ON COLUMN vendors.name IS 'Vendor name (language-agnostic)';
COMMENT ON COLUMN products.name IS 'Product name (language-agnostic)';
COMMENT ON COLUMN products.description IS 'Product description (language-agnostic)';
COMMENT ON COLUMN ltas.name IS 'LTA name (language-agnostic)';
COMMENT ON COLUMN ltas.description IS 'LTA description (language-agnostic)';
COMMENT ON COLUMN lta_documents.name IS 'Document name (language-agnostic)';
COMMENT ON COLUMN notifications.title IS 'Notification title (language-agnostic)';
COMMENT ON COLUMN notifications.message IS 'Notification message (language-agnostic)';

