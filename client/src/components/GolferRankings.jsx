import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GolferRankings.css';

function GolferRankings({ usedGolfers = [] }) {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('OWGR');

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/rankings');
                if (response.data && response.data.rankings) {
                    setRankings(response.data.rankings);
                } else {
                    throw new Error('Invalid rankings data format');
                }
            } catch (error) {
                console.error('Error fetching rankings:', error);
                setError('Failed to load rankings');
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, []);

    // Check if a player is in the usedGolfers array
    const isPlayerUsed = (playerName) => {
        return usedGolfers.some(usedGolfer => 
            usedGolfer && playerName && 
            usedGolfer.toLowerCase() === playerName.toLowerCase()
        );
    };

    // Format availability as percentage
    const formatAvailability = (player) => {
        // If player is in usedGolfers array, return 0%
        if (isPlayerUsed(player.Player)) {
            return '0%';
        }
        
        // Otherwise use the original formatting logic
        const value = player.Availability;
        if (typeof value === 'number' && value <= 1) {
            return `${Math.round(value * 100)}%`;
        } else if (typeof value === 'number') {
            return `${value}%`;
        } else if (typeof value === 'string') {
            if (value.includes('%')) return value;
            
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num <= 1) {
                    return `${Math.round(num * 100)}%`;
                } else {
                    return `${num}%`;
                }
            }
            return `${value}%`;
        }
        return value ? `${value}%` : '0%';
    };

    // Filter rankings based on search query
    const filteredRankings = rankings.filter(player => 
        player.Player.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort rankings based on selected column
    const sortedRankings = [...filteredRankings].sort((a, b) => {
        if (sortBy === 'OWGR') {
            return parseInt(a.OWGR) - parseInt(b.OWGR);
        } else if (sortBy === 'Player') {
            return a.Player.localeCompare(b.Player);
        } else if (sortBy === 'Tour') {
            return a.Tour.localeCompare(b.Tour);
        } else if (sortBy === 'Availability') {
            // Extract numeric values for comparison
            const aValue = parseFloat(a.Availability.replace('%', ''));
            const bValue = parseFloat(b.Availability.replace('%', ''));
            return bValue - aValue; // Sort high to low
        }
        return 0;
    });

    if (loading) return <div className="rankings-container"><p>Loading rankings...</p></div>;
    if (error) return <div className="rankings-container"><p>Error: {error}</p></div>;

    return (
        <div className="rankings-container">
            <h3>World Golf Rankings (Top 200)</h3>
            
            <div className="rankings-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by player name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <div className="sort-box">
                    <label htmlFor="sort-select">Sort by: </label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="OWGR">OWGR</option>
                        <option value="Player">Player</option>
                        <option value="Tour">Tour</option>
                        <option value="Availability">Availability</option>
                    </select>
                </div>
            </div>
            
            <div className="rankings-table-wrapper">
                <table className="rankings-table">
                    <thead>
                        <tr>
                            <th>OWGR</th>
                            <th>Player</th>
                            <th>Country</th>
                            <th>Tour</th>
                            <th>Availability</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRankings.map((player, index) => {
                            const isUsed = isPlayerUsed(player.Player);
                            return (
                                <tr key={index} className={isUsed ? 'used-golfer' : ''}>
                                    <td title={player.OWGR}>{player.OWGR}</td>
                                    <td title={player.Player}>{player.Player}</td>
                                    <td title={player.Country}>{player.Country}</td>
                                    <td title={player.Tour}>{player.Tour}</td>
                                    <td title={formatAvailability(player)}>
                                        {formatAvailability(player)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default GolferRankings;