import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Snapshot.css';

const Snapshot = ({ username, profileImage }) => {
    const [snapshotData, setSnapshotData] = useState([
        { label: 'Current Ranking', value: null },
        { label: 'Earnings', value: null },
        { label: 'Behind Leader', value: null },
        { label: 'Winners', value: null },
        { label: 'Top10s', value: null }
    ]);

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching leaderboard data for snapshot...');
                const response = await axios.get('/api/leaderboard');
                console.log('Received leaderboard data:', response.data);

                // Find the current user's data
                const userData = response.data.find(row => row.username === username);
                if (!userData) {
                    console.error('User data not found in leaderboard');
                    return;
                }

                // Get the leader's earnings (first row)
                const leaderEarnings = response.data[0].earnings;
                const behindLeader = leaderEarnings - userData.earnings;
                
                const newData = [
                    { label: 'Current Ranking', value: userData.rank },
                    { label: 'Earnings', value: formatCurrency(userData.earnings) },
                    { 
                        label: 'Behind Leader', 
                        value: formatCurrency(behindLeader),
                        className: behindLeader > 0 ? 'behind-leader' : 'ahead-or-tied'
                    },
                    { label: 'Winners', value: userData.winners },
                    { label: 'Top10s', value: userData.top10s }
                ];

                console.log('Formatted snapshot data:', newData);
                setSnapshotData(newData);
            } catch (err) {
                console.error('Error fetching data:', err);
                // Set default values on error
                setSnapshotData([
                    { label: 'Current Ranking', value: 0 },
                    { label: 'Earnings', value: formatCurrency(0) },
                    { label: 'Behind Leader', value: formatCurrency(0) },
                    { label: 'Winners', value: 0 },
                    { label: 'Top10s', value: 0 }
                ]);
            }
        };

        fetchData();
    }, [username]);

    return (
        <div className="snapshot">
            <div className="snapshot-header">
                <h2>{username}</h2>
                <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="profile-image"
                />
            </div>
            <table className="snapshot-table">
                <tbody>
                    {snapshotData.map((row, index) => (
                        <tr key={index}>
                            <td className="label-cell">{row.label}</td>
                            <td className={`value-cell ${row.className || ''}`}>{row.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Snapshot;