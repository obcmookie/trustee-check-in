// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { stopScannerInstance } from './utils/scannerManager';

const App = () => {
    const location = useLocation();

    // Stop scanner globally on any route change
    useEffect(() => {
        stopScannerInstance();
    }, [location]);

    return (
        <div className="app-container">
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/admin">Admin</Link></li>
                </ul>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </div>
    );
};

export default App;
