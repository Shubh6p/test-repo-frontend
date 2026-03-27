import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { useToast } from '../hooks/useToast';
import DropZone from '../components/DropZone';
import RoomCodeDisplay from '../components/RoomCodeDisplay';
import TransferProgress from '../components/TransferProgress';
import ConnectionStatus from '../components/ConnectionStatus';
import SentFileCard from '../components/SentFileCard';
import ToastContainer from '../components/Toast';
import { CONNECTION_STATES, WEBRTC_TIMEOUT } from '../utils/constants';

export default function Send() {
    const navigate = useNavigate();
    const toast = useToast();

    const [roomId, setRoomId] = useState(null);
    const [status, setStatus] = useState(CONNECTION_STATES.IDLE);
    const [peerConnected, setPeerConnected] = useState(false);

    const [file, setFile] = useState(null);
    const fileRef = useRef(null);
    const webrtcTimeoutRef = useRef(null);
    const hasStartedTransfer = useRef(false);
    const dataChannelOpenRef = useRef(false);
    const toastFiredRef = useRef({});

    const { socket, isConnected, sessionId, emit, on } = useSocket();
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
        sentFiles,
        startSending,
        startSendingViaSocket,
        resetForNext
    } = useFileTransfer();

    useEffect(() => {
        fileRef.current = file;
    }, [file]);

    // Keep ref in sync with state so timeout closures read current value
    useEffect(() => {
        dataChannelOpenRef.current = dataChannelOpen;
    }, [dataChannelOpen]);

    const handleAbort = () => {
        if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        cleanup();
        if (socket) socket.emit('leave-room');
        toast.warning('SESSION TERMINATED');
        setTimeout(() => navigate('/'), 300);
    };

    const handleReconnect = () => {
        cleanup();
        setPeerConnected(false);
        setRoomId(null);
        resetForNext();
        handleCreateRoom();
    };

    // Step 1: Create room immediately
    const handleCreateRoom = useCallback(async () => {
        try {
            const response = await emit('create-room', { sessionId, fileInfo: null });
            setRoomId(response.roomId);
            sessionStorage.setItem('directdrop_last_room_id', response.roomId);
            setStatus(CONNECTION_STATES.WAITING);
            toast.info('ROOM CREATED — SHARE THE CODE');
        } catch (err) {
            console.error('Failed to create room:', err);
            setStatus(CONNECTION_STATES.ERROR);
            toast.error('FAILED TO CREATE ROOM');
        }
    }, [emit, toast, sessionId]);

    // Handle session restoration
    useEffect(() => {
        const restoreSession = async () => {
            const lastRoomId = sessionStorage.getItem('directdrop_last_room_id');
            // Only attempt restore if we are connected but don't have a roomId state yet
            if (lastRoomId && isConnected && !roomId) {
                try {
                    console.log('[Send] Attempting to restore session...', lastRoomId);
                    await emit('reconnect-room', { roomId: lastRoomId, sessionId });
                    setRoomId(lastRoomId);
                    setStatus(CONNECTION_STATES.WAITING);
                    toast.info('SESSION RESTORED');
                } catch (err) {
                    console.log('[Send] Session restoration failed:', err.message);
                    sessionStorage.removeItem('directdrop_last_room_id');
                    handleCreateRoom(); // Start fresh if restoration fails
                }
            } else if (isConnected && !roomId) {
                handleCreateRoom();
            }
        };

        restoreSession();
    }, [isConnected, roomId, handleCreateRoom, emit, toast, sessionId]);

    const fallbackToRelay = useCallback(() => {
        if (hasStartedTransfer.current) return;
        console.log('[Send] WebRTC failed, falling back to Socket relay...');
        setPeerConnected(true);
        setStatus(CONNECTION_STATES.CONNECTED);
        toast.warning('USING RELAY MODE');
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handlePeerJoined = async () => {
            console.log('[Send] Peer joined! Starting WebRTC...');
            setStatus(CONNECTION_STATES.CONNECTING);
            hasStartedTransfer.current = false;

            try {
                await startAsSender();

                webrtcTimeoutRef.current = setTimeout(() => {
                    // Use ref (not state) to avoid stale closure
                    if (!dataChannelOpenRef.current) {
                        console.log('[Send] WebRTC timeout, data channel not open');
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

        const cleanupAnswer = on('signal-answer', (data) => onAnswer(data.answer));
        const cleanupIce = on('signal-ice-candidate', (data) => onIceCandidate(data.candidate));
        const cleanupDisconnect = on('peer-disconnected', () => {
            setPeerConnected(false);
            setStatus(CONNECTION_STATES.DISCONNECTED);
            toast.error('PEER DISCONNECTED');
        });

        const cleanupReconnect = on('peer-reconnected', (data) => {
            if (data.role === 'receiver') {
                console.log('[Send] Receiver reconnected!');
                toast.success('PEER RECONNECTED');
                setPeerConnected(true);
                setStatus(CONNECTION_STATES.CONNECTED);
            }
        });

        return () => {
            cleanupAnswer();
            cleanupIce();
            cleanupDisconnect();
            cleanupReconnect();
        };
    }, [socket, on, onAnswer, onIceCandidate]);

    useEffect(() => {
        if (dataChannelOpen && dataChannel) {
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
            setPeerConnected(true);
            setStatus(CONNECTION_STATES.CONNECTED);
            if (!toastFiredRef.current.connected) {
                toastFiredRef.current.connected = true;
                toast.success('PEER CONNECTED — SECURE TUNNEL ACTIVE');
            }
        }
    }, [dataChannelOpen, dataChannel]);

    useEffect(() => {
        if (connectionState === CONNECTION_STATES.DISCONNECTED && !peerConnected) {
            fallbackToRelay();
        }
    }, [connectionState, fallbackToRelay, peerConnected]);

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
        toast.info('TRANSMITTING DATABLOCK...');

        if (dataChannelOpen && dataChannel) {
            startSending(dataChannel, file);
        } else if (socket) {
            startSendingViaSocket(socket, file);
        }
    }, [file, dataChannelOpen, dataChannel, socket, startSending, startSendingViaSocket]);

    useEffect(() => {
        if (transferState === CONNECTION_STATES.COMPLETED) {
            setStatus(CONNECTION_STATES.COMPLETED);
            if (!toastFiredRef.current.complete) {
                toastFiredRef.current.complete = true;
                toast.success('FILE TRANSMITTED SUCCESSFULLY');
            }
        }
    }, [transferState]);

    const handleSendMore = () => {
        setFile(null);
        fileRef.current = null;
        hasStartedTransfer.current = false;
        toastFiredRef.current.complete = false; // Reset for next transfer
        resetForNext();
        setStatus(CONNECTION_STATES.CONNECTED);
    };

    const isWaiting = !peerConnected && status === CONNECTION_STATES.WAITING;
    const isConnecting = !peerConnected && status === CONNECTION_STATES.CONNECTING;
    const isReady = peerConnected && !file && transferState !== CONNECTION_STATES.COMPLETED;
    const hasFile = peerConnected && file && ![CONNECTION_STATES.TRANSFERRING, CONNECTION_STATES.RELAY_TRANSFERRING, CONNECTION_STATES.COMPLETED].includes(transferState);
    const isTransferring = [CONNECTION_STATES.TRANSFERRING, CONNECTION_STATES.RELAY_TRANSFERRING].includes(transferState) && transferState !== CONNECTION_STATES.COMPLETED;
    const isComplete = transferState === CONNECTION_STATES.COMPLETED;

    return (
        <>
            <ToastContainer toasts={toast.toasts} />
            <div className="bg-retro-card shadow-brutal border border-retro-shadow/20 p-6 md:p-10 space-y-8 max-w-2xl mx-auto relative mt-4 animate-slide-up">
                <div className="absolute top-0 left-6 w-16 h-8 bg-gray-200 border-x-2 border-b-2 border-gray-300"></div>

                <div className="flex items-center justify-between border-b-2 border-retro-shadow/30 pb-4 mt-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-dos font-bold text-retro-text uppercase">HOST SESSION</h1>
                        {![CONNECTION_STATES.IDLE, CONNECTION_STATES.COMPLETED, CONNECTION_STATES.DISCONNECTED, CONNECTION_STATES.ERROR].includes(status) && (
                            <button
                                onClick={handleAbort}
                                className="bg-red-600/10 text-red-600 border border-red-600 font-dos text-[10px] px-3 py-1 uppercase transition-all duration-150 active:translate-y-[2px] active:translate-x-[2px] shadow-sm hover:bg-red-600 hover:text-white"
                            >
                                ABORT
                            </button>
                        )}
                    </div>
                    <ConnectionStatus state={status} />
                </div>

                {isRelayMode && (
                    <div className="bg-amber-100 border border-amber-400 p-3 text-center font-dos text-[10px] text-amber-800 uppercase animate-fade-in">
                        ⚡ RELAY MODE — File routed via server
                    </div>
                )}

                {/* Phase 1: Waiting */}
                {(isWaiting || isConnecting) && roomId && (
                    <div className="animate-pop-in">
                        <RoomCodeDisplay roomId={roomId} />
                    </div>
                )}

                {/* Phase 2: Connected, select file */}
                {isReady && (
                    <div className="space-y-4 animate-slide-up">
                        <div className="bg-retro-olive/10 border border-retro-olive p-4 text-center font-dos text-xs text-retro-olive uppercase">
                            ✓ PEER CONNECTED — SELECT A FILE TO TRANSMIT
                            <span className="animate-cursor-blink ml-1">▌</span>
                        </div>
                        <DropZone onFileSelected={handleFileSelected} selectedFile={null} disabled={false} />
                    </div>
                )}

                {/* Phase 2b: File selected */}
                {hasFile && (
                    <div className="space-y-4 animate-slide-up">
                        <DropZone onFileSelected={handleFileSelected} selectedFile={file} disabled={false} />
                        <button
                            onClick={handleSendFile}
                            className="w-full bg-retro-olive text-white font-dos text-sm py-4 uppercase shadow-brutal transition-all duration-150 active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-retro-olive/80"
                        >
                            ▸ TRANSMIT DATABLOCK
                        </button>
                    </div>
                )}

                {/* Phase 3: Transferring */}
                {isTransferring && file && (
                    <div className="animate-fade-in">
                        <TransferProgress progress={progress} state={transferState} fileName={file.name} />
                    </div>
                )}

                {/* Phase 4: Complete */}
                {isComplete && (
                    <div className="space-y-4 animate-pop-in">
                        <div className="text-center p-6 bg-retro-input border border-retro-shadow shadow-brutal">
                            <p className="text-retro-text text-lg font-dos mb-2 font-bold uppercase">
                                FILE TRANSMITTED ✓
                            </p>
                            <p className="text-retro-gray text-xs font-mono uppercase">
                                {sentFiles.length} file{sentFiles.length > 1 ? 's' : ''} sent this session
                            </p>
                        </div>
                        <button
                            onClick={handleSendMore}
                            className="w-full bg-retro-amber text-retro-terminal font-dos text-sm py-4 uppercase shadow-brutal transition-all duration-150 active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-retro-amber/80"
                        >
                            ▸ SEND ANOTHER FILE
                        </button>
                    </div>
                )}

                {/* Sent files history */}
                {sentFiles.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                        <h2 className="font-dos text-xs text-retro-text uppercase font-bold border-b border-retro-shadow/20 pb-2">
                            TRANSMITTED DATABLOCKS ({sentFiles.length})
                        </h2>
                        <div className="space-y-2 animate-stagger">
                            {sentFiles.map((f) => (
                                <SentFileCard key={f.id} file={f} />
                            ))}
                        </div>
                    </div>
                )}

                {status === CONNECTION_STATES.ERROR && (
                    <div className="text-center p-6 bg-red-100 border border-red-300 shadow-brutal mt-4 animate-pop-in">
                        <p className="text-red-800 font-dos text-sm mb-4 uppercase">CRITICAL UPLINK FAILURE</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => { cleanup(); navigate('/'); }}
                                className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-black">
                                RETURN TO BASE
                            </button>
                            <button onClick={handleReconnect}
                                className="bg-retro-olive text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-retro-olive/80">
                                HOST NEW SESSION
                            </button>
                        </div>
                    </div>
                )}

                {status === CONNECTION_STATES.DISCONNECTED && (
                    <div className="text-center p-6 bg-yellow-100 border border-yellow-300 shadow-brutal mt-4 animate-pop-in">
                        <p className="text-yellow-800 font-dos text-sm mb-2 uppercase">TARGET DISCONNECTED</p>
                        {sentFiles.length > 0 && (
                            <p className="text-yellow-700 font-mono text-[10px] mb-4 uppercase">
                                {sentFiles.length} file{sentFiles.length > 1 ? 's' : ''} transmitted before disconnect
                            </p>
                        )}
                        <div className="flex gap-4 justify-center mt-4">
                            <button onClick={() => { cleanup(); navigate('/'); }}
                                className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-black">
                                RETURN TO BASE
                            </button>
                            <button onClick={handleReconnect}
                                className="bg-retro-olive text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-retro-olive/80">
                                HOST NEW SESSION
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t-2 border-retro-shadow/40 flex justify-between items-end">
                    <div className="font-dos text-[10px] text-retro-gray uppercase">
                        <div>OPERATION</div>
                        <div className="text-retro-text">CREATE.BIN</div>
                    </div>
                    <div className="w-4 h-4 bg-retro-brown"></div>
                </div>
            </div>
        </>
    );
}