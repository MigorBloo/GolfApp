-- First, let's check the current table structure
\d score_tracker;

-- Drop and recreate the score_tracker table with correct column types
DROP TABLE IF EXISTS score_tracker;

CREATE TABLE score_tracker (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) UNIQUE NOT NULL,
    selection VARCHAR(255),
    result VARCHAR(50),
    earnings NUMERIC(10,2)
);

-- Re-insert Patrick Cantlay's data
INSERT INTO score_tracker (event, selection, result, earnings)
VALUES ('THE PLAYERS Championship', 'Patrick Cantlay', '12', 556250.00)
ON CONFLICT (event) DO UPDATE
SET selection = EXCLUDED.selection,
    result = EXCLUDED.result,
    earnings = EXCLUDED.earnings;

-- Verify the data
SELECT * FROM score_tracker WHERE event = 'THE PLAYERS Championship'; 