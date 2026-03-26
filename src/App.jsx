import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Send from './pages/Send';
import Receive from './pages/Receive';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-retro-base text-retro-text p-4 md:p-12 flex flex-col items-center selection:bg-retro-amber selection:text-white">
                <div className="w-full max-w-5xl flex-grow flex flex-col">
                    <Header />
                    <main className="mt-8 md:mt-12 flex-grow">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/send" element={<Send />} />
                            <Route path="/receive" element={<Receive />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </div>
        </Router>
    );
}

export default App;