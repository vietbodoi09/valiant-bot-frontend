import { globalStats } from '../data/cryptoData';

const StatsSection = () => {
  const stats = [
    { value: globalStats.totalVolume, label: 'Total Volume' },
    { value: globalStats.tradesExecuted, label: 'Trades Executed' },
    { value: globalStats.totalUsers.toString(), label: 'Total Users' },
    { value: globalStats.integratedExchanges.toString(), label: 'Integrated Exchanges' },
  ];

  return (
    <section className="py-12 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`text-center py-6 ${
                index < stats.length - 1 ? 'lg:border-r lg:border-white/10' : ''
              }`}
            >
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
