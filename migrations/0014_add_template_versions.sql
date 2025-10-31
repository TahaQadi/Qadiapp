
-- Add template versions table
CREATE TABLE IF NOT EXISTS template_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sections TEXT NOT NULL,
  variables TEXT NOT NULL,
  styles TEXT NOT NULL,
  changed_by TEXT,
  change_reason TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Add template usage stats table
CREATE TABLE IF NOT EXISTS template_usage_stats (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  user_id TEXT,
  document_type TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  generation_time_ms INTEGER,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_created_at ON template_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON template_usage_stats(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_generated_at ON template_usage_stats(generated_at);
CREATE INDEX IF NOT EXISTS idx_template_usage_success ON template_usage_stats(success);
