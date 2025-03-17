import pkg from 'pg';
const { Pool } = pkg;
import { pool } from '../config/db.js';


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

export const saveSelection = async (event, playerName, isLocked) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Saving selection with lock status:', { event, playerName, isLocked });

        // Save to tournament_selections
        const tournamentResult = await client.query(`
            INSERT INTO tournament_selections (event, player_name, selection_date, is_locked)
            VALUES ($1, $2, NOW(), $3)
            ON CONFLICT (event) DO UPDATE
            SET player_name = $2, selection_date = NOW(), is_locked = $3
            RETURNING *
        `, [event, playerName, isLocked]);

        // If locked, update score_tracker
        if (isLocked) {
            console.log('Updating score_tracker for locked selection');
            await client.query(`
                UPDATE score_tracker
                SET selection = $1
                WHERE event = $2
            `, [playerName, event]);
        }

        await client.query('COMMIT');
        
        // Log final state
        const finalState = await client.query(`
            SELECT ts.*, st.selection 
            FROM tournament_selections ts
            LEFT JOIN score_tracker st ON ts.event = st.event
            WHERE ts.event = $1
        `, [event]);
        
        console.log('Final state after save:', finalState.rows[0]);
        
        return tournamentResult.rows[0];
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
        const result = await pool.query('SELECT * FROM tournament_selections ORDER BY id');
        return result.rows;
    } catch (error) {
        throw error;
    }
};

export const getScoreTrackerEntries = async () => {
    try {
        const result = await pool.query('SELECT * FROM score_tracker ORDER BY id');
        return result.rows;
    } catch (error) {
        throw error;
    }
};