import React, { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateQRCode, fetchScanLogsForTrustee } from '../utils/api';
import Loader from './Loader';
import { setScannerInstance } from '../utils/scannerManager';

const QRScanner = () => {
    const html5QrCodeInstance = useRef(null);
    const [scannerActive, setScannerActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(false);
    const [scanLogs, setScanLogs] = useState([]);

    const beepSound = new Audio('/beep.mp3');

    const startScanner = async () => {
        try {
            setError(null);
            setResult(null);
            setScanLogs([]);
            setScannerActive(true);

            html5QrCodeInstance.current = new Html5Qrcode('qr-reader');
            setScannerInstance(html5QrCodeInstance.current); // Save globally

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            await html5QrCodeInstance.current.start(
                { facingMode: 'environment' },
                config,
                async (decodedText) => {
                    try {
                        setLoading(true);

                        await html5QrCodeInstance.current.stop();
                        html5QrCodeInstance.current.clear();
                        setScannerActive(false);

                        const validation = await validateQRCode(decodedText);

                        if (validation.success) {
                            beepSound.play();
                            triggerFlash();

                            const logs = await fetchScanLogsForTrustee(validation.trustee.id);
                            setScanLogs(logs);
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
            );
        } catch (err) {
            console.error('Unable to start scanner:', err);
            setError('Unable to start the camera scanner.');
        }
    };

    const triggerFlash = () => {
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
    };

    const handleScanNext = () => {
        startScanner(); // Restart scanner for next scan
    };

    return (
        <div className={`scanner-container ${flash ? 'flash' : ''}`}>
            {/* Scanner container MUST always be rendered */}
            <div id="qr-reader" style={{ width: '100%', maxWidth: '350px', height: '350px', marginBottom: '20px' }} />

            {!scannerActive && !result && !error && (
                <button onClick={startScanner}>Ready to Scan</button>
            )}

            {loading && <Loader />}

            {result && result.success && (
                <div className="checkin-result">
                    <h2>✅ Check-In Successful</h2>
                    <p>{result.trustee.first_name} {result.trustee.last_name}</p>
                    <p>Gaam: {result.trustee.gaam}</p>
                    <p>Scans Today: {result.trustee.daily_scan_count + 1} / {result.trustee.family_size_limit}</p>

                    <div style={{ marginTop: '20px' }}>
                        <h3>Scan Log for this Trustee</h3>
                        {scanLogs.length === 0 && <p>No previous scans today.</p>}
                        {scanLogs.length > 0 && (
                            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                {scanLogs.map((log) => (
                                    <li key={log.id}>{new Date(log.scan_time).toLocaleString()}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button onClick={handleScanNext} style={{ marginTop: '15px' }}>Scan Next QR</button>
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
