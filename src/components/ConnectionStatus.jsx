import { Wifi, WifiOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { CONNECTION_STATES } from '../utils/constants';

const STATUS_CONFIG = {
    [CONNECTION_STATES.IDLE]: {
        icon: Wifi, color: 'text-retro-gray', label: 'READY.'
    },
    [CONNECTION_STATES.CONNECTING]: {
        icon: Loader2, color: 'text-retro-amber', label: 'UPLINKING...', animate: true
    },
    [CONNECTION_STATES.WAITING]: {
        icon: Loader2, color: 'text-retro-amber', label: 'AWAITING PEER...', animate: true
    },
    [CONNECTION_STATES.CONNECTED]: {
        icon: Check, color: 'text-retro-olive', label: 'LINK ESTABLISHED.'
    },
    [CONNECTION_STATES.TRANSFERRING]: {
        icon: Wifi, color: 'text-retro-amber animate-pulse', label: 'TRANSMITTING...'
    },
    [CONNECTION_STATES.RELAY_CONNECTING]: {
        icon: Loader2, color: 'text-orange-500', label: 'RELAY CONNECTING...', animate: true
    },
    [CONNECTION_STATES.RELAY_TRANSFERRING]: {
        icon: Wifi, color: 'text-orange-500 animate-pulse', label: 'RELAY TRANSFER...'
    },
    [CONNECTION_STATES.COMPLETED]: {
        icon: Check, color: 'text-retro-olive', label: 'SEQUENCE COMPLETE.'
    },
    [CONNECTION_STATES.ERROR]: {
        icon: AlertCircle, color: 'text-red-500', label: 'CRITICAL FAILURE.'
    },
    [CONNECTION_STATES.DISCONNECTED]: {
        icon: WifiOff, color: 'text-red-500', label: 'LINK SEVERED.'
    },
};

export default function ConnectionStatus({ state }) {
    const config = STATUS_CONFIG[state] || STATUS_CONFIG[CONNECTION_STATES.IDLE];
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2 font-dos text-[10px] md:text-xs tracking-wider uppercase bg-retro-terminal px-3 py-2 border-2 border-retro-terminal text-white">
            <Icon className={`w-3 h-3 md:w-4 md:h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
            <span className={config.color}>{config.label}</span>
        </div>
    );
}