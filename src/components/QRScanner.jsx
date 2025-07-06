import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateQRCode } from '../utils/api';
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
        startScanner();

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

                    // Fully stop scanner to clear buffer
                    await scanner.stop();
                    scanner.clear();
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

                    // Restart scanner after 3 seconds
                    setTimeout(() => {
                        setResult(null);
                        setError(null);
                        startScanner(); // Restart clean scanner
                    }, 3000);

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

    const triggerFlash = () => {
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
    };

    return (
        <div className={`scanner-container ${flash ? 'flash' : ''}`}>
            {!loading && !error && (
                <div id="qr-reader" style={{ width: '100%', maxWidth: '350px', height: 'auto' }} />
            )}

            {loading && <Loader />}

            {result && result.success && (
                <div className="checkin-result">
                    <h2>✅ Check-In Successful</h2>
                    <p>{result.trustee.first_name} {result.trustee.last_name}</p>
                    <p>Gaam: {result.trustee.gaam}</p>
                    <p>Scans Today: {result.trustee.daily_scan_count + 1} / {result.trustee.family_size_limit}</p>
                    <p>Ready for next scan...</p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <h2>❌ Error</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Restart Scanner</button>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
