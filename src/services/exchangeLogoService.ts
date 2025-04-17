// Exchange logo service
import axios from 'axios';

// Map of exchange IDs to their CoinGecko IDs
const EXCHANGE_TO_COINGECKO_ID: Record<string, string> = {
  binance: 'binance',
  coinbase: 'coinbase',
  kraken: 'kraken',
  kucoin: 'kucoin',
  bybit: 'bybit',
  okx: 'okx',
  ftx: 'ftx',
  huobi: 'huobi',
  gate: 'gate',
  bitfinex: 'bitfinex',
};

// Map of exchange IDs to their logos (fallback)
const EXCHANGE_LOGOS: Record<string, string> = {
  binance: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png?v=026',
  coinbase: 'https://cryptologos.cc/logos/coinbase-coin-logo.png?v=026',
  kraken: 'https://cryptologos.cc/logos/kraken-logo.png?v=026',
  kucoin: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png?v=026',
  bybit: 'https://cryptologos.cc/logos/bybit-logo.png?v=026',
  okx: 'https://cryptologos.cc/logos/okb-okb-logo.png?v=026',
  ftx: 'https://cryptologos.cc/logos/ftx-token-ftt-logo.png?v=026',
  huobi: 'https://cryptologos.cc/logos/huobi-token-ht-logo.png?v=026',
  gate: 'https://cryptologos.cc/logos/gate-io-logo.png?v=026',
  bitfinex: 'https://cryptologos.cc/logos/bitfinex-logo.png?v=026',
};

// Cache for exchange logos
const logoCache: Record<string, string> = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the logo URL for an exchange
 * @param exchangeId The exchange ID
 * @returns The logo URL
 */
export async function getExchangeLogoUrl(exchangeId: string): Promise<string> {
  const normalizedExchangeId = exchangeId.toLowerCase();

  // Check cache first
  if (
    logoCache[normalizedExchangeId] &&
    Date.now() - lastCacheUpdate < CACHE_DURATION
  ) {
    return logoCache[normalizedExchangeId];
  }

  // Check if we have a local file
  const localPath = `/exchanges/${normalizedExchangeId}.svg`;

  try {
    // Try to fetch the local file
    const response = await fetch(localPath);
    if (response.ok) {
      logoCache[normalizedExchangeId] = localPath;
      return localPath;
    }
  } catch (error) {
    console.log(`No local logo found for ${exchangeId}, trying fallback`);
  }

  // Use fallback logo
  const fallbackLogo =
    EXCHANGE_LOGOS[normalizedExchangeId] || '/placeholder.svg';
  logoCache[normalizedExchangeId] = fallbackLogo;

  // Update cache timestamp
  lastCacheUpdate = Date.now();

  return fallbackLogo;
}

/**
 * Download exchange logos from CryptoLogos
 * This is a utility function to download logos for all supported exchanges
 */
export async function downloadExchangeLogos(): Promise<void> {
  for (const [exchangeId, logoUrl] of Object.entries(EXCHANGE_LOGOS)) {
    try {
      const response = await axios.get(logoUrl, {
        responseType: 'arraybuffer',
      });
      const blob = new Blob([response.data], { type: 'image/png' });

      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${exchangeId}.png`;
      link.click();

      console.log(`Downloaded logo for ${exchangeId}`);
    } catch (error) {
      console.error(`Error downloading logo for ${exchangeId}:`, error);
    }
  }
}

/**
 * Get all supported exchanges with their logos
 */
export async function getSupportedExchanges(): Promise<
  Array<{ id: string; name: string; logo: string }>
> {
  const exchanges = Object.keys(EXCHANGE_LOGOS).map(async (id) => {
    const logo = await getExchangeLogoUrl(id);
    return {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      logo,
    };
  });

  return Promise.all(exchanges);
}
