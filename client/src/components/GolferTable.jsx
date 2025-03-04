import React from 'react';
import './GolferTable.css';

function GolferTable({ golfers, eventInfo, sortOption, onSortChange }) {  // Add these two props
    // Format the date and time
    const eventDate = new Date().toLocaleDateString();
    const startTime = "12:00 PM EST";
    const timeTillLock = "2h 30m";

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
                        <span className="info-value">{eventDate}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Start Time</span>
                        <span className="info-value">{startTime}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Time till Lock</span>
                        <span className="info-value">{timeTillLock}</span>
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
                        <th>Name</th>
                        <th>Country</th>
                        <th>DK Salary</th>
                        <th>FD Salary</th>
                    </tr>
                </thead>
                <tbody>
                    {golfers.map((golfer, index) => (
                        <tr key={index}>
                            <td>{golfer.name}</td>
                            <td>{golfer.country}</td>
                            <td>${golfer.dkSalary.toLocaleString()}</td>
                            <td>${golfer.fdSalary.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default GolferTable;