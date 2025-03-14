import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pool from './config/db.js';
import { initializeDatabase, saveSelection, getSelections, getScoreTrackerEntries } from './services/database.js';

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
        const selections = await getSelections();
        res.json(selections);
    } catch (error) {
        console.error('Error fetching selections:', error);
        res.status(500).json({ error: 'Failed to fetch selections' });
    }
});

app.get('/api/scoretracker/entries', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM score_tracker ORDER BY tournament_id');
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

app.post('/api/selections/save', async (req, res) => {
    try {
        const { tournamentId, playerName, isLocked } = req.body;
        console.log('Save endpoint received:', { tournamentId, playerName, isLocked });
        
        // Log the current database connection
        const dbCheck = await pool.query('SELECT current_database(), current_schema()');
        console.log('Using database/schema:', dbCheck.rows[0]);
        
        const result = await saveSelection(tournamentId, playerName, isLocked);
        console.log('Save result:', result);
        
        res.json(result);
    } catch (error) {
        console.error('Error in save endpoint:', error);
        res.status(500).json({ error: 'Failed to save selection' });
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

