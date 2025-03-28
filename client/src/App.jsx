import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Snapshot from './components/Snapshot';
import ScoreTracker from './components/ScoreTracker';
import GolferTable from './components/GolferTable';
import Pagination from './components/Pagination';
import Schedule from './components/Schedule';
import GolferRankings from './components/GolferRankings';
import Leaderboard from './components/Leaderboard';
import Header from './components/Header';
import Profile from './components/Profile';
import './styles.css';

function MainContent() {
    const [golfers, setGolfers] = useState([]);
    const [eventInfo, setEventInfo] = useState({
        event_name: '',
        course: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState('dkSalary');
    const [selectedGolfer, setSelectedGolfer] = useState(null);
    const [rankedGolfers, setRankedGolfers] = useState([]);
    const [isEventLocked, setIsEventLocked] = useState(false);
    const [rankingsError, setRankingsError] = useState(null);
    const [scoreTrackerData, setScoreTrackerData] = useState([]);
    const [username, setUsername] = useState('');
    const [profileImage, setProfileImage] = useState('GolfBall.png');
    const golfersPerPage = 10;

    const handleGolferSelect = (golfer) => {
        setSelectedGolfer(golfer);
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
            setScoreTrackerData(response.data);
        } catch (error) {
            console.error('Error fetching score tracker data:', error);
        }
    };

    const handleEventLockStatus = (locked) => {
        setIsEventLocked(locked);
        if (locked && selectedGolfer) {
            updateScoreTracker(selectedGolfer);
        }
    };

    const updateScoreTracker = async (golferName) => {
        try {
            await axios.post('/api/scoretracker/update', {
                golfer: golferName,
                tournament: 1 // or however you identify the current tournament
            });
            fetchScoreTrackerData();
        } catch (error) {
            console.error('Error updating ScoreTracker:', error);
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Calculate pagination values
    const indexOfLastGolfer = currentPage * golfersPerPage;
    const indexOfFirstGolfer = indexOfLastGolfer - golfersPerPage;
    const golfersToDisplay = golfers.slice(indexOfFirstGolfer, indexOfLastGolfer);
    const totalPages = Math.ceil(golfers.length / golfersPerPage);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                console.log('Starting axios request...');
                const response = await axios.get('/api/golfers');
                console.log('Response received:', response.data);
    
                const data = response.data;
    
                if (data && data.field) {
                    setEventInfo({
                        event_name: data.event_name || '',
                        course: data.field[0]?.course || ''
                    });
    
                    const formattedGolfers = data.field.map(golfer => ({
                        name: golfer.player_name,
                        country: golfer.country,
                        dkSalary: Number(golfer.dk_salary) || 0,
                        fdSalary: Number(golfer.fd_salary) || 0
                    }));
    
                    formattedGolfers.sort((a, b) => b.dkSalary - a.dkSalary);
                    setGolfers(formattedGolfers);
                }
            } catch (error) {
                console.error('Error details:', error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchData();
        fetchScoreTrackerData(); // Fetch score tracker data initially
    }, []);

    useEffect(() => {
        const fetchRankedGolfers = async () => {
            console.log('Starting to fetch rankings data...');
            try {
                const response = await axios.get('/api/rankings');
                console.log('Rankings API Response:', response.data);
                
                const rankingsData = response.data.rankings;
                
                if (Array.isArray(rankingsData) && rankingsData.length > 0) {
                    setRankedGolfers(rankingsData);
                    console.log('Rankings data set successfully:', rankingsData);
                } else {
                    console.error('Rankings data is empty or invalid:', response.data);
                    setRankingsError('No rankings data available');
                }
            } catch (error) {
                console.error('Error fetching rankings:', error);
                setRankingsError(error.message);
            }
        };
    
        fetchRankedGolfers();
    }, []);

    useEffect(() => {
        console.log('Current rankedGolfers state:', rankedGolfers);
    }, [rankedGolfers]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8001/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setUsername(response.data.username);
                setProfileImage(`/images/${response.data.profile_image || 'GolfBall.png'}`);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setProfileImage('/GolfBall.png');
            }
        };

        fetchUserData();
    }, []);

    return (
        <>
            <div className="top-grid">
                <div className="snapshot-section">
                    <Snapshot username={username} profileImage={profileImage} />
                </div>
                <div className="leaderboard-section">
                    <Leaderboard />
                </div>
                <div className="score-tracker-section">
                    <ScoreTracker data={scoreTrackerData} />
                </div>
            </div>

            <div className="main-grid">
                <div className="rankings-section">
                    <GolferRankings usedGolfers={scoreTrackerData.map(entry => entry.selection)} />
                </div>
                <div className="golfer-table-section">
                    <GolferTable 
                        golfers={golfersToDisplay}
                        eventInfo={eventInfo}
                        sortOption={sortOption}
                        onSortChange={handleSort}
                        onGolferSelect={handleGolferSelect}
                        onEventLockChange={handleEventLockStatus}
                        isLocked={isEventLocked}
                        usedGolfers={scoreTrackerData.map(entry => entry.selection)}
                    />
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLocked={isEventLocked}
                    />
                </div>
                <div className="schedule-section">
                    <Schedule 
                        selectedGolfer={selectedGolfer}
                        golfers={golfersToDisplay}
                        rankedGolfers={rankedGolfers}
                        isLocked={isEventLocked}
                        usedGolfers={scoreTrackerData.map(entry => entry.selection)}
                    />
                </div>
            </div>
        </>
    );
}

function App() {
    return (
        <Router>
            <div className="app">
                <Header />
                <Routes>
                    <Route path="/" element={<MainContent />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;