
-- Order Feedback
CREATE TABLE IF NOT EXISTS order_feedback (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  ordering_process_rating INTEGER CHECK (ordering_process_rating >= 1 AND ordering_process_rating <= 5),
  product_quality_rating INTEGER CHECK (product_quality_rating >= 1 AND product_quality_rating <= 5),
  delivery_speed_rating INTEGER CHECK (delivery_speed_rating >= 1 AND delivery_speed_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  comments TEXT,
  would_recommend BOOLEAN NOT NULL,
  admin_response TEXT,
  admin_response_at INTEGER,
  responded_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Issue Reports
CREATE TABLE IF NOT EXISTS issue_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'admin')),
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('bug', 'feature_request', 'confusion', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  browser_info TEXT,
  screen_size TEXT,
  screenshots TEXT, -- JSON array of URLs
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  resolved_at INTEGER
);

-- Feature Requests
CREATE TABLE IF NOT EXISTS feature_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ordering', 'lta', 'products', 'reports', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('nice_to_have', 'important', 'critical')),
  votes INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Micro Feedback
CREATE TABLE IF NOT EXISTS micro_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  touchpoint TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  quick_response TEXT,
  context TEXT, -- JSON object
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Feature Request Votes (many-to-many)
CREATE TABLE IF NOT EXISTS feature_request_votes (
  feature_request_id TEXT NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (feature_request_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_feedback_order_id ON order_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_order_feedback_client_id ON order_feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_order_feedback_created_at ON order_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issue_reports_user_id ON issue_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_severity ON issue_reports(severity);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created_at ON issue_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_category ON feature_requests(category);
CREATE INDEX IF NOT EXISTS idx_feature_requests_votes ON feature_requests(votes DESC);

CREATE INDEX IF NOT EXISTS idx_micro_feedback_touchpoint ON micro_feedback(touchpoint);
CREATE INDEX IF NOT EXISTS idx_micro_feedback_sentiment ON micro_feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_micro_feedback_created_at ON micro_feedback(created_at DESC);
