import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile({ onProfileImageChange }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [tempSelectedImage, setTempSelectedImage] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const images = [
        'GolfBall.png',
        'GolfClub.png',
        'GolfFlag.png'
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8001/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Profile data:', response.data);
            setEmail(response.data.email);
            setUsername(response.data.username);
            setTempUsername(response.data.username);
            setSelectedImage(response.data.profile_image || 'GolfBall.png');
            setTempSelectedImage(response.data.profile_image || 'GolfBall.png');
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Error loading profile data');
        }
    };

    const handleUsernameUpdate = async () => {
        if (!tempUsername.trim()) {
            setError('Username cannot be empty');
            return;
        }

        setIsUpdating(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:8001/api/users/username', 
                { username: tempUsername },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setUsername(response.data.username);
            setIsEditing(false);
            setSuccess('Username updated successfully');
        } catch (error) {
            console.error('Error updating username:', error);
            setError('Error updating username');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleImageSelect = (image) => {
        setTempSelectedImage(image);
        setIsConfirming(true);
        setError('');
        setSuccess('');
    };

    const handleImageConfirm = async () => {
        if (!tempSelectedImage) {
            setError('Please select an image first');
            return;
        }

        setIsUpdating(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:8001/api/users/profile-image',
                { profile_image: tempSelectedImage },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setSelectedImage(response.data.profile_image);
            onProfileImageChange(response.data.profile_image);
            setIsConfirming(false);
            setSuccess('Profile image updated successfully');
        } catch (error) {
            console.error('Error updating profile image:', error);
            setError('Error updating profile image');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-box">
                <h2>Profile Settings</h2>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <div className="profile-section">
                    <h3>Account Information</h3>
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
                                <button 
                                    onClick={handleUsernameUpdate}
                                    disabled={isUpdating || !tempUsername.trim()}
                                >
                                    {isUpdating ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setTempUsername(username);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="display-username">
                                <span>{username}</span>
                                <button onClick={() => setIsEditing(true)}>Edit</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Profile Image</h3>
                    <div className="current-image">
                        <label>Current Image:</label>
                        <img 
                            src={selectedImage} 
                            alt="Current profile" 
                            className="profile-image"
                        />
                    </div>
                    <div className="image-options">
                        {images.map((image) => (
                            <div 
                                key={image} 
                                className={`image-option ${tempSelectedImage === image ? 'selected' : ''}`}
                                onClick={() => handleImageSelect(image)}
                            >
                                <img 
                                    src={image}
                                    alt={image} 
                                />
                            </div>
                        ))}
                    </div>
                    {isConfirming && (
                        <div className="image-confirmation">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={tempSelectedImage === selectedImage}
                                    onChange={handleImageConfirm}
                                    disabled={isUpdating}
                                />
                                Confirm image selection
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile; 