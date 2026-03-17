import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Shield, Zap, BarChart3, Radio } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#060608] overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/[0.03] rounded-full blur-[120px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Hero */}
      <div className="relative pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo mark */}
          <div className="relative w-20 h-20 mx-auto mb-10">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-2xl animate-pulse" />
            <div className="absolute inset-[-4px] rounded-2xl bg-gradient-to-br from-emerald-400/20 to-transparent" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Activity className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-6xl md:text-7xl font-black tracking-tight">
              <span className="text-white">Val</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Bot</span>
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-white/40 mb-3 font-light tracking-wide">
            Delta-Neutral Arbitrage Engine
          </p>
          <p className="text-sm text-white/25 mb-14 max-w-lg mx-auto leading-relaxed">
            Automated funding rate farming across Hyperliquid &amp; Lighter. 
            Zero directional risk. Maximum yield extraction.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link to="/bot">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:translate-y-[-1px]">
                <span className="flex items-center gap-2.5">
                  Launch Terminal
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </Link>
            <Link to="/scan">
              <button className="px-8 py-4 bg-white/[0.04] text-white/70 font-medium rounded-xl border border-white/[0.06] hover:bg-white/[0.07] hover:border-emerald-500/20 hover:text-white transition-all duration-300">
                Scan Markets
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative max-w-4xl mx-auto px-4 mb-20">
        <div className="flex items-center justify-center gap-12 py-6 px-8 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          {[
            { label: 'Exchanges', value: '2', sub: 'HL + Lighter' },
            { label: 'Fee', value: '0%', sub: 'Maker rebate' },
            { label: 'Strategy', value: 'δ=0', sub: 'Delta neutral' },
            { label: 'Uptime', value: '24/7', sub: 'Cloud hosted' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-[10px] text-white/25 uppercase tracking-wider">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="relative max-w-5xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: BarChart3, color: 'emerald',
              title: 'Delta-Neutral',
              desc: 'Long one exchange, short another. Capture funding spreads with zero market exposure.'
            },
            {
              icon: Zap, color: 'teal',
              title: 'Auto Execution',
              desc: 'Smart ALO orders with maker rebates. Multi-cycle management. Auto-leverage optimization.'
            },
            {
              icon: Shield, color: 'cyan',
              title: 'Secure Access',
              desc: 'Device-bound master key auth. Private keys never leave the server. Encrypted at rest.'
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all duration-500">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className={`w-11 h-11 rounded-xl bg-${f.color}-500/10 flex items-center justify-center mb-5`}>
                    <Icon className={`w-5 h-5 text-${f.color}-400`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-sm tracking-wide">{f.title}</h3>
                  <p className="text-white/30 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
