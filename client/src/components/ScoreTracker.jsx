import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScoreTracker.css';

function ScoreTracker() {
    const [scoreData, setScoreData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScoreData = async () => {
            try {
                console.log('Fetching score tracker data...'); // Log start of fetch
                const response = await axios.get('/api/scoretracker');
                console.log('Raw response:', response); // Log full response
                console.log('Score tracker data:', response.data); // Log just the data
                setScoreData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error details:', error); // More detailed error
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
                {console.log('Current scoreData state:', scoreData)} {/* Log current state */}
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
                                    <td>{row.Event || '-'}</td>
                                    <td>{row['Player Selection'] || '-'}</td>
                                    <td>{row.Result || '-'}</td>
                                    <td>{row.PrizeMoney ? `$${row.PrizeMoney.toLocaleString()}` : '-'}</td>
                                    <td>{row.Winner || '-'}</td>
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