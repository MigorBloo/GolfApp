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

    useEffect(() => {
        const fetchSnapshotData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8001/api/snapshot', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                setSnapshotData([
                    { label: 'Current Ranking', value: response.data.current_ranking || null },
                    { label: 'Earnings', value: response.data.earnings || null },
                    { label: 'Behind Leader', value: response.data.behind_leader || null },
                    { label: 'Winners', value: response.data.winners || null },
                    { label: 'Top10s', value: response.data.top10s || null }
                ]);
            } catch (err) {
                console.error('Error fetching snapshot:', err);
            }
        };

        fetchSnapshotData();
    }, []);

    return (
        <div className="snapshot-container">
            <h2>{username}</h2>
            <div className="profile-image-container">
                <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="profile-image"
                    onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = '/GolfBall.png';
                    }}
                />
            </div>
            <table className="snapshot-table">
                <tbody>
                    {snapshotData.map((row, index) => (
                        <tr key={index}>
                            <td className="label-cell">{row.label}</td>
                            <td className="value-cell">{row.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Snapshot;