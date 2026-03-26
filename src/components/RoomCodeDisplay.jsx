import { useState } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';

export default function RoomCodeDisplay({ roomId }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-400 mb-3">
                Share this code with the receiver
            </p>
            <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-[0.3em] text-blue-400">
                    {roomId}
                </span>
                <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    title="Copy code"
                >
                    {copied
                        ? <Check className="w-5 h-5 text-green-400" />
                        : <Copy className="w-5 h-5 text-gray-400" />
                    }
                </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for someone to join...
            </div>
        </div>
    );
}