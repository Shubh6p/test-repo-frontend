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

    // Session state
    const [roomId, setRoomId] = useState(null);
    const [status, setStatus] = useState(CONNECTION_STATES.IDLE);
    const [peerConnected, setPeerConnected] = useState(false);
    const [transferCount, setTransferCount] = useState(0);

    // File state (per-transfer, resets for each new file)
    const [file, setFile] = useState(null);
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
        startSendingViaSocket,
        resetForNext
    } = useFileTransfer();

    useEffect(() => {
        fileRef.current = file;
    }, [file]);

    const handleAbort = () => {
        if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        cleanup();
        navigate('/');
    };

    // Step 1: Create room immediately (no file required)
    const handleCreateRoom = useCallback(async () => {
        try {
            const response = await emit('create-room', null);
            setRoomId(response.roomId);
            setStatus(CONNECTION_STATES.WAITING);
        } catch (err) {
            console.error('Failed to create room:', err);
            setStatus(CONNECTION_STATES.ERROR);
        }
    }, [emit]);

    // Auto-create room on mount
    useEffect(() => {
        if (isConnected && !roomId) {
            handleCreateRoom();
        }
    }, [isConnected, roomId, handleCreateRoom]);

    // Fallback to socket relay
    const fallbackToRelay = useCallback(() => {
        if (hasStartedTransfer.current) return;
        console.log('[Send] WebRTC failed, falling back to Socket relay...');
        setPeerConnected(true);
        setStatus(CONNECTION_STATES.CONNECTED);
    }, []);

    // Step 2: Peer joins → start WebRTC
    useEffect(() => {
        if (!socket) return;

        const handlePeerJoined = async () => {
            console.log('[Send] Peer joined! Starting WebRTC...');
            setStatus(CONNECTION_STATES.CONNECTING);
            hasStartedTransfer.current = false;

            try {
                await startAsSender();

                webrtcTimeoutRef.current = setTimeout(() => {
                    if (!dataChannelOpen) {
                        console.log('[Send] WebRTC timeout, falling back...');
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
    }, [socket, on, startAsSender, fallbackToRelay, dataChannelOpen]);

    // Signal handlers
    useEffect(() => {
        if (!socket) return;

        const cleanupAnswer = on('signal-answer', (data) => {
            onAnswer(data.answer);
        });

        const cleanupIce = on('signal-ice-candidate', (data) => {
            onIceCandidate(data.candidate);
        });

        const cleanupDisconnect = on('peer-disconnected', () => {
            setPeerConnected(false);
            setStatus(CONNECTION_STATES.DISCONNECTED);
        });

        return () => {
            cleanupAnswer();
            cleanupIce();
            cleanupDisconnect();
        };
    }, [socket, on, onAnswer, onIceCandidate]);

    // WebRTC success: data channel opened
    useEffect(() => {
        if (dataChannelOpen && dataChannel) {
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
            console.log('[Send] DataChannel open! Peer connected.');
            setPeerConnected(true);
            setStatus(CONNECTION_STATES.CONNECTED);
        }
    }, [dataChannelOpen, dataChannel]);

    // Watch for connection failure
    useEffect(() => {
        if (connectionState === CONNECTION_STATES.DISCONNECTED && !peerConnected) {
            fallbackToRelay();
        }
    }, [connectionState, fallbackToRelay, peerConnected]);

    // Step 3: User selects a file & send it
    const handleFileSelected = useCallback((selectedFile) => {
        if (!selectedFile) {
            setFile(null);
            return;
        }
        setFile(selectedFile);
    }, []);

    const handleSendFile = useCallback(() => {
        if (!file) return;
        hasStartedTransfer.current = true;
        setStatus(CONNECTION_STATES.TRANSFERRING);

        if (dataChannelOpen && dataChannel) {
            startSending(dataChannel, file);
        } else if (socket) {
            startSendingViaSocket(socket, file);
        }
    }, [file, dataChannelOpen, dataChannel, socket, startSending, startSendingViaSocket]);

    // Step 4: Transfer complete
    useEffect(() => {
        if (transferState === CONNECTION_STATES.COMPLETED) {
            setStatus(CONNECTION_STATES.COMPLETED);
            setTransferCount(prev => prev + 1);
        }
    }, [transferState]);

    // Send another file
    const handleSendMore = () => {
        setFile(null);
        fileRef.current = null;
        hasStartedTransfer.current = false;
        resetForNext();
        setStatus(CONNECTION_STATES.CONNECTED);
    };

    // UI Phases
    const isWaiting = !peerConnected && status === CONNECTION_STATES.WAITING;
    const isConnecting = !peerConnected && status === CONNECTION_STATES.CONNECTING;
    const isReady = peerConnected && !file && transferState !== CONNECTION_STATES.COMPLETED;
    const hasFile = peerConnected && file && transferState !== CONNECTION_STATES.TRANSFERRING && transferState !== CONNECTION_STATES.RELAY_TRANSFERRING && transferState !== CONNECTION_STATES.COMPLETED;
    const isTransferring = [CONNECTION_STATES.TRANSFERRING, CONNECTION_STATES.RELAY_TRANSFERRING].includes(transferState) && transferState !== CONNECTION_STATES.COMPLETED;
    const isComplete = transferState === CONNECTION_STATES.COMPLETED;

    return (
        <div className="bg-retro-card shadow-brutal border border-retro-shadow/20 p-6 md:p-10 space-y-8 max-w-2xl mx-auto relative mt-4">
            <div className="absolute top-0 left-6 w-16 h-8 bg-gray-200 border-x-2 border-b-2 border-gray-300"></div>

            <div className="flex items-center justify-between border-b-2 border-retro-shadow/30 pb-4 mt-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-dos font-bold text-retro-text uppercase">HOST SESSION</h1>
                    {![CONNECTION_STATES.IDLE, CONNECTION_STATES.COMPLETED, CONNECTION_STATES.DISCONNECTED, CONNECTION_STATES.ERROR].includes(status) && (
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

            {/* Phase 1: Waiting for peer */}
            {(isWaiting || isConnecting) && roomId && (
                <RoomCodeDisplay roomId={roomId} />
            )}

            {/* Phase 2: Peer connected, select file */}
            {isReady && (
                <div className="space-y-4">
                    <div className="bg-retro-olive/10 border border-retro-olive p-4 text-center font-dos text-xs text-retro-olive uppercase">
                        ✓ PEER CONNECTED — SELECT A FILE TO TRANSMIT
                    </div>
                    <DropZone
                        onFileSelected={handleFileSelected}
                        selectedFile={null}
                        disabled={false}
                    />
                </div>
            )}

            {/* Phase 2b: File selected, ready to send */}
            {hasFile && (
                <div className="space-y-4">
                    <DropZone
                        onFileSelected={handleFileSelected}
                        selectedFile={file}
                        disabled={false}
                    />
                    <button
                        onClick={handleSendFile}
                        className="w-full bg-retro-olive text-white font-dos text-sm py-4 uppercase shadow-brutal active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-retro-olive/80 transition-colors"
                    >
                        ▸ TRANSMIT DATABLOCK
                    </button>
                </div>
            )}

            {/* Phase 3: Transferring */}
            {isTransferring && file && (
                <TransferProgress
                    progress={progress}
                    state={transferState}
                    fileName={file.name}
                />
            )}

            {/* Phase 4: Complete */}
            {isComplete && (
                <div className="space-y-4">
                    <div className="text-center p-6 bg-retro-input border border-retro-shadow shadow-brutal">
                        <p className="text-retro-text text-lg font-dos mb-2 font-bold uppercase">
                            FILE UPLOAD COMPLETE
                        </p>
                        <p className="text-retro-gray text-xs font-mono uppercase">
                            {transferCount} file{transferCount > 1 ? 's' : ''} transmitted this session
                        </p>
                    </div>
                    <button
                        onClick={handleSendMore}
                        className="w-full bg-retro-amber text-retro-terminal font-dos text-sm py-4 uppercase shadow-brutal active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-retro-amber/80 transition-colors"
                    >
                        ▸ SEND ANOTHER FILE
                    </button>
                </div>
            )}

            {status === CONNECTION_STATES.ERROR && (
                <div className="text-center p-6 bg-red-100 border border-red-300 shadow-brutal mt-4">
                    <p className="text-red-800 font-dos text-sm mb-4 uppercase">CRITICAL UPLINK FAILURE</p>
                    <button
                        onClick={() => {
                            cleanup();
                            navigate('/');
                        }}
                        className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-black"
                    >
                        RETURN TO BASE
                    </button>
                </div>
            )}

            {status === CONNECTION_STATES.DISCONNECTED && (
                <div className="text-center p-6 bg-yellow-100 border border-yellow-300 shadow-brutal mt-4">
                    <p className="text-yellow-800 font-dos text-sm mb-4 uppercase">TARGET DISCONNECTED</p>
                    <button
                        onClick={() => {
                            cleanup();
                            navigate('/');
                        }}
                        className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-black"
                    >
                        RETURN TO BASE
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