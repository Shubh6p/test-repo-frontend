import { useState, useCallback, useRef } from 'react';
import { sendFile, FileReceiver } from '../services/fileHandler';
import { sendFileViaSocket, SocketFileReceiver } from '../services/socketRelay';
import { CONNECTION_STATES } from '../utils/constants';

export function useFileTransfer() {
    const [transferState, setTransferState] = useState(CONNECTION_STATES.IDLE);
    const [progress, setProgress] = useState({
        percentage: 0,
        speed: 0,
        timeRemaining: 0,
        bytesSent: 0,
        totalBytes: 0
    });
    const [transferResult, setTransferResult] = useState(null);
    const [isRelayMode, setIsRelayMode] = useState(false);
    const [receivedFiles, setReceivedFiles] = useState([]);
    const [sentFiles, setSentFiles] = useState([]);
    const fileReceiverRef = useRef(null);
    const socketReceiverRef = useRef(null);

    // WebRTC DataChannel send
    const startSending = useCallback(async (dataChannel, file) => {
        setTransferState(CONNECTION_STATES.TRANSFERRING);
        setIsRelayMode(false);

        try {
            const result = await sendFile(dataChannel, file, (prog) => {
                setProgress(prog);
            });

            // Track sent file
            const sentEntry = {
                id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
                fileName: file.name,
                totalBytes: file.size,
                mimeType: file.type,
                duration: result.duration,
                speed: result.speed,
                timestamp: new Date()
            };
            setSentFiles(prev => [...prev, sentEntry]);

            setTransferState(CONNECTION_STATES.COMPLETED);
            setTransferResult(result);
            return result;
        } catch (err) {
            setTransferState(CONNECTION_STATES.ERROR);
            throw err;
        }
    }, []);

    // Socket.io relay send
    const startSendingViaSocket = useCallback(async (socket, file) => {
        setTransferState(CONNECTION_STATES.RELAY_TRANSFERRING);
        setIsRelayMode(true);

        try {
            const result = await sendFileViaSocket(socket, file, (prog) => {
                setProgress(prog);
            });

            const sentEntry = {
                id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
                fileName: file.name,
                totalBytes: file.size,
                mimeType: file.type,
                duration: result.duration,
                speed: result.speed,
                timestamp: new Date()
            };
            setSentFiles(prev => [...prev, sentEntry]);

            setTransferState(CONNECTION_STATES.COMPLETED);
            setTransferResult(result);
            return result;
        } catch (err) {
            setTransferState(CONNECTION_STATES.ERROR);
            throw err;
        }
    }, []);

    // Handler for file received (adds to list)
    const handleFileComplete = useCallback((result) => {
        const fileEntry = {
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            fileName: result.fileName,
            totalBytes: result.totalBytes,
            mimeType: result.mimeType,
            duration: result.duration,
            speed: result.speed,
            blob: result.blob,
            timestamp: new Date()
        };

        setReceivedFiles(prev => [...prev, fileEntry]);
        setTransferState(CONNECTION_STATES.COMPLETED);
        setTransferResult(result);
    }, []);

    // WebRTC DataChannel receive
    const startReceiving = useCallback((dataChannel) => {
        setIsRelayMode(false);
        const receiver = new FileReceiver(
            (prog) => {
                setProgress({
                    ...prog,
                    bytesSent: prog.bytesReceived,
                });
                setTransferState(CONNECTION_STATES.TRANSFERRING);
            },
            handleFileComplete
        );

        fileReceiverRef.current = receiver;

        dataChannel.onmessage = (event) => {
            receiver.handleData(event.data);
        };
    }, [handleFileComplete]);

    // Socket.io relay receive
    const startReceivingViaSocket = useCallback((socket) => {
        setIsRelayMode(true);
        setTransferState(CONNECTION_STATES.RELAY_TRANSFERRING);

        const receiver = new SocketFileReceiver(
            socket,
            (prog) => {
                setProgress({
                    ...prog,
                    bytesSent: prog.bytesReceived,
                });
                setTransferState(CONNECTION_STATES.RELAY_TRANSFERRING);
            },
            handleFileComplete
        );

        socketReceiverRef.current = receiver;
    }, [handleFileComplete]);

    const cleanupSocketReceiver = useCallback(() => {
        if (socketReceiverRef.current) {
            socketReceiverRef.current.cleanup();
            socketReceiverRef.current = null;
        }
    }, []);

    // Reset for sending another file (keeps history)
    const resetForNext = useCallback(() => {
        setTransferState(CONNECTION_STATES.IDLE);
        setProgress({
            percentage: 0,
            speed: 0,
            timeRemaining: 0,
            bytesSent: 0,
            totalBytes: 0
        });
        setTransferResult(null);
    }, []);

    // Full reset
    const resetTransfer = useCallback(() => {
        resetForNext();
        setIsRelayMode(false);
        setReceivedFiles([]);
        setSentFiles([]);
        cleanupSocketReceiver();
    }, [resetForNext, cleanupSocketReceiver]);

    return {
        transferState,
        progress,
        transferResult,
        isRelayMode,
        receivedFiles,
        sentFiles,
        startSending,
        startSendingViaSocket,
        startReceiving,
        startReceivingViaSocket,
        cleanupSocketReceiver,
        resetForNext,
        resetTransfer
    };
}