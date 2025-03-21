-- Drop the existing table
DROP TABLE IF EXISTS tournament_selections;

-- Recreate the table with the unique constraint
CREATE TABLE tournament_selections (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) NOT NULL UNIQUE,
    selection VARCHAR(255),
    selection_date TIMESTAMP,
    is_locked BOOLEAN DEFAULT false
);

-- Reinsert the existing data
INSERT INTO tournament_selections (event, selection, selection_date, is_locked)
VALUES 
    ('THE PLAYERS Championship', 'Patrick Cantlay', '2025-03-20T19:54:13.650Z', true),
    ('Valspar Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Texas Children''s Houston Open', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Valero Texas Open', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Masters Tournament', NULL, '2025-03-20T19:54:13.650Z', false),
    ('RBC Heritage', NULL, '2025-03-20T19:54:13.650Z', false),
    ('THE CJ CUP Byron Nelson', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Truist Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('PGA Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Charles Schwab Challenge', NULL, '2025-03-20T19:54:13.650Z', false),
    ('The Memorial Tournament', NULL, '2025-03-20T19:54:13.650Z', false),
    ('RBC Canadian Open', NULL, '2025-03-20T19:54:13.650Z', false),
    ('U.S. Open', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Travelers Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Rocket Mortgage Classic', NULL, '2025-03-20T19:54:13.650Z', false),
    ('John Deere Classic', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Genesis Scottish Open', NULL, '2025-03-20T19:54:13.650Z', false),
    ('The Open Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('3M Open', NULL, '2025-03-20T19:54:13.650Z', false),
    ('Wyndham Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('FedEx St. Jude Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('BMW Championship', NULL, '2025-03-20T19:54:13.650Z', false),
    ('TOUR Championship', NULL, '2025-03-20T19:54:13.650Z', false); 