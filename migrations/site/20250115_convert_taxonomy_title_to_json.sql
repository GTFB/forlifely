-- Migration: Convert taxonomy.title from plain text to JSON format and add data_in field
-- This migration converts existing title values to JSON format {"en": "...", "ru": "..."}
-- If title is already in JSON format, it will be preserved
-- If title is a plain string, it will be converted to {"en": "<value>", "ru": "<value>"}
-- Also adds data_in field to taxonomy table

-- Add data_in field to taxonomy table if it doesn't exist
ALTER TABLE taxonomy ADD COLUMN data_in text;

-- Update existing records: convert plain text titles to JSON format
UPDATE taxonomy
SET title = CASE
  -- If title is NULL or empty, set to NULL
  WHEN title IS NULL OR title = '' THEN NULL
  -- If title is already valid JSON, keep it as is
  WHEN json_valid(title) = 1 THEN title
  -- Otherwise, convert plain text to JSON with both en and ru set to the same value
  ELSE json_object('en', title, 'ru', title)
END
WHERE title IS NOT NULL AND title != '';

