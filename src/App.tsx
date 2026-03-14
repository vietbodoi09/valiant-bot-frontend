import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './hooks/useWallet';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BotDashboard from './pages/BotDashboard';
import AdminDashboard from './pages/AdminDashboard'; 
import MasterKeyAuth from './pages/MasterKeyAuth';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-[#0a0a0a] text-white">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/bot" element={<BotDashboard />} />
              <Route path="/bot" element={<MasterKeyAuth />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
