import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket } from '../services/socket';

// Helper to get or create a persistent session ID
const getSessionId = () => {
    let id = localStorage.getItem('klickshare_session_id');
    if (!id) {
        id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('klickshare_session_id', id);
    }
    return id;
};

export function useSocket() {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const sessionId = useRef(getSessionId());

    useEffect(() => {
        const socket = connectSocket();
        socketRef.current = socket;

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        setIsConnected(socket.connected);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    const emit = useCallback((event, data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                reject(new Error('Socket not connected'));
                return;
            }
            socketRef.current.emit(event, data, (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }, []);

    const on = useCallback((event, handler) => {
        socketRef.current?.on(event, handler);
        return () => socketRef.current?.off(event, handler);
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        sessionId: sessionId.current,
        emit,
        on
    };
}