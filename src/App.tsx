import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { WalletProvider } from './hooks/useWallet';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BotDashboard from './pages/BotDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FundingScanner from './pages/FundingScanner';
import SwapDashboard from './pages/SwapDashboard';

function FundingScannerPage() {
  const navigate = useNavigate();
  return (
    <div className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
      <FundingScanner onSelectPair={(symbol, longEx, shortEx) => {
        localStorage.setItem('valiant_selected_pair', JSON.stringify({ symbol, longEx, shortEx }));
        navigate('/bot');
      }} />
    </div>
  );
}

// Separate component to use useNavigate inside Router context
function AppContent() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* User Bot Dashboard - open access */}
            <Route path="/bot" element={<BotDashboard onLogout={handleLogout} />} />

            {/* Admin Dashboard */}
            <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />

            {/* Funding Scanner - public */}
            <Route path="/scan" element={<FundingScannerPage />} />

            {/* Swap Bot - open access */}
            <Route path="/swap" element={<SwapDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </WalletProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
