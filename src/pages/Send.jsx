import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import DropZone from '../components/DropZone';
import RoomCodeDisplay from '../components/RoomCodeDisplay';
import TransferProgress from '../components/TransferProgress';
import ConnectionStatus from '../components/ConnectionStatus';
import { CONNECTION_STATES, WEBRTC_TIMEOUT } from '../utils/constants';

export default function Send() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [status, setStatus] = useState(CONNECTION_STATES.IDLE);
    const fileRef = useRef(null);
    const webrtcTimeoutRef = useRef(null);
    const hasStartedTransfer = useRef(false);

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
        isRelayMode,
        startSending,
        startSendingViaSocket
    } = useFileTransfer();

    useEffect(() => {
        fileRef.current = file;
    }, [file]);

    const handleAbort = () => {
        if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        cleanup();
        navigate('/');
    };

    // Fallback to socket relay
    const fallbackToRelay = useCallback(() => {
        if (hasStartedTransfer.current) return;
        hasStartedTransfer.current = true;

        console.log('[Send] WebRTC failed, falling back to Socket relay...');
        setStatus(CONNECTION_STATES.RELAY_TRANSFERRING);

        if (socket && fileRef.current) {
            startSendingViaSocket(socket, fileRef.current);
        }
    }, [socket, startSendingViaSocket]);

    const handleFileSelected = useCallback(async (selectedFile) => {
        if (!selectedFile) {
            setFile(null);
            setRoomId(null);
            setStatus(CONNECTION_STATES.IDLE);
            return;
        }

        setFile(selectedFile);
        hasStartedTransfer.current = false;

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
            hasStartedTransfer.current = false;

            try {
                await startAsSender();

                // Set timeout: if data channel doesn't open, fallback to relay
                webrtcTimeoutRef.current = setTimeout(() => {
                    if (!hasStartedTransfer.current) {
                        console.log('[Send] WebRTC timeout, switching to relay...');
                        fallbackToRelay();
                    }
                }, WEBRTC_TIMEOUT);
            } catch (err) {
                console.error('Failed to start WebRTC:', err);
                fallbackToRelay();
            }
        };

        const cleanup1 = on('peer-joined', handlePeerJoined);
        return () => {
            cleanup1();
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        };
    }, [socket, on, startAsSender, fallbackToRelay]);

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

    // WebRTC success path: data channel opened
    useEffect(() => {
        if (dataChannelOpen && dataChannel && fileRef.current && !hasStartedTransfer.current) {
            hasStartedTransfer.current = true;
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);

            console.log('[Send] DataChannel open! Sending file via WebRTC...');
            setStatus(CONNECTION_STATES.TRANSFERRING);
            startSending(dataChannel, fileRef.current);
        }
    }, [dataChannelOpen, dataChannel, startSending]);

    useEffect(() => {
        if (transferState === CONNECTION_STATES.COMPLETED) {
            setStatus(CONNECTION_STATES.COMPLETED);
        }
    }, [transferState]);

    // Watch for WebRTC connection failure to trigger relay
    useEffect(() => {
        if (connectionState === CONNECTION_STATES.DISCONNECTED && !hasStartedTransfer.current) {
            fallbackToRelay();
        }
    }, [connectionState, fallbackToRelay]);

    const showDropZone = !roomId;
    const showRoomCode = roomId && status === CONNECTION_STATES.WAITING;
    const showProgress = [
        CONNECTION_STATES.CONNECTING,
        CONNECTION_STATES.CONNECTED,
        CONNECTION_STATES.TRANSFERRING,
        CONNECTION_STATES.RELAY_TRANSFERRING,
        CONNECTION_STATES.COMPLETED
    ].includes(status);

    return (
        <div className="bg-retro-card shadow-brutal border border-retro-shadow/20 p-6 md:p-10 space-y-8 max-w-2xl mx-auto relative mt-4">
            {/* Floppy slider detail */}
            <div className="absolute top-0 left-6 w-16 h-8 bg-gray-200 border-x-2 border-b-2 border-gray-300"></div>

            <div className="flex items-center justify-between border-b-2 border-retro-shadow/30 pb-4 mt-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-dos font-bold text-retro-text uppercase">HOST SESSION</h1>
                    {[CONNECTION_STATES.WAITING, CONNECTION_STATES.CONNECTING, CONNECTION_STATES.TRANSFERRING, CONNECTION_STATES.RELAY_TRANSFERRING].includes(status) && (
                        <button
                            onClick={handleAbort}
                            className="bg-red-600/10 text-red-600 border border-red-600 font-dos text-[10px] px-3 py-1 uppercase transition-transform active:translate-y-[2px] active:translate-x-[2px] shadow-sm hover:bg-red-600 hover:text-white"
                        >
                            ABORT
                        </button>
                    )}
                </div>
                <ConnectionStatus state={status} />
            </div>

            {isRelayMode && (
                <div className="bg-amber-100 border border-amber-400 p-3 text-center font-dos text-[10px] text-amber-800 uppercase">
                    ⚡ RELAY MODE — File routed via server (WebRTC unavailable)
                </div>
            )}

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
                <div className="text-center p-6 bg-retro-input border border-retro-shadow shadow-brutal mt-4">
                    <p className="text-retro-text text-lg font-dos mb-2 font-bold uppercase">
                        FILE UPLOAD SEQUENCE COMPLETE
                    </p>
                    <p className="text-retro-gray text-xs font-mono uppercase">
                        Target has received the datablock.
                    </p>
                </div>
            )}

            {status === CONNECTION_STATES.ERROR && (
                <div className="text-center p-6 bg-red-100 border border-red-300 shadow-brutal mt-4">
                    <p className="text-red-800 font-dos text-sm mb-4 uppercase">CRITICAL UPLINK FAILURE</p>
                    <button
                        onClick={() => {
                            cleanup();
                            setFile(null);
                            setRoomId(null);
                            setStatus(CONNECTION_STATES.IDLE);
                            hasStartedTransfer.current = false;
                        }}
                        className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-black"
                    >
                        RESTART SEQUENCE
                    </button>
                </div>
            )}

            {status === CONNECTION_STATES.DISCONNECTED && (
                <div className="text-center p-6 bg-yellow-100 border border-yellow-300 shadow-brutal mt-4">
                    <p className="text-yellow-800 font-dos text-sm mb-4 uppercase">TARGET DISCONNECTED</p>
                    <button
                        onClick={() => {
                            cleanup();
                            setFile(null);
                            setRoomId(null);
                            setStatus(CONNECTION_STATES.IDLE);
                            hasStartedTransfer.current = false;
                        }}
                        className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-black"
                    >
                        RESTART SEQUENCE
                    </button>
                </div>
            )}
            
            {/* Footer detail */}
            <div className="mt-8 pt-4 border-t-2 border-retro-shadow/40 flex justify-between items-end">
                <div className="font-dos text-[10px] text-retro-gray uppercase">
                    <div>OPERATION</div>
                    <div className="text-retro-text">CREATE.BIN</div>
                </div>
                <div className="w-4 h-4 bg-retro-brown"></div>
            </div>
        </div>
    );
}