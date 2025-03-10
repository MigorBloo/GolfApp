import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Schedule.css';

function Schedule({ selectedGolfer }) {
    const [schedule, setSchedule] = useState([]);
    const [selections, setSelections] = useState({});
    const [tempSelection, setTempSelection] = useState(null);
    const [activeBoxId, setActiveBoxId] = useState(null);

    // Load schedule data from Excel
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const response = await axios.get('/api/schedule');
                console.log('Tournament data with all properties:', Object.keys(response.data[0]));
                console.log('First tournament full data:', response.data[0]);
                const scheduleData = Array.isArray(response.data) ? response.data : [];
                const scheduleWithIds = scheduleData.map((tournament, index) => ({
                    ...tournament,
                    id: tournament.id || index + 1
                }));
                setSchedule(scheduleWithIds);
            } catch (error) {
                console.error('Error fetching schedule:', error);
                setSchedule([]);
            }
        };
        fetchSchedule();
    }, []);

    // Handle selected golfer from GolferTable
    useEffect(() => {
        if (selectedGolfer && schedule.length > 0) {
            setTempSelection(selectedGolfer);
            setActiveBoxId(schedule[0]?.id);
        }
    }, [selectedGolfer, schedule]);

    const handleInputChange = (tournamentId, value) => {
        if (!selections[tournamentId]) {
            setTempSelection(value);
            setActiveBoxId(tournamentId);
        }
    };

    const handleConfirmSelection = (tournamentId) => {
        if (tempSelection) {
            setSelections(prev => ({
                ...prev,
                [tournamentId]: tempSelection
            }));
            setTempSelection(null);
            setActiveBoxId(null);
        }
    };

    const handleCancelSelection = () => {
        setTempSelection(null);
        setActiveBoxId(null);
    };

    if (schedule.length === 0) {
        return <div className="schedule-container">Loading schedule...</div>;
    }

    return (
        <div className="schedule-container">
            <h1>Tournament Selection</h1>
            <div className="schedule-list">
                {schedule.map((tournament, index) => (
                    <div key={tournament.id} className="schedule-item">
                        <div className="tournament-info">
                            <div className="event-date">
                                {tournament.StartDate ? new Date(tournament.StartDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                }) : ''}
                            </div>
                            <div className="event-schedule">
                                {tournament.event || tournament.Event || tournament.TOURNAMENT || tournament.name || tournament.Name}
                            </div>
                            <div className="event-purse">${tournament.purse || tournament.Purse?.toLocaleString()}</div>
                            <div className="event-details">
                                <span>{tournament.course || tournament.Course}</span>
                                <span>{tournament.location || tournament.Location}</span>
                            </div>
                        </div>
                        <div className="selection-container">
                            <input
                                type="text"
                                className="selection-input"
                                placeholder="Enter selection..."
                                value={
                                    activeBoxId === tournament.id && index === 0
                                        ? tempSelection || ''
                                        : selections[tournament.id] || ''
                                }
                                onChange={(e) => handleInputChange(tournament.id, e.target.value)}
                                readOnly={!!selections[tournament.id]}
                            />
                            {activeBoxId === tournament.id && index === 0 && tempSelection && (
                                <>
                                    <button 
                                        className="action-button confirm-button"
                                        onClick={() => handleConfirmSelection(tournament.id)}
                                        title="Confirm selection"
                                    >
                                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                        </svg>
                                    </button>
                                    <button 
                                        className="action-button cancel-button"
                                        onClick={handleCancelSelection}
                                        title="Cancel selection"
                                    >
                                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Schedule;