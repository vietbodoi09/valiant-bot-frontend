import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, BarChart3, TrendingUp, DollarSign, 
  Clock, RefreshCw, Scan, Bot, ChevronRight, ExternalLink, Check, X } from 'lucide-react';

const AFFILIATE_LINK = "https://valiant.trade/trade?af=valbot";

function FeeCompare() {
  const rows = [
    { label: 'Open Position', market: '0.045%', valbot: '-0.010%', note: 'Maker rebate' },
    { label: 'Close Position', market: '0.045%', valbot: '-0.010%', note: 'Maker rebate' },
    { label: 'Round Trip', market: '0.090%', valbot: '-0.020%', note: 'You EARN fees' },
    { label: 'With 20% Affiliate', market: '0.072%', valbot: '-0.020%', note: 'Extra savings' },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <div className="grid grid-cols-4 text-[11px] uppercase tracking-wider text-white/30 bg-white/[0.02] px-4 py-3">
        <div>Action</div>
        <div className="text-center">Market Order</div>
        <div className="text-center text-emerald-400">ValBot (Limit)</div>
        <div className="text-right">Note</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`grid grid-cols-4 px-4 py-3 text-sm ${i === rows.length - 1 ? 'bg-emerald-500/[0.05] border-t border-emerald-500/20' : 'border-t border-white/[0.04]'}`}>
          <div className="text-white/60 text-xs">{r.label}</div>
          <div className="text-center text-red-400/80 font-mono text-xs">{r.market}</div>
          <div className="text-center text-emerald-400 font-mono text-xs font-semibold">{r.valbot}</div>
          <div className="text-right text-white/25 text-[11px]">{r.note}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#060608] overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* HERO */}
      <div className="relative pt-16 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative w-20 h-20 mx-auto mb-10">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-2xl animate-pulse" />
            <img src="/valbot-logo.png" alt="ValBot" className="relative w-20 h-20 rounded-2xl shadow-2xl shadow-emerald-500/30" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">Val</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Bot</span>
          </h1>
          <p className="text-lg md:text-xl text-white/40 mb-3 font-light tracking-wide">Delta-Neutral Arbitrage Engine</p>
          <p className="text-sm text-white/25 mb-14 max-w-lg mx-auto leading-relaxed">
            Automated funding rate farming across Hyperliquid &amp; Lighter. Zero directional risk. Maximum yield extraction.
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link to="/bot">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:translate-y-[-1px]">
                <span className="flex items-center gap-2.5">Launch Terminal <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" /></span>
              </button>
            </Link>
            <Link to="/scan">
              <button className="px-8 py-4 bg-white/[0.04] text-white/70 font-medium rounded-xl border border-white/[0.06] hover:bg-white/[0.07] hover:border-emerald-500/20 hover:text-white transition-all duration-300">Scan Markets</button>
            </Link>
          </div>
          <a href={AFFILIATE_LINK} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-all">
            <Zap size={12} /> Sign up via our link → Get 20% fee discount on Valiant <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* STATS */}
      <div className="relative max-w-4xl mx-auto px-4 mb-24">
        <div className="flex items-center justify-center gap-12 py-6 px-8 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          {[{ value: '2', sub: 'Exchanges' }, { value: 'δ=0', sub: 'Delta Neutral' }, { value: 'Maker', sub: 'Limit Orders' }, { value: '24/7', sub: 'Cloud Hosted' }].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-[10px] text-white/25 uppercase tracking-wider">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="relative max-w-5xl mx-auto px-4 mb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-white/30 text-sm max-w-xl mx-auto">
            ValBot opens opposite positions on two exchanges simultaneously — capturing funding rate differentials while maintaining zero market exposure.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {[
            { step: '01', icon: Scan, title: 'Scan', desc: 'Scanner finds the best funding rate spreads across Hyperliquid & Lighter in real-time.' },
            { step: '02', icon: Bot, title: 'Enter', desc: 'Bot opens SHORT on one exchange + LONG on the other using limit orders (ALO) for maker rebates.' },
            { step: '03', icon: Clock, title: 'Hold & Farm', desc: 'Positions are held for a configured period. Funding payments flow in every 8 hours.' },
            { step: '04', icon: DollarSign, title: 'Close & Profit', desc: 'Bot closes both sides with limit orders. You keep the funding spread minus near-zero fees.' },
          ].map((s, i) => (
            <div key={i} className="relative group">
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-emerald-500/40 font-mono text-xs font-bold">{s.step}</span>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><s.icon className="w-4 h-4 text-emerald-400" /></div>
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{s.title}</h3>
                <p className="text-white/30 text-xs leading-relaxed">{s.desc}</p>
              </div>
              {i < 3 && <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10"><ChevronRight className="w-4 h-4 text-emerald-500/20" /></div>}
            </div>
          ))}
        </div>

        {/* Delta Visual */}
        <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <h3 className="text-white font-semibold text-sm mb-4 text-center">Why Delta-Neutral = Zero Risk</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="text-blue-400 text-xs font-medium mb-2">Hyperliquid</div>
              <div className="text-2xl font-bold text-white mb-1">SHORT</div>
              <div className="text-white/30 text-xs">Profit when price ↓</div>
            </div>
            <div className="p-4 flex flex-col items-center justify-center">
              <div className="text-white/20 text-xs mb-2">Net Exposure</div>
              <div className="text-3xl font-black text-emerald-400">0</div>
              <div className="text-emerald-400/50 text-[10px] mt-1">Perfect Hedge</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-purple-400 text-xs font-medium mb-2">Lighter</div>
              <div className="text-2xl font-bold text-white mb-1">LONG</div>
              <div className="text-white/30 text-xs">Profit when price ↑</div>
            </div>
          </div>
          <p className="text-center text-white/20 text-xs mt-4">Price moves cancel out. You only collect funding rate payments.</p>
        </div>
      </div>

      {/* FEE ADVANTAGE */}
      <div className="relative max-w-4xl mx-auto px-4 mb-28">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Stop Paying <span className="text-red-400 line-through">Taker Fees</span>
          </h2>
          <p className="text-white/30 text-sm max-w-xl mx-auto">
            Most bots use market orders and pay 0.045% per trade. ValBot uses <span className="text-emerald-400 font-medium">limit orders (ALO)</span> — you actually <span className="text-emerald-400 font-medium">earn rebates</span> on every trade.
          </p>
        </div>
        <FeeCompare />
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-red-500/[0.05] border border-red-500/20">
            <div className="flex items-center gap-2 mb-3"><X className="w-4 h-4 text-red-400" /><span className="text-red-400 text-sm font-medium">Other Bots (Market Orders)</span></div>
            <ul className="space-y-2 text-xs text-white/40">
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Pay 0.045% taker fee every trade</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Round trip costs 0.09% = $0.135 per $150</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Fees eat into your funding profits</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Slippage on market orders</li>
            </ul>
          </div>
          <div className="p-5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-sm font-medium">ValBot (Limit Orders / ALO)</span></div>
            <ul className="space-y-2 text-xs text-white/40">
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> <span><strong className="text-emerald-400">Earn</strong> 0.010% maker rebate every trade</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Round trip earns $0.030 per $150 back</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> 100% of funding profits are yours</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> No slippage — price guaranteed</li>
            </ul>
          </div>
        </div>

        {/* Affiliate CTA */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">Save Even More with Our Affiliate Link</h3>
          </div>
          <p className="text-white/40 text-sm mb-5 max-w-lg mx-auto">
            Sign up on Valiant through our referral link and get an <span className="text-emerald-400 font-semibold">extra 20% discount</span> on 
            all trading fees. Combined with ValBot's maker orders, your effective fee is <span className="text-emerald-400 font-semibold">negative</span> — you get paid to trade.
          </p>
          <a href={AFFILIATE_LINK} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:translate-y-[-1px]">
            Get 20% Fee Discount <ExternalLink size={16} />
          </a>
          <p className="text-white/20 text-[10px] mt-3">Discount applies to all Valiant perp trading. No minimum deposit.</p>
        </div>
      </div>

      {/* FEATURES */}
      <div className="relative max-w-5xl mx-auto px-4 mb-28">
        <div className="text-center mb-10"><h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Features</h2></div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: BarChart3, title: 'Funding Scanner', desc: 'Real-time scan of all markets on both exchanges. Find the highest APR spreads instantly.' },
            { icon: RefreshCw, title: 'Multi-Cycle Automation', desc: 'Set cycles count, hold time, auto re-enter. Bot runs 24/7 on cloud — close your browser.' },
            { icon: Shield, title: 'Smart Size & Leverage', desc: 'Auto-detects max leverage per symbol. Auto-caps position size to your balance. No margin errors.' },
            { icon: TrendingUp, title: 'Perfect Delta Entry', desc: 'HL fills first via limit order, then Lighter matches exact same size. 0% delta mismatch.' },
            { icon: DollarSign, title: 'Maker Rebates', desc: 'Both open and close use ALO limit orders on HL. You earn rebates instead of paying fees.' },
            { icon: Zap, title: 'Live Dashboard', desc: 'Real-time position cards, PnL tracking, balance updates, live logs via WebSocket.' },
          ].map((f, i) => (
            <div key={i} className="group p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4"><f.icon className="w-5 h-5 text-emerald-400" /></div>
              <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="relative max-w-3xl mx-auto px-4 pb-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Farm?</h2>
        <p className="text-white/30 text-sm mb-8">Start earning funding rates with zero directional risk.</p>
        <div className="flex items-center justify-center gap-4">
          <a href={AFFILIATE_LINK} target="_blank" rel="noopener noreferrer"
            className="px-6 py-3 bg-white/[0.04] text-white/60 font-medium rounded-xl border border-white/[0.06] hover:border-emerald-500/20 hover:text-white transition-all text-sm flex items-center gap-2">
            Create Valiant Account (20% off) <ExternalLink size={14} />
          </a>
          <Link to="/bot">
            <button className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center gap-2">
              Launch ValBot <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
