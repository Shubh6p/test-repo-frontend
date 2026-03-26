export const CHUNK_SIZE = 16 * 1024; // 16KB per chunk (Maximum optimal compatibility size for cross-network WebRTC)

export const BUFFER_THRESHOLD = 64 * 1024; // 64KB Buffer Bloat Prevention

export const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
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
    DISCONNECTED: 'disconnected'
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB