import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { WalletProvider } from './hooks/useWallet';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BotDashboard from './pages/BotDashboard';
import SecureMasterKeyAuth from './pages/SecureMasterKeyAuth';


const AUTH_API_URL = 'https://valiant-bot-be-01.fly.dev';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [keyName, setKeyName] = useState<string>('');

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('valiant_jwt_token');
      const savedExpiry = localStorage.getItem('valiant_token_expiry');
      
      if (savedToken && savedExpiry) {
        const expiry = new Date(savedExpiry);
        if (expiry > new Date()) {
          try {
            const response = await fetch(`${AUTH_API_URL}/api/auth/verify-token?token=${savedToken}`);
            if (response.ok) {
              const data = await response.json();
              setAuthToken(savedToken);
              setKeyName(data.key_name || '');
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('valiant_jwt_token');
              localStorage.removeItem('valiant_token_expiry');
            }
          } catch (e) {
            console.error('Token verification failed:', e);
          }
        } else {
          localStorage.removeItem('valiant_jwt_token');
          localStorage.removeItem('valiant_token_expiry');
        }
      }
      setIsChecking(false);
    };
    
    verifyToken();
  }, []);

  const handleAuthenticated = (token: string, name?: string) => {
    setAuthToken(token);
    if (name) setKeyName(name);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch(`${AUTH_API_URL}/api/auth/logout?token=${authToken}`);
      } catch (e) {
        console.error('Logout notification failed:', e);
      }
    }
    
    localStorage.removeItem('valiant_jwt_token');
    localStorage.removeItem('valiant_token_expiry');
    localStorage.removeItem('valiant_device_id');
    localStorage.removeItem('valiant_session_id');
    
    setAuthToken(null);
    setKeyName('');
    setIsAuthenticated(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-[#0a0a0a] text-white">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              
              {/* User Bot Dashboard */}
              <Route 
                path="/bot" 
                element={
                  isAuthenticated ? (
                    <BotDashboard 
                      onLogout={handleLogout} 
                      authToken={authToken}
                      keyName={keyName}
                    />
                  ) : (
                    <SecureMasterKeyAuth onAuthenticated={handleAuthenticated} />
                  )
                } 
              />
              

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
