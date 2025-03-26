import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Snapshot.css';

const Snapshot = () => {
    const [snapshot, setSnapshot] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSnapshot = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/snapshot`);
                setSnapshot(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching snapshot:', err);
                setError('Failed to load snapshot data');
                setLoading(false);
            }
        };

        fetchSnapshot();
    }, []);

    if (loading) return <div>Loading snapshot...</div>;
    if (error) return <div>Error: {error}</div>;
    if (snapshot.length === 0) return <div>No current tournament data available</div>;

    const currentEvent = snapshot[0]?.event || 'Current Tournament';

    return (
        <div className="snapshot-container">
            <h2>{currentEvent} - Current Standings</h2>
            <div className="snapshot-table-container">
                <table className="snapshot-table">
                    <thead>
                        <tr>
                            <th>Position</th>
                            <th>Player</th>
                            <th>Selection</th>
                            <th>Result</th>
                            <th>Earnings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {snapshot.map((entry, index) => (
                            <tr key={index} className={index === 0 ? 'leader' : ''}>
                                <td>{index + 1}</td>
                                <td>{entry.username}</td>
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
                </table>
            </div>
        </div>
    );
};

export default Snapshot;