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
                console.log('Fetching snapshot data...');
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8001/api/snapshot', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('Received snapshot data:', response.data);
                
                const formatCurrency = (value) => {
                    return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(value);
                };

                const newData = [
                    { label: 'Current Ranking', value: response.data.current_ranking || 0 },
                    { label: 'Earnings', value: formatCurrency(response.data.earnings) },
                    { 
                        label: 'Behind Leader', 
                        value: formatCurrency(response.data.behind_leader),
                        className: response.data.behind_leader > 0 ? 'behind-leader' : 'ahead-or-tied'
                    },
                    { label: 'Winners', value: response.data.winners || 0 },
                    { label: 'Top10s', value: response.data.top10s || 0 }
                ];

                console.log('Formatted snapshot data:', newData);
                setSnapshotData(newData);
            } catch (err) {
                console.error('Error fetching snapshot:', err);
            }
        };

        fetchSnapshotData();
    }, []);

    console.log('Current snapshot data state:', snapshotData);

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