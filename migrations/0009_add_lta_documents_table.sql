
-- Create LTA documents table
CREATE TABLE IF NOT EXISTS lta_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lta_id UUID NOT NULL REFERENCES ltas(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES clients(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lta_documents_lta_id ON lta_documents(lta_id);
