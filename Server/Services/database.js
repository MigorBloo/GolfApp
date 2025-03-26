import pkg from 'pg';
const { Pool } = pkg;
import { pool } from '../config/db.js';


export const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('Initializing database...');
        
        // First, verify we can connect and query
        const testResult = await client.query('SELECT NOW()');
        console.log('Database connection verified:', testResult.rows[0]);

        // Create tournament_selections table if it doesn't exist
        console.log('Checking tournament_selections table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS tournament_selections (
                id SERIAL PRIMARY KEY,
                event VARCHAR(255) NOT NULL UNIQUE,
                selection VARCHAR(255),
                selection_date TIMESTAMP,
                is_locked BOOLEAN DEFAULT false
            );
        `);
        console.log('tournament_selections table verified');

        // Create score_tracker table if it doesn't exist
        console.log('Checking score_tracker table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS score_tracker (
                id SERIAL PRIMARY KEY,
                event VARCHAR(255) UNIQUE NOT NULL,
                selection VARCHAR(255),
                result NUMERIC,
                earnings NUMERIC
            );
        `);
        console.log('score_tracker table verified');

        // Verify tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Existing tables:', tablesResult.rows.map(r => r.table_name));

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
};

export const saveSelection = async (event, selection, isLocked) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Saving selection with lock status:', { event, selection, isLocked });

        // Save to tournament_selections
        const tournamentResult = await client.query(`
            INSERT INTO tournament_selections (event, selection, selection_date, is_locked)
            VALUES ($1, $2, NOW(), $3)
            ON CONFLICT (event) DO UPDATE
            SET selection = $2, selection_date = NOW(), is_locked = $3
            RETURNING *
        `, [event, selection, isLocked]);

        // If locked, update score_tracker
        if (isLocked) {
            console.log('Updating score_tracker for locked selection');
            await client.query(`
                UPDATE score_tracker
                SET selection = $1
                WHERE event = $2
            `, [selection, event]);
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