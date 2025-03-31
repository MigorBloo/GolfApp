import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ScoreTracker.css';

const ScoreTracker = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [updateStatus, setUpdateStatus] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // First update the weekly results
                await updateWeeklyResults();
                
                // Then fetch the updated score tracker entries
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/scoretracker/entries`);
                setEntries(response.data);

                // Calculate total earnings
                const total = response.data.reduce((sum, entry) => {
                    const earnings = entry.earnings ? Number(entry.earnings) : 0;
                    return sum + earnings;
                }, 0);
                setTotalEarnings(total);
                
                setLoading(false);
            } catch (err) {
                console.error('Error fetching score tracker data:', err);
                setError('Failed to load score tracker data');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const updateWeeklyResults = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            setUpdateStatus('Updating results...');
            const response = await axios.post('/api/scoretracker/update-results', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUpdateStatus('Results updated successfully!');
            await fetchData(); // Refresh the data
        } catch (err) {
            console.error('Error updating weekly results:', err);
            setUpdateStatus(err.response?.data?.details || 'Failed to update results. Please check the server logs.');
        }
    };

    if (loading) return <div>Loading score tracker...</div>;
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
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id}>
                                <td>{entry.event}</td>
                                <td>{entry.selection}</td>
                                <td style={{ color: entry.result === 'MC' ? 'red' : 'inherit' }}>
                                    {entry.result || ''}
                                </td>
                                <td className={
                                    entry.earnings > 0 ? 'positive-earnings' : 
                                    (entry.earnings === 0 || entry.result === 'MC') ? 'zero-earnings' : ''
                                }>
                                    {entry.earnings !== null ? `$${Number(entry.earnings).toLocaleString()}` : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td>Total Earnings</td>
                            <td></td>
                            <td></td>
                            <td>
                                ${Number(totalEarnings).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ScoreTracker;