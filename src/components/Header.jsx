import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header className="bg-retro-terminal text-retro-amber shadow-brutal border-2 border-retro-terminal w-full">
            <div className="px-4 py-5 flex items-center justify-between font-dos text-sm md:text-xl">
                <Link to="/" className="flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest">
                    <span>A:\&gt; KLICKS.EXE<span className="animate-pulse bg-retro-amber w-3 h-5 inline-block align-middle ml-2"></span></span>
                </Link>
                <div className="text-xs tracking-widest uppercase opacity-90 hidden sm:block">
                    V1.0.0 [P2P PROTOCOL]
                </div>
            </div>
        </header>
    );
}
