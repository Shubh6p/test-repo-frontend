import { useState, useEffect, useCallback } from 'react';

let toastId = 0;

export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);

        setTimeout(() => {
            setToasts(prev =>
                prev.map(t => t.id === id ? { ...t, exiting: true } : t)
            );
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, duration);
    }, []);

    const success = useCallback((msg) => addToast(msg, 'success', 3000), [addToast]);
    const error = useCallback((msg) => addToast(msg, 'error', 4000), [addToast]);
    const info = useCallback((msg) => addToast(msg, 'info', 3000), [addToast]);
    const warning = useCallback((msg) => addToast(msg, 'warning', 3500), [addToast]);

    return { toasts, success, error, info, warning };
}
