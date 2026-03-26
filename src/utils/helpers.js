export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSecond) {
    return formatBytes(bytesPerSecond) + '/s';
}

export function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFileIcon(type) {
    if (!type) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('text')) return '📝';
    return '📄';
}

export function formatProgress(sent, total) {
    if (total === 0) return 0;
    return Math.min(100, (sent / total) * 100).toFixed(1);
}

export function checkWebRTCSupport() {
    const hasRTC = !!window.RTCPeerConnection;
    const hasFileReader = !!window.FileReader;
    const hasBlob = !!window.Blob;

    return {
        supported: hasRTC && hasFileReader && hasBlob,
        checks: {
            rtcPeerConnection: hasRTC,
            fileReader: hasFileReader,
            blob: hasBlob
        }
    };
}