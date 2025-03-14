import pool from '../config/db.js';

export const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('Initializing database...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS tournament_selections (
                id SERIAL PRIMARY KEY,
                tournament_id INTEGER NOT NULL,
                player_name VARCHAR(255) NOT NULL,
                selection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_locked BOOLEAN NOT NULL DEFAULT false,
                UNIQUE(tournament_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS score_tracker (
                id SERIAL PRIMARY KEY,
                tournament_id INTEGER NOT NULL,
                player_name VARCHAR(255) NOT NULL,
                entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                result VARCHAR(255),
                earnings DECIMAL,
                winner VARCHAR(255),
                UNIQUE(tournament_id)
            );
        `);

        console.log('Database initialization completed');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
};

export const saveSelection = async (tournamentId, playerName, isLocked) => {
    const client = await pool.connect();
    try {
        console.log('Starting database transaction...', { tournamentId, playerName, isLocked });
        await client.query('BEGIN');

        // Ensure isLocked is always a boolean
        const isLockedBoolean = isLocked === true;

        const query = `
            INSERT INTO tournament_selections 
                (tournament_id, player_name, is_locked)
            VALUES 
                ($1, $2, $3)
            ON CONFLICT (tournament_id) 
            DO UPDATE SET 
                player_name = EXCLUDED.player_name,
                is_locked = EXCLUDED.is_locked,
                selection_date = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        console.log('Executing query with values:', { 
            tournamentId, 
            playerName, 
            isLocked: isLockedBoolean 
        });

        const result = await client.query(query, [
            tournamentId, 
            playerName, 
            isLockedBoolean
        ]);

        await client.query('COMMIT');
        console.log('Transaction committed successfully');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in saveSelection:', error);
        throw error;
    } finally {
        client.release();
    }
};

export const getSelections = async () => {
    try {
        const result = await pool.query('SELECT * FROM tournament_selections ORDER BY tournament_id');
        return result.rows;
    } catch (error) {
        throw error;
    }
};

export const getScoreTrackerEntries = async () => {
    try {
        const result = await pool.query('SELECT * FROM score_tracker ORDER BY tournament_id');
        return result.rows;
    } catch (error) {
        throw error;
    }
};