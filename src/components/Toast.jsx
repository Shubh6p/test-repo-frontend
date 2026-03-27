const TOAST_STYLES = {
    success: {
        bg: 'bg-retro-olive',
        border: 'border-retro-olive',
        text: 'text-white',
        icon: '✓'
    },
    error: {
        bg: 'bg-red-600',
        border: 'border-red-700',
        text: 'text-white',
        icon: '✗'
    },
    info: {
        bg: 'bg-retro-terminal',
        border: 'border-retro-shadow',
        text: 'text-retro-amber',
        icon: '>'
    },
    warning: {
        bg: 'bg-amber-500',
        border: 'border-amber-600',
        text: 'text-white',
        icon: '!'
    }
};

export default function ToastContainer({ toasts }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
            {toasts.map((toast) => {
                const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
                return (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto
                            ${style.bg} ${style.text} border ${style.border}
                            px-5 py-3 shadow-brutal font-dos text-[10px] md:text-xs uppercase
                            flex items-center gap-3 max-w-sm
                            ${toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}
                        `}
                        style={{ transformOrigin: 'center top' }}
                    >
                        <span className="text-base font-bold">{style.icon}</span>
                        <span>{toast.message}</span>
                    </div>
                );
            })}
        </div>
    );
}
