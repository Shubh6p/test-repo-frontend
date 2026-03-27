import { Download } from 'lucide-react';
import { formatBytes, getFileIcon } from '../utils/helpers';
import { downloadBlob } from '../services/fileHandler';

export default function ReceivedFileCard({ file }) {
    const handleDownload = () => {
        downloadBlob(file.blob, file.fileName);
    };

    const timeString = file.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="bg-retro-input border border-retro-shadow/30 shadow-brutal p-4 flex items-center justify-between gap-4">
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
            <button
                onClick={handleDownload}
                className="flex-shrink-0 bg-retro-olive text-white font-dos text-[10px] px-4 py-2 uppercase shadow-brutal-sm active:translate-y-[2px] active:translate-x-[2px] active:shadow-brutal-active hover:bg-retro-olive/80 flex items-center gap-2 transition-colors"
            >
                <Download className="w-3 h-3" />
                SAVE
            </button>
        </div>
    );
}
