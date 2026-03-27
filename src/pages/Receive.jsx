import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { useToast } from '../hooks/useToast';
import RoomCodeInput from '../components/RoomCodeInput';
import TransferProgress from '../components/TransferProgress';
import ConnectionStatus from '../components/ConnectionStatus';
import ReceivedFileCard from '../components/ReceivedFileCard';
import ToastContainer from '../components/Toast';
import { CONNECTION_STATES, WEBRTC_TIMEOUT } from '../utils/constants';

export default function Receive() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    const searchParams = new URLSearchParams(location.search);
    const queryCode = searchParams.get('code');
    const predefinedCode = location.state?.predefinedCode || queryCode || '';

    const [status, setStatus] = useState(CONNECTION_STATES.IDLE);
    const [error, setError] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [peerConnected, setPeerConnected] = useState(false);
    const webrtcTimeoutRef = useRef(null);
    const hasStartedReceiving = useRef(false);
    const prevReceivedCount = useRef(0);
    const toastFiredRef = useRef({});

    const { socket, isConnected, emit, on } = useSocket();
    const {
        dataChannel,
        dataChannelOpen,
        connectionState,
        startAsReceiver,
        onAnswer,
        onIceCandidate,
        cleanup
    } = useWebRTC(socket);
    const {
        transferState,
        progress,
        isRelayMode,
        receivedFiles,
        startReceiving,
        startReceivingViaSocket,
        cleanupSocketReceiver
    } = useFileTransfer();

    const handleAbort = () => {
        if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        cleanup();
        cleanupSocketReceiver();
        if (socket) socket.emit('leave-room');
        toast.warning('SESSION TERMINATED');
        setTimeout(() => navigate('/'), 300);
    };

    const handleReconnect = () => {
        cleanup();
        cleanupSocketReceiver();
        setPeerConnected(false);
        setStatus(CONNECTION_STATES.IDLE);
        hasStartedReceiving.current = false;
        toastFiredRef.current.connected = false;
    };

    // Toast on new file received
    useEffect(() => {
        if (receivedFiles.length > prevReceivedCount.current) {
            const latest = receivedFiles[receivedFiles.length - 1];
            toast.success(`RECEIVED: ${latest.fileName}`);
            prevReceivedCount.current = receivedFiles.length;
        }
    }, [receivedFiles]);

    const fallbackToRelay = useCallback(() => {
        if (hasStartedReceiving.current) return;
        hasStartedReceiving.current = true;

        setPeerConnected(true);
        setStatus(CONNECTION_STATES.CONNECTED);
        toast.warning('USING RELAY MODE');

        if (socket) {
            startReceivingViaSocket(socket);
        }
    }, [socket, startReceivingViaSocket]);

    const handleJoinRoom = useCallback(async (code) => {
        setJoinLoading(true);
        setError('');
        hasStartedReceiving.current = false;

        try {
            await emit('join-room', code);
            setStatus(CONNECTION_STATES.CONNECTING);
            toast.info('JOINING SESSION...');

            webrtcTimeoutRef.current = setTimeout(() => {
                if (!hasStartedReceiving.current) {
                    fallbackToRelay();
                }
            }, WEBRTC_TIMEOUT);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setJoinLoading(false);
        }
    }, [emit, fallbackToRelay]);

    useEffect(() => {
        if (!socket) return;

        const cleanupOffer = on('signal-offer', async (data) => {
            try {
                await startAsReceiver(data.offer);
            } catch (err) {
                console.error('Failed to handle offer:', err);
                fallbackToRelay();
            }
        });

        const cleanupIce = on('signal-ice-candidate', (data) => onIceCandidate(data.candidate));
        const cleanupDisconnect = on('peer-disconnected', () => {
            setPeerConnected(false);
            setStatus(CONNECTION_STATES.DISCONNECTED);
            toast.error('PEER DISCONNECTED');
        });

        return () => {
            cleanupOffer();
            cleanupIce();
            cleanupDisconnect();
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        };
    }, [socket, on, startAsReceiver, onIceCandidate, fallbackToRelay]);

    useEffect(() => {
        if (dataChannelOpen && dataChannel && !hasStartedReceiving.current) {
            hasStartedReceiving.current = true;
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);

            setPeerConnected(true);
            setStatus(CONNECTION_STATES.CONNECTED);
            startReceiving(dataChannel);
            if (!toastFiredRef.current.connected) {
                toastFiredRef.current.connected = true;
                toast.success('SECURE TUNNEL ESTABLISHED');
            }
        }
    }, [dataChannelOpen, dataChannel, startReceiving]);

    useEffect(() => {
        if (transferState === CONNECTION_STATES.TRANSFERRING || transferState === CONNECTION_STATES.RELAY_TRANSFERRING) {
            setStatus(CONNECTION_STATES.TRANSFERRING);
        }
        if (transferState === CONNECTION_STATES.COMPLETED) {
            setStatus(CONNECTION_STATES.CONNECTED);
        }
    }, [transferState]);

    useEffect(() => {
        if (connectionState === CONNECTION_STATES.DISCONNECTED && !hasStartedReceiving.current) {
            fallbackToRelay();
        }
    }, [connectionState, fallbackToRelay]);

    const showInput = status === CONNECTION_STATES.IDLE;
    const isConnecting = status === CONNECTION_STATES.CONNECTING;
    const isTransferring = [CONNECTION_STATES.TRANSFERRING, CONNECTION_STATES.RELAY_TRANSFERRING].includes(transferState) && transferState !== CONNECTION_STATES.COMPLETED;

    return (
        <>
            <ToastContainer toasts={toast.toasts} />
            <div className="bg-retro-card shadow-brutal border border-retro-shadow/20 p-6 md:p-10 space-y-8 max-w-2xl mx-auto relative mt-4 animate-slide-up">
                <div className="absolute top-0 right-6 w-16 h-8 bg-gray-200 border-x-2 border-b-2 border-gray-300"></div>

                <div className="flex items-center justify-between border-b-2 border-retro-shadow/30 pb-4 mt-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-dos font-bold text-retro-text uppercase">JOIN SESSION</h1>
                        {![CONNECTION_STATES.IDLE, CONNECTION_STATES.DISCONNECTED, CONNECTION_STATES.ERROR].includes(status) && (
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

                {/* Phase 1: Enter code */}
                {showInput && (
                    <div className="animate-pop-in">
                        <RoomCodeInput
                            onSubmit={handleJoinRoom}
                            loading={joinLoading}
                            error={error}
                            initialCode={predefinedCode}
                        />
                    </div>
                )}

                {/* Phase 2: Connecting */}
                {isConnecting && (
                    <div className="text-center p-8 bg-retro-input border border-retro-shadow/20 shadow-brutal animate-fade-in">
                        <div className="animate-pulse font-dos text-retro-amber text-sm uppercase">
                            ESTABLISHING SECURE TUNNEL...
                        </div>
                        <p className="text-retro-gray font-mono text-[10px] mt-3 uppercase">
                            Negotiating encryption keys with peer
                            <span className="animate-cursor-blink ml-1">▌</span>
                        </p>
                    </div>
                )}

                {/* Phase 3: Connected, awaiting files */}
                {peerConnected && !isTransferring && receivedFiles.length === 0 && transferState !== CONNECTION_STATES.COMPLETED && (
                    <div className="text-center p-8 bg-retro-input border border-retro-shadow/20 shadow-brutal animate-slide-up">
                        <div className="font-dos text-retro-olive text-sm uppercase mb-2">
                            ✓ LINK ESTABLISHED
                        </div>
                        <div className="animate-pulse font-dos text-retro-amber text-xs uppercase">
                            AWAITING INCOMING DATABLOCKS...
                            <span className="animate-cursor-blink ml-1">▌</span>
                        </div>
                        <p className="text-retro-gray font-mono text-[10px] mt-3 uppercase">
                            Sender is selecting a file to transmit
                        </p>
                    </div>
                )}

                {/* Active transfer progress */}
                {isTransferring && (
                    <div className="animate-fade-in">
                        <TransferProgress progress={progress} state={transferState} fileName="Incoming file" />
                    </div>
                )}

                {/* Received files list */}
                {receivedFiles.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                        <h2 className="font-dos text-xs text-retro-text uppercase font-bold border-b border-retro-shadow/20 pb-2">
                            RECEIVED DATABLOCKS ({receivedFiles.length})
                        </h2>
                        <div className="space-y-2 animate-stagger">
                            {receivedFiles.map((file) => (
                                <div key={file.id} className="animate-slide-up">
                                    <ReceivedFileCard file={file} />
                                </div>
                            ))}
                        </div>
                        {peerConnected && !isTransferring && (
                            <div className="text-center p-3 border border-dashed border-retro-gray/30 animate-fade-in">
                                <p className="font-dos text-[10px] text-retro-gray uppercase animate-pulse">
                                    Waiting for more files...
                                    <span className="animate-cursor-blink ml-1">▌</span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {status === CONNECTION_STATES.DISCONNECTED && (
                    <div className="text-center p-6 bg-yellow-100 border border-yellow-300 shadow-brutal mt-4 animate-pop-in">
                        <p className="text-yellow-800 font-dos text-sm mb-2 uppercase">TARGET DISCONNECTED</p>
                        {receivedFiles.length > 0 && (
                            <p className="text-yellow-700 font-mono text-[10px] mb-4 uppercase">
                                {receivedFiles.length} file{receivedFiles.length > 1 ? 's' : ''} received this session
                            </p>
                        )}
                        <div className="flex gap-4 justify-center mt-4">
                            <button onClick={() => { cleanup(); cleanupSocketReceiver(); navigate('/'); }}
                                className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-black">
                                RETURN TO BASE
                            </button>
                            <button onClick={handleReconnect}
                                className="bg-retro-olive text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-retro-olive/80">
                                JOIN ANOTHER SESSION
                            </button>
                        </div>
                    </div>
                )}

                {status === CONNECTION_STATES.ERROR && (
                    <div className="text-center p-6 bg-red-100 border border-red-300 shadow-brutal mt-4 animate-pop-in">
                        <p className="text-red-800 font-dos text-sm mb-4 uppercase">CRITICAL UPLINK FAILURE</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => { cleanup(); cleanupSocketReceiver(); navigate('/'); }}
                                className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-black">
                                RETURN TO BASE
                            </button>
                            <button onClick={handleReconnect}
                                className="bg-retro-olive text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm transition-all duration-150 active:translate-y-1 active:translate-x-1 hover:bg-retro-olive/80">
                                JOIN ANOTHER SESSION
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t-2 border-retro-shadow/40 flex justify-between items-end">
                    <div className="font-dos text-[10px] text-retro-gray uppercase">
                        <div>OPERATION</div>
                        <div className="text-retro-text">JOIN.BIN</div>
                    </div>
                    <div className="w-4 h-4 bg-retro-gray"></div>
                </div>
            </div>
        </>
    );
}