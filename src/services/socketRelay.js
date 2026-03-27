import { RELAY_CHUNK_SIZE } from '../utils/constants';

/**
 * Socket.io Relay: Sends file chunks through the signaling server
 * as a fallback when WebRTC DataChannel fails.
 * Uses acknowledgment-based flow control (no buffer overflow possible).
 */
export function sendFileViaSocket(socket, file, onProgress) {
    return new Promise((resolve, reject) => {
        const totalChunks = Math.ceil(file.size / RELAY_CHUNK_SIZE);
        let currentChunk = 0;
        let bytesSent = 0;
        const startTime = Date.now();

        // Step 1: Send metadata
        socket.emit('relay-metadata', {
            name: file.name,
            size: file.size,
            mimeType: file.type,
            totalChunks,
            chunkSize: RELAY_CHUNK_SIZE
        });

        const fileReader = new FileReader();
        let offset = 0;

        function readNextChunk() {
            if (offset >= file.size) {
                socket.emit('relay-complete');
                const duration = (Date.now() - startTime) / 1000;
                resolve({
                    totalBytes: file.size,
                    duration,
                    speed: file.size / duration
                });
                return;
            }

            const slice = file.slice(offset, offset + RELAY_CHUNK_SIZE);
            fileReader.readAsArrayBuffer(slice);
        }

        fileReader.onload = (event) => {
            try {
                const arrayBuffer = event.target.result;
                // Convert to base64 for socket transport
                const uint8 = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < uint8.byteLength; i++) {
                    binary += String.fromCharCode(uint8[i]);
                }
                const base64 = btoa(binary);

                // Send with acknowledgment callback for flow control
                socket.emit('relay-chunk', {
                    data: base64,
                    index: currentChunk
                }, () => {
                    // Ack received — safe to send next chunk
                    bytesSent += arrayBuffer.byteLength;
                    currentChunk++;
                    offset += RELAY_CHUNK_SIZE;

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

                    readNextChunk();
                });
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

/**
 * Socket.io Relay: Receives file chunks through the signaling server.
 */
export class SocketFileReceiver {
    constructor(socket, onProgress, onComplete) {
        this.socket = socket;
        this.chunks = [];
        this.receivedBytes = 0;
        this.metadata = null;
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.startTime = null;
        this._handlers = {};

        this._bind();
    }

    _bind() {
        this._handlers.metadata = (data) => {
            this.metadata = data;
            this.startTime = Date.now();
            console.log('[SocketRelay] Metadata:', data);
        };

        this._handlers.chunk = (data, ack) => {
            // Decode base64 back to ArrayBuffer
            const binary = atob(data.data);
            const uint8 = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                uint8[i] = binary.charCodeAt(i);
            }
            const buffer = uint8.buffer;

            this.chunks.push(buffer);
            this.receivedBytes += buffer.byteLength;

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

            // Acknowledge receipt to release sender
            if (typeof ack === 'function') ack();
        };

        this._handlers.complete = () => {
            this.assembleAndDownload();
        };

        this.socket.on('relay-metadata', this._handlers.metadata);
        this.socket.on('relay-chunk', this._handlers.chunk);
        this.socket.on('relay-complete', this._handlers.complete);
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

    cleanup() {
        this.socket.off('relay-metadata', this._handlers.metadata);
        this.socket.off('relay-chunk', this._handlers.chunk);
        this.socket.off('relay-complete', this._handlers.complete);
    }
}
