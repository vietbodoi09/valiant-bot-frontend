import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl">
              <Zap className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Valiant Bot
          </h1>
          <p className="text-xl text-white/60 mb-4 max-w-2xl mx-auto">
            Automated Delta-Neutral Arbitrage Trading
          </p>
          <p className="text-white/40 mb-12 max-w-xl mx-auto">
            Farm funding rates across Hyperliquid and Lighter exchanges with automated hedge positions.
          </p>
          
          <div className="flex items-center justify-center">
            <Link to="/bot">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-orange-500/20">
                <TrendingUp className="w-5 h-5 mr-2" />
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Delta-Neutral</h3>
            <p className="text-white/50">Long on one exchange, short on another. Capture funding rate differentials with zero directional risk.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automated Trading</h3>
            <p className="text-white/50">Set your parameters and let the bot execute trades automatically. 24/7 operation with smart position management.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure Access</h3>
            <p className="text-white/50">Device-bound authentication with master key system. Each key works only on authorized devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
