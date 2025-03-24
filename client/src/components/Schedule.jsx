import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Schedule.css';

// Add this utility function
const getNextThursdayDate = () => {
    const today = new Date();
    const thursday = new Date(today);
    thursday.setDate(today.getDate() + ((4 + 7 - today.getDay()) % 7));
    thursday.setHours(0, 0, 0, 0);
    return thursday;
};

const Schedule = ({ selectedGolfer, golfers, rankedGolfers: propRankedGolfers, isLocked, usedGolfers }) => {
    const [schedule, setSchedule] = useState([]);
    const [selections, setSelections] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSelection, setTempSelection] = useState(null);
    const [activeBoxId, setActiveBoxId] = useState(null);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);
    const [activeSchedule, setActiveSchedule] = useState([]);
    const [nextTournamentDate, setNextTournamentDate] = useState(getNextThursdayDate());
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching schedule data...');
                const scheduleResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/schedule`);
                console.log('Schedule response:', scheduleResponse.data);
                const scheduleData = scheduleResponse.data;
                const scheduleWithIds = scheduleData.map((tournament, index) => ({
                    ...tournament,
                    id: tournament.id || index + 1
                }));
                setSchedule(scheduleWithIds);
                setLoading(false);
                updateActiveSchedule(scheduleWithIds);

                // Refresh selections after schedule is loaded
                console.log('Refreshing selections...');
                const selectionsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/selections`);
                console.log('Received selections:', selectionsResponse.data);
                
                const savedSelections = selectionsResponse.data.reduce((acc, selection) => {
                    acc[selection.event] = selection.selection;
                    return acc;
                }, {});
                console.log('Processed selections:', savedSelections);
                setSelections(savedSelections);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data');
                setLoading(false);
                setSchedule([]);
                setActiveSchedule([]);
            }
        };

        fetchData();
    }, []);

    // Handle selected golfer updates
    useEffect(() => {
        if (selectedGolfer && activeSchedule.length > 0) {
            console.log('Selected golfer update:', {
                golfer: selectedGolfer,
                firstTournament: activeSchedule[0]
            });
            setTempSelection(selectedGolfer);
            setActiveBoxId(activeSchedule[0]?.id);
        }
    }, [selectedGolfer, activeSchedule]);

    const isGolferUsed = (golferName) => {
        return usedGolfers.some(usedGolfer => 
            usedGolfer && golferName && 
            usedGolfer.toLowerCase() === golferName.toLowerCase()
        );
    };

    const getSuggestions = (input, index) => {
        if (!input) return [];
        const inputValue = input.toLowerCase();
    
        // For the first box (index 0), don't show suggestions as it's controlled by GolferTable
        if (index === 0) return [];
    
        // Use ranked golfers for autocomplete for all other boxes
        const golferNames = Array.isArray(propRankedGolfers) 
            ? propRankedGolfers.map(golfer => {
                if (!golfer) return null;
                
                const name = golfer.Player || golfer.player || golfer.Name || golfer.name;
                if (!name) return null;
    
                // If name is already in "First Last" format
                if (!name.includes(',')) return name;
    
                // If name is in "Last, First" format
                const [lastName, firstName] = name.split(', ');
                return `${firstName} ${lastName}`;
            })
            .filter(Boolean) // Remove null values
            .filter(name => !isGolferUsed(name)) // Filter out used golfers from suggestions
            : [];
    
        return golferNames
            .filter(name => name.toLowerCase().includes(inputValue))
            .slice(0, 5); // Limit to 5 suggestions
    };
    
    // Handle suggestion click function
    const handleSuggestionClick = (suggestion, tournamentId) => {
        setTempSelection(suggestion);
        setActiveBoxId(tournamentId);
        setSuggestions([]);
        setActiveSuggestionBox(null);
    };

    const handleInputChange = (tournamentId, value, index) => {
        setTempSelection(value);
        setActiveBoxId(tournamentId);

        // Only show suggestions for boxes after the first one
        if (index > 0) {
            const newSuggestions = getSuggestions(value, index);
            setSuggestions(newSuggestions);
            setActiveSuggestionBox(tournamentId);
        }
    };

    const handleConfirmSelection = async (tournament, index) => {
        try {
            const eventName = tournament.Event || tournament.event;
            const tournamentDate = new Date(tournament.StartDate);
            const now = new Date();
            const isLocked = tournamentDate <= now;
            
            console.log('Confirming selection:', {
                event: eventName,
                playerName: tempSelection,
                isLocked: isLocked,
                index: index
            });

            const response = await axios.post('/api/selections/save', {
                event: eventName,
                playerName: tempSelection,
                isLocked: isLocked
            });

            console.log('Save response:', response.data);
            
            // Update local state
            setSelections(prev => ({
                ...prev,
                [eventName]: tempSelection
            }));
            
            // Clear temporary states
            setTempSelection(null);
            setActiveBoxId(null);
            setSuggestions([]);
            setActiveSuggestionBox(null);
        } catch (error) {
            console.error('Error saving selection:', error);
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert('Failed to save selection');
            }
        }
    };

    const handleCancelSelection = () => {
        setTempSelection(null);
        setActiveBoxId(null);
        setSuggestions([]);
        setActiveSuggestionBox(null);
        setErrorMessage('');
    };

    const renderSelectionInput = (tournament, index) => {
        const isFirstTournament = index === 0;
        const tournamentDate = new Date(tournament.StartDate);
        const now = new Date();
        const isLocked = tournamentDate <= now;
        const eventName = tournament.Event || tournament.event;
        const currentValue = activeBoxId === tournament.id
            ? tempSelection || ''
            : selections[eventName] || '';
    
        return (
            <div className={`selection-container ${isLocked ? 'locked' : ''}`}>
                <div className="selection-input-wrapper">
                    <input
                        type="text"
                        className={`selection-input ${errorMessage && activeBoxId === tournament.id ? 'error' : ''}`}
                        placeholder={isLocked ? "Locked" : "Enter selection..."}
                        value={currentValue}
                        onChange={(e) => handleInputChange(tournament.id, e.target.value, index)}
                        disabled={isLocked}
                    />
                    {activeSuggestionBox === tournament.id && suggestions.length > 0 && !isLocked && (
                        <div className="suggestions-dropdown">
                            {suggestions.map((suggestion, i) => (
                                <div
                                    key={i}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(suggestion, tournament.id)}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {activeBoxId === tournament.id && !isLocked && (
                    <>
                        <div className="action-buttons">
                            <button 
                                className="action-button confirm-button"
                                onClick={() => handleConfirmSelection(tournament, index)}
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
                        </div>
                        {errorMessage && (
                            <div className="error-message">
                                {errorMessage}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    // Function to filter and rotate tournaments based on current date
    const updateActiveSchedule = (fullSchedule) => {
        const now = new Date();
        console.log('Updating active schedule. Current date:', now);
        
        // Filter out past tournaments and sort remaining ones
        const upcomingTournaments = fullSchedule.filter(tournament => {
            const tournamentDate = new Date(tournament.StartDate);
            console.log('Tournament:', tournament.Event, 'Date:', tournamentDate);
            return tournamentDate >= now;
        }).sort((a, b) => {
            return new Date(a.StartDate) - new Date(b.StartDate);
        });
    
        console.log('Filtered upcoming tournaments:', upcomingTournaments);
        setActiveSchedule(upcomingTournaments);
    };

    // Load saved selections
    useEffect(() => {
        const loadSavedSelections = async () => {
            try {
                console.log('Loading saved selections...');
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/selections`);
                console.log('Received selections:', response.data);
                
                const savedSelections = response.data.reduce((acc, selection) => {
                    acc[selection.event] = selection.selection;
                    return acc;
                }, {});
                console.log('Processed selections:', savedSelections);
                setSelections(savedSelections);
            } catch (error) {
                console.error('Error loading saved selections:', error);
            }
        };

        loadSavedSelections();
    }, []);

    useEffect(() => {
        // Update active schedule immediately
        if (schedule.length > 0) {
            updateActiveSchedule(schedule);
        }
    
        // Set up an interval to check for updates (e.g., every hour)
        const interval = setInterval(() => {
            if (schedule.length > 0) {
                updateActiveSchedule(schedule);
            }
        }, 3600000); // Check every hour
    
        return () => clearInterval(interval);
    }, [schedule]);

    // Add this effect to update the next tournament date
    useEffect(() => {
        const updateNextTournamentDate = () => {
            setNextTournamentDate(getNextThursdayDate());
        };

        // Update immediately
        updateNextTournamentDate();

        // Set up daily check
        const interval = setInterval(updateNextTournamentDate, 86400000); // Check every 24 hours

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="schedule-container">Loading schedule...</div>;
    }

    if (error) {
        return <div className="schedule-container">Error: {error}</div>;
    }

    if (schedule.length === 0) {
        return <div className="schedule-container">No schedule data available</div>;
    }

    return (
        <div className="schedule-container">
            <h1>Tournament Selection</h1>
            <div className="schedule-list">
                {activeSchedule.map((tournament, index) => (
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
                        {renderSelectionInput(tournament, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Schedule;