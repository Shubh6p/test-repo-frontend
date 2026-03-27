import { ICE_SERVERS, DATA_CHANNEL_OPTIONS } from '../utils/constants';

export function createPeerConnection(onIceCandidate, onConnectionStateChange) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    let hasAttemptedRestart = false;

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

        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            hasAttemptedRestart = false; // Reset so future drops can retry
            onConnectionStateChange('connected');
        } else if (pc.iceConnectionState === 'failed') {
            // Attempt ONE ICE restart before declaring failure
            if (!hasAttemptedRestart) {
                hasAttemptedRestart = true;
                console.log('[WebRTC] ICE failed, attempting restart...');
                pc.restartIce();
            } else {
                console.log('[WebRTC] ICE restart failed, giving up');
                onConnectionStateChange('failed');
            }
        } else if (pc.iceConnectionState === 'disconnected') {
            // Give it 3 seconds to recover before declaring failure
            setTimeout(() => {
                if (pc.iceConnectionState === 'disconnected') {
                    if (!hasAttemptedRestart) {
                        hasAttemptedRestart = true;
                        console.log('[WebRTC] Still disconnected, attempting ICE restart...');
                        pc.restartIce();
                    } else {
                        onConnectionStateChange('failed');
                    }
                }
            }, 3000);
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

export async function createRestartOffer(peerConnection) {
    const offer = await peerConnection.createOffer({ iceRestart: true });
    await peerConnection.setLocalDescription(offer);
    return offer;
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