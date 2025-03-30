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
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:8001';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor to add auth token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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

    const handleGolferSelect = async (golfer) => {
        setSelectedGolfer(golfer);
        if (golfer) {
            try {
                // Save to tournament_selections table only
                await axios.post('/api/tournament-selections', {
                    event: eventInfo.event_name,
                    selection: golfer
                });
                // Refresh the tournament selections data
                fetchTournamentSelections();
                setSelectedGolfer(null); // Clear the selection after saving
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
            // Add is_locked property to each entry
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
                // Call the new endpoint to lock the tournament and move selection to score tracker
                await axios.post('/api/tournament-selections/lock', {
                    event: eventInfo.event_name
                });
                // Refresh both tournament selections and score tracker data
                fetchTournamentSelections();
                fetchScoreTrackerData();
            } catch (error) {
                console.error('Error locking tournament:', error);
            }
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

    const fetchTournamentSelections = async () => {
        try {
            const response = await axios.get('/api/tournament-selections');
            // Update any UI state if needed based on the selections
            console.log('Tournament selections:', response.data);
        } catch (error) {
            console.error('Error fetching tournament selections:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
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
                }
            } catch (error) {
                console.error('Error fetching rankings:', error);
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
                const response = await axios.get('/api/users/profile');
                setUsername(response.data.username);
                setProfileImage(response.data.profile_image || 'GolfBall.png');
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [setProfileImage]);

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
                    <GolferRankings usedGolfers={scoreTrackerData.filter(entry => entry.is_locked).map(entry => entry.selection)} />
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
                        usedGolfers={scoreTrackerData.filter(entry => entry.is_locked).map(entry => entry.selection)}
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
                        usedGolfers={scoreTrackerData.filter(entry => entry.is_locked).map(entry => entry.selection)}
                    />
                </div>
            </div>
        </>
    );
}

function App() {
    const [profileImage, setProfileImage] = useState('GolfBall.png');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get('/api/users/profile');
                    setProfileImage(response.data.profile_image || 'GolfBall.png');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    return (
        <Router>
            <div className="app">
                <Header />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <MainContent profileImage={profileImage} setProfileImage={setProfileImage} />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <Profile onProfileImageChange={setProfileImage} />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;