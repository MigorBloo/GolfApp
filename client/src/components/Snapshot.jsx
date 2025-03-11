import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Snapshot.css';

function Snapshot() {
    const [snapshotData, setSnapshotData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSnapshotData = async () => {
            try {
                const response = await axios.get('/api/snapshot');
                setSnapshotData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching snapshot data:', error);
                setLoading(false);
            }
        };

        fetchSnapshotData();
    }, []);

    if (loading) return <div className="snapshot-container">Loading...</div>;

    return (
        <div className="snapshot-container">
            <h2>Snapshot</h2>
            <table className="snapshot-table">
                <tbody>
                    <tr>
                        <td className="snapshot-label">Current Ranking</td>
                        <td className="snapshot-value">{snapshotData[0]?.['Current Ranking'] || '-'}</td>
                    </tr>
                    <tr>
                        <td className="snapshot-label">Earnings</td>
                        <td className="snapshot-value">{snapshotData[0]?.Earnings || '-'}</td>
                    </tr>
                    <tr>
                        <td className="snapshot-label">Behind Leader</td>
                        <td className="snapshot-value">{snapshotData[0]?.['Behind Leader'] || '-'}</td>
                    </tr>
                    <tr>
                        <td className="snapshot-label">Winners</td>
                        <td className="snapshot-value">{snapshotData[0]?.Winners || '-'}</td>
                    </tr>
                    <tr>
                        <td className="snapshot-label">Top 10s</td>
                        <td className="snapshot-value">{snapshotData[0]?.Top10s || '-'}</td>
                    </tr>
                    <tr>
                        <td className="snapshot-label">Stinkers</td>
                        <td className="snapshot-value">{snapshotData[0]?.Stinkers || '-'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default Snapshot;