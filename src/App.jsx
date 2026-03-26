import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Send from './pages/Send';
import Receive from './pages/Receive';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-950 text-white">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-2xl">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/send" element={<Send />} />
                        <Route path="/receive" element={<Receive />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;