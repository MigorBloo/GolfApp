import { pool } from './config/db.js';

const resetDatabase = async () => {
    const client = await pool.connect();
    try {
        // Drop existing tables
        await client.query('DROP TABLE IF EXISTS score_tracker CASCADE');
        await client.query('DROP TABLE IF EXISTS tournament_selections CASCADE');
        console.log('Existing tables dropped');

        // Recreate tables
        await client.query(`
            CREATE TABLE tournament_selections (
                id SERIAL PRIMARY KEY,
                event VARCHAR(255) NOT NULL,
                player_name VARCHAR(255),
                selection_date TIMESTAMP,
                is_locked BOOLEAN DEFAULT false
            );
        `);

        await client.query(`
            CREATE TABLE score_tracker (
                id SERIAL PRIMARY KEY,
                event VARCHAR(255) NOT NULL UNIQUE,
                selection VARCHAR(255),
                result VARCHAR(255),
                earnings DECIMAL(10,2)
            );
        `);

        console.log('Tables recreated successfully');
    } catch (error) {
        console.error('Error resetting database:', error);
        throw error;
    } finally {
        client.release();
    }
};

resetDatabase().catch(console.error); 