// src/components/QRScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateQRCode } from '../utils/api';
import CheckInResult from './CheckInResult';
import Loader from './Loader';

const QRScanner = () => {
    const scannerRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(false);

    const beepSound = new Audio('/beep.mp3');

    useEffect(() => {
        if (!scannerRef.current && !scanning) {
            startScanner();
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                });
            }
        };
    }, []);

    const startScanner = () => {
        setError(null);
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        setScanning(true);

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        scanner.start(
            { facingMode: 'environment' },
            config,
            async (decodedText) => {
                try {
                    setLoading(true);
                    await scanner.stop();
                    setScanning(false);

                    const validation = await validateQRCode(decodedText);

                    if (validation.success) {
                        beepSound.play();
                        triggerFlash();
                    }

                    if (!validation.success) {
                        setError(validation.message);
                    }

                    setResult(validation);
                } catch (err) {
                    console.error('Scan processing error:', err);
                    setError('An unexpected error occurred during scanning.');
                } finally {
                    setLoading(false);
                }
            },
            (errorMessage) => {
                console.warn('QR Scan error:', errorMessage);
            }
        ).catch((err) => {
            console.error('Unable to start scanner:', err);
            setError('Unable to start the camera scanner.');
        });
    };

    const resetScanner = () => {
        setResult(null);
        setError(null);
        startScanner();
    };

    const triggerFlash = () => {
        setFlash(true);
        setTimeout(() => setFlash(false), 300); // Flash duration
    };

    return (
        <div className={`scanner-container ${flash ? 'flash' : ''}`}>
            {!loading && !result && !error && (
                <div id="qr-reader" style={{ width: '100%', maxWidth: '350px', height: 'auto' }} />
            )}

            {loading && <Loader />}

            {result && <CheckInResult result={result} onRetry={resetScanner} />}

            {error && (
                <div className="error-message">
                    <h2>❌ Error</h2>
                    <p>{error}</p>
                    <button onClick={resetScanner}>Try Again</button>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
