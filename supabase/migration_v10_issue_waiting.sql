-- Migration v10: Add 'waiting' state to issues
-- This adds a new issue state for tracking issues that are waiting/blocked

-- Add 'waiting' to the issue_state enum
ALTER TYPE issue_state ADD VALUE IF NOT EXISTS 'waiting' AFTER 'open';
