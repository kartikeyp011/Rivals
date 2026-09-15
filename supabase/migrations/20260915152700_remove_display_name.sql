-- Remove display_name column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS display_name;
