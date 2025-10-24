
-- Prevent duplicate feedback for same order
-- Migration: 0008_prevent_duplicate_feedback.sql
-- Date: January 2025

-- Add unique constraint on order_id to prevent duplicate feedback
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_feedback_unique_order 
ON order_feedback(order_id);

-- Note: If there are existing duplicates, they need to be cleaned up first
-- This migration will fail if duplicates exist
