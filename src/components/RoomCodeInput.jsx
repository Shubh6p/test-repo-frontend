import { useState, useEffect } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import QRScanner from './QRScanner';

export default function RoomCodeInput({ onSubmit, loading, error, initialCode }) {
    const [code, setCode] = useState(initialCode || '');
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        if (initialCode && initialCode.length >= 7 && !loading) {
            onSubmit(initialCode);
        }
    }, [initialCode]);

    const handleChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) {
            value = value.slice(0, 3) + '-' + value.slice(3, 6);
        }
        setCode(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.length >= 7) {
            onSubmit(code);
        }
    };

    return (
        <div className="max-w-lg mx-auto w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-retro-input p-5 pb-6 shadow-brutal border border-retro-shadow/20">
                    <label className="block text-[10px] font-dos text-retro-text uppercase mb-3 font-bold">TARGET ROOM ID</label>
                    <div className="flex items-center text-lg md:text-xl font-body text-retro-gray">
                        <span className="text-retro-amber font-dos mr-3">&gt;</span>
                        <input
                            type="text"
                            value={code}
                            onChange={handleChange}
                            placeholder="XXX-XXX"
                            maxLength={7}
                            className="bg-transparent border-none outline-none w-full tracking-[0.2em] placeholder-retro-gray/40 text-retro-gray block font-bold uppercase disabled:opacity-50"
                            autoFocus
                            disabled={loading}
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-red-500 font-dos text-xs text-center">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={code.length < 7 || loading}
                    className="w-full text-center bg-retro-olive text-white font-dos text-sm py-4 md:py-5 uppercase transition-transform active:translate-y-1 active:translate-x-1 shadow-brutal-sm active:shadow-brutal-active hover:bg-retro-oliveHover disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            UPLINKING...
                        </span>
                    ) : (
                        'CONNECT UPLINK'
                    )}
                </button>
            </form>

            <button
                type="button"
                onClick={() => setShowScanner(!showScanner)}
                disabled={loading}
                className="w-full text-center bg-retro-terminal text-retro-amber font-dos text-xs py-3 mt-4 uppercase transition-transform shadow-brutal-sm hover:text-white disabled:opacity-50"
            >
                <span className="flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4" />
                    {showScanner ? 'CLOSE SCANNER' : 'SCAN QR CODE'}
                </span>
            </button>
            
            {showScanner && (
                <QRScanner 
                    onScan={(scannedCode) => {
                        setCode(scannedCode);
                        setShowScanner(false);
                        // Auto submit when scanned
                        onSubmit(scannedCode);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}