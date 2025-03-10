import React, { useState, useEffect } from 'react';
import './GolferTable.css';
import ThisWeekTitle from './ThisWeekTitle';
import '../components/EventInfo.css';

function GolferTable({ golfers, eventInfo, sortOption, onSortChange, onGolferSelect }) {
    const [timeUntilLock, setTimeUntilLock] = useState('');
    const [isWithin24Hours, setIsWithin24Hours] = useState(false);
    const [selectedGolfer, setSelectedGolfer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleGolferSelection = (golfer) => {
        const playerName = formatPlayerName(golfer.name);
        if (selectedGolfer === playerName) {
            setSelectedGolfer(null);
            onGolferSelect(null);
        } else {
            setSelectedGolfer(playerName);
            onGolferSelect(playerName);
        }
    };

    const filteredGolfers = golfers.filter(golfer => 
        formatPlayerName(golfer.name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="golfer-table-container">
            <ThisWeekTitle />
            <div className="event-header">
                <h2 className="event-name">{eventInfo.event_name}</h2>
                <div className="course-container">
                    <h3 className="course-name">{eventInfo.course}</h3>
                </div>
                <div className="event-timing">
                    <div className="info-item">
                        <div className="label">Event Date</div>
                        <div className="value">{formatDate(eventDate)}</div>
                    </div>
                    <div className="info-item">
                        <div className="label">Start Time</div>
                        <div className="value">{startTime}</div>
                    </div>
                    <div className="info-item">
                        <div className="label">Time till Lock</div>
                        <div className="value">{timeUntilLock}</div>
                    </div>
                </div>
            </div>
            
            {/* Field Section */}
            <div className="field-section">
                <h3 className="field-heading">Tournament Field</h3>

                <div className="search-container">
                     <input
                     type="text"
                    placeholder="Search player..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                   />
               </div>
               
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
                    {filteredGolfers.map((golfer, index) => {
                        const golferName = formatPlayerName(golfer.name);
                        const isSelected = selectedGolfer === golferName;
                        
                        return (
                            <tr 
                                key={index}
                                className={isSelected ? 'selected-row' : ''}
                                onClick={() => handleGolferSelection(golfer)}
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
                                        onChange={() => handleGolferSelection(golfer)}
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