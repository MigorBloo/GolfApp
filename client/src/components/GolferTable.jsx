import React, { useState, useEffect } from 'react';
import './GolferTable.css';

function GolferTable({ golfers, eventInfo, sortOption, onSortChange }) {
    const [timeUntilLock, setTimeUntilLock] = useState('');
    const [isWithin24Hours, setIsWithin24Hours] = useState(false);
    const [selectedGolfer, setSelectedGolfer] = useState(null);

    // Format the date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    };

    // Format player name from "Last, First" to "First Last"
    const formatPlayerName = (name) => {
        const [lastName, firstName] = name.split(', ');
        return `${firstName} ${lastName}`;
    };

    // Set event date and start time
    const eventDate = "2025-03-13";
    const startTime = "7:00 AM EST";

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const eventDateTime = new Date(`${eventDate} ${startTime}`);
            const now = new Date();
            const timeDiff = eventDateTime - now;

            if (timeDiff <= 0) {
                setTimeUntilLock('Event has started');
                setIsWithin24Hours(true);
                return;
            }

            // Calculate total hours remaining
            const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
            setIsWithin24Hours(hoursRemaining <= 24);

            if (hoursRemaining > 24) {
                // If more than 24 hours, show days
                const days = Math.floor(hoursRemaining / 24);
                setTimeUntilLock(`${days} ${days === 1 ? 'day' : 'days'}`);
            } else {
                // If less than 24 hours, show hours, minutes, seconds
                const hours = hoursRemaining;
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                setTimeUntilLock(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        // Update every second when within 24 hours, otherwise update every minute
        const timer = setInterval(
            calculateTimeRemaining,
            isWithin24Hours ? 1000 : 60000
        );
        
        calculateTimeRemaining(); // Initial calculation

        return () => clearInterval(timer);
    }, [eventDate, startTime, isWithin24Hours]);

    const handleGolferSelection = (golferName) => {
        // If clicking the same golfer, deselect it
        if (selectedGolfer === golferName) {
            setSelectedGolfer(null);
        } else {
            // If clicking a different golfer, select it (automatically deselects previous)
            setSelectedGolfer(golferName);
        }
    };

    return (
        <div className="golfer-table-container">
            {/* Event Header Section */}
            <div className="event-header">
                <h2 className="event-name">{eventInfo.event_name}</h2>
                <div className="course-container">
                    <h3 className="course-name">{eventInfo.course}</h3>
                </div>
                <div className="tournament-info">
                    <div className="info-item">
                        <span className="info-label">Date</span>
                        <span className="info-value">{formatDate(eventDate)}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Start Time</span>
                        <span className="info-value">{startTime}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Time till Lock</span>
                        <span className={`info-value countdown ${isWithin24Hours ? 'red' : 'green'}`}>
                            {timeUntilLock}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Field Section */}
            <div className="field-section">
                <h3 className="field-heading">Tournament Field</h3>
                <div className="sort-container">
                    <label htmlFor="sort">Sort By: </label>
                    <select 
                        id="sort"
                        value={sortOption}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="sort-select"
                    >
                        <option value="dkSalary">DraftKings Salary (High to Low)</option>
                        <option value="fdSalary">FanDuel Salary (High to Low)</option>
                    </select>
                </div>
            </div>

            {/* Golfers Table */}
            <table className="golfer-table">
                <thead>
                    <tr>
                        <th style={{ fontSize: '0.75rem', padding: '5px 3px' }}>Player</th>
                        <th style={{ fontSize: '0.75rem', padding: '5px 3px' }}>Country</th>
                        <th style={{ fontSize: '0.75rem', padding: '5px 3px' }}>DK Salary</th>
                        <th style={{ fontSize: '0.75rem', padding: '5px 3px' }}>FD Salary</th>
                        <th style={{ fontSize: '0.75rem', padding: '5px 3px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {golfers.map((golfer, index) => {
                        const golferName = formatPlayerName(golfer.name);
                        const isSelected = selectedGolfer === golferName;
                        
                        return (
                            <tr 
                                key={index}
                                className={isSelected ? 'selected-row' : ''}
                                onClick={() => handleGolferSelection(golferName)}
                            >
                                <td title={golferName}>{golferName}</td>
                                <td title={golfer.country}>{golfer.country}</td>
                                <td title={golfer.dkSalary.toLocaleString()}>${golfer.dkSalary.toLocaleString()}</td>
                                <td title={golfer.fdSalary.toLocaleString()}>${golfer.fdSalary.toLocaleString()}</td>
                                <td 
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleGolferSelection(golferName)}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default GolferTable;