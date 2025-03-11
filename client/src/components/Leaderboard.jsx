import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const response = await axios.get('/api/leaderboard');
                setLeaderboardData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching leaderboard data:', error);
                setLoading(false);
            }
        };

        fetchLeaderboardData();
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
                            <th>Team</th>
                            <th>Earnings</th>
                            <th>Winners</th>
                            <th>Top 10s</th>  
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.map((row, index) => (
                            <tr key={index}>
                                <td>{row.Rank || '-'}</td>
                                <td>{row['Total Prize Money'] ? 
                                    `$${row['Total Prize Money'].toLocaleString()}` : '-'}</td>
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