import { useState } from 'react';
import { Copy, Check, Loader2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function RoomCodeDisplay({ roomId }) {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareUrl = `${window.location.origin}/receive?code=${roomId}`;

    return (
        <div className="bg-retro-input border border-retro-shadow/20 shadow-brutal p-6 text-center mt-2">
            <p className="text-xs font-dos text-retro-text mb-4 uppercase font-bold">
                DISTRIBUTE THIS ACCESS CODE
            </p>
            <div className="flex items-center justify-center gap-3">
                <span className="text-3xl md:text-4xl font-dos font-bold tracking-[0.2em] text-retro-amber bg-white px-4 py-2 border-2 border-retro-shadow/50">
                    {roomId}
                </span>
                <button
                    onClick={handleCopy}
                    className="p-3 bg-retro-text hover:bg-black transition-colors shadow-brutal-sm active:shadow-brutal-active active:translate-x-1 active:translate-y-1"
                    title="Copy code"
                >
                    {copied
                        ? <Check className="w-6 h-6 text-retro-olive" />
                        : <Copy className="w-6 h-6 text-white" />
                    }
                </button>
            </div>
            
            <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className="mt-6 w-full text-center bg-retro-terminal text-retro-amber font-dos text-xs py-3 uppercase transition-transform shadow-brutal-sm hover:text-white"
            >
                <span className="flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4" />
                    {showQR ? 'HIDE QR CODE' : 'GENERATE QR CODE'}
                </span>
            </button>

            {showQR && (
                <div className="mt-4 p-4 bg-white border-2 border-retro-shadow/50 flex flex-col justify-center items-center">
                    <QRCodeSVG value={shareUrl} size={160} fgColor="#0c0c0c" bgColor="#ffffff" level="H" />
                    <p className="mt-3 text-[10px] font-dos text-retro-gray uppercase">Scan to connect directly</p>
                </div>
            )}
            
            <div className="flex items-center justify-center gap-2 mt-6 text-[10px] md:text-xs font-dos text-retro-gray uppercase">
                <Loader2 className="w-3 h-3 animate-spin text-retro-amber" />
                AWAITING TARGET CONNECTION...
            </div>
        </div>
    );
}