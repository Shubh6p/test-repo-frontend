import { formatBytes, getFileIcon } from '../utils/helpers';

export default function FileInfo({ fileInfo }) {
    return (
        <div className="bg-retro-input border border-retro-shadow/20 shadow-brutal p-4 flex items-center gap-4">
            <span className="text-3xl border-r-2 border-retro-shadow/30 pr-4">{getFileIcon(fileInfo.type)}</span>
            <div className="min-w-0 flex-1">
                <p className="text-retro-text font-dos text-sm uppercase truncate font-bold">{fileInfo.name}</p>
                <p className="text-xs font-mono text-retro-gray mt-1">{formatBytes(fileInfo.size)} - READY FOR SYNC</p>
            </div>
        </div>
    );
}