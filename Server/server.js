import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { initializeDatabase, saveSelection, getSelections, getScoreTrackerEntries } from './services/database.js';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express setup
const app = express();
const PORT = process.env.PORT || 8001;
const apiKey = process.env.DATAGOLF_API_KEY;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function for reading Excel files
const readExcelFile = (filename) => {
    try {
        const filePath = join(__dirname, 'data', filename);
        console.log('Reading file:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return null;
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
};

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Golf API Server is running',
        endpoints: {
            golfers: '/api/golfers',
            rankings: '/api/rankings',
            selections: '/api/selections',
            scoretracker: '/api/scoretracker/entries'
        }
    });
});

app.get('/api/rankings', async (req, res) => {
    try {
        const filePath = join(__dirname, 'data', 'GolfRankings.xlsx');
        if (!fs.existsSync(filePath)) {
            throw new Error('Rankings file not found');
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        const rankings = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const owgr = row.getCell(1).text;
                const player = row.getCell(2).text;
                const country = row.getCell(3).text;
                const tour = row.getCell(4).text;
                let availability = row.getCell(5).value;
                
                if (typeof availability === 'number') {
                    availability = `${Math.round(availability * 100)}%`;
                }

                rankings.push({ OWGR: owgr, Player: player, Country: country, Tour: tour, Availability: availability });
            }
        });

        res.json({ rankings });
    } catch (error) {
        console.error('Error reading rankings:', error);
        res.status(500).json({ error: 'Failed to read rankings data' });
    }
});

app.get('/api/golfers', async (req, res) => {
    try {
        const response = await fetch(`https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=${apiKey}`);
        if (!response.ok) throw new Error(`DataGolf API responded with status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from DataGolf:', error);
        res.status(500).json({ error: 'Failed to fetch golfer data' });
    }
});

app.get('/api/schedule', async (req, res) => {
    try {
        const filePath = join(__dirname, 'data', 'schedule.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1);
        const schedule = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                schedule.push({
                    StartDate: row.getCell(1).text,
                    Event: row.getCell(2).text,
                    Purse: Number(row.getCell(3).value) || 0,
                    Selection: row.getCell(4).text || ''
                });
            }
        });

        res.json(schedule);
    } catch (error) {
        console.error('Error reading schedule:', error);
        res.status(500).json({ error: 'Failed to read schedule data' });
    }
});

app.get('/api/selections', async (req, res) => {
    try {
        console.log('Fetching selections...');
        const result = await pool.query('SELECT * FROM tournament_selections ORDER BY id');
        console.log('Tournament selections:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching selections:', error);
        res.status(500).json({ error: 'Failed to fetch selections' });
    }
});

app.get('/api/scoretracker/entries', async (req, res) => {
    try {
        console.log('Fetching score tracker entries...');
        const result = await pool.query('SELECT * FROM score_tracker ORDER BY id');
        console.log('Score tracker entries:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching score tracker entries:', error);
        res.status(500).json({ error: 'Failed to fetch score tracker entries' });
    }
});

app.get('/api/test-insert', async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('Testing database insert...');
        
        // First, try a simple insert
        const testResult = await client.query(`
            INSERT INTO tournament_selections (tournament_id, player_name, is_locked)
            VALUES (999, 'Test Player', false)
            RETURNING *;
        `);
        
        console.log('Test insert result:', testResult.rows[0]);
        
        // Then try to read it back
        const readResult = await client.query('SELECT * FROM tournament_selections');
        console.log('All selections:', readResult.rows);
        
        res.json({
            inserted: testResult.rows[0],
            allRows: readResult.rows
        });
    } catch (error) {
        console.error('Test insert error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Save selection
app.post('/api/selections/save', async (req, res) => {
    try {
        const { event, playerName, isLocked } = req.body;
        console.log('Save endpoint received:', { event, playerName, isLocked });

        const result = await saveSelection(event, playerName, isLocked);
        console.log('Save result:', result);

        // Fetch updated score_tracker entry
        const scoreTrackerEntry = await pool.query(
            'SELECT * FROM score_tracker WHERE event = $1',
            [event]
        );
        console.log('Updated score_tracker entry:', scoreTrackerEntry.rows[0]);

        res.json(result);
    } catch (error) {
        console.error('Error saving selection:', error);
        res.status(500).json({ error: 'Failed to save selection' });
    }
});

// Add tournament earnings endpoint
app.get('/api/tournament-earnings/:tournId/:year', async (req, res) => {
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
            console.log('Raw earnings:', player.earnings);
            return {
                name,
                earnings: player.earnings.$numberInt || player.earnings // Handle both formats
            };
        });

        console.log('Transformed earnings data:', earningsData);
        res.json(earningsData);
    } catch (error) {
        console.error('Error fetching tournament earnings:', error);
        res.status(500).json({ error: 'Failed to fetch tournament earnings' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Database connection error handling
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Start server
const startServer = async () => {
    try {
        console.log('Starting server initialization...');
        
        // Test database connection first
        console.log('Testing database connection...');
        const client = await pool.connect();
        console.log('Database connection successful');
        
        const testQuery = await client.query('SELECT NOW()');
        console.log('Database query successful:', testQuery.rows[0]);
        client.release();

        // Initialize database tables
        console.log('Initializing database tables...');
        await initializeDatabase();
        console.log('Database tables initialized');

        // Start the Express server with error handling
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Server initialization complete');
            
            // Log available endpoints
            console.log('Available endpoints:');
            console.log('- GET  /api/golfers');
            console.log('- GET  /api/rankings');
            console.log('- GET  /api/selections');
            console.log('- POST /api/selections/save');
            console.log('- GET  /api/scoretracker/entries');
        });

        // Add error handler for the server
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Stopping server...`);
                process.exit(1);
            } else {
                console.error('Server error:', error);
            }
        });

    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1);
    }
};

console.log('Beginning server startup process...');
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    // Add connection pool settings
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // how long to wait for a connection
    maxRetries: 3, // number of retries for connection
    retryDelay: 1000, // delay between retries in milliseconds
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connection successful');
        client.release();
        return true;
    } catch (err) {
        console.error('Database connection failed:', err);
        return false;
    }
};

// Initialize database connection
const initializeDatabase = async () => {
    let retries = 3;
    while (retries > 0) {
        if (await testConnection()) {
            break;
        }
        retries--;
        if (retries > 0) {
            console.log(`Retrying database connection... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// Call initialization
initializeDatabase();

