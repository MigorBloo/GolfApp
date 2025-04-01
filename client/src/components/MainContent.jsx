import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Snapshot from './Snapshot';
import ScoreTracker from './ScoreTracker';
import GolferTable from './GolferTable';
import Pagination from './Pagination';
import Schedule from './Schedule';
import GolferRankings from './GolferRankings';
import Leaderboard from './Leaderboard';
import ThisWeekTitle from './ThisWeekTitle';

function MainContent({ profileImage, setProfileImage }) {
    const [golfers, setGolfers] = useState([]);
    const [eventInfo, setEventInfo] = useState({
        event_name: '',
        course: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState('dkSalary');
    const [selectedGolfer, setSelectedGolfer] = useState(null);
    const [rankedGolfers, setRankedGolfers] = useState([]);
    const [isEventLocked, setIsEventLocked] = useState(false);
    const [scoreTrackerData, setScoreTrackerData] = useState([]);
    const [username, setUsername] = useState('');
    const golfersPerPage = 10;

    const fetchTournamentSelections = async () => {
        try {
            const response = await axios.get('/api/tournament-selections');
            const selections = response.data;
            // Update the selected golfer based on the current event
            const currentSelection = selections.find(s => s.event === eventInfo.event_name);
            if (currentSelection) {
                setSelectedGolfer(currentSelection.selection);
            }
            // Update event lock status
            const currentEvent = selections.find(s => s.event === eventInfo.event_name);
            if (currentEvent) {
                setIsEventLocked(currentEvent.is_locked || false);
            }
        } catch (error) {
            console.error('Error fetching tournament selections:', error);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('/api/check-auth');
                if (response.data.isAuthenticated) {
                    setUsername(response.data.user.username);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        fetchTournamentSelections();
        fetchScoreTrackerData();
    }, [eventInfo.event_name]);

    const handleGolferSelect = async (golfer) => {
        setSelectedGolfer(golfer);
        if (golfer) {
            try {
                await axios.post('/api/tournament-selections', {
                    event: eventInfo.event_name,
                    selection: golfer
                });
                fetchTournamentSelections();
                setSelectedGolfer(null);
            } catch (error) {
                console.error('Error saving selection:', error);
            }
        }
    };

    const handleSort = (option) => {
        setSortOption(option);
        const sortedGolfers = [...golfers].sort((a, b) => 
            option === 'dkSalary' ? b.dkSalary - a.dkSalary : b.fdSalary - a.fdSalary
        );
        setGolfers(sortedGolfers);
    };

    const fetchScoreTrackerData = async () => {
        try {
            const response = await axios.get('/api/scoretracker/entries');
            const data = response.data.map(entry => ({
                ...entry,
                is_locked: entry.is_locked || false
            }));
            setScoreTrackerData(data);
        } catch (error) {
            console.error('Error fetching score tracker data:', error);
        }
    };

    const handleEventLockStatus = async (isLocked) => {
        setIsEventLocked(isLocked);
        if (isLocked) {
            try {
                await axios.post('/api/tournament-selections/lock', {
                    event: eventInfo.event_name
                });
                fetchTournamentSelections();
                fetchScoreTrackerData();
            } catch (error) {
                console.error('Error locking tournament:', error);
            }
        }
    };

    return (
        <div className="main-content">
            <ThisWeekTitle eventInfo={eventInfo} />
            <div className="content-grid">
                <div className="left-column">
                    <Snapshot username={username} profileImage={profileImage} />
                    <Leaderboard />
                </div>
                <div className="center-column">
                    <GolferTable
                        golfers={golfers}
                        eventInfo={eventInfo}
                        currentPage={currentPage}
                        golfersPerPage={golfersPerPage}
                        sortOption={sortOption}
                        onSort={handleSort}
                        selectedGolfer={selectedGolfer}
                        onGolferSelect={handleGolferSelect}
                        isEventLocked={isEventLocked}
                        onEventLockStatus={handleEventLockStatus}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(golfers.length / golfersPerPage)}
                        onPageChange={setCurrentPage}
                    />
                </div>
                <div className="right-column">
                    <ScoreTracker data={scoreTrackerData} />
                    <GolferRankings />
                    <Schedule />
                </div>
            </div>
        </div>
    );
}

export default MainContent; 