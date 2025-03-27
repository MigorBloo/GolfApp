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
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

// Add JWT secret to your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

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

        // Get all used golfers from score_tracker
        const usedGolfersResult = await pool.query('SELECT selection FROM score_tracker WHERE selection IS NOT NULL');
        const usedGolfers = new Set(usedGolfersResult.rows.map(row => row.selection.toLowerCase()));

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const owgr = row.getCell(1).text;
                const player = row.getCell(2).text;
                const country = row.getCell(3).text;
                const tour = row.getCell(4).text;
                let availability = row.getCell(5).value;
                
                // If the player is used, set availability to 0%
                if (usedGolfers.has(player.toLowerCase())) {
                    availability = 0;
                } else if (typeof availability === 'number') {
                    availability = `${Math.round(availability * 100)}%`;
                }

                rankings.push({ 
                    OWGR: owgr, 
                    Player: player, 
                    Country: country, 
                    Tour: tour, 
                    Availability: availability,
                    isUsed: usedGolfers.has(player.toLowerCase())
                });
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

        // Update lock status for all tournaments
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            for (const tournament of schedule) {
                const tournamentDate = new Date(tournament.StartDate);
                const now = new Date();
                const isLocked = tournamentDate <= now;

                // Update tournament_selections
                await client.query(`
                    UPDATE tournament_selections 
                    SET is_locked = $1
                    WHERE event = $2 AND is_locked = false
                `, [isLocked, tournament.Event]);

                // If tournament is locked and has a selection, ensure it's in score_tracker
                if (isLocked) {
                    const selectionResult = await client.query(`
                        SELECT selection FROM tournament_selections WHERE event = $1
                    `, [tournament.Event]);

                    if (selectionResult.rows.length > 0 && selectionResult.rows[0].selection) {
                        await client.query(`
                            INSERT INTO score_tracker (event, selection)
                            VALUES ($1, $2)
                            ON CONFLICT (event) DO UPDATE
                            SET selection = $2
                        `, [tournament.Event, selectionResult.rows[0].selection]);
                    }
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating tournament lock status:', error);
        } finally {
            client.release();
        }

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
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT 
                id,
                event,
                selection,
                result,
                format_currency(earnings) as earnings
            FROM score_tracker
            ORDER BY id;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching score tracker entries:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
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

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// Save selection
app.post('/api/selections/save', authenticateToken, async (req, res) => {
    const { event, selection, isLocked } = req.body;
    const userId = req.user.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('Save endpoint received:', { event, selection, isLocked, userId });

        // First check if the golfer is already in score_tracker
        const usedGolferCheck = await client.query(`
            SELECT event FROM score_tracker WHERE selection = $1
        `, [selection]);

        if (usedGolferCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'This Golfer has already been used in a previous tournament. Please select a different one.',
                usedIn: usedGolferCheck.rows[0].event
            });
        }

        // Check if event already exists in tournament_selections
        const existingEvent = await client.query(`
            SELECT * FROM tournament_selections WHERE event = $1
        `, [event]);

        let tournamentResult;
        if (existingEvent.rows.length > 0) {
            // Update existing event
            tournamentResult = await client.query(`
                UPDATE tournament_selections 
                SET selection = $1, 
                    selection_date = NOW(), 
                    is_locked = $2,
                    user_id = $3
                WHERE event = $4
                RETURNING *
            `, [selection, isLocked, userId, event]);
        } else {
            // Insert new event
            tournamentResult = await client.query(`
                INSERT INTO tournament_selections (event, selection, selection_date, is_locked, user_id)
                VALUES ($1, $2, NOW(), $3, $4)
                RETURNING *
            `, [event, selection, isLocked, userId]);
        }

        console.log('Tournament selection saved:', tournamentResult.rows[0]);

        // If locked, update score_tracker
        if (isLocked) {
            console.log('Updating score_tracker for locked selection');
            await client.query(`
                INSERT INTO score_tracker (event, selection, user_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (event) DO UPDATE
                SET selection = EXCLUDED.selection,
                    user_id = EXCLUDED.user_id
            `, [event, selection, userId]);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Selection saved successfully' });
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
        const resultsPath = join(__dirname, 'data', 'WeeklyResult.xlsx');
        console.log('Looking for results file at:', resultsPath);
        
        if (!fs.existsSync(resultsPath)) {
            throw new Error('Results file not found');
        }

        const resultsWorkbook = new ExcelJS.Workbook();
        await resultsWorkbook.xlsx.readFile(resultsPath);
        const resultsWorksheet = resultsWorkbook.getWorksheet(1);

        // Create a map of results data for easy lookup by player name
        const resultsMap = new Map();
        resultsWorksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const result = parseInt(row.getCell(1).value); // Result column
                const player = row.getCell(2).text.trim(); // Player column
                const earnings = parseInt(row.getCell(3).value.toString().replace(/[$,]/g, '')); // Earnings column
                
                if (!isNaN(result) && !isNaN(earnings)) {
                    resultsMap.set(player, { result, earnings });
                    console.log(`Processed player data:`, { player, result, earnings });
                }
            }
        });

        // Get all entries from score_tracker
        const scoreTrackerResult = await pool.query('SELECT * FROM score_tracker ORDER BY id');
        console.log('Current score tracker entries:', scoreTrackerResult.rows);
        
        // Update each entry if we have matching results
        for (const entry of scoreTrackerResult.rows) {
            if (entry.selection) {  // if there's a player selected
                const resultData = resultsMap.get(entry.selection);
                if (resultData) {
                    console.log(`Updating ${entry.event} - ${entry.selection}:`, resultData);
                    await pool.query(`
                        UPDATE score_tracker 
                        SET result = $1, earnings = $2
                        WHERE event = $3 AND selection = $4
                    `, [resultData.result, resultData.earnings, entry.event, entry.selection]);
                }
            }
        }

        res.json({ message: 'Score tracker updated successfully' });
    } catch (error) {
        console.error('Error updating score tracker:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update score tracker with weekly results
app.get('/api/update-weekly-results', async (req, res) => {
    try {
        const filePath = join(__dirname, 'data', 'WeeklyResult.xlsx');
        console.log('Looking for file at:', filePath);
        
        if (!fs.existsSync(filePath)) {
            throw new Error('Weekly results file not found');
        }
        console.log('File exists, proceeding...');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get all selections that don't have results yet
            const pendingEntries = await client.query(`
                SELECT id, event, selection
                FROM score_tracker 
                WHERE selection IS NOT NULL AND result IS NULL
                ORDER BY id DESC
            `);

            if (pendingEntries.rows.length === 0) {
                console.log('No pending entries to update');
                return res.json([]);
            }

            // Read the weekly results file
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.getWorksheet(1);
            
            console.log('Successfully read Excel file');
            
            // Create a map of player results from Excel
            const playerResults = new Map();
            
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Skip header row
                    const player = String(row.getCell(1).value).trim();
                    const resultValue = row.getCell(2).value;
                    let earnings = row.getCell(3).value;

                    // Handle result value - preserve "T" prefix if it exists
                    const result = String(resultValue);

                    // Clean up earnings value if it's a string
                    if (typeof earnings === 'string') {
                        earnings = Number(earnings.replace(/[$,]/g, ''));
                    }

                    if (player) {
                        playerResults.set(player.toLowerCase(), {
                            result: result,
                            earnings: earnings
                        });
                    }
                }
            });

            // Update each pending entry
            for (const entry of pendingEntries.rows) {
                const playerData = playerResults.get(entry.selection.toLowerCase());
                
                let result, earnings;
                
                if (playerData) {
                    // Player found in results
                    result = playerData.result;
                    earnings = playerData.earnings;
                } else {
                    // Player not found - mark as MC
                    result = 'MC';
                    earnings = 0;
                }

                console.log('Updating player:', {
                    player: entry.selection,
                    result,
                    earnings
                });

                await client.query(`
                    UPDATE score_tracker 
                    SET result = $1, earnings = $2
                    WHERE id = $3
                `, [result, earnings, entry.id]);
            }

            await client.query('COMMIT');
            
            // Get all updated score tracker entries
            const updatedEntries = await client.query(`
                SELECT id, event, selection, result, earnings
                FROM score_tracker 
                ORDER BY id
            `);
            
            console.log('\nFinal score tracker entries:', updatedEntries.rows);
            res.json(updatedEntries.rows);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating weekly results:', error);
        res.status(500).json({ error: 'Failed to update weekly results' });
    }
});

// User registration endpoint
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if email already exists
        const userCheck = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userCheck.rows.length > 0) {
            throw new Error('Email already registered');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert the new user
        const result = await client.query(
            'INSERT INTO users (email, password, is_admin) VALUES ($1, $2, $3) RETURNING id, email, is_admin',
            [email, hashedPassword, false] // Set is_admin to false for regular users
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: result.rows[0].id,
                email: result.rows[0].email,
                isAdmin: result.rows[0].is_admin
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await client.query('COMMIT');
        res.json({ 
            message: 'Registration successful',
            token,
            user: {
                id: result.rows[0].id,
                email: result.rows[0].email,
                isAdmin: result.rows[0].is_admin
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration error:', error);
        res.status(400).json({ 
            error: error.message === 'Email already registered' 
                ? error.message 
                : 'Registration failed' 
        });
    } finally {
        client.release();
    }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create and assign token with complete user info
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email,
                isAdmin: user.is_admin 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Modify the score tracker endpoints to be user-specific
app.post('/api/scoretracker/selection', authenticateToken, async (req, res) => {
    try {
        const { event, selection } = req.body;
        const userId = req.user.id;

        const result = await pool.query(
            'INSERT INTO score_tracker (user_id, event, selection) VALUES ($1, $2, $3) RETURNING *',
            [userId, event, selection]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving selection:', error);
        res.status(500).json({ error: 'Failed to save selection' });
    }
});

// Get user-specific score tracker entries
app.get('/api/scoretracker/entries', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM score_tracker WHERE user_id = $1 ORDER BY id',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching score tracker entries:', error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.username,
                SUM(COALESCE(st.earnings, 0)) as total_earnings,
                COUNT(DISTINCT st.event) as tournaments_played
            FROM users u
            LEFT JOIN score_tracker st ON u.id = st.user_id
            GROUP BY u.id, u.username
            ORDER BY total_earnings DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get snapshot data (weekly results)
app.get('/api/snapshot', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.username,
                st.event,
                st.selection,
                st.result,
                st.earnings
            FROM users u
            JOIN score_tracker st ON u.id = st.user_id
            WHERE st.event = (
                SELECT event 
                FROM score_tracker 
                ORDER BY id DESC 
                LIMIT 1
            )
            ORDER BY st.earnings DESC NULLS LAST
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching snapshot:', error);
        res.status(500).json({ error: 'Failed to fetch snapshot' });
    }
});

// Add this new endpoint before the last app.listen line
app.post('/api/admin/clear-tables', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear both tables and reset their sequences
    await client.query('TRUNCATE TABLE tournament_selections, score_tracker RESTART IDENTITY CASCADE');
    
    await client.query('COMMIT');
    console.log('Successfully cleared tournament_selections and score_tracker tables');
    res.json({ message: 'Tables cleared successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error clearing tables:', error);
    res.status(500).json({ error: 'Failed to clear tables' });
  } finally {
    client.release();
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

// Update the POST endpoint for score tracker
app.post('/api/scoretracker/entry', async (req, res) => {
    const { event, selection, result, earnings } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // First check if the selection exists in tournament_selections
        const selectionCheck = await client.query(
            'SELECT * FROM tournament_selections WHERE event = $1 AND selection = $2',
            [event, selection]
        );
        
        if (selectionCheck.rows.length === 0) {
            throw new Error('Selection not found in tournament_selections');
        }
        
        // Insert into score_tracker
        const insertResult = await client.query(
            'INSERT INTO score_tracker (event, selection, result, earnings) VALUES ($1, $2, $3, $4) RETURNING id',
            [event, selection, result, earnings]
        );
        
        // Fetch the inserted row with formatted earnings
        const newEntry = await client.query(
            'SELECT id, event, selection, result, format_currency(earnings) as earnings FROM score_tracker WHERE id = $1',
            [insertResult.rows[0].id]
        );
        
        await client.query('COMMIT');
        res.json(newEntry.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding score tracker entry:', error);
        res.status(500).json({ error: 'Failed to add score tracker entry' });
    } finally {
        client.release();
    }
});

// Update GET endpoint for tournament selections to include is_locked
app.get('/api/tournament-selections', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        id,
        event,
        selection,
        selection_date,
        is_locked
      FROM tournament_selections
      ORDER BY id;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tournament selections:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update save endpoint to handle is_locked
app.post('/api/save', async (req, res) => {
  const { event, selection } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if tournament is locked
    const lockCheck = await client.query(
      'SELECT is_locked FROM tournament_selections WHERE event = $1',
      [event]
    );

    if (lockCheck.rows.length > 0 && lockCheck.rows[0].is_locked) {
      throw new Error('Tournament is locked and cannot be modified');
    }

    // Update or insert the selection
    const result = await client.query(
      `INSERT INTO tournament_selections (event, selection, selection_date)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (event) DO UPDATE
       SET selection = $2,
           selection_date = CURRENT_TIMESTAMP
       WHERE tournament_selections.is_locked = false
       RETURNING *`,
      [event, selection]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving selection:', error);
    res.status(500).json({ 
      error: error.message === 'Tournament is locked and cannot be modified' 
        ? error.message 
        : 'Failed to save selection' 
    });
  } finally {
    client.release();
  }
});

// Add new endpoint to lock/unlock tournament
app.post('/api/tournament/lock', async (req, res) => {
  const { event, lock } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE tournament_selections SET is_locked = $1 WHERE event = $2 RETURNING *',
      [lock, event]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating tournament lock status:', error);
    res.status(500).json({ error: 'Failed to update tournament lock status' });
  } finally {
    client.release();
  }
});

// Profile endpoints
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        console.log('Profile endpoint called with user:', req.user);
        const userId = req.user.userId;
        console.log('Fetching profile for user ID:', userId);
        
        const result = await pool.query(
            'SELECT email, username, profile_image FROM users WHERE id = $1',
            [userId]
        );
        
        console.log('Query result:', result.rows);
        
        if (result.rows.length === 0) {
            console.log('No user found with ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});

app.put('/api/users/username', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username } = req.body;
        
        const result = await pool.query(
            'UPDATE users SET username = $1 WHERE id = $2 RETURNING username',
            [username, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ username: result.rows[0].username });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ message: 'Error updating username' });
    }
});

app.put('/api/users/profile-image', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { profile_image } = req.body;
        
        const result = await pool.query(
            'UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING profile_image',
            [profile_image, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ profile_image: result.rows[0].profile_image });
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ message: 'Error updating profile image' });
    }
});

