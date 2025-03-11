import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Snapshot from './components/Snapshot';
import ScoreTracker from './components/ScoreTracker';
import GolferTable from './components/GolferTable';
import Pagination from './components/Pagination';
import Schedule from './components/Schedule';
import GolferRankings from './components/GolferRankings';
import Leaderboard from './components/Leaderboard';
import './styles.css';

function App() {
    const [golfers, setGolfers] = useState([]);
    const [eventInfo, setEventInfo] = useState({
        event_name: '',
        course: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState('dkSalary');
    const [selectedGolfer, setSelectedGolfer] = useState(null);
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

    return (
        <div className="app-container">
            {/* Top section with new components */}
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
                    <Schedule selectedGolfer={selectedGolfer} />
                </div>
            </div>
        </div>
    );
}

export default App;