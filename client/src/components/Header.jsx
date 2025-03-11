import React from 'react';
import './Header.css';

function Header() {
    return (
        <header className="header">
            <div className="logo">
                <h1>Golf One&Done</h1>
            </div>
            <nav className="nav-links">
                <button className="nav-button active">Home</button>
                <button className="nav-button">Profile</button>
                <button className="nav-button">Strategy Sheet</button>
                <button className="nav-button">All the Data</button>
                <button className="nav-button">Rules</button>
                <button className="nav-button">FAQs</button>
                <button className="nav-button">Mission</button>
                <button className="nav-button">Contact</button>
            </nav>
        </header>
    );
}

export default Header;