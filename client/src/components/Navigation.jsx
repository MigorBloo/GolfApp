import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
    return (
        <nav className="navigation">
            <ul>
                <li>
                    <Link to="/register">Register</Link>
                </li>
                <li>
                    <Link to="/schedule">Schedule</Link>
                </li>
                <li>
                    <Link to="/scoretracker">Score Tracker</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navigation; 