import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import { initializeDatabase, saveSelection, getSelections, getScoreTrackerEntries } from './services/database.js';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxRetries: 3,
    retryDelay: 1000
});

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
        const result = await pool.query('SELECT event, selection, selection_date, is_locked FROM tournament_selections ORDER BY id');
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
    const { event, playerName, isLocked } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('Save endpoint received:', { event, playerName, isLocked });

        // First check if the golfer is already in score_tracker
        const usedGolferCheck = await client.query(`
            SELECT event FROM score_tracker WHERE selection = $1
        `, [playerName]);

        if (usedGolferCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'This Golfer has already been used in a previous tournament. Please select a different one.',
                usedIn: usedGolferCheck.rows[0].event
            });
        }

        // Save to tournament_selections
        const tournamentResult = await client.query(`
            INSERT INTO tournament_selections (event, selection, selection_date, is_locked)
            VALUES ($1, $2, NOW(), $3)
            ON CONFLICT (event) DO UPDATE
            SET selection = $2, selection_date = NOW(), is_locked = $3
            RETURNING *
        `, [event, playerName, isLocked]);

        // If locked, update score_tracker
        if (isLocked) {
            console.log('Updating score_tracker for locked selection');
            await client.query(`
                INSERT INTO score_tracker (event, selection)
                VALUES ($1, $2)
                ON CONFLICT (event) DO UPDATE
                SET selection = $2
            `, [event, playerName]);
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
        
        res.json(tournamentResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving selection:', error);
        res.status(500).json({ error: 'Failed to save selection' });
    } finally {
        client.release();
    }
});

// Add new endpoint for uploading score tracker data
app.post('/api/scoretracker/upload', async (req, res) => {
    try {
        console.log('Starting score tracker data upload...');
        
        // Read PlayersChampionshipResult.xlsx for Result and Earnings data
        const resultsPath = join(__dirname, 'data', 'PlayersChampionshipResult.xlsx');
        console.log('Looking for results file at:', resultsPath);
        
        if (!fs.existsSync(resultsPath)) {
            throw new Error('PlayersChampionshipResult.xlsx file not found');
        }

        const resultsWorkbook = new ExcelJS.Workbook();
        await resultsWorkbook.xlsx.readFile(resultsPath);
        const resultsWorksheet = resultsWorkbook.getWorksheet(1);

        // Create a map of results data for easy lookup by player name
        const resultsMap = new Map();
        resultsWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const result = parseInt(row.getCell(1).value); // Result column - convert to integer
                const player = row.getCell(2).text.trim(); // Player column
                const earnings = parseInt(row.getCell(3).value.toString().replace(/[$,]/g, '')); // Earnings column - remove $ and , then convert to integer
                
                if (!isNaN(result) && !isNaN(earnings)) {
                    resultsMap.set(player, { result, earnings });
                    console.log(`Processed player data:`, { player, result, earnings });
                }
            }
        });

        // Get selections from tournament_selections table
        const selectionsResult = await pool.query('SELECT * FROM tournament_selections WHERE is_locked = true');
        console.log('Locked selections:', selectionsResult.rows);
        
        // Update score_tracker with results
        for (const selection of selectionsResult.rows) {
            if (selection.selection) {
                const resultData = resultsMap.get(selection.selection);
                console.log(`Processing ${selection.event} - ${selection.selection}:`, resultData);
                
                if (resultData) {
                    console.log(`Updating score_tracker for ${selection.event}:`, resultData);
                    await pool.query(`
                        UPDATE score_tracker 
                        SET result = $1, earnings = $2
                        WHERE event = $3
                    `, [resultData.result, resultData.earnings, selection.event]);
                } else {
                    console.log(`No results found for ${selection.selection}`);
                }
            }
        }

        // Verify the update
        const verifyResult = await pool.query(`
            SELECT * FROM score_tracker 
            WHERE event = 'THE PLAYERS Championship'
        `);
        console.log('Final state of Players Championship entry:', verifyResult.rows[0]);

        res.json({ message: 'Score tracker updated successfully' });
    } catch (error) {
        console.error('Error updating score tracker:', error);
        res.status(500).json({ error: error.message });
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

// Initialize server
const startServer = async () => {
    console.log('Beginning server startup process...');
    try {
        console.log('Starting server initialization...');
        
        // Test database connection with retries
        console.log('Testing database connection...');
        await testConnection();
        
        // Initialize database tables
        console.log('Initializing database tables...');
        await initializeDatabase();
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Server initialization complete');
        });
    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

