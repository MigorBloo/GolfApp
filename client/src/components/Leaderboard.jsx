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
                console.log('Received leaderboard data:', leaderboardResponse.data);
                setLeaderboardData(leaderboardResponse.data);
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
                                <td>{row.rank}</td>
                                <td>{row.username || '-'}</td>
                                <td className="earnings">
                                    {row.earnings ? 
                                        `$${Number(row.earnings).toLocaleString()}` : '-'}
                                </td>
                                <td>{row.winners || '-'}</td>
                                <td>{row.top10s || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Leaderboard;