import { ArrowRight, Bot, TrendingUp, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 hero-gradient-valiant">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/15 rounded-full blur-[80px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-orange-400 text-sm font-medium">Delta-Neutral Arbitrage</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Automated Funding Rate
            <br />
            <span className="text-gradient-orange">Arbitrage Bot</span>
          </h1>
          
          <p className="text-xl text-white/70 mb-4 max-w-2xl mx-auto">
            Farm funding rates across Hyperliquid & Lighter
          </p>
          <p className="text-white/50 mb-8 max-w-xl mx-auto">
            Delta-neutral positions. Zero directional risk. Pure yield from funding rate differentials.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/bot"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-orange text-white font-medium rounded-full hover:opacity-90 transition-all duration-300 hover:scale-105"
            >
              Launch Bot
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-orange-400 text-sm font-medium uppercase tracking-wider mb-4">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Delta-Neutral{' '}
              <span className="text-gradient-orange">Yield Farming</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Open opposite positions on two exchanges to eliminate price risk while capturing funding rate payments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Bot,
                title: 'Automated Trading',
                description: 'Bot automatically opens and manages delta-neutral positions 24/7.',
              },
              {
                icon: TrendingUp,
                title: 'Funding Arbitrage',
                description: 'Capture funding rate differentials between Hyperliquid and Lighter.',
              },
              {
                icon: Shield,
                title: 'Zero Price Risk',
                description: 'Long on one exchange, short on another. Net delta = 0.',
              },
              {
                icon: Zap,
                title: 'Real-time Monitoring',
                description: 'Live PnL tracking, position updates, and bot logs.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent hover:border-orange-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Section */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-orange-400 text-sm font-medium uppercase tracking-wider mb-4">
                The Strategy
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                How Delta-Neutral
                <br />
                <span className="text-gradient-orange">Arbitrage Works</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Monitor Funding Rates</h4>
                    <p className="text-white/60 text-sm">Bot checks funding rates on both Hyperliquid and Lighter every few seconds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Open Opposite Positions</h4>
                    <p className="text-white/60 text-sm">Long on the exchange with negative funding, short on the one with positive funding.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Collect Funding Payments</h4>
                    <p className="text-white/60 text-sm">Every 8 hours, receive funding payments. Net delta = 0 means no price risk.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Auto Re-enter</h4>
                    <p className="text-white/60 text-sm">After closing positions, bot can automatically re-enter for continuous yield.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
              <h3 className="text-xl font-semibold text-white mb-6">Example Trade</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">Hyperliquid</span>
                    <span className="text-green-400 font-medium">LONG $500</span>
                  </div>
                  <div className="text-white/40 text-sm">Funding: +0.013% (you receive)</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">Lighter</span>
                    <span className="text-red-400 font-medium">SHORT $500</span>
                  </div>
                  <div className="text-white/40 text-sm">Funding: -0.008% (you pay less)</div>
                </div>
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Net Funding per 8h</span>
                    <span className="text-green-400 font-bold">+~$0.10</span>
                  </div>
                  <div className="text-white/40 text-sm mt-1">Delta exposure: $0 (neutral)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent border border-orange-500/20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Start Farming?
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Connect your wallet, enter your API keys, and let the bot do the work.
              </p>
              <Link
                to="/bot"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-orange text-white font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                Launch Bot
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
