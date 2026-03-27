import { CHUNK_SIZE, BUFFER_THRESHOLD } from '../utils/constants';

// SENDER: Send file in chunks
export function sendFile(dataChannel, file, onProgress) {
    return new Promise((resolve, reject) => {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let currentChunk = 0;
        let bytesSent = 0;
        const startTime = Date.now();

        // Step 1: Send metadata
        const metadata = JSON.stringify({
            type: 'metadata',
            name: file.name,
            size: file.size,
            mimeType: file.type,
            totalChunks: totalChunks,
            chunkSize: CHUNK_SIZE
        });
        dataChannel.send(metadata);

        // Step 2: Read and send chunks
        const fileReader = new FileReader();
        let offset = 0;

        function readNextChunk() {
            if (offset >= file.size) {
                // Step 3: Send completion signal
                dataChannel.send(JSON.stringify({ type: 'complete' }));

                const duration = (Date.now() - startTime) / 1000;
                resolve({
                    totalBytes: file.size,
                    duration: duration,
                    speed: file.size / duration
                });
                return;
            }

            // Handle backpressure heavily
            if (dataChannel.bufferedAmount > BUFFER_THRESHOLD) {
                setTimeout(readNextChunk, 50);
                return;
            }

            const slice = file.slice(offset, offset + CHUNK_SIZE);
            fileReader.readAsArrayBuffer(slice);
        }

        fileReader.onload = (event) => {
            try {
                if (dataChannel.readyState !== 'open') {
                    reject(new Error('DataChannel closed unexpectedly'));
                    return;
                }

                dataChannel.send(event.target.result);

                bytesSent += event.target.result.byteLength;
                currentChunk++;
                offset += CHUNK_SIZE;

                const elapsed = (Date.now() - startTime) / 1000;
                const speed = elapsed > 0 ? bytesSent / elapsed : 0;
                const remaining = speed > 0 ? (file.size - bytesSent) / speed : 0;

                onProgress({
                    bytesSent,
                    totalBytes: file.size,
                    percentage: (bytesSent / file.size) * 100,
                    speed,
                    timeRemaining: remaining,
                    currentChunk,
                    totalChunks
                });

                // Crucial fix: always yield to the event loop to prevent 100% thread lock
                // and to avoid flooding the SCTP socket directly to MTU burst limits
                setTimeout(readNextChunk, 2);
            } catch (err) {
                reject(err);
            }
        };

        fileReader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        readNextChunk();
    });
}

// RECEIVER: Collect chunks and download
export class FileReceiver {
    constructor(onProgress, onComplete) {
        this.chunks = [];
        this.receivedBytes = 0;
        this.metadata = null;
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.startTime = null;
    }

    handleData(data) {
        // JSON string = control message
        if (typeof data === 'string') {
            const message = JSON.parse(data);

            if (message.type === 'metadata') {
                this.metadata = message;
                this.startTime = Date.now();
                console.log('[FileReceiver] Metadata:', message);
                return;
            }

            if (message.type === 'complete') {
                this.assembleAndDownload();
                return;
            }

            return;
        }

        // ArrayBuffer = file chunk
        if (data instanceof ArrayBuffer) {
            this.chunks.push(data);
            this.receivedBytes += data.byteLength;

            const elapsed = (Date.now() - this.startTime) / 1000;
            const speed = elapsed > 0 ? this.receivedBytes / elapsed : 0;
            const remaining = speed > 0
                ? (this.metadata.size - this.receivedBytes) / speed
                : 0;

            this.onProgress({
                bytesReceived: this.receivedBytes,
                totalBytes: this.metadata.size,
                percentage: (this.receivedBytes / this.metadata.size) * 100,
                speed,
                timeRemaining: remaining,
                currentChunk: this.chunks.length,
                totalChunks: this.metadata.totalChunks
            });
        }
    }

    assembleAndDownload() {
        const blob = new Blob(this.chunks, {
            type: this.metadata.mimeType || 'application/octet-stream'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.metadata.name;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        const duration = (Date.now() - this.startTime) / 1000;
        this.onComplete({
            fileName: this.metadata.name,
            totalBytes: this.metadata.size,
            duration,
            speed: this.metadata.size / duration
        });

        this.chunks = [];
    }
}