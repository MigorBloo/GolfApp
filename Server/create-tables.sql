-- Drop existing tables
DROP TABLE IF EXISTS tournament_selections CASCADE;
DROP TABLE IF EXISTS score_tracker CASCADE;

-- Create tournament_selections table
CREATE TABLE tournament_selections (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) UNIQUE NOT NULL,
    player_name VARCHAR(255),
    selection_date TIMESTAMP,
    is_locked BOOLEAN DEFAULT false
);

-- Create score_tracker table
CREATE TABLE score_tracker (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) UNIQUE NOT NULL,
    selection VARCHAR(255),
    result VARCHAR(255),
    earnings DECIMAL(10,2)
);

-- Insert events in the correct order
INSERT INTO score_tracker (event) VALUES
('THE PLAYERS Championship'),
('Valspar Championship'),
('Texas Children''s Houston Open'),
('Valero Texas Open'),
('Masters Tournament'),
('RBC Heritage'),
('Mexico Open at Vidanta'),
('Wells Fargo Championship'),
('AT&T Byron Nelson'),
('PGA Championship'),
('Charles Schwab Challenge'),
('the Memorial Tournament'),
('RBC Canadian Open'),
('U.S. Open'),
('Travelers Championship'),
('Rocket Mortgage Classic'),
('John Deere Classic'),
('Genesis Scottish Open'),
('The Open Championship'),
('3M Open'),
('Wyndham Championship'),
('FedEx St. Jude Championship'),
('BMW Championship'),
('TOUR Championship');