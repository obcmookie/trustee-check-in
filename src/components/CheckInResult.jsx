// src/components/CheckInResult.jsx
import React from 'react';

const CheckInResult = ({ result, onRetry }) => {
    return (
        <div className="checkin-result">
            {result.success ? (
                <div>
                    <h2>Check-In Successful ✅</h2>
                    <p>{result.trustee.first_name} {result.trustee.last_name}</p>
                    <p>Gaam: {result.trustee.gaam}</p>
                </div>
            ) : (
                <div>
                    <h2>❌ Check-In Failed</h2>
                    <p>{result.message}</p>
                </div>
            )}
            <button onClick={onRetry}>Scan Another QR</button>
        </div>
    );
};

export default CheckInResult;
