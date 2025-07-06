// src/pages/Home.jsx
import React from 'react';
import QRScanner from '../components/QRScanner';

const Home = () => {
    return (
        <div className="home-page">
            <h1>Trustee Check-In</h1>
            <QRScanner />
        </div>
    );
};

export default Home;
