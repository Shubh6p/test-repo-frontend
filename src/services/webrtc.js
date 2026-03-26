import { ICE_SERVERS, DATA_CHANNEL_OPTIONS } from '../utils/constants';

export function createPeerConnection(onIceCandidate, onConnectionStateChange) {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            onIceCandidate(event.candidate);
        }
    };

    pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        onConnectionStateChange(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state:', pc.iceConnectionState);
        // Fallback for browsers that don't reliably fire onconnectionstatechange
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            onConnectionStateChange('connected');
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            onConnectionStateChange('failed');
        }
    };

    return pc;
}

export async function createOffer(peerConnection) {
    const dataChannel = peerConnection.createDataChannel(
        'fileTransfer',
        DATA_CHANNEL_OPTIONS
    );

    dataChannel.binaryType = 'arraybuffer';

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return { offer, dataChannel };
}

export async function handleOffer(peerConnection, offer) {
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
    );

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return answer;
}

export async function handleAnswer(peerConnection, answer) {
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
    );
}

export async function addIceCandidate(peerConnection, candidate) {
    try {
        await peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
        );
    } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
    }
}

export function closePeerConnection(peerConnection) {
    if (peerConnection) {
        peerConnection.close();
    }
}