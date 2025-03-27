import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8001/api/users/profile', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            setEmail(response.data.email);
            setUsername(response.data.username);
            setTempUsername(response.data.username);
            setSelectedImage(response.data.profile_image || 'GolfBall.png');
        } catch (error) {
            console.error('Error fetching user data:', error);
            setMessage('Error loading profile data');
        }
    };

    const handleUsernameUpdate = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:8001/api/users/username',
                { username: tempUsername },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setUsername(tempUsername);
            setIsEditing(false);
            setMessage('Username updated successfully');
        } catch (error) {
            console.error('Error updating username:', error);
            setMessage('Error updating username');
        }
    };

    const handleImageSelect = async (imageName) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:8001/api/users/profile-image',
                { profile_image: imageName },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            setSelectedImage(imageName);
            setMessage('Profile image updated successfully');
        } catch (error) {
            console.error('Error updating profile image:', error);
            setMessage('Error updating profile image');
        }
    };

    return (
        <div className="profile-container">
            <h2>Profile Settings</h2>
            {message && <div className="message">{message}</div>}
            
            <div className="profile-section">
                <div className="profile-info">
                    <div className="info-group">
                        <label>Email:</label>
                        <span>{email}</span>
                    </div>
                    <div className="info-group">
                        <label>Username:</label>
                        {isEditing ? (
                            <div className="edit-username">
                                <input
                                    type="text"
                                    value={tempUsername}
                                    onChange={(e) => setTempUsername(e.target.value)}
                                />
                                <button onClick={handleUsernameUpdate}>Save</button>
                                <button onClick={() => {
                                    setIsEditing(false);
                                    setTempUsername(username);
                                }}>Cancel</button>
                            </div>
                        ) : (
                            <div className="display-username">
                                <span>{username}</span>
                                <button onClick={() => setIsEditing(true)}>Edit</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-image-section">
                    <h3>Select Profile Image</h3>
                    <div className="image-options">
                        <div 
                            className={`image-option ${selectedImage === 'GolfBall.png' ? 'selected' : ''}`}
                            onClick={() => handleImageSelect('GolfBall.png')}
                        >
                            <img src="/GolfBall.png" alt="Golf Ball" />
                        </div>
                        <div 
                            className={`image-option ${selectedImage === 'GolfClub.png' ? 'selected' : ''}`}
                            onClick={() => handleImageSelect('GolfClub.png')}
                        >
                            <img src="/GolfClub.png" alt="Golf Club" />
                        </div>
                        <div 
                            className={`image-option ${selectedImage === 'GolfFlag.png' ? 'selected' : ''}`}
                            onClick={() => handleImageSelect('GolfFlag.png')}
                        >
                            <img src="/GolfFlag.png" alt="Golf Flag" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile; 