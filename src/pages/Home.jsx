import { Link } from 'react-router-dom';

export default function Home() {

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
                    <h2 className="font-dos text-xl md:text-2xl mb-4 font-bold tracking-tight text-retro-text">JOIN SESSION</h2>
                    <p className="text-retro-gray mb-8 text-sm md:text-base leading-relaxed">
                        Connect to an existing secure peer-to-peer data tunnel. Enter target room ID or scan QR code on the next screen.
                    </p>
                    
                    <Link
                        to="/receive"
                        className="block w-full text-center bg-retro-olive text-white font-dos text-sm py-4 md:py-5 uppercase transition-transform active:translate-y-1 active:translate-x-1 shadow-brutal-sm active:shadow-brutal-active hover:bg-retro-oliveHover"
                    >
                        CONNECT UPLINK
                    </Link>
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