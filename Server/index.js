const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { join } = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test-files', (req, res) => {
    const dataPath = path.join(__dirname, 'Data');
    const files = fs.readdirSync(dataPath);
    res.json({ files });
});

// Schedule endpoint - wrap data in 'schedule' property
app.get('/api/schedule', (req, res) => {
    try {
        const workbook = XLSX.readFile(path.join(__dirname, 'Data', 'schedule.xlsx'));
        const sheetName = workbook.SheetNames[0];
        const scheduleData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        res.json(scheduleData);
    } catch (error) {
        console.error('Error reading schedule data:', error);
        res.status(500).json({ error: 'Failed to load schedule data' });
    }
});

// Rankings endpoint following the same pattern
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
                    const availability = row.getCell(5).text;

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

const PORT = 8001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    const dataPath = path.join(__dirname, 'Data');
    const files = fs.readdirSync(dataPath);
    console.log('Files in Data directory:', files);
});