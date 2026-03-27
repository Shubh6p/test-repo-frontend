export const CHUNK_SIZE = 16 * 1024; // 16KB per chunk

export const BUFFER_THRESHOLD = 64 * 1024; // 64KB

// bufferedAmountLowThreshold for event-driven backpressure
export const BUFFER_LOW_THRESHOLD = 16 * 1024; // 16KB

export const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        // Metered.ca free TURN servers (reliable, 50GB/month free tier)
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'e8dd65e92f9a0e3b1c79c275',
            credential: '5W14cMkESimu4fU+'
        },
        {
            urls: 'turn:a.relay.metered.ca:80?transport=tcp',
            username: 'e8dd65e92f9a0e3b1c79c275',
            credential: '5W14cMkESimu4fU+'
        },
        {
            urls: 'turn:a.relay.metered.ca:443',
            username: 'e8dd65e92f9a0e3b1c79c275',
            credential: '5W14cMkESimu4fU+'
        },
        {
            urls: 'turn:a.relay.metered.ca:443?transport=tcp',
            username: 'e8dd65e92f9a0e3b1c79c275',
            credential: '5W14cMkESimu4fU+'
        },
        {
            urls: 'turns:a.relay.metered.ca:443?transport=tcp',
            username: 'e8dd65e92f9a0e3b1c79c275',
            credential: '5W14cMkESimu4fU+'
        }
    ],
    iceCandidatePoolSize: 10
};

export const DATA_CHANNEL_OPTIONS = {
    ordered: true,
};

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://test-repo-lf3m.onrender.com';

export const CONNECTION_STATES = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    WAITING: 'waiting',
    CONNECTED: 'connected',
    TRANSFERRING: 'transferring',
    COMPLETED: 'completed',
    ERROR: 'error',
    DISCONNECTED: 'disconnected',
    RELAY_CONNECTING: 'relay_connecting',
    RELAY_TRANSFERRING: 'relay_transferring'
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

// WebRTC connection timeout before falling back to socket relay (ms)
export const WEBRTC_TIMEOUT = 8000;

// Max relay chunk size for Socket.io fallback (base64 adds ~33% overhead)
export const RELAY_CHUNK_SIZE = 64 * 1024; // 64KB raw -> ~85KB base64