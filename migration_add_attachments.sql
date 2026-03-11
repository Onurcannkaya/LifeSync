-- Migration: Add attachments column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
