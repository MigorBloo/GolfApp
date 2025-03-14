import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScoreTracker.css';

const API_BASE_URL = 'http://localhost:8001';

function ScoreTracker() {
    const [scoreData, setScoreData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScoreData = async () => {
            try {
                console.log('Fetching score tracker data...');
                const response = await axios.get(`${API_BASE_URL}/api/scoretracker/entries`);
                console.log('Score tracker data received:', response.data);
                setScoreData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading score tracker data:', error);
                console.error('Error details:', error);
                setLoading(false);
            }
        };
    
        fetchScoreData();
    }, []);  

    if (loading) return <div className="score-tracker-container">Loading...</div>;

    return (
        <div className="score-tracker-container">
            <h2>Score Tracker</h2>
            <div className="score-tracker-table-wrapper">
                {console.log('Current scoreData state:', scoreData)}
                <table className="score-tracker-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Selection</th>
                            <th>Result</th>
                            <th>Earnings</th>
                            <th>Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scoreData && scoreData.length > 0 ? (
                            scoreData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.tournament_id || '-'}</td>
                                    <td>{row.player_name || '-'}</td>
                                    <td>{row.result || '-'}</td>
                                    <td>{row.earnings ? `$${row.earnings.toLocaleString()}` : '-'}</td>
                                    <td>{row.winner || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );   
}

export default ScoreTracker;