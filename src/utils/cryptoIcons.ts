// Utility functions for cryptocurrency icons
import React from 'react';

// Map of common cryptocurrency symbols to their icon paths
const CRYPTO_ICON_MAP: Record<string, string> = {
  BTC: '/crypto-icons/btc.svg',
  ETH: '/crypto-icons/eth.svg',
  USDT: '/crypto-icons/usdt.svg',
  USDC: '/crypto-icons/usdc.svg',
  BNB: '/crypto-icons/bnb.svg',
  XRP: '/crypto-icons/xrp.svg',
  SOL: '/crypto-icons/sol.svg',
  ADA: '/crypto-icons/ada.svg',
  DOGE: '/crypto-icons/doge.svg',
  AVAX: '/crypto-icons/avax.svg',
  MATIC: '/crypto-icons/matic.svg',
  DOT: '/crypto-icons/dot.svg',
  LINK: '/crypto-icons/link.svg',
};

/**
 * Get the icon URL for a cryptocurrency symbol
 * @param symbol The cryptocurrency symbol (e.g., BTC, ETH)
 * @returns The URL to the cryptocurrency icon
 */
export function getCryptoIconUrl(symbol: string): string {
  if (!symbol) return '/placeholder.svg';

  const upperSymbol = symbol.toUpperCase();

  // Check if we have a predefined icon for this symbol
  if (CRYPTO_ICON_MAP[upperSymbol]) {
    return CRYPTO_ICON_MAP[upperSymbol];
  }

  // Try to use the lowercase symbol as a fallback
  return `/crypto-icons/${symbol.toLowerCase()}.svg`;
}

/**
 * Component to display a cryptocurrency icon
 * @param symbol The cryptocurrency symbol
 * @param className Additional CSS classes
 * @returns JSX element with the cryptocurrency icon
 */
export function CryptoIcon({
  symbol,
  className = 'w-6 h-6 rounded-full',
  fallbackClassName = 'bg-orange-500 flex items-center justify-center'
}: {
  symbol: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const iconUrl = getCryptoIconUrl(symbol);

  return (
    <div className={className}>
      <img
        src={iconUrl}
        alt={symbol}
        className="w-full h-full object-cover"
        onError={(e) => {
          // If the image fails to load, show the first letter of the symbol
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement?.classList.add(...fallbackClassName.split(' '));

          // Create a span with the first letter
          const span = document.createElement('span');
          span.className = 'text-xs font-bold text-white';
          span.textContent = symbol.substring(0, 1).toUpperCase();
          e.currentTarget.parentElement?.appendChild(span);
        }}
      />
    </div>
  );
}
