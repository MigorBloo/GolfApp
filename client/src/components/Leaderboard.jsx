import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch leaderboard data
                const leaderboardResponse = await axios.get('/api/leaderboard');
                // Sort the data by earnings in descending order
                const sortedData = leaderboardResponse.data.sort((a, b) => 
                    (b['Total Prize Money'] || 0) - (a['Total Prize Money'] || 0)
                );
                // Add rank based on sorted position
                const rankedData = sortedData.map((row, index) => ({
                    ...row,
                    Rank: index + 1
                }));
                setLeaderboardData(rankedData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="leaderboard-container">Loading...</div>;

    return (
        <div className="leaderboard-container">
            <h2>Leaderboard</h2>
            <div className="leaderboard-table-wrapper">
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Earnings</th>
                            <th>Winners</th>
                            <th>Top 10s</th>  
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.map((row, index) => (
                            <tr key={index} className={index === 0 ? 'leader' : ''}>
                                <td>{row.Rank}</td>
                                <td>{row.username || '-'}</td>
                                <td className="earnings">
                                    {row['Total Prize Money'] ? 
                                        `$${row['Total Prize Money'].toLocaleString()}` : '-'}
                                </td>
                                <td>{row.Winners || '-'}</td>
                                <td>{row.Top10s || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Leaderboard;