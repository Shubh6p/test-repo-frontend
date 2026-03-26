import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';

export default function Header() {
    return (
        <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Send className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        Direct<span className="text-blue-500">Drop</span>
                    </span>
                </Link>
                <nav className="flex items-center gap-6 text-sm font-medium">
                    <Link to="/send" className="text-gray-400 hover:text-white transition-colors">
                        Send
                    </Link>
                    <Link to="/receive" className="text-gray-400 hover:text-white transition-colors">
                        Receive
                    </Link>
                </nav>
            </div>
        </header>
    );
}
