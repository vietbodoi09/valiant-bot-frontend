import { Bot, Activity, TrendingUp, Gift } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Automated Trading',
    subtitle: '24/7 Active',
    description: 'Deploy bots 24/7 across perpetual exchanges. Generate volume, accumulate points, and capture airdrop allocations - fully hands-off after setup.',
  },
  {
    icon: Activity,
    title: '24/7 Bot Monitoring',
    subtitle: '99.9% Uptime',
    description: 'Bots run on our infrastructure with real-time health checks, automatic restarts, and configurable position limits to keep operations running smoothly around the clock.',
  },
  {
    icon: TrendingUp,
    title: 'Real-time PnL Tracking',
    subtitle: 'Live Updates',
    description: 'Monitor fees paid, points earned, and net returns live from your dashboard. Full transparency on what each strategy costs and what it generates in points value.',
  },
  {
    icon: Gift,
    title: 'Airdrop Optimized',
    subtitle: 'Max ROI',
    description: 'Official affiliate and builder status across every exchange means users get points boosts unavailable to solo traders. Strategies are tuned for lowest cost-per-point across the board.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-green-400 text-sm font-medium uppercase tracking-wider mb-4">
            Platform Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6">
            Everything You Need to{' '}
            <span className="text-gradient-green">Win</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Built to{' '}
            <span className="text-white font-medium">automate execution, optimize capital efficiency,</span>
            {' '}and give you{' '}
            <span className="text-white font-medium">full visibility into performance</span>
            {' '}across exchanges
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent hover:border-green-500/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-green-400 text-sm mb-3">{feature.subtitle}</p>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {feature.description}
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

export default FeaturesSection;
