import { CHUNK_SIZE, BUFFER_THRESHOLD, BUFFER_LOW_THRESHOLD } from '../utils/constants';

// SENDER: Send file in chunks with event-driven backpressure
export function sendFile(dataChannel, file, onProgress) {
    return new Promise((resolve, reject) => {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let currentChunk = 0;
        let bytesSent = 0;
        const startTime = Date.now();

        // Configure event-driven backpressure
        dataChannel.bufferedAmountLowThreshold = BUFFER_LOW_THRESHOLD;

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
        let paused = false;

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

            // Guard: ensure channel is still open
            if (dataChannel.readyState !== 'open') {
                reject(new Error('DataChannel closed unexpectedly'));
                return;
            }

            // Event-driven backpressure: if buffer is full, pause and wait for drain event
            if (dataChannel.bufferedAmount > BUFFER_THRESHOLD) {
                paused = true;
                return; // onbufferedamountlow will resume
            }

            const slice = file.slice(offset, offset + CHUNK_SIZE);
            fileReader.readAsArrayBuffer(slice);
        }

        // Resume sending when buffer drains
        dataChannel.onbufferedamountlow = () => {
            if (paused) {
                paused = false;
                readNextChunk();
            }
        };

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

                // Yield to event loop then continue
                setTimeout(readNextChunk, 0);
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
            try {
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
            } catch (e) {
                console.error('[FileReceiver] Failed to parse message:', e);
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