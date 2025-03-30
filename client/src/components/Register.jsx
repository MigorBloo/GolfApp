import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [profileImage, setProfileImage] = useState('GolfBall.png');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const profileImages = [
        { value: 'GolfBall.png', label: 'Golf Ball', image: '/images/GolfBall.png' },
        { value: 'GolfClub.png', label: 'Golf Club', image: '/images/GolfClub.png' },
        { value: 'GolfFlag.png', label: 'Golf Flag', image: '/images/GolfFlag.png' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:8001/api/register', {
                email,
                password,
                username,
                profile_image: profileImage
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/');
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Create Account</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Profile Image</label>
                        <div className="profile-image-grid">
                            {profileImages.map((image) => (
                                <div 
                                    key={image.value} 
                                    className={`profile-image-option ${profileImage === image.value ? 'selected' : ''}`}
                                    onClick={() => setProfileImage(image.value)}
                                >
                                    <img 
                                        src={image.image} 
                                        alt={image.label} 
                                        className="profile-image-preview"
                                    />
                                    <span className="profile-image-label">{image.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="auth-button">Register</button>
                </form>
                <div className="auth-links">
                    <p>Already have an account? <a href="/login">Login</a></p>
                </div>
            </div>
        </div>
    );
}

export default Register; 