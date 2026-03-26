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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 truncate max-w-[70%]">
                    {fileName}
                </span>
                <span className="text-sm font-mono text-white">
                    {percentage.toFixed(1)}%
                </span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
                <span>{formatBytes(bytesSent)} / {formatBytes(totalBytes)}</span>
                {!isComplete && (
                    <>
                        <span>{formatSpeed(speed)}</span>
                        <span>ETA: {formatTime(timeRemaining)}</span>
                    </>
                )}
                {isComplete && (
                    <span className="text-green-400 font-medium">✓ Transfer Complete</span>
                )}
            </div>
        </div>
    );
}