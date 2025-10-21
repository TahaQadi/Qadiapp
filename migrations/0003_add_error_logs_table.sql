
-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL CHECK (level IN ('error', 'warning', 'info')),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level_timestamp ON error_logs(level, timestamp DESC);

-- Add GIN index for JSONB context queries
CREATE INDEX IF NOT EXISTS idx_error_logs_context ON error_logs USING GIN (context);

-- Add comment
COMMENT ON TABLE error_logs IS 'Application error logs with context';
