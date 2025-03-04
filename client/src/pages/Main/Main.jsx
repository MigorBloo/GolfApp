import React, { useState, useEffect } from 'react';
import Schedule from '../../components/Schedule';
import GolferTable from '../../components/GolferTable';
import GolferRankings from '../../components/GolferRankings';
import './Main.css';

function Main() {
    const [events, setEvents] = useState([]);
    const [currentEvent, setCurrentEvent] = useState({
        name: "Arnold Palmer Invitational",
        course: "Bay Hill Club & Lodge",
        date: "2025-03-06"
    });
    const [sortOption, setSortOption] = useState('rank');
    const [selectedGolfers, setSelectedGolfers] = useState([]);
    const [golfers, setGolfers] = useState([]);

   
    useEffect(() => {
        const loadScheduleData = async () => {
            try {
                console.log('Attempting to load schedule data...');
                const response = await fetch('/api/schedule', {  // Remove the full URL, just use the path
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Loaded schedule data:', data);

                if (!data.schedule) {
                    throw new Error('No schedule data in response');
                }

                setEvents(data.schedule);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const upcomingEvents = data.schedule
                    .filter(event => {
                        const eventDate = new Date(event.StartDate);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate >= today;
                    })
                    .sort((a, b) => new Date(a.StartDate) - new Date(b.StartDate));

                if (upcomingEvents.length > 0) {
                    setCurrentEvent({
                        name: upcomingEvents[0].Event,
                        course: "Bay Hill Club & Lodge",
                        date: upcomingEvents[0].StartDate
                    });
                }
            } catch (error) {
                console.error('Error loading schedule data:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            }
        };

        loadScheduleData();
    }, []);

    const handleSortChange = (option) => {
        setSortOption(option);
    };

    const handleSelectionChange = (selectedGolfers) => {
        setSelectedGolfers(selectedGolfers);
    };

    return (
        <div className="main-container">
            <div className="content-wrapper">
                <div className="rankings-section">
                    <h2>Golfer Rankings</h2>
                    <p>Rankings will be available soon</p>
                </div>
                <div className="golfer-section">
                    <GolferTable 
                        golfers={golfers}
                        eventInfo={{
                            event_name: currentEvent.name,
                            course: currentEvent.course,
                            date: currentEvent.date
                        }}
                        sortOption={sortOption}
                        onSortChange={handleSortChange}
                        selectedGolfers={selectedGolfers}
                        onSelectionChange={handleSelectionChange}
                    />
                </div>
                <div className="schedule-section">
                    {events.length > 0 ? (
                        <Schedule 
                            events={events}
                            currentEventId={currentEvent?.id}
                        />
                    ) : (
                        <p>Loading schedule data...</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Main;