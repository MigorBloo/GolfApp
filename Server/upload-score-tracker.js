import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting score tracker upload...');
console.log('Current directory:', __dirname);

// Check if files exist
const schedulePath = path.join(__dirname, 'data', 'schedule.xlsx');
const resultsPath = path.join(__dirname, 'data', 'PlayersChampionshipResult.xlsx');

console.log('\nChecking file existence:');
console.log('schedule.xlsx path:', schedulePath);
console.log('schedule.xlsx exists:', fs.existsSync(schedulePath));
console.log('PlayersChampionshipResult.xlsx path:', resultsPath);
console.log('PlayersChampionshipResult.xlsx exists:', fs.existsSync(resultsPath));

fetch('http://localhost:8001/api/scoretracker/upload', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('\nServer response status:', response.status);
    return response.json();
})
.then(data => {
    console.log('\nUpload response:', data);
    if (data.error) {
        console.error('Error from server:', data.error);
    }
})
.catch(error => {
    console.error('\nError uploading score tracker:', error);
    if (error.message) {
        console.error('Error message:', error.message);
    }
}); 