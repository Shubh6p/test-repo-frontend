import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Home() {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState('');

    const handleJoin = (e) => {
        e.preventDefault();
        if (roomCode.length >= 7) {
            navigate('/receive', { state: { predefinedCode: roomCode } });
        } else {
            navigate('/receive');
        }
    };

    const handleRoomCodeChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) {
            value = value.slice(0, 3) + '-' + value.slice(3, 6);
        }
        setRoomCode(value);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-4xl mx-auto">
            
            {/* HOST SESSION CARD */}
            <div className="bg-retro-card shadow-brutal relative pt-12 pb-6 px-6 md:px-8 flex flex-col h-full border border-retro-shadow/20">
                {/* Floppy slider detail */}
                <div className="absolute top-0 left-6 w-16 h-8 bg-gray-200 border-x-2 border-b-2 border-gray-300"></div>

                <div className="flex-grow">
                    <h2 className="font-dos text-xl md:text-2xl mb-4 font-bold tracking-tight text-retro-text">HOST SESSION</h2>
                    <p className="text-retro-gray mb-8 text-sm md:text-base leading-relaxed">
                        Initiate a secure peer-to-peer data tunnel. Absolute zero server retention. E2E DTLS encryption standard.
                    </p>
                    
                    <Link
                        to="/send"
                        className="block w-full text-center bg-retro-olive text-white font-dos text-sm py-4 md:py-5 uppercase transition-transform active:translate-y-1 active:translate-x-1 shadow-brutal-sm active:shadow-brutal-active hover:bg-retro-oliveHover"
                    >
                        GENERATE ROOM CODE
                    </Link>
                </div>

                {/* Footer detail */}
                <div className="mt-8 pt-4 border-t-2 border-retro-shadow/40 flex justify-between items-end">
                    <div className="font-dos text-[10px] text-retro-gray uppercase">
                        <div>OPERATION</div>
                        <div className="text-retro-text">CREATE.BIN</div>
                    </div>
                    <div className="w-4 h-4 bg-retro-brown"></div>
                </div>
            </div>

            {/* JOIN SESSION CARD */}
            <div className="bg-retro-card shadow-brutal relative pt-12 pb-6 px-6 md:px-8 flex flex-col h-full border border-retro-shadow/20">
                {/* Floppy slider detail */}
                <div className="absolute top-0 right-6 w-16 h-8 bg-gray-200 border-x-2 border-b-2 border-gray-300"></div>

                <div className="flex-grow">
                    <h2 className="font-dos text-xl md:text-2xl mb-8 font-bold tracking-tight text-retro-text">JOIN SESSION</h2>
                    
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="bg-retro-input p-5 pb-6">
                            <label className="block text-[10px] font-dos text-retro-text uppercase mb-3 font-bold">TARGET ROOM ID</label>
                            <div className="flex items-center text-lg md:text-xl font-body text-retro-gray">
                                <span className="text-retro-amber font-dos mr-3">&gt;</span>
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={handleRoomCodeChange}
                                    placeholder="XXX-XXX"
                                    maxLength={7}
                                    className="bg-transparent border-none outline-none w-full tracking-[0.2em] placeholder-retro-gray/40 text-retro-gray block font-bold uppercase disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full text-center bg-retro-olive text-white font-dos text-sm py-4 md:py-5 uppercase transition-transform active:translate-y-1 active:translate-x-1 shadow-brutal-sm active:shadow-brutal-active hover:bg-retro-oliveHover"
                        >
                            CONNECT UPLINK
                        </button>
                    </form>
                </div>

                {/* Footer detail */}
                <div className="mt-8 pt-4 border-t-2 border-retro-shadow/40 flex justify-between items-end">
                    <div className="font-dos text-[10px] text-retro-gray uppercase">
                        <div>OPERATION</div>
                        <div className="text-retro-text">JOIN.BIN</div>
                    </div>
                    <div className="w-4 h-4 bg-retro-gray"></div>
                </div>
            </div>

        </div>
    );
}