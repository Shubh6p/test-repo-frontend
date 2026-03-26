import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function RoomCodeInput({ onSubmit, loading, error }) {
    const [code, setCode] = useState('');

    const handleChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) {
            value = value.slice(0, 3) + '-' + value.slice(3, 6);
        }
        setCode(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.length >= 7) {
            onSubmit(code);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    Enter the room code
                </label>
                <input
                    type="text"
                    value={code}
                    onChange={handleChange}
                    placeholder="XXX-XXX"
                    maxLength={7}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-2xl font-mono text-center tracking-[0.3em] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    disabled={loading}
                />
            </div>

            {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
                type="submit"
                disabled={code.length < 7 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                    </>
                ) : (
                    <>
                        Connect
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>
    );
}