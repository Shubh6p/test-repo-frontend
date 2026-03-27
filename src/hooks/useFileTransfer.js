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

            setTransferState(CONNECTION_STATES.COMPLETED);
            setTransferResult(result);
            return result;
        } catch (err) {
            setTransferState(CONNECTION_STATES.ERROR);
            throw err;
        }
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
            (result) => {
                setTransferState(CONNECTION_STATES.COMPLETED);
                setTransferResult(result);
            }
        );

        fileReceiverRef.current = receiver;

        dataChannel.onmessage = (event) => {
            receiver.handleData(event.data);
        };
    }, []);

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
            (result) => {
                setTransferState(CONNECTION_STATES.COMPLETED);
                setTransferResult(result);
            }
        );

        socketReceiverRef.current = receiver;
    }, []);

    const cleanupSocketReceiver = useCallback(() => {
        if (socketReceiverRef.current) {
            socketReceiverRef.current.cleanup();
            socketReceiverRef.current = null;
        }
    }, []);

    const resetTransfer = useCallback(() => {
        setTransferState(CONNECTION_STATES.IDLE);
        setProgress({
            percentage: 0,
            speed: 0,
            timeRemaining: 0,
            bytesSent: 0,
            totalBytes: 0
        });
        setTransferResult(null);
        setIsRelayMode(false);
        cleanupSocketReceiver();
    }, [cleanupSocketReceiver]);

    return {
        transferState,
        progress,
        transferResult,
        isRelayMode,
        startSending,
        startSendingViaSocket,
        startReceiving,
        startReceivingViaSocket,
        cleanupSocketReceiver,
        resetTransfer
    };
}