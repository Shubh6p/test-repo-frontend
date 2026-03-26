import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import RoomCodeInput from '../components/RoomCodeInput';
import FileInfo from '../components/FileInfo';
import TransferProgress from '../components/TransferProgress';
import ConnectionStatus from '../components/ConnectionStatus';
import { CONNECTION_STATES } from '../utils/constants';

export default function Receive() {
    const [status, setStatus] = useState(CONNECTION_STATES.IDLE);
    const [fileInfo, setFileInfo] = useState(null);
    const [error, setError] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);

    const { socket, isConnected, emit, on } = useSocket();
    const {
        dataChannel,
        dataChannelOpen,
        startAsReceiver,
        onAnswer,
        onIceCandidate,
        cleanup
    } = useWebRTC(socket);
    const {
        transferState,
        progress,
        transferResult,
        startReceiving
    } = useFileTransfer();

    const handleJoinRoom = useCallback(async (code) => {
        setJoinLoading(true);
        setError('');

        try {
            const response = await emit('join-room', code);
            setFileInfo(response.fileInfo);
            setStatus(CONNECTION_STATES.CONNECTING);
        } catch (err) {
            setError(err.message);
        } finally {
            setJoinLoading(false);
        }
    }, [emit]);

    useEffect(() => {
        if (!socket) return;

        const cleanupOffer = on('signal-offer', async (data) => {
            console.log('[Receive] Got offer, creating answer...');
            try {
                await startAsReceiver(data.offer);
            } catch (err) {
                console.error('Failed to handle offer:', err);
                setStatus(CONNECTION_STATES.ERROR);
            }
        });

        const cleanupIce = on('signal-ice-candidate', (data) => {
            onIceCandidate(data.candidate);
        });

        const cleanupDisconnect = on('peer-disconnected', () => {
            setStatus(CONNECTION_STATES.DISCONNECTED);
        });

        return () => {
            cleanupOffer();
            cleanupIce();
            cleanupDisconnect();
        };
    }, [socket, on, startAsReceiver, onIceCandidate]);

    useEffect(() => {
        if (dataChannelOpen && dataChannel) {
            console.log('[Receive] DataChannel open! Ready to receive...');
            setStatus(CONNECTION_STATES.TRANSFERRING);
            startReceiving(dataChannel);
        }
    }, [dataChannelOpen, dataChannel, startReceiving]);

    useEffect(() => {
        if (transferState === CONNECTION_STATES.COMPLETED) {
            setStatus(CONNECTION_STATES.COMPLETED);
        }
    }, [transferState]);

    const showInput = status === CONNECTION_STATES.IDLE;
    const showProgress = [
        CONNECTION_STATES.CONNECTING,
        CONNECTION_STATES.TRANSFERRING,
        CONNECTION_STATES.COMPLETED
    ].includes(status);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Receive a File</h1>
                <ConnectionStatus state={status} />
            </div>

            {showInput && (
                <RoomCodeInput
                    onSubmit={handleJoinRoom}
                    loading={joinLoading}
                    error={error}
                />
            )}

            {fileInfo && (
                <FileInfo fileInfo={fileInfo} />
            )}

            {showProgress && fileInfo && (
                <TransferProgress
                    progress={progress}
                    state={transferState}
                    fileName={fileInfo.name}
                />
            )}

            {status === CONNECTION_STATES.COMPLETED && transferResult && (
                <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <p className="text-green-400 text-lg font-medium">
                        🎉 File downloaded!
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        {transferResult.fileName} — transferred in{' '}
                        {transferResult.duration.toFixed(1)}s
                    </p>
                </div>
            )}

            {status === CONNECTION_STATES.DISCONNECTED && (
                <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-red-400">Sender disconnected.</p>
                    <button
                        onClick={() => {
                            cleanup();
                            setFileInfo(null);
                            setError('');
                            setStatus(CONNECTION_STATES.IDLE);
                        }}
                        className="mt-3 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {status === CONNECTION_STATES.ERROR && (
                <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-red-400">Connection failed. Please try again.</p>
                    <button
                        onClick={() => {
                            cleanup();
                            setFileInfo(null);
                            setError('');
                            setStatus(CONNECTION_STATES.IDLE);
                        }}
                        className="mt-3 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}