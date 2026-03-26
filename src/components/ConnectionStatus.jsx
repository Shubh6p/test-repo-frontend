import { Wifi, WifiOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { CONNECTION_STATES } from '../utils/constants';

const STATUS_CONFIG = {
    [CONNECTION_STATES.IDLE]: {
        icon: Wifi, color: 'text-gray-500', label: 'Ready'
    },
    [CONNECTION_STATES.CONNECTING]: {
        icon: Loader2, color: 'text-yellow-500', label: 'Connecting...', animate: true
    },
    [CONNECTION_STATES.WAITING]: {
        icon: Loader2, color: 'text-blue-500', label: 'Waiting for peer...', animate: true
    },
    [CONNECTION_STATES.CONNECTED]: {
        icon: Check, color: 'text-green-500', label: 'Connected (P2P)'
    },
    [CONNECTION_STATES.TRANSFERRING]: {
        icon: Wifi, color: 'text-blue-500', label: 'Transferring...'
    },
    [CONNECTION_STATES.COMPLETED]: {
        icon: Check, color: 'text-green-500', label: 'Complete!'
    },
    [CONNECTION_STATES.ERROR]: {
        icon: AlertCircle, color: 'text-red-500', label: 'Error'
    },
    [CONNECTION_STATES.DISCONNECTED]: {
        icon: WifiOff, color: 'text-red-500', label: 'Disconnected'
    },
};

export default function ConnectionStatus({ state }) {
    const config = STATUS_CONFIG[state] || STATUS_CONFIG[CONNECTION_STATES.IDLE];
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
            <span className={config.color}>{config.label}</span>
        </div>
    );
}