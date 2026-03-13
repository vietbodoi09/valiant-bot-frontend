export interface PerpMarket {
  id: string;
  name: string;
  symbol: string;
  markPrice: string;
  oraclePrice: string;
  change24h: number;
  change24hUsd: string;
  volume24h: string;
  openInterest: string;
  fundingRate: number;
  fundingCountdown: string;
  leverage: number;
  color: string;
}

export const perpMarkets: PerpMarket[] = [
  {
    id: 'btc',
    name: 'BTC',
    symbol: 'BTC',
    markPrice: '73,442.00',
    oraclePrice: '73,478.00',
    change24h: 4.42,
    change24hUsd: '+3,107.00',
    volume24h: '$3,230,388,632',
    openInterest: '$1,947,508,852',
    fundingRate: 0.0013,
    fundingCountdown: '00:44:45',
    leverage: 40,
    color: '#f7931a',
  },
  {
    id: 'eth',
    name: 'ETH',
    symbol: 'ETH',
    markPrice: '2,187.50',
    oraclePrice: '2,188.20',
    change24h: 3.85,
    change24hUsd: '+81.20',
    volume24h: '$1,845,293,441',
    openInterest: '$892,341,221',
    fundingRate: 0.0008,
    fundingCountdown: '00:44:45',
    leverage: 40,
    color: '#627eea',
  },
  {
    id: 'sol',
    name: 'SOL',
    symbol: 'SOL',
    markPrice: '145.32',
    oraclePrice: '145.45',
    change24h: 6.21,
    change24hUsd: '+8.50',
    volume24h: '$892,441,221',
    openInterest: '$445,221,110',
    fundingRate: 0.0021,
    fundingCountdown: '00:44:45',
    leverage: 40,
    color: '#14f195',
  },
  {
    id: 'wif',
    name: 'WIF',
    symbol: 'WIF',
    markPrice: '1.85',
    oraclePrice: '1.86',
    change24h: -2.34,
    change24hUsd: '-0.04',
    volume24h: '$234,112,442',
    openInterest: '$112,442,221',
    fundingRate: -0.0005,
    fundingCountdown: '00:44:45',
    leverage: 20,
    color: '#8b5cf6',
  },
  {
    id: 'bonk',
    name: 'BONK',
    symbol: 'BONK',
    markPrice: '0.000021',
    oraclePrice: '0.000021',
    change24h: 8.45,
    change24hUsd: '+0.0000016',
    volume24h: '$156,332,110',
    openInterest: '$78,221,442',
    fundingRate: 0.0042,
    fundingCountdown: '00:44:45',
    leverage: 20,
    color: '#f59e0b',
  },
  {
    id: 'weth',
    name: 'WETH',
    symbol: 'WETH',
    markPrice: '2,187.20',
    oraclePrice: '2,188.00',
    change24h: 3.78,
    change24hUsd: '+79.50',
    volume24h: '$445,221,110',
    openInterest: '$223,110,552',
    fundingRate: 0.0009,
    fundingCountdown: '00:44:45',
    leverage: 40,
    color: '#627eea',
  },
];

export interface Pool {
  id: string;
  name: string;
  token0: string;
  token1: string;
  fee: number;
  estYield: number;
  volume24h: string;
  tvl: string;
  fees24h: string;
  type: 'CLMM';
  color0: string;
  color1: string;
}

export const pools: Pool[] = [
  {
    id: 'fogo-usdc',
    name: 'FOGO / USDC.s',
    token0: 'FOGO',
    token1: 'USDC.s',
    fee: 0.30,
    estYield: 27.86,
    volume24h: '$33,162,383',
    tvl: '$572,916',
    fees24h: '$99,487',
    type: 'CLMM',
    color0: '#ff6b35',
    color1: '#2775ca',
  },
  {
    id: 'stfogo-fogo',
    name: 'stFOGO / FOGO',
    token0: 'stFOGO',
    token1: 'FOGO',
    fee: 0.30,
    estYield: 1.20,
    volume24h: '$399,085',
    tvl: '$450,638',
    fees24h: '$1,197',
    type: 'CLMM',
    color0: '#ff8c5a',
    color1: '#ff6b35',
  },
  {
    id: 'ifogo-fogo',
    name: 'iFOGO / FOGO',
    token0: 'iFOGO',
    token1: 'FOGO',
    fee: 0.05,
    estYield: 51.12,
    volume24h: '$14,969,149',
    tvl: '$276,675',
    fees24h: '$7,485',
    type: 'CLMM',
    color0: '#ff5722',
    color1: '#ff6b35',
  },
  {
    id: 'ihub-fogo',
    name: 'iHUB / FOGO',
    token0: 'iHUB',
    token1: 'FOGO',
    fee: 0.05,
    estYield: 0.69,
    volume24h: '$116,955',
    tvl: '$97,079',
    fees24h: '$58',
    type: 'CLMM',
    color0: '#9c27b0',
    color1: '#ff6b35',
  },
  {
    id: 'fish-usdc',
    name: 'FISH / USDC.s',
    token0: 'FISH',
    token1: 'USDC.s',
    fee: 1.00,
    estYield: 44.15,
    volume24h: '$4,756,202',
    tvl: '$75,040',
    fees24h: '$47,562',
    type: 'CLMM',
    color0: '#2196f3',
    color1: '#2775ca',
  },
  {
    id: 'sol-usdc',
    name: 'SOL / USDC.s',
    token0: 'SOL',
    token1: 'USDC.s',
    fee: 0.30,
    estYield: 19.37,
    volume24h: '$875,281',
    tvl: '$61,579',
    fees24h: '$2,626',
    type: 'CLMM',
    color0: '#14f195',
    color1: '#2775ca',
  },
  {
    id: 'weth-usdc',
    name: 'WETH / USDC.s',
    token0: 'WETH',
    token1: 'USDC.s',
    fee: 0.30,
    estYield: 15.20,
    volume24h: '$8,704',
    tvl: '$14',
    fees24h: '$26',
    type: 'CLMM',
    color0: '#627eea',
    color1: '#2775ca',
  },
  {
    id: 'wbtc-usdc',
    name: 'WBTC / USDC.s',
    token0: 'WBTC',
    token1: 'USDC.s',
    fee: 0.30,
    estYield: 11.67,
    volume24h: '$4,195',
    tvl: '$13',
    fees24h: '$13',
    type: 'CLMM',
    color0: '#f7931a',
    color1: '#2775ca',
  },
];

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: string;
  pendingEarnings: string;
  lifetimeVolume: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  commissionRate: number;
}

export const affiliateStats: AffiliateStats = {
  totalReferrals: 47,
  activeReferrals: 32,
  totalEarnings: '$12,847.50',
  pendingEarnings: '$1,234.80',
  lifetimeVolume: '$4,234,892.00',
  tier: 'Gold',
  commissionRate: 25,
};

export interface Referral {
  id: string;
  address: string;
  joinedAt: string;
  volume24h: string;
  totalVolume: string;
  earnings: string;
  status: 'active' | 'inactive';
}

export const referrals: Referral[] = [
  {
    id: '1',
    address: '0x7a2f...9b3c',
    joinedAt: '2026-03-01',
    volume24h: '$45,230',
    totalVolume: '$892,441',
    earnings: '$2,231.10',
    status: 'active',
  },
  {
    id: '2',
    address: '0x3d8e...7f2a',
    joinedAt: '2026-03-02',
    volume24h: '$32,110',
    totalVolume: '$654,221',
    earnings: '$1,635.55',
    status: 'active',
  },
  {
    id: '3',
    address: '0x9c4b...1e5d',
    joinedAt: '2026-03-03',
    volume24h: '$28,440',
    totalVolume: '$445,892',
    earnings: '$1,114.73',
    status: 'active',
  },
  {
    id: '4',
    address: '0x1f6a...8c2e',
    joinedAt: '2026-03-05',
    volume24h: '$15,220',
    totalVolume: '$223,441',
    earnings: '$558.60',
    status: 'active',
  },
  {
    id: '5',
    address: '0x5b9d...3a7f',
    joinedAt: '2026-03-08',
    volume24h: '$0',
    totalVolume: '$45,230',
    earnings: '$113.08',
    status: 'inactive',
  },
];

export const globalStats = {
  tvl: '$1,558,658',
  volume24h: '$951,838',
  fees24h: '$989',
  totalMarkets: 6,
  totalPools: 42,
};

export interface TierInfo {
  name: string;
  minVolume: string;
  commissionRate: number;
  benefits: string[];
  color: string;
}

export const tiers: TierInfo[] = [
  {
    name: 'Bronze',
    minVolume: '$0',
    commissionRate: 15,
    benefits: ['Base commission rate', 'Monthly payouts', 'Email support'],
    color: '#cd7f32',
  },
  {
    name: 'Silver',
    minVolume: '$100K',
    commissionRate: 20,
    benefits: ['Increased commission', 'Weekly payouts', 'Priority support', 'Exclusive updates'],
    color: '#c0c0c0',
  },
  {
    name: 'Gold',
    minVolume: '$500K',
    commissionRate: 25,
    benefits: ['High commission', 'Daily payouts', 'Dedicated manager', 'Early access', 'Custom referrals'],
    color: '#ffd700',
  },
  {
    name: 'Platinum',
    minVolume: '$2M',
    commissionRate: 35,
    benefits: ['Maximum commission', 'Instant payouts', 'VIP support', 'Beta features', 'Co-marketing', 'Revenue share'],
    color: '#e5e4e2',
  },
];
