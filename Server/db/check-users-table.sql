-- Check users table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position; 