import { useState } from 'react';
import { cn } from '@/lib/utils';

// Multiple icon sources with fallback chain
const ICON_SOURCES = [
  // 1. CoinGecko (best coverage for crypto)
  (s: string) => `https://assets.coingecko.com/coins/images/1/small/${COINGECKO_IDS[s] || s.toLowerCase()}.png`,
  // 2. CryptoCompare
  (s: string) => `https://www.cryptocompare.com/media/44154091/${s.toLowerCase()}.png`,
  // 3. Trust Wallet assets (good coverage)
  (s: string) => `https://raw.githubusercontent.com/nicehash/cryptocurrency-icons/master/svg/${s.toLowerCase()}.svg`,
  // 4. CoinCap
  (s: string) => `https://assets.coincap.io/assets/icons/${s.toLowerCase()}@2x.png`,
];

// Special CoinGecko ID mappings for tokens that don't match symbol
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin', 'XRP': 'ripple', 'ADA': 'cardano', 'DOT': 'polkadot',
  'LINK': 'chainlink', 'UNI': 'uniswap', 'AAVE': 'aave', 'SUI': 'sui',
  'APT': 'aptos', 'ARB': 'arbitrum', 'OP': 'optimism', 'PEPE': 'pepe',
  'WIF': 'dogwifcoin', 'HYPE': 'hyperliquid', 'ONDO': 'ondo-finance',
  'TRUMP': 'official-trump', 'BERA': 'berachain', 'TIA': 'celestia',
  'PENGU': 'pudgy-penguins', 'KAITO': 'kaito', 'BNB': 'binancecoin',
  'HOOD': 'robinhood', 'NVDA': 'nvidia', 'AAPL': 'apple', 'COIN': 'coinbase',
  'GOLD': 'paxos-gold', 'XAU': 'paxos-gold', 'JUP': 'jupiter-exchange-solana',
  'ENA': 'ethena', 'WLD': 'worldcoin-wld', 'MORPHO': 'morpho',
};

// Color mapping for fallback backgrounds
const TOKEN_COLORS: Record<string, string> = {
  'BTC': 'bg-orange-500', 'ETH': 'bg-blue-500', 'SOL': 'bg-purple-500',
  'AVAX': 'bg-red-500', 'DOGE': 'bg-yellow-500', 'XRP': 'bg-gray-500',
  'LINK': 'bg-blue-600', 'UNI': 'bg-pink-500', 'AAVE': 'bg-cyan-500',
  'SUI': 'bg-sky-500', 'APT': 'bg-teal-500', 'HYPE': 'bg-green-500',
};

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export default function TokenIcon({ symbol, size = 24, className }: TokenIconProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  
  const clean = symbol.toUpperCase()
    .replace('-USD', '').replace('-PERP', '')
    .replace('1000', '').replace('k', '');

  const handleError = () => {
    if (sourceIndex < ICON_SOURCES.length - 1) {
      setSourceIndex(prev => prev + 1);
    } else {
      setShowFallback(true);
    }
  };

  if (showFallback) {
    const bgColor = TOKEN_COLORS[clean] || 'bg-white/20';
    return (
      <div 
        className={cn(
          'rounded-full flex items-center justify-center text-white font-bold',
          bgColor,
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {clean.substring(0, 2)}
      </div>
    );
  }

  const src = ICON_SOURCES[sourceIndex](clean);

  return (
    <img
      src={src}
      alt={clean}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      onError={handleError}
      loading="lazy"
    />
  );
}
