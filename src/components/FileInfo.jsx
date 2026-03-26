import { formatBytes, getFileIcon } from '../utils/helpers';

export default function FileInfo({ fileInfo }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">{getFileIcon(fileInfo.type)}</span>
            <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{fileInfo.name}</p>
                <p className="text-sm text-gray-500">{formatBytes(fileInfo.size)}</p>
            </div>
        </div>
    );
}