-- Add thumbnail_url column to saved_items table
ALTER TABLE saved_items 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN saved_items.thumbnail_url IS 'URL of the thumbnail image for the saved item';