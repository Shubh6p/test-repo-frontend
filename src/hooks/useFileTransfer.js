import { useState, useCallback, useRef } from 'react';
import { sendFile, FileReceiver } from '../services/fileHandler';
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
    const fileReceiverRef = useRef(null);

    const startSending = useCallback(async (dataChannel, file) => {
        setTransferState(CONNECTION_STATES.TRANSFERRING);

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

    const startReceiving = useCallback((dataChannel) => {
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
    }, []);

    return {
        transferState,
        progress,
        transferResult,
        startSending,
        startReceiving,
        resetTransfer
    };
}