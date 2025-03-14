import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Schedule.css';

function Schedule({ selectedGolfer, golfers, rankedGolfers, isLocked }) {
    const [schedule, setSchedule] = useState([]);
    const [selections, setSelections] = useState({});
    const [tempSelection, setTempSelection] = useState(null);
    const [activeBoxId, setActiveBoxId] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState(null);

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

    useEffect(() => {
        console.log('Ranked golfers received:', rankedGolfers);
    }, [rankedGolfers]);
    
    // Updated getSuggestions function
    const getSuggestions = (input, index) => {
        if (!input) return [];
        const inputValue = input.toLowerCase();

        // For the first box (index 0), don't show suggestions as it's controlled by GolferTable
        if (index === 0) return [];

        // Use ranked golfers for autocomplete for all other boxes
        const golferNames = Array.isArray(rankedGolfers) 
            ? rankedGolfers.map(golfer => {
                // Log a sample golfer to see its structure
                if (!golfer) return null;
                
                // Adjust these properties based on your actual data structure
                const name = golfer.Player || golfer.player || golfer.Name || golfer.name;
                if (!name) return null;

                // If name is already in "First Last" format
                if (!name.includes(',')) return name;

                // If name is in "Last, First" format
                const [lastName, firstName] = name.split(', ');
                return `${firstName} ${lastName}`;
            })
            .filter(Boolean) // Remove null values
            : [];

        return golferNames
            .filter(name => name.toLowerCase().includes(inputValue))
            .slice(0, 5); // Limit to 5 suggestions
    };

    // Update handleInputChange to pass the index
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

    const handleSuggestionClick = (suggestion, tournamentId) => {
        setTempSelection(suggestion);
        setActiveBoxId(tournamentId);
        setSuggestions([]);
        setActiveSuggestionBox(null);
    };

    const handleConfirmSelection = async (tournamentId) => {
        if (tempSelection) {
            try {
                const isFirstTournament = tournamentId === schedule[0]?.id;
                const shouldBeLocked = isFirstTournament && isLocked;

                console.log('Attempting to save selection:', {
                    tournamentId,
                    playerName: tempSelection,
                    isLocked: shouldBeLocked
                });

                const response = await axios({
                    method: 'post',
                    url: '/api/selections/save',
                    data: {
                        tournamentId,
                        playerName: tempSelection,
                        isLocked: shouldBeLocked
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Selection saved successfully:', response.data);

                // Update local state
                setSelections(prev => ({
                    ...prev,
                    [tournamentId]: tempSelection
                }));
                
                // Clear temporary states
                setTempSelection(null);
                setActiveBoxId(null);
                setSuggestions([]);
                setActiveSuggestionBox(null);

            } catch (error) {
                console.error('Full error:', error);
                const errorMessage = error.response?.data?.details || error.message;
                console.error('Error details:', errorMessage);
                alert(`Failed to save selection: ${errorMessage}`);
            }
        }
    };

    const handleCancelSelection = () => {
        setTempSelection(null);
        setActiveBoxId(null);
        setSuggestions([]);
        setActiveSuggestionBox(null);
    };

    const renderSelectionInput = (tournament, index) => {
        const isFirstTournament = index === 0;
        const isDisabled = isLocked && isFirstTournament;
        const currentValue = activeBoxId === tournament.id
            ? tempSelection || ''
            : selections[tournament.id] || '';

            return (
                <div className={`selection-container ${isLocked && index === 0 ? 'locked' : ''}`}>
                    <div className="selection-input-wrapper">
                        <input
                            type="text"
                            className="selection-input"
                            placeholder={isDisabled ? "Locked" : "Enter selection..."}
                            value={currentValue}
                            onChange={(e) => handleInputChange(tournament.id, e.target.value, index)}
                            disabled={isDisabled}
                        />
                        {activeSuggestionBox === tournament.id && suggestions.length > 0 && (
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
                    {activeBoxId === tournament.id && (
                        <div className="action-buttons">
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
                        </div>
                    )}
                </div>
            );
        };   

    useEffect(() => {
        const loadSavedSelections = async () => {
            try {
                console.log('Loading saved selections...');
                const response = await axios.get('/api/selections');
                console.log('Received selections:', response.data);
                
                const savedSelections = response.data.reduce((acc, selection) => {
                    acc[selection.tournament_id] = selection.player_name;
                    return acc;
                }, {});
                console.log('Processed selections:', savedSelections);
                setSelections(savedSelections);
            } catch (error) {
                console.error('Error loading saved selections:', error);
            }
        };
    
        loadSavedSelections();
    }, []); // Run once when component mounts

    useEffect(() => {
        console.log('Golfers from table:', golfers);
        console.log('Ranked golfers:', rankedGolfers);
    }, [golfers, rankedGolfers]);

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
                        {renderSelectionInput(tournament, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Schedule;