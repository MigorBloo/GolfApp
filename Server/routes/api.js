const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ... existing code ...

// Add new endpoint for tournament earnings
router.get('/tournament-earnings/:tournId/:year', async (req, res) => {
    try {
        const { tournId, year } = req.params;
        const response = await axios.get(`https://live-golf-data.p.rapidapi.com/earnings`, {
            params: {
                tournId,
                year
            },
            headers: {
                'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
                'x-rapidapi-key': 'abb8d57a72mshdc51e35db403e8bp115f1ejsn04c19819e20b'
            }
        });

        console.log('Raw API response:', response.data);

        // Transform the data to make it easier to work with
        const earningsData = response.data.leaderboard.map(player => {
            const name = `${player.firstName} ${player.lastName}`;
            console.log('Transformed player name:', name);
            return {
                name,
                earnings: player.earnings.$numberInt
            };
        });

        console.log('Transformed earnings data:', earningsData);
        res.json(earningsData);
    } catch (error) {
        console.error('Error fetching tournament earnings:', error);
        res.status(500).json({ error: 'Failed to fetch tournament earnings' });
    }
});

// ... rest of the existing code ... 