import { Check } from 'lucide-react';
import { formatBytes, getFileIcon } from '../utils/helpers';

export default function SentFileCard({ file }) {
    const timeString = file.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="bg-retro-input border border-retro-shadow/30 shadow-brutal p-4 flex items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
            <div className="flex-shrink-0 bg-retro-olive/20 text-retro-olive border border-retro-olive/50 font-dos text-[10px] px-3 py-2 uppercase flex items-center gap-1">
                <Check className="w-3 h-3" />
                SENT
            </div>
        </div>
    );
}
