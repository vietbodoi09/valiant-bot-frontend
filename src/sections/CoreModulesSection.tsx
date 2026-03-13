import { BarChart3, Scale } from 'lucide-react';

const modules = [
  {
    badge: 'Volume Generation',
    title: 'Imbalance Bot',
    description: 'Real-time orderbook imbalance detection with momentum confirmation. Adaptive stop-loss tightening over position lifetime.',
    icon: BarChart3,
  },
  {
    badge: 'Delta-Neutral Yield',
    title: 'Arb Funding Bot',
    description: 'Delta-neutral across two venues. Zero directional exposure - pure yield from funding rate spreads and point incentives.',
    icon: Scale,
  },
];

const CoreModulesSection = () => {
  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-green-400 text-sm font-medium uppercase tracking-wider mb-4">
            Core Modules
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6">
            Trading Strategies
          </h2>
          <p className="text-white/60 max-w-3xl mx-auto text-lg">
            Designed to support{' '}
            <span className="text-white font-medium">high-volume execution</span>
            {' '}and{' '}
            <span className="text-white font-medium">capital-efficient delta-neutral yield</span>,
            {' '}with systematic participation across supported exchanges
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent hover:border-green-500/30 transition-all duration-300"
            >
              {/* Badge */}
              <div className="mb-6">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                  {module.badge}
                </span>
              </div>

              {/* Content */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <module.icon className="w-7 h-7 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {module.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreModulesSection;
