import { pool } from './config/db.js';

const restoreSelections = async () => {
    const client = await pool.connect();
    try {
        // Insert tournament selections
        const selections = [
            { event: 'THE PLAYERS Championship', player_name: 'Patrick Cantlay', selection_date: '2025-03-17T15:18:20.030Z', is_locked: true },
            { event: 'Valspar Championship', player_name: 'Tommy Fleetwood', selection_date: '2025-03-18T21:27:08.730Z', is_locked: false },
            { event: "Texas Children's Houston Open", player_name: 'Xander Schauffele', selection_date: '2025-03-18T20:42:13.449Z', is_locked: false },
            { event: 'Valero Texas Open', player_name: 'Justin Thomas', selection_date: '2025-03-18T20:42:19.115Z', is_locked: false },
            { event: 'Masters Tournament', player_name: 'Tony Finau', selection_date: '2025-03-18T22:14:08.309Z', is_locked: false },
            { event: 'RBC Heritage', player_name: 'Rickie Fowler', selection_date: '2025-03-18T20:51:14.835Z', is_locked: false },
            { event: 'THE CJ CUP Byron Nelson', player_name: 'Rickie Fowler', selection_date: '2025-03-18T22:26:03.649Z', is_locked: false },
            { event: 'Truist Championship', player_name: 'Sepp Straka', selection_date: '2025-03-18T21:14:17.679Z', is_locked: false },
            { event: 'PGA Championship', player_name: null, selection_date: null, is_locked: false },
            { event: 'Charles Schwab Challenge', player_name: null, selection_date: null, is_locked: false },
            { event: 'The Memorial Tournament', player_name: null, selection_date: null, is_locked: false },
            { event: 'RBC Canadian Open', player_name: null, selection_date: null, is_locked: false },
            { event: 'U.S. Open', player_name: null, selection_date: null, is_locked: false },
            { event: 'Travelers Championship', player_name: null, selection_date: null, is_locked: false },
            { event: 'Rocket Mortgage Classic', player_name: null, selection_date: null, is_locked: false },
            { event: 'John Deere Classic', player_name: null, selection_date: null, is_locked: false },
            { event: 'Genesis Scottish Open', player_name: null, selection_date: null, is_locked: false },
            { event: 'The Open Championship', player_name: null, selection_date: null, is_locked: false },
            { event: '3M Open', player_name: null, selection_date: null, is_locked: false },
            { event: 'Wyndham Championship', player_name: null, selection_date: null, is_locked: false },
            { event: 'FedEx St. Jude Championship', player_name: null, selection_date: null, is_locked: false },
            { event: 'BMW Championship', player_name: null, selection_date: null, is_locked: false },
            { event: 'TOUR Championship', player_name: null, selection_date: null, is_locked: false }
        ];

        for (const selection of selections) {
            await client.query(
                `INSERT INTO tournament_selections (event, player_name, selection_date, is_locked)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (event) DO UPDATE SET
                    player_name = EXCLUDED.player_name,
                    selection_date = EXCLUDED.selection_date,
                    is_locked = EXCLUDED.is_locked`,
                [selection.event, selection.player_name, selection.selection_date, selection.is_locked]
            );
        }

        console.log('Tournament selections restored successfully');
    } catch (error) {
        console.error('Error restoring tournament selections:', error);
        throw error;
    } finally {
        client.release();
    }
};

restoreSelections().catch(console.error); 