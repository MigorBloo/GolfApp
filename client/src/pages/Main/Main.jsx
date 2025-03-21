import React, { useState, useEffect } from 'react';
import Schedule from '../../components/Schedule';
import GolferTable from '../../components/GolferTable';
import ScoreTracker from '../../components/ScoreTracker';
import './Main.css';

function Main() {
    const [currentEvent, setCurrentEvent] = useState({
        name: "Valspar Championship",  // Set default to match schedule.xlsx
        course: "Innisbrook Resort (Copperhead Course)",
        date: "2024-03-21"
    });
    const [selectedGolfers, setSelectedGolfers] = useState([]);

    useEffect(() => {
        const loadScheduleData = async () => {
            try {
                // Fetch schedule data to get the correct event names
                const scheduleResponse = await fetch('/api/schedule');
                const scheduleData = await scheduleResponse.json();
                
                // Fetch current event from DataGolf API
                const datagolfResponse = await fetch('/api/golfers');
                const datagolfData = await datagolfResponse.json();
                
                if (datagolfData && datagolfData.tournament) {
                    // Find matching event in schedule data
                    const matchingEvent = scheduleData.find(event => 
                        event.Event.toLowerCase() === datagolfData.tournament.toLowerCase()
                    );

                    if (matchingEvent) {
                        setCurrentEvent({
                            name: matchingEvent.Event,  // Use the exact name from schedule.xlsx
                            course: matchingEvent.Course || "Course TBD",
                            date: matchingEvent.StartDate
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading schedule data:', error);
            }
        };

        loadScheduleData();
    }, []);

    const handleSelectionChange = (selectedGolfers) => {
        setSelectedGolfers(selectedGolfers);
    };

    return (
        <div className="main-container">
            <div className="left-panel">
                <GolferTable 
                    currentEventId={currentEvent?.id}
                    onGolferSelect={handleSelectionChange}
                    usedGolfers={selectedGolfers}
                />
            </div>
            <div className="right-panel">
                <Schedule currentEvent={currentEvent} />
                <ScoreTracker />
            </div>
        </div>
    );
}

export default Main;