import { useRef, useState, useCallback, useEffect } from 'react';
import {
    createPeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    closePeerConnection
} from '../services/webrtc';
import { CONNECTION_STATES } from '../utils/constants';

export function useWebRTC(socket) {
    const peerConnectionRef = useRef(null);
    const dataChannelRef = useRef(null);
    const iceQueueRef = useRef([]); // ICE Candidate queue
    const [connectionState, setConnectionState] = useState(CONNECTION_STATES.IDLE);
    const [dataChannelOpen, setDataChannelOpen] = useState(false);

    useEffect(() => {
        return () => {
            closePeerConnection(peerConnectionRef.current);
        };
    }, []);

    const initConnection = useCallback(() => {
        iceQueueRef.current = [];
        const pc = createPeerConnection(
            (candidate) => {
                socket?.emit('signal-ice-candidate', { candidate });
            },
            (state) => {
                if (state === 'connected') {
                    setConnectionState(CONNECTION_STATES.CONNECTED);
                } else if (state === 'failed' || state === 'disconnected') {
                    setConnectionState(CONNECTION_STATES.DISCONNECTED);
                }
            }
        );

        peerConnectionRef.current = pc;
        return pc;
    }, [socket]);

    const flushIceQueue = useCallback(async () => {
        const pc = peerConnectionRef.current;
        if (!pc || !pc.remoteDescription) return;
        
        while (iceQueueRef.current.length > 0) {
            const candidate = iceQueueRef.current.shift();
            await addIceCandidate(pc, candidate);
        }
    }, []);

    const startAsSender = useCallback(async () => {
        const pc = initConnection();

        const { offer, dataChannel } = await createOffer(pc);
        dataChannelRef.current = dataChannel;

        dataChannel.onopen = () => {
            console.log('[DataChannel] Open (sender)');
            setDataChannelOpen(true);
            setConnectionState(CONNECTION_STATES.CONNECTED);
        };

        dataChannel.onclose = () => {
            console.log('[DataChannel] Closed (sender)');
            setDataChannelOpen(false);
        };

        dataChannel.onerror = (err) => {
            console.error('[DataChannel] Error:', err);
            setConnectionState(CONNECTION_STATES.ERROR);
        };

        socket?.emit('signal-offer', { offer });
        setConnectionState(CONNECTION_STATES.CONNECTING);

        return dataChannel;
    }, [initConnection, socket]);

    const startAsReceiver = useCallback(async (offer) => {
        const pc = initConnection();

        pc.ondatachannel = (event) => {
            const dataChannel = event.channel;
            dataChannel.binaryType = 'arraybuffer';
            dataChannelRef.current = dataChannel;

            dataChannel.onopen = () => {
                console.log('[DataChannel] Open (receiver)');
                setDataChannelOpen(true);
                setConnectionState(CONNECTION_STATES.CONNECTED);
            };

            dataChannel.onclose = () => {
                console.log('[DataChannel] Closed (receiver)');
                setDataChannelOpen(false);
            };
        };

        const answer = await handleOffer(pc, offer);
        await flushIceQueue(); // Flush any candidates received while handling offer

        socket?.emit('signal-answer', { answer });
        setConnectionState(CONNECTION_STATES.CONNECTING);

        return pc;
    }, [initConnection, flushIceQueue, socket]);

    const onAnswer = useCallback(async (answer) => {
        if (peerConnectionRef.current) {
            await handleAnswer(peerConnectionRef.current, answer);
            await flushIceQueue(); // Flush any candidates received while validating answer
        }
    }, [flushIceQueue]);

    const onIceCandidate = useCallback(async (candidate) => {
        const pc = peerConnectionRef.current;
        if (pc) {
            if (pc.remoteDescription) {
                await addIceCandidate(pc, candidate);
            } else {
                iceQueueRef.current.push(candidate);
            }
        }
    }, []);

    const cleanup = useCallback(() => {
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
        }
        closePeerConnection(peerConnectionRef.current);
        peerConnectionRef.current = null;
        dataChannelRef.current = null;
        iceQueueRef.current = [];
        setDataChannelOpen(false);
        setConnectionState(CONNECTION_STATES.IDLE);
    }, []);

    return {
        peerConnection: peerConnectionRef.current,
        dataChannel: dataChannelRef.current,
        connectionState,
        dataChannelOpen,
        startAsSender,
        startAsReceiver,
        onAnswer,
        onIceCandidate,
        cleanup
    };
}