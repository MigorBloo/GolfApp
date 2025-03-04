import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 8001;
const apiKey = process.env.DATAGOLF_API_KEY;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Add a root route handler
app.get('/', (req, res) => {
    res.json({
        message: 'Golf API Server is running',
        endpoints: {
            golfers: '/api/golfers'
        }
    });
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
        res.json({ schedule });
        
    } catch (error) {
        console.error('Server Error reading schedule:', error);
        res.status(500).json({ 
            error: 'Failed to read schedule data',
            details: error.message,
            path: join(__dirname, 'data', 'schedule.xlsx')
        });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});