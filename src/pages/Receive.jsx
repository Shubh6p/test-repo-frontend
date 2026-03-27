import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import RoomCodeInput from '../components/RoomCodeInput';
import TransferProgress from '../components/TransferProgress';
import ConnectionStatus from '../components/ConnectionStatus';
import ReceivedFileCard from '../components/ReceivedFileCard';
import { CONNECTION_STATES, WEBRTC_TIMEOUT } from '../utils/constants';

export default function Receive() {
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const queryCode = searchParams.get('code');
    const predefinedCode = location.state?.predefinedCode || queryCode || '';

    const [status, setStatus] = useState(CONNECTION_STATES.IDLE);
    const [error, setError] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [peerConnected, setPeerConnected] = useState(false);
    const webrtcTimeoutRef = useRef(null);
    const hasStartedReceiving = useRef(false);

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
        transferResult,
        isRelayMode,
        receivedFiles,
        startReceiving,
        startReceivingViaSocket,
        cleanupSocketReceiver,
        resetForNext
    } = useFileTransfer();

    const handleAbort = () => {
        if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        cleanup();
        cleanupSocketReceiver();
        navigate('/');
    };

    // Fallback to socket relay
    const fallbackToRelay = useCallback(() => {
        if (hasStartedReceiving.current) return;
        hasStartedReceiving.current = true;

        console.log('[Receive] WebRTC failed, falling back to Socket relay...');
        setPeerConnected(true);
        setStatus(CONNECTION_STATES.CONNECTED);

        if (socket) {
            startReceivingViaSocket(socket);
        }
    }, [socket, startReceivingViaSocket]);

    const handleJoinRoom = useCallback(async (code) => {
        setJoinLoading(true);
        setError('');
        hasStartedReceiving.current = false;

        try {
            const response = await emit('join-room', code);
            setStatus(CONNECTION_STATES.CONNECTING);

            webrtcTimeoutRef.current = setTimeout(() => {
                if (!hasStartedReceiving.current) {
                    console.log('[Receive] WebRTC timeout, switching to relay...');
                    fallbackToRelay();
                }
            }, WEBRTC_TIMEOUT);
        } catch (err) {
            setError(err.message);
        } finally {
            setJoinLoading(false);
        }
    }, [emit, fallbackToRelay]);

    useEffect(() => {
        if (!socket) return;

        const cleanupOffer = on('signal-offer', async (data) => {
            console.log('[Receive] Got offer, creating answer...');
            try {
                await startAsReceiver(data.offer);
            } catch (err) {
                console.error('Failed to handle offer:', err);
                fallbackToRelay();
            }
        });

        const cleanupIce = on('signal-ice-candidate', (data) => {
            onIceCandidate(data.candidate);
        });

        const cleanupDisconnect = on('peer-disconnected', () => {
            setPeerConnected(false);
            setStatus(CONNECTION_STATES.DISCONNECTED);
        });

        return () => {
            cleanupOffer();
            cleanupIce();
            cleanupDisconnect();
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);
        };
    }, [socket, on, startAsReceiver, onIceCandidate, fallbackToRelay]);

    // WebRTC success path
    useEffect(() => {
        if (dataChannelOpen && dataChannel && !hasStartedReceiving.current) {
            hasStartedReceiving.current = true;
            if (webrtcTimeoutRef.current) clearTimeout(webrtcTimeoutRef.current);

            console.log('[Receive] DataChannel open! Ready to receive...');
            setPeerConnected(true);
            setStatus(CONNECTION_STATES.CONNECTED);
            startReceiving(dataChannel);
        }
    }, [dataChannelOpen, dataChannel, startReceiving]);

    // Transfer state updates
    useEffect(() => {
        if (transferState === CONNECTION_STATES.TRANSFERRING || transferState === CONNECTION_STATES.RELAY_TRANSFERRING) {
            setStatus(CONNECTION_STATES.TRANSFERRING);
        }
        if (transferState === CONNECTION_STATES.COMPLETED) {
            setStatus(CONNECTION_STATES.CONNECTED); // Ready for more files
        }
    }, [transferState]);

    // Watch for WebRTC failure
    useEffect(() => {
        if (connectionState === CONNECTION_STATES.DISCONNECTED && !hasStartedReceiving.current) {
            fallbackToRelay();
        }
    }, [connectionState, fallbackToRelay]);

    const showInput = status === CONNECTION_STATES.IDLE;
    const isConnecting = status === CONNECTION_STATES.CONNECTING;
    const isTransferring = [CONNECTION_STATES.TRANSFERRING, CONNECTION_STATES.RELAY_TRANSFERRING].includes(transferState) && transferState !== CONNECTION_STATES.COMPLETED;

    return (
        <div className="bg-retro-card shadow-brutal border border-retro-shadow/20 p-6 md:p-10 space-y-8 max-w-2xl mx-auto relative mt-4">
            <div className="absolute top-0 right-6 w-16 h-8 bg-gray-200 border-x-2 border-b-2 border-gray-300"></div>

            <div className="flex items-center justify-between border-b-2 border-retro-shadow/30 pb-4 mt-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-dos font-bold text-retro-text uppercase">JOIN SESSION</h1>
                    {![CONNECTION_STATES.IDLE, CONNECTION_STATES.DISCONNECTED, CONNECTION_STATES.ERROR].includes(status) && (
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

            {/* Phase 1: Enter code */}
            {showInput && (
                <RoomCodeInput
                    onSubmit={handleJoinRoom}
                    loading={joinLoading}
                    error={error}
                    initialCode={predefinedCode}
                />
            )}

            {/* Phase 2: Connecting */}
            {isConnecting && (
                <div className="text-center p-8 bg-retro-input border border-retro-shadow/20 shadow-brutal">
                    <div className="animate-pulse font-dos text-retro-amber text-sm uppercase">
                        ESTABLISHING SECURE TUNNEL...
                    </div>
                    <p className="text-retro-gray font-mono text-[10px] mt-3 uppercase">
                        Negotiating encryption keys with peer
                    </p>
                </div>
            )}

            {/* Phase 3: Connected, awaiting files */}
            {peerConnected && !isTransferring && receivedFiles.length === 0 && transferState !== CONNECTION_STATES.COMPLETED && (
                <div className="text-center p-8 bg-retro-input border border-retro-shadow/20 shadow-brutal">
                    <div className="font-dos text-retro-olive text-sm uppercase mb-2">
                        ✓ LINK ESTABLISHED
                    </div>
                    <div className="animate-pulse font-dos text-retro-amber text-xs uppercase">
                        AWAITING INCOMING DATABLOCKS...
                    </div>
                    <p className="text-retro-gray font-mono text-[10px] mt-3 uppercase">
                        Sender is selecting a file to transmit
                    </p>
                </div>
            )}

            {/* Active transfer progress */}
            {isTransferring && (
                <TransferProgress
                    progress={progress}
                    state={transferState}
                    fileName="Incoming file"
                />
            )}

            {/* Received files list */}
            {receivedFiles.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-dos text-xs text-retro-text uppercase font-bold">
                            RECEIVED DATABLOCKS ({receivedFiles.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {receivedFiles.map((file) => (
                            <ReceivedFileCard key={file.id} file={file} />
                        ))}
                    </div>
                    {peerConnected && !isTransferring && (
                        <div className="text-center p-3 border border-dashed border-retro-gray/30">
                            <p className="font-dos text-[10px] text-retro-gray uppercase animate-pulse">
                                Waiting for more files...
                            </p>
                        </div>
                    )}
                </div>
            )}

            {status === CONNECTION_STATES.DISCONNECTED && (
                <div className="text-center p-6 bg-yellow-100 border border-yellow-300 shadow-brutal mt-4">
                    <p className="text-yellow-800 font-dos text-sm mb-2 uppercase">TARGET DISCONNECTED</p>
                    {receivedFiles.length > 0 && (
                        <p className="text-yellow-700 font-mono text-[10px] mb-4 uppercase">
                            {receivedFiles.length} file{receivedFiles.length > 1 ? 's' : ''} received this session
                        </p>
                    )}
                    <button
                        onClick={() => {
                            cleanup();
                            cleanupSocketReceiver();
                            navigate('/');
                        }}
                        className="bg-retro-text text-white font-dos text-xs px-6 py-3 uppercase shadow-brutal-sm active:translate-y-1 active:translate-x-1 active:shadow-brutal-active hover:bg-black"
                    >
                        RETURN TO BASE
                    </button>
                </div>
            )}

            {status === CONNECTION_STATES.ERROR && (
                <div className="text-center p-6 bg-red-100 border border-red-300 shadow-brutal mt-4">
                    <p className="text-red-800 font-dos text-sm mb-4 uppercase">CRITICAL UPLINK FAILURE</p>
                    <button
                        onClick={() => {
                            cleanup();
                            cleanupSocketReceiver();
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
                    <div className="text-retro-text">JOIN.BIN</div>
                </div>
                <div className="w-4 h-4 bg-retro-gray"></div>
            </div>
        </div>
    );
}