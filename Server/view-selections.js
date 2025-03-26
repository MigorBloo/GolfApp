import { pool } from './config/db.js';

const viewSelections = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM tournament_selections ORDER BY id');
        console.log('\nTournament Selections Contents:');
        console.log('------------------------');
        result.rows.forEach(row => {
            console.log(`Event: ${row.event}`);
            console.log(`Player: ${row.player_name || 'Not selected'}`);
            console.log(`Selection Date: ${row.selection_date || 'Not set'}`);
            console.log(`Locked: ${row.is_locked}`);
            console.log('------------------------');
        });
    } catch (error) {
        console.error('Error viewing selections:', error);
        throw error;
    } finally {
        client.release();
    }
};

viewSelections().catch(console.error); 