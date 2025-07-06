// src/utils/scannerManager.js

let html5QrCodeInstance = null;

export function setScannerInstance(scanner) {
    html5QrCodeInstance = scanner;
}

export async function stopScannerInstance() {
    if (html5QrCodeInstance) {
        try {
            await html5QrCodeInstance.stop();
            html5QrCodeInstance.clear();
            console.log('Scanner stopped globally.');
        } catch (err) {
            console.error('Error stopping scanner globally:', err);
        }
    }
    html5QrCodeInstance = null;
}
