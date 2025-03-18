import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScoreTracker.css';

const ScoreTracker = () => {
    const [scoreData, setScoreData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalEarnings, setTotalEarnings] = useState(0);

    useEffect(() => {
        const fetchScoreData = async () => {
            try {
                // Fetch score tracker data
                console.log('Fetching score tracker entries...');
                const scoreResponse = await axios.get('/api/scoretracker/entries');
                console.log('Score tracker response:', scoreResponse.data);
                
                // Fetch locked selections
                console.log('Fetching selections...');
                const selectionsResponse = await axios.get('/api/selections');
                console.log('Selections response:', selectionsResponse.data);
                
                const lockedSelections = selectionsResponse.data.filter(s => s.is_locked);
                console.log('Locked selections:', lockedSelections);
                
                // Update score data with locked selections
                const updatedScoreData = scoreResponse.data.map(score => {
                    const lockedSelection = lockedSelections.find(s => s.event === score.event);
                    console.log(`Processing event: ${score.event}`, {
                        scoreEntry: score,
                        matchingSelection: lockedSelection
                    });
                    
                    return {
                        ...score,
                        // Use the selection from score_tracker if it exists, otherwise use the locked selection
                        selection: score.selection || (lockedSelection ? lockedSelection.player_name : null)
                    };
                });

                console.log('Final updated score data:', updatedScoreData);
                setScoreData(updatedScoreData);
                
                // Calculate total earnings
                const total = updatedScoreData.reduce((sum, entry) => {
                    const earnings = entry.earnings ? parseFloat(entry.earnings.replace(/[^0-9.-]+/g, '')) : 0;
                    return sum + earnings;
                }, 0);
                setTotalEarnings(total);
                
                setError(null);
            } catch (err) {
                console.error('Error loading score tracker data:', err);
                setError('Failed to load score tracker data');
            } finally {
                setLoading(false);
            }
        };

        fetchScoreData();
        const interval = setInterval(fetchScoreData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="score-tracker-container">
            <h2>Score Tracker</h2>
            <div className="score-tracker-table-container">
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
                        {scoreData.map((entry, index) => (
                            <tr key={index}>
                                <td>{entry.event}</td>
                                <td>{entry.selection || '-'}</td>
                                <td>{entry.result || '-'}</td>
                                <td>{entry.earnings ? `$${entry.earnings.toLocaleString()}` : '-'}</td>
                                <td>{entry.winner ? '✓' : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="total-earnings-row">
                <table className="score-tracker-table">
                    <tbody>
                        <tr>
                            <td>Total Earnings</td>
                            <td></td>
                            <td></td>
                            <td>${totalEarnings.toLocaleString()}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScoreTracker;