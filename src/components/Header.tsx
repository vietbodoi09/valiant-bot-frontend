import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, address, connect, disconnect } = useWallet();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/scan', label: 'Scan' },
    { path: '/bot', label: 'Bot' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-white font-semibold text-lg">Valiant Bot</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActive(item.path)
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected ? (
              <button 
                onClick={disconnect}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white hover:bg-white/10 transition-colors"
              >
                <Wallet size={16} className="text-orange-400" />
                <span>{address}</span>
              </button>
            ) : (
              <button 
                onClick={connect}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-orange text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                <Wallet size={16} />
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isConnected ? (
                <button 
                  onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                  className="mt-2 px-4 py-3 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg"
                >
                  Disconnect ({address})
                </button>
              ) : (
                <button 
                  onClick={() => { connect(); setMobileMenuOpen(false); }}
                  className="mt-2 px-4 py-3 text-sm font-medium text-white bg-gradient-orange rounded-lg"
                >
                  Connect Wallet
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
