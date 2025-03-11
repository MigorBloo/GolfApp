import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path'; // Added path import
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'GolfApp',
    password: 'HoloMax0809$$',
    port: 5433
});

const app = express();
const PORT = process.env.PORT || 8001; // Unified PORT variable
const apiKey = process.env.DATAGOLF_API_KEY;

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
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`Data from ${filename}:`, data);
        return data;
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
};


app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json()); 

app.get('/', (req, res) => {
    res.json({
        message: 'Golf API Server is running',
        endpoints: {
            golfers: '/api/golfers'
        }
    });
});

app.get('/api/snapshot', async (req, res) => {
    const data = readExcelFile('Snapshot.xlsx');
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to read Snapshot.xlsx' });
    }
});

app.get('/api/scoretracker', async (req, res) => {
    const data = readExcelFile('ScoreTracker.xlsx');
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to read ScoreTracker.xlsx' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    const data = readExcelFile('Leaderboard.xlsx');
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to read Leaderboard.xlsx' });
    }
});

app.get('/api/rankings', async (req, res) => {
    try {
        console.log('Starting rankings request...');
        
        res.setHeader('Content-Type', 'application/json');
        
        console.log('Reading rankings file...');
        const filePath = join(__dirname, 'data', 'GolfRankings.xlsx');
        console.log('Excel file path:', filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`Excel file not found at: ${filePath}`);
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('No worksheet found in Excel file');
        }

        const rankings = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                try {
                    const owgr = row.getCell(1).text;
                    const player = row.getCell(2).text;
                    const country = row.getCell(3).text;
                    const tour = row.getCell(4).text;
                    
                    // Format availability as percentage
                    let availability = row.getCell(5).value;
                    if (typeof availability === 'number') {
                        availability = `${Math.round(availability * 100)}%`;
                    } else if (availability && !availability.includes('%')) {
                        availability = `${availability}%`;
                    }

                    rankings.push({
                        OWGR: owgr,
                        Player: player,
                        Country: country,
                        Tour: tour,
                        Availability: availability
                    });
                } catch (rowError) {
                    console.error(`Error reading row ${rowNumber}:`, rowError);
                }
            }
        });

        console.log(`Successfully read ${rankings.length} rankings`);
        res.json({ rankings });
        
    } catch (error) {
        console.error('Server Error reading rankings:', error);
        res.status(500).json({ 
            error: 'Failed to read rankings data',
            details: error.message,
            path: join(__dirname, 'data', 'GolfRankings.xlsx')
        });
    }
});


// Existing golfers route
app.get('/api/golfers', async (req, res) => {
    try {
        console.log('Fetching data from DataGolf API...');
        const response = await fetch(`https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`DataGolf API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Successfully fetched data from DataGolf');
        res.json(data);
    } catch (error) {
        console.error('Error fetching data from DataGolf:', error);
        res.status(500).json({ 
            error: 'Failed to fetch data from DataGolf API',
            details: error.message 
        });
    }
});

app.get('/api/schedule', async (req, res) => {
    try {
        console.log('Starting schedule request...'); // Debug log
        
        // Add response headers
        res.setHeader('Content-Type', 'application/json');
        
        console.log('Reading schedule file...');
        const filePath = join(__dirname, 'data', 'schedule.xlsx');
        console.log('Excel file path:', filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`Excel file not found at: ${filePath}`);
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('No worksheet found in Excel file');
        }

        const schedule = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                try {
                    const startDate = row.getCell(1).text;
                    const event = row.getCell(2).text;
                    const purse = Number(row.getCell(3).value) || 0;
                    const selection = row.getCell(4).text || '';

                    console.log(`Reading row ${rowNumber}:`, { startDate, event, purse, selection });

                    schedule.push({
                        StartDate: startDate,
                        Event: event,
                        Purse: purse,
                        Selection: selection
                    });
                } catch (rowError) {
                    console.error(`Error reading row ${rowNumber}:`, rowError);
                }
            }
        });

        console.log(`Successfully read ${schedule.length} events`);
        const scheduleArray = Array.isArray(schedule) ? schedule : [schedule];
        res.json(scheduleArray);
        
    } catch (error) {
        console.error('Server Error reading schedule:', error);
        res.status(500).json({ 
            error: 'Failed to read schedule data',
            details: error.message,
            path: join(__dirname, 'data', 'schedule.xlsx')
        });
    }
});

app.get('/api/selections', async (req, res) => {
    try {
        const query = 'SELECT * FROM tournament_selections ORDER BY tournament_id';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/selections', async (req, res) => {
    try {
        const { tournamentId, playerName } = req.body;
        const query = `
            INSERT INTO tournament_selections (tournament_id, player_name)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [tournamentId, playerName]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Log the contents of the data directory
    const dataPath = join(__dirname, 'data');
    if (fs.existsSync(dataPath)) {
        console.log('Contents of data directory:', fs.readdirSync(dataPath));
    } else {
        console.log('Data directory not found at:', dataPath);
    }
});