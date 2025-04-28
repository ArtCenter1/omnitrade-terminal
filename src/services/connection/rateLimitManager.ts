// src/services/connection/rateLimitManager.ts

/**
 * Rate limit information interface
 */
export interface RateLimitInfo {
  usedWeight: number;
  weightLimit: number;
  orderCount: number;
  orderLimit: number;
  resetTime: Date;
  isRateLimited: boolean;
  retryAfter?: number;
}

/**
 * Rate limit manager for Binance Testnet API
 * Handles tracking and managing API rate limits
 */
export class RateLimitManager {
  private static instance: RateLimitManager;
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private requestQueues: Map<string, Array<() => Promise<any>>> = new Map();
  private processingQueues: Map<string, boolean> = new Map();

  /**
   * Get the singleton instance of RateLimitManager
   */
  public static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize with default rate limits for known exchanges
    this.initializeRateLimits('binance_testnet', {
      usedWeight: 0,
      weightLimit: 1200, // 1200 weight per minute
      orderCount: 0,
      orderLimit: 100000, // 100,000 orders per day
      resetTime: new Date(Date.now() + 60000), // 1 minute from now
      isRateLimited: false,
    });
  }

  /**
   * Initialize rate limits for an exchange
   * @param exchangeId The exchange ID
   * @param rateLimitInfo The rate limit information
   */
  private initializeRateLimits(
    exchangeId: string,
    rateLimitInfo: RateLimitInfo,
  ): void {
    this.rateLimits.set(exchangeId, rateLimitInfo);
    this.requestQueues.set(exchangeId, []);
    this.processingQueues.set(exchangeId, false);
  }

  /**
   * Get rate limit information for an exchange
   * @param exchangeId The exchange ID
   * @returns The rate limit information
   */
  public getRateLimitInfo(exchangeId: string): RateLimitInfo {
    return (
      this.rateLimits.get(exchangeId) || {
        usedWeight: 0,
        weightLimit: 1200,
        orderCount: 0,
        orderLimit: 100000,
        resetTime: new Date(Date.now() + 60000),
        isRateLimited: false,
      }
    );
  }

  /**
   * Update rate limit information from response headers
   * @param exchangeId The exchange ID
   * @param headers The response headers
   */
  public updateFromHeaders(
    exchangeId: string,
    headers: Record<string, string>,
  ): void {
    const currentInfo = this.getRateLimitInfo(exchangeId);
    const updatedInfo: RateLimitInfo = { ...currentInfo };

    // Update used weight
    if (headers['x-mbx-used-weight-1m']) {
      updatedInfo.usedWeight = parseInt(headers['x-mbx-used-weight-1m']);
    }

    // Update order count
    if (headers['x-mbx-order-count-1d']) {
      updatedInfo.orderCount = parseInt(headers['x-mbx-order-count-1d']);
    }

    // Check if we're rate limited
    if (headers['retry-after']) {
      const retryAfter = parseInt(headers['retry-after']);
      updatedInfo.isRateLimited = true;
      updatedInfo.retryAfter = retryAfter;
      updatedInfo.resetTime = new Date(Date.now() + retryAfter * 1000);
    } else {
      // If not rate limited, check if we need to reset the counter
      if (Date.now() > currentInfo.resetTime.getTime()) {
        updatedInfo.usedWeight = 0;
        updatedInfo.resetTime = new Date(Date.now() + 60000); // 1 minute from now
        updatedInfo.isRateLimited = false;
        updatedInfo.retryAfter = undefined;
      }
    }

    // Update the rate limit info
    this.rateLimits.set(exchangeId, updatedInfo);
  }

  /**
   * Check if a request can be made with the given weight
   * @param exchangeId The exchange ID
   * @param weight The request weight
   * @returns Whether the request can be made
   */
  public canMakeRequest(exchangeId: string, weight: number = 1): boolean {
    const rateLimitInfo = this.getRateLimitInfo(exchangeId);

    // If we're rate limited, we can't make requests
    if (rateLimitInfo.isRateLimited) {
      return false;
    }

    // Reset counter if we've passed the reset time
    if (Date.now() > rateLimitInfo.resetTime.getTime()) {
      this.rateLimits.set(exchangeId, {
        ...rateLimitInfo,
        usedWeight: 0,
        resetTime: new Date(Date.now() + 60000), // 1 minute from now
      });
      return true;
    }

    // Check if we have enough weight left
    return rateLimitInfo.usedWeight + weight <= rateLimitInfo.weightLimit;
  }

  /**
   * Queue a request to be executed when rate limits allow
   * @param exchangeId The exchange ID
   * @param requestFn The request function
   * @param weight The request weight
   * @returns A promise that resolves with the request result
   */
  public async queueRequest<T>(
    exchangeId: string,
    requestFn: () => Promise<T>,
    weight: number = 1,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queue = this.requestQueues.get(exchangeId) || [];
      queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      this.requestQueues.set(exchangeId, queue);

      this.processQueue(exchangeId, weight);
    });
  }

  /**
   * Process the queue of requests for an exchange
   * @param exchangeId The exchange ID
   * @param weight The request weight
   */
  private async processQueue(
    exchangeId: string,
    weight: number = 1,
  ): Promise<void> {
    // If already processing, return
    if (this.processingQueues.get(exchangeId)) {
      return;
    }

    this.processingQueues.set(exchangeId, true);

    try {
      const queue = this.requestQueues.get(exchangeId) || [];

      while (queue.length > 0) {
        if (!this.canMakeRequest(exchangeId, weight)) {
          // Wait until we can make requests again
          const rateLimitInfo = this.getRateLimitInfo(exchangeId);
          const waitTime = rateLimitInfo.resetTime.getTime() - Date.now();
          await new Promise((resolve) =>
            setTimeout(resolve, waitTime > 0 ? waitTime : 1000),
          );
          continue;
        }

        const request = queue.shift();
        if (request) {
          // Update the used weight before making the request
          const rateLimitInfo = this.getRateLimitInfo(exchangeId);
          this.rateLimits.set(exchangeId, {
            ...rateLimitInfo,
            usedWeight: rateLimitInfo.usedWeight + weight,
          });

          try {
            await request();
          } catch (error) {
            console.error(
              `Error processing queued request for ${exchangeId}:`,
              error,
            );
          }
        }
      }
    } finally {
      this.processingQueues.set(exchangeId, false);
    }
  }

  /**
   * Execute a request with rate limit handling
   * @param exchangeId The exchange ID
   * @param requestFn The request function
   * @param weight The request weight
   * @param options Options for the request
   * @returns The request result
   */
  public async executeRequest<T>(
    exchangeId: string,
    requestFn: () => Promise<Response>,
    weight: number = 1,
    options: {
      parseJson?: boolean;
      retries?: number;
      retryDelay?: number;
    } = {},
  ): Promise<T> {
    const { parseJson = true, retries = 3, retryDelay = 1000 } = options;

    // Queue the request
    return this.queueRequest<T>(
      exchangeId,
      async () => {
        let lastError: Error | null = null;
        let attempt = 0;

        while (attempt <= retries) {
          try {
            const response = await requestFn();

            // Update rate limits from headers
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
              headers[key.toLowerCase()] = value;
            });
            this.updateFromHeaders(exchangeId, headers);

            // Check if rate limited
            if (response.status === 429 || response.status === 418) {
              const retryAfter = parseInt(headers['retry-after'] || '60');
              throw new Error(
                `Rate limited. Retry after ${retryAfter} seconds.`,
              );
            }

            // Check for other errors
            if (!response.ok) {
              // Don't throw here for non-OK responses like 404.
              // Let the original response propagate so middleware can handle it.
              // const errorText = await response.text(); // Avoid consuming body here
              // throw new Error(`API error (${response.status}): ${errorText}`);
              console.warn(
                `RateLimitManager: Received non-OK response (${response.status}). Passing response through.`,
              );
            }

            // Parse response if it was OK, otherwise return the response object itself
            if (response.ok && parseJson) {
              return (await response.json()) as T;
            } else if (response.ok) {
              return (await response.text()) as unknown as T;
            } else {
              // Return the raw Response object for non-OK statuses
              return response as unknown as T;
            }
            /* Original parsing logic:
            if (parseJson) {
              return await response.json() as T;
            } else {
              return await response.text() as unknown as T;
            }
*/
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error(String(error));

            // If rate limited, wait for the specified time
            if (lastError.message.includes('Rate limited')) {
              const retryAfterMatch = lastError.message.match(
                /Retry after (\d+) seconds/,
              );
              const retryAfter = retryAfterMatch
                ? parseInt(retryAfterMatch[1]) * 1000
                : retryDelay;
              await new Promise((resolve) => setTimeout(resolve, retryAfter));
            } else if (attempt < retries) {
              // For other errors, use exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, retryDelay * Math.pow(2, attempt)),
              );
            }

            attempt++;
          }
        }

        // If we've exhausted all retries, throw the last error
        throw lastError;
      },
      weight,
    );
  }
}
