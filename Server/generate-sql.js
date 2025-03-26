import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateSQL() {
    try {
        // Read schedule.xlsx
        const schedulePath = join(__dirname, 'data', 'schedule.xlsx');
        console.log('Reading schedule file from:', schedulePath);
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(schedulePath);
        const worksheet = workbook.getWorksheet(1);
        
        // Generate SQL commands
        let sql = `-- Drop existing tables
DROP TABLE IF EXISTS tournament_selections CASCADE;
DROP TABLE IF EXISTS score_tracker CASCADE;

-- Create tournament_selections table
CREATE TABLE tournament_selections (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) NOT NULL,
    player_name VARCHAR(255),
    selection_date TIMESTAMP,
    is_locked BOOLEAN DEFAULT false
);

-- Create score_tracker table
CREATE TABLE score_tracker (
    id SERIAL PRIMARY KEY,
    event VARCHAR(255) UNIQUE NOT NULL,
    selection VARCHAR(255),
    result VARCHAR(255),
    earnings DECIMAL(10,2)
);

-- Insert events in the correct order
INSERT INTO score_tracker (event) VALUES\n`;

        // Add each event from the Excel file
        const events = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const event = row.getCell(2).text;
                events.push(`('${event.replace(/'/g, "''")}')`);
            }
        });

        sql += events.join(',\n');

        // Write SQL to file
        const sqlPath = join(__dirname, 'create-tables.sql');
        fs.writeFileSync(sqlPath, sql);
        console.log(`SQL commands written to: ${sqlPath}`);

    } catch (error) {
        console.error('Error generating SQL:', error);
    }
}

generateSQL(); 