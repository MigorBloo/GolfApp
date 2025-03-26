import { pool } from './config/db.js';

const viewScoreTracker = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM score_tracker ORDER BY id');
        console.log('\nScore Tracker Contents:');
        console.log('------------------------');
        result.rows.forEach(row => {
            console.log(`Event: ${row.event}`);
            console.log(`Selection: ${row.selection || 'Not selected'}`);
            console.log(`Result: ${row.result || 'Not completed'}`);
            console.log(`Earnings: ${row.earnings || 'Not available'}`);
            console.log('------------------------');
        });
    } catch (error) {
        console.error('Error viewing score tracker:', error);
        throw error;
    } finally {
        client.release();
    }
};

viewScoreTracker().catch(console.error); 