-- Add profile_image column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT 'GolfBall.png';

-- Update existing users to have a default profile image
UPDATE users
SET profile_image = 'GolfBall.png'
WHERE profile_image IS NULL; 