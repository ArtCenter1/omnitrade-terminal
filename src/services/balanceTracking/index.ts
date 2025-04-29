/**
 * Balance Tracking Service Exports
 *
 * This file exports the balance tracking service.
 * The service is initialized in the useBalances hook to ensure proper error handling.
 */

import { balanceTrackingService } from './balanceTrackingService';

// Export the service
export { balanceTrackingService };
export type { BalanceUpdate, BalanceCache } from './balanceTrackingService';
