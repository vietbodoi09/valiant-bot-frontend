export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: string;
  quantScore: number;
  apr: number;
  performance: {
    '1D': number;
    '7D': number;
    '30D': number;
  };
  metrics: {
    spread: 'High' | 'Good' | 'Fair' | 'Low';
    volume: 'High' | 'Good' | 'Fair' | 'Low';
    rate: 'High' | 'Good' | 'Fair' | 'Low';
    historical: 'High' | 'Good' | 'Fair' | 'Low';
  };
  longExchange: string;
  shortExchange: string;
  volume: string;
  color: string;
}

export const cryptoData: CryptoData[] = [
  {
    id: 'lit',
    name: 'LIT',
    symbol: 'LIT',
    price: '$1.1566',
    quantScore: 4,
    apr: 75.8,
    performance: {
      '1D': 6.9,
      '7D': 4.9,
      '30D': 6.1,
    },
    metrics: {
      spread: 'High',
      volume: 'High',
      rate: 'High',
      historical: 'Good',
    },
    longExchange: 'Lighter',
    shortExchange: 'grvt',
    volume: '$5.51M',
    color: '#22c55e',
  },
  {
    id: 'ondo',
    name: 'ONDO',
    symbol: 'ONDO',
    price: '$0.2762',
    quantScore: 4,
    apr: 17.6,
    performance: {
      '1D': 27.6,
      '7D': 27.2,
      '30D': 18.9,
    },
    metrics: {
      spread: 'High',
      volume: 'Good',
      rate: 'High',
      historical: 'High',
    },
    longExchange: 'NADO',
    shortExchange: 'grvt',
    volume: '$1.33M',
    color: '#3b82f6',
  },
  {
    id: 'btc',
    name: 'BTC',
    symbol: 'BTC',
    price: '$73,523.00',
    quantScore: 4,
    apr: 14.0,
    performance: {
      '1D': 6.1,
      '7D': 2.6,
      '30D': 3.8,
    },
    metrics: {
      spread: 'High',
      volume: 'High',
      rate: 'High',
      historical: 'Fair',
    },
    longExchange: 'NADO',
    shortExchange: 'extended',
    volume: '$172.81M',
    color: '#f7931a',
  },
  {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRP',
    price: '$1.4444',
    quantScore: 4,
    apr: 12.5,
    performance: {
      '1D': 11.4,
      '7D': 10.4,
      '30D': 5.0,
    },
    metrics: {
      spread: 'High',
      volume: 'High',
      rate: 'High',
      historical: 'Fair',
    },
    longExchange: 'NADO',
    shortExchange: 'extended',
    volume: '$3.05M',
    color: '#23292f',
  },
  {
    id: 'eth',
    name: 'ETH',
    symbol: 'ETH',
    price: '$2,187.39',
    quantScore: 4,
    apr: 12.3,
    performance: {
      '1D': 13.7,
      '7D': 9.5,
      '30D': 8.5,
    },
    metrics: {
      spread: 'High',
      volume: 'High',
      rate: 'High',
      historical: 'Good',
    },
    longExchange: 'NADO',
    shortExchange: 'grvt',
    volume: '$110.85M',
    color: '#627eea',
  },
  {
    id: 'bnb',
    name: 'BNB',
    symbol: 'BNB',
    price: '$675.5904',
    quantScore: 4,
    apr: 11.2,
    performance: {
      '1D': 22.0,
      '7D': 9.8,
      '30D': 5.9,
    },
    metrics: {
      spread: 'High',
      volume: 'High',
      rate: 'High',
      historical: 'Fair',
    },
    longExchange: 'NADO',
    shortExchange: 'extended',
    volume: '$3.85M',
    color: '#f3ba2f',
  },
  {
    id: 'xau',
    name: 'XAU',
    symbol: 'XAU',
    price: '$5,100.55',
    quantScore: 4,
    apr: 7.4,
    performance: {
      '1D': 17.3,
      '7D': 4.7,
      '30D': 19.3,
    },
    metrics: {
      spread: 'High',
      volume: 'High',
      rate: 'Good',
      historical: 'High',
    },
    longExchange: 'NADO',
    shortExchange: 'extended',
    volume: '$9.42M',
    color: '#ffd700',
  },
  {
    id: 'eth2',
    name: 'ETH',
    symbol: 'ETH',
    price: '$2,187.28',
    quantScore: 4,
    apr: 3.8,
    performance: {
      '1D': 9.4,
      '7D': 9.5,
      '30D': 7.1,
    },
    metrics: {
      spread: 'High',
      volume: 'High',
      rate: 'High',
      historical: 'Good',
    },
    longExchange: 'NADO',
    shortExchange: 'grvt',
    volume: '$110.85M',
    color: '#627eea',
  },
];

export interface Exchange {
  id: string;
  name: string;
  logo?: string;
}

export const exchanges: Exchange[] = [
  { id: 'all', name: 'All' },
  { id: 'extended', name: 'extended' },
  { id: 'variational', name: 'Variational' },
  { id: 'nado', name: 'NADO' },
  { id: 'hyperliquid', name: 'Hyperliquid' },
  { id: 'lighter', name: 'Lighter' },
  { id: 'grvt', name: 'grvt' },
  { id: 'pacifica', name: 'Pacifica' },
  { id: 'paradex', name: 'PARADEX' },
  { id: 'polymarket', name: 'Polymarket' },
];

export interface PlatformStat {
  id: string;
  name: string;
  nextSnapshot: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  stats: {
    totalVolume: string;
    totalTrades: string;
    activeBots: number;
    totalUsers: number;
  };
}

export const platformStats: PlatformStat[] = [
  {
    id: 'grvt',
    name: 'grvt',
    nextSnapshot: {
      days: 3,
      hours: 9,
      minutes: 57,
      seconds: 16,
    },
    stats: {
      totalVolume: '$364.26K',
      totalTrades: '$97',
      activeBots: 8,
      totalUsers: 17,
    },
  },
  {
    id: 'nado',
    name: 'NADO',
    nextSnapshot: {
      days: 6,
      hours: 10,
      minutes: 57,
      seconds: 16,
    },
    stats: {
      totalVolume: '$132.47M',
      totalTrades: '$49.56K',
      activeBots: 3,
      totalUsers: 25,
    },
  },
];

export const globalStats = {
  totalVolume: '$11.42B+',
  tradesExecuted: '2.9M+',
  totalUsers: 1391,
  integratedExchanges: 8,
};
