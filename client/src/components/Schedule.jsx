import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Schedule.css';

function Schedule() {
    const [schedule, setSchedule] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selections, setSelections] = useState({});  // New state for selections

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/schedule');
                if (response.data && response.data.schedule) {
                    const formattedSchedule = response.data.schedule.map(event => ({
                        ...event,
                        StartDate: new Date(event.StartDate).toDateString()
                    }));
                    setSchedule(formattedSchedule);
                    
                    // Initialize selections object with empty strings
                    const initialSelections = {};
                    formattedSchedule.forEach(event => {
                        initialSelections[event.Event] = '';
                    });
                    setSelections(initialSelections);
                } else {
                    throw new Error('Invalid schedule data format');
                }
            } catch (error) {
                console.error('Error fetching schedule:', error);
                setError('Failed to load schedule');
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    const handleSelectionChange = (event, tournamentName) => {
        setSelections(prev => ({
            ...prev,
            [tournamentName]: event.target.value
        }));
    };

    if (loading) return <div>Loading schedule...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="schedule-container">
            <h2>Tournament Selections</h2>
            <div className="schedule-list">
                {schedule.map((event, index) => (
                    <div key={index} className="schedule-item">
                        <div className="event-date">{event.StartDate}</div>
                        <div className="event-name">{event.Event}</div>
                        <div className="event-purse">${event.Purse.toLocaleString()}</div>
                        <input
                            type="text"
                            className="selection-input"
                            placeholder="Selection"
                            value={selections[event.Event] || ''}
                            onChange={(e) => handleSelectionChange(e, event.Event)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Schedule;