import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Snapshot from './components/Snapshot';
import ScoreTracker from './components/ScoreTracker';
import GolferTable from './components/GolferTable';
import Pagination from './components/Pagination';
import Schedule from './components/Schedule';
import GolferRankings from './components/GolferRankings';
import Leaderboard from './components/Leaderboard';
import Header from './components/Header';
import './styles.css';

function App() {
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
    const golfersPerPage = 10;

    // Add handleGolferSelect function
    const handleGolferSelect = (golfer) => {
        setSelectedGolfer(golfer);
    };

    // Add handleSort function
    const handleSort = (option) => {
        setSortOption(option);
        const sortedGolfers = [...golfers].sort((a, b) => 
            option === 'dkSalary' ? b.dkSalary - a.dkSalary : b.fdSalary - a.fdSalary
        );
        setGolfers(sortedGolfers);
    };

    // Add handlePageChange function
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
            try {
                console.log('Starting axios request...'); // Debug log
                
                // Change this line to use the relative URL
                const response = await axios.get('/api/golfers');
                
                console.log('Response received:', response.data); // Debug log
    
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
                setLoading(false);
            } catch (error) {
                console.error('Error details:', error);
                setError(error);
                setLoading(false);
            }
        };
    
        fetchData();
    }, []);

    useEffect(() => {
        const fetchRankedGolfers = async () => {
            console.log('Starting to fetch rankings data...');
            try {
                const response = await axios.get('/api/rankings');
                console.log('Rankings API Response:', response.data);
                
                // Extract the rankings array from the response
                const rankingsData = response.data.rankings; // Add this line
                
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

    return (
        <div className="app">
            <Header />
        <div className="app-container">
         <div className="top-grid">
         <div className="snapshot-section">
         <Snapshot />
         </div>
         <div className="leaderboard-section">
         <Leaderboard />
        </div>
         <div className="score-tracker-section">
        <ScoreTracker />
    </div>
</div>

            {/* Existing main grid */}
            <div className="main-grid">
                <div className="rankings-section">
                    <GolferRankings />
                </div>
                <div className="golfer-table-section">
                    <GolferTable 
                        golfers={golfersToDisplay}
                        eventInfo={eventInfo}
                        sortOption={sortOption}
                        onSortChange={handleSort}
                        onGolferSelect={handleGolferSelect}
                    />
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
                <div className="schedule-section">
                    <Schedule 
                    selectedGolfer={selectedGolfer}
                    golfers={golfersToDisplay}
                    rankedGolfers={rankedGolfers}  />
                </div>
            </div>
        </div>
    </div>
    );
}

export default App;