-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modify score_tracker table to include user_id
CREATE TABLE IF NOT EXISTS score_tracker (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event VARCHAR(100) NOT NULL,
    selection VARCHAR(100),
    result VARCHAR(50),
    earnings NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_score_tracker_user_id ON score_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_score_tracker_event ON score_tracker(event); 