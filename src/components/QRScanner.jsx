import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onError, onClose }) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            false
        );

        scanner.render(
            (decodedText) => {
                // Determine if it is a URL with ?code= or just the code directly
                try {
                    const url = new URL(decodedText);
                    const codeParam = url.searchParams.get('code');
                    if (codeParam) {
                        scanner.clear();
                        onScan(codeParam.toUpperCase());
                    } else if (decodedText.match(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/i)) {
                        scanner.clear();
                        onScan(decodedText.toUpperCase());
                    }
                } catch (e) {
                    // Not a URL, check if it matches pattern directly
                    if (decodedText.match(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/i)) {
                        scanner.clear();
                        onScan(decodedText.toUpperCase());
                    }
                }
            },
            (error) => {
                if (onError) onError(error);
            }
        );

        // Cleanup on unmount
        return () => {
            scanner.clear().catch(console.error);
        };
    }, [onScan, onError]);

    return (
        <div className="bg-retro-input p-4 border border-retro-shadow/20 shadow-brutal mt-4 relative font-dos uppercase">
            <style>{`
                #reader { border: 2px solid #0c0c0c !important; }
                #reader__scan_region { background: #f9f8f4; }
                #reader__dashboard_section_csr span { color: #1a1a1a !important; font-family: 'VT323', monospace; }
                #reader button { background: #526239; color: white; padding: 4px 8px; font-family: 'Press Start 2P', monospace; font-size: 10px; border: none; cursor: pointer; text-transform: uppercase; margin-top: 10px;}
                #reader a { display: none !important; }
            `}</style>
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-retro-text font-bold">OPTICAL UPLINK</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-retro-gray hover:text-red-500 font-dos text-[10px]"
                >
                    [X] CANCEL
                </button>
            </div>
            <div id="reader" className="w-full"></div>
        </div>
    );
}
