-- Drop tables if they exist
DROP TABLE IF EXISTS score_tracker CASCADE;
DROP TABLE IF EXISTS tournament_selections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table first (before other tables)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tournament_selections table
CREATE TABLE tournament_selections (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) NOT NULL,
    selection VARCHAR(255),
    selection_date TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id),
    UNIQUE(event, selection)
);

-- Create score_tracker table with updated column definitions
CREATE TABLE score_tracker (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) NOT NULL,
    selection VARCHAR(255),
    result VARCHAR(50),  -- Allows for T6, MC, etc.
    earnings NUMERIC(12, 0),  -- Changed to 0 decimal places
    user_id INTEGER REFERENCES users(id),
    FOREIGN KEY (event, selection) REFERENCES tournament_selections(event, selection)
);

-- Function to format earnings without decimal places
CREATE OR REPLACE FUNCTION format_currency(amount NUMERIC) 
RETURNS TEXT AS $$
BEGIN
    RETURN CASE 
        WHEN amount IS NULL THEN NULL
        ELSE '$' || TO_CHAR(amount, 'FM999,999,999')
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically add to score_tracker when tournament is locked
CREATE OR REPLACE FUNCTION add_to_score_tracker() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_locked = true AND OLD.is_locked = false AND NEW.selection IS NOT NULL THEN
        INSERT INTO score_tracker (event, selection)
        VALUES (NEW.event, NEW.selection)
        ON CONFLICT (event) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER tournament_locked_trigger
    AFTER UPDATE ON tournament_selections
    FOR EACH ROW
    WHEN (NEW.is_locked = true AND OLD.is_locked = false)
    EXECUTE FUNCTION add_to_score_tracker();

-- Add user_id to tournament_selections for tracking who made each selection
ALTER TABLE tournament_selections 
ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Add user_id to score_tracker for tracking whose scores they are
ALTER TABLE score_tracker 
ADD COLUMN user_id INTEGER REFERENCES users(id); 