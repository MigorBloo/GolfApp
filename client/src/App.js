import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Schedule from './components/Schedule';
import ScoreTracker from './components/ScoreTracker';
import Register from './components/Register';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/scoretracker" element={<ScoreTracker />} />
          <Route path="/" element={<Navigate to="/register" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 