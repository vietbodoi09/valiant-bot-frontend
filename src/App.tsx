import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import BotDashboard from './pages/BotDashboard';
import SecureMasterKeyAuth from './pages/SecureMasterKeyAuth';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check existing token
    const token = localStorage.getItem('valiant_jwt_token');
    const expiry = localStorage.getItem('valiant_token_expiry');
    if (token && expiry && new Date(expiry) > new Date()) {
      setIsAuth(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('valiant_jwt_token');
    localStorage.removeItem('valiant_token_expiry');
    setIsAuth(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/bot" 
          element={
            isAuth ? (
              <BotDashboard onLogout={handleLogout} />
            ) : (
              <SecureMasterKeyAuth onAuthenticated={() => setIsAuth(true)} />
            )
          } 
        />
        <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />
      </Routes>
    </Router>
  );
}

export default App;
