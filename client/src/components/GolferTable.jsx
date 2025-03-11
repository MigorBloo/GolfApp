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

    // Update these constants at the top of your component
    const eventDate = "2025-03-13";
    const startTime = "7:00 AM EST";

    useEffect(() => {
        const calculateTimeRemaining = () => {
            // Parse the event date and time
            const [year, month, day] = eventDate.split('-');
            const [timeStr, period] = startTime.split(' ');
            const [hourStr, minuteStr] = timeStr.split(':');
            
            // Create event date object
            const eventDateTime = new Date(year, month - 1, day);
            
            // Set the time
            let eventHour = parseInt(hourStr);
            if (period === 'PM' && eventHour !== 12) eventHour += 12;
            if (period === 'AM' && eventHour === 12) eventHour = 0;
            
            eventDateTime.setHours(eventHour, parseInt(minuteStr), 0);
            
            // Get current time
            const now = new Date();
            const timeDiff = eventDateTime - now;

            if (timeDiff <= 0) {
                setTimeUntilLock('Event has started');
                setIsWithin24Hours(true);
                return;
            }

            // Calculate days and hours
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            // Set within 24 hours flag
            setIsWithin24Hours(days === 0 && hours < 24);

            // Set the display text with appropriate class
            const countdownClass = isWithin24Hours ? 'countdown-red' : 'countdown-green';
            if (days > 0) {
                setTimeUntilLock(
                    <span className={countdownClass}>
                        {`${days} ${days === 1 ? 'day' : 'days'}`}
                    </span>
                );
            } else {
                setTimeUntilLock(
                    <span className={countdownClass}>
                        {`${hours}h ${minutes}m`}
                    </span>
                );
            }
        };

        // Calculate immediately and set up interval
        calculateTimeRemaining();
        const timer = setInterval(calculateTimeRemaining, 60000); // Update every minute

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