import { Check, RotateCw } from 'lucide-react';
import { formatBytes, getFileIcon } from '../utils/helpers';

export default function SentFileCard({ file, onSendAgain }) {
    const timeString = file.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="bg-retro-input border border-retro-shadow/30 shadow-brutal p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
                <div className="text-2xl flex-shrink-0">{getFileIcon(file.mimeType)}</div>
                <div className="min-w-0">
                    <p className="text-retro-text font-dos text-[10px] md:text-xs uppercase truncate font-bold">
                        {file.fileName}
                    </p>
                    <p className="text-retro-gray font-mono text-[9px] mt-1 uppercase">
                        {formatBytes(file.totalBytes)} • {file.duration.toFixed(1)}s • {timeString}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <button 
                    onClick={() => onSendAgain && onSendAgain(file.rawFile)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-retro-amber text-retro-text font-dos text-[10px] px-3 py-2 uppercase shadow-brutal-sm hover:translate-y-[-1px] transition-all active:translate-y-[1px]"
                >
                    <RotateCw className="w-3 h-3" />
                    SEND AGAIN
                </button>
                <div className="flex-1 md:flex-none bg-retro-olive/20 text-retro-olive border border-retro-olive/50 font-dos text-[10px] px-3 py-2 uppercase flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    SENT
                </div>
            </div>
        </div>
    );
}
