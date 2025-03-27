import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate('/');
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <header className="header">
            <div className="logo" onClick={handleLogoClick}>
                <img src="/BlueFish.png" alt="Logo" className="logo-image" />
            </div>
            <nav className="nav-links">
                <button className="nav-button" onClick={handleProfileClick}>Profile</button>
                <button className="nav-button">PreSelection Sheet</button>
                <button className="nav-button">All the Data</button>
                <button className="nav-button">Rules/FAQs</button>
                <button className="nav-button">Surveys</button>
                <button className="nav-button">Mission</button>
                <button className="nav-button contact-button">Contact</button>
            </nav>
        </header>
    );
}

export default Header;