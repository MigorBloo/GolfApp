import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthPage.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            if (isLogin) {
                // Handle Login
                console.log('Attempting login with:', { email, password });
                const response = await axios.post('http://localhost:8001/api/login', {
                    email,
                    password
                });
                console.log('Login response:', response.data);
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    console.log('Token stored, navigating to home...');
                    // Force a full page reload to ensure the app state is reset
                    window.location.href = '/home';
                }
            } else {
                // Handle Registration
                if (!username || !email || !password) {
                    setError('All fields are required');
                    return;
                }

                const response = await axios.post('http://localhost:8001/api/register', {
                    username,
                    email,
                    password
                });
                
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    console.log('Registration successful, navigating to home...');
                    // Force a full page reload to ensure the app state is reset
                    window.location.href = '/home';
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError(error.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isLogin ? 'Login' : 'Register'}</h2>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />
                    </div>
                    
                    <div className="form-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                        />
                    </div>
                    
                    <button type="submit" className="auth-button">
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>
                
                <div className="auth-switch">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="switch-button"
                    >
                        {isLogin ? 'Need to register?' : 'Already have an account?'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage; 