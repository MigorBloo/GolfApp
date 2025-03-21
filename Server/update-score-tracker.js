import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const updateScoreTracker = async () => {
    try {
        console.log('Updating score tracker...');
        const response = await axios.post('http://localhost:8001/api/scoretracker/upload');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
};

updateScoreTracker(); 