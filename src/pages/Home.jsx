import { Link } from 'react-router-dom';
import { Upload, Download, Zap, Shield, Wifi } from 'lucide-react';

export default function Home() {
    return (
        <div className="space-y-12 py-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">
                    Share files <span className="text-blue-500">directly</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                    Peer-to-peer file transfer. No upload. No storage.
                    Files go straight from one browser to another.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    to="/send"
                    className="group bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-8 text-center transition-all duration-200 hover:bg-gray-900/80"
                >
                    <Upload className="w-10 h-10 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h2 className="text-xl font-semibold mb-2">Send a File</h2>
                    <p className="text-sm text-gray-500">Drop a file and get a share code</p>
                </Link>

                <Link
                    to="/receive"
                    className="group bg-gray-900 border border-gray-800 hover:border-green-500/50 rounded-2xl p-8 text-center transition-all duration-200 hover:bg-gray-900/80"
                >
                    <Download className="w-10 h-10 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h2 className="text-xl font-semibold mb-2">Receive a File</h2>
                    <p className="text-sm text-gray-500">Enter the code to start download</p>
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="space-y-2">
                    <Shield className="w-6 h-6 text-blue-500 mx-auto" />
                    <p className="text-gray-400">End-to-end</p>
                </div>
                <div className="space-y-2">
                    <Zap className="w-6 h-6 text-yellow-500 mx-auto" />
                    <p className="text-gray-400">LAN speed</p>
                </div>
                <div className="space-y-2">
                    <Wifi className="w-6 h-6 text-green-500 mx-auto" />
                    <p className="text-gray-400">No server storage</p>
                </div>
            </div>
        </div>
    );
}