import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/30 blur-lg rounded-xl" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Valiant Bot</h1>
            <p className="text-xs text-white/40">Delta-Neutral Arbitrage</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/bot" 
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
