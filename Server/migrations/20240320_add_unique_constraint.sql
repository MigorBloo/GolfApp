-- Drop existing constraint if it exists
ALTER TABLE score_tracker DROP CONSTRAINT IF EXISTS score_tracker_event_unique;

-- Add unique constraint to event and user_id columns in score_tracker table
ALTER TABLE score_tracker ADD CONSTRAINT score_tracker_event_user_unique UNIQUE (event, user_id);

-- Drop existing trigger first
DROP TRIGGER IF EXISTS tournament_locked_trigger ON tournament_selections;

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS add_to_score_tracker();

-- Create new trigger function that handles user-specific entries
CREATE OR REPLACE FUNCTION add_to_score_tracker()
RETURNS TRIGGER AS $$
BEGIN
    -- First check if the event exists in score_tracker for this user
    IF EXISTS (SELECT 1 FROM score_tracker WHERE event = NEW.event AND user_id = NEW.user_id) THEN
        -- Update existing record
        UPDATE score_tracker 
        SET selection = NEW.selection
        WHERE event = NEW.event AND user_id = NEW.user_id;
    ELSE
        -- Insert new record
        INSERT INTO score_tracker (event, selection, user_id)
        VALUES (NEW.event, NEW.selection, NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER tournament_locked_trigger
    AFTER UPDATE ON tournament_selections
    FOR EACH ROW
    WHEN (NEW.is_locked = true AND OLD.is_locked = false)
    EXECUTE FUNCTION add_to_score_tracker(); 