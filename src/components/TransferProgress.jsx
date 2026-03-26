import { formatBytes, formatSpeed, formatTime } from '../utils/helpers';

export default function TransferProgress({ progress, state, fileName }) {
    const {
        percentage = 0,
        speed = 0,
        timeRemaining = 0,
        bytesSent = 0,
        totalBytes = 0
    } = progress;

    const isComplete = state === 'completed';

    return (
        <div className="bg-retro-card border-none shadow-brutal p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-retro-shadow/20 pb-2">
                <span className="text-xs font-dos text-retro-text uppercase truncate max-w-[65%] font-bold">
                    {fileName}
                </span>
                <span className="text-sm font-dos text-retro-amber">
                    {percentage.toFixed(1)}%
                </span>
            </div>

            <div className="w-full bg-retro-shadow/30 h-6 border-2 border-retro-shadow/50 relative overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${isComplete ? 'bg-retro-olive' : 'bg-retro-amber'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            <div className="flex justify-between text-[10px] md:text-xs font-dos text-retro-gray uppercase">
                <span>{formatBytes(bytesSent)} / {formatBytes(totalBytes)}</span>
                {!isComplete && (
                    <div className="flex gap-4">
                        <span>{formatSpeed(speed)}</span>
                        <span>ETA: {formatTime(timeRemaining)}</span>
                    </div>
                )}
                {isComplete && (
                    <span className="text-retro-olive font-bold">VERIFIED OK.</span>
                )}
            </div>
        </div>
    );
}