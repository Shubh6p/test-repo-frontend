import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import DropZone from '../components/DropZone';
import RoomCodeDisplay from '../components/RoomCodeDisplay';
import TransferProgress from '../components/TransferProgress';
import ConnectionStatus from '../components/ConnectionStatus';
import { CONNECTION_STATES } from '../utils/constants';

export default function Send() {
    const [file, setFile] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [status, setStatus] = useState(CONNECTION_STATES.IDLE);
    const fileRef = useRef(null);

    const { socket, isConnected, emit, on } = useSocket();
    const {
        dataChannel,
        connectionState,
        dataChannelOpen,
        startAsSender,
        onAnswer,
        onIceCandidate,
        cleanup
    } = useWebRTC(socket);
    const {
        transferState,
        progress,
        transferResult,
        startSending
    } = useFileTransfer();

    useEffect(() => {
        fileRef.current = file;
    }, [file]);

    const handleFileSelected = useCallback(async (selectedFile) => {
        if (!selectedFile) {
            setFile(null);
            setRoomId(null);
            setStatus(CONNECTION_STATES.IDLE);
            return;
        }

        setFile(selectedFile);

        try {
            const response = await emit('create-room', {
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type
            });

            setRoomId(response.roomId);
            setStatus(CONNECTION_STATES.WAITING);
        } catch (err) {
            console.error('Failed to create room:', err);
            setStatus(CONNECTION_STATES.ERROR);
        }
    }, [emit]);

    useEffect(() => {
        if (!socket) return;

        const handlePeerJoined = async () => {
            console.log('[Send] Peer joined! Starting WebRTC...');
            setStatus(CONNECTION_STATES.CONNECTING);

            try {
                await startAsSender();
            } catch (err) {
                console.error('Failed to start WebRTC:', err);
                setStatus(CONNECTION_STATES.ERROR);
            }
        };

        const cleanup1 = on('peer-joined', handlePeerJoined);
        return cleanup1;
    }, [socket, on, startAsSender]);

    useEffect(() => {
        if (!socket) return;

        const cleanupAnswer = on('signal-answer', (data) => {
            onAnswer(data.answer);
        });

        const cleanupIce = on('signal-ice-candidate', (data) => {
            onIceCandidate(data.candidate);
        });

        const cleanupDisconnect = on('peer-disconnected', () => {
            setStatus(CONNECTION_STATES.DISCONNECTED);
        });

        return () => {
            cleanupAnswer();
            cleanupIce();
            cleanupDisconnect();
        };
    }, [socket, on, onAnswer, onIceCandidate]);

    useEffect(() => {
        if (dataChannelOpen && dataChannel && fileRef.current) {
            console.log('[Send] DataChannel open! Sending file...');
            setStatus(CONNECTION_STATES.TRANSFERRING);
            startSending(dataChannel, fileRef.current);
        }
    }, [dataChannelOpen, dataChannel, startSending]);

    useEffect(() => {
        if (transferState === CONNECTION_STATES.COMPLETED) {
            setStatus(CONNECTION_STATES.COMPLETED);
        }
    }, [transferState]);

    const showDropZone = !roomId;
    const showRoomCode = roomId && status === CONNECTION_STATES.WAITING;
    const showProgress = [
        CONNECTION_STATES.CONNECTING,
        CONNECTION_STATES.CONNECTED,
        CONNECTION_STATES.TRANSFERRING,
        CONNECTION_STATES.COMPLETED
    ].includes(status);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Send a File</h1>
                <ConnectionStatus state={status} />
            </div>

            <DropZone
                onFileSelected={handleFileSelected}
                selectedFile={file}
                disabled={status !== CONNECTION_STATES.IDLE}
            />

            {showRoomCode && <RoomCodeDisplay roomId={roomId} />}

            {showProgress && file && (
                <TransferProgress
                    progress={progress}
                    state={transferState}
                    fileName={file.name}
                />
            )}

            {status === CONNECTION_STATES.COMPLETED && (
                <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <p className="text-green-400 text-lg font-medium">
                        🎉 File sent successfully!
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        The receiver has downloaded the file.
                    </p>
                </div>
            )}

            {status === CONNECTION_STATES.ERROR && (
                <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-red-400">Connection failed. Please try again.</p>
                    <button
                        onClick={() => {
                            cleanup();
                            setFile(null);
                            setRoomId(null);
                            setStatus(CONNECTION_STATES.IDLE);
                        }}
                        className="mt-3 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            )}

            {status === CONNECTION_STATES.DISCONNECTED && (
                <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-red-400">Receiver disconnected.</p>
                    <button
                        onClick={() => {
                            cleanup();
                            setFile(null);
                            setRoomId(null);
                            setStatus(CONNECTION_STATES.IDLE);
                        }}
                        className="mt-3 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            )}
        </div>
    );
}