// This file is deprecated and will be removed in a future update.
// Please use tradingService.ts instead.

import { TradingPair } from '../types/trading';

// Re-export from the new service
export { generateMockTradingPairs } from './tradingService';

// Empty mock trading pairs object for backward compatibility
export const mockTradingPairs: Record<
  string,
  Record<string, TradingPair[]>
> = {};
