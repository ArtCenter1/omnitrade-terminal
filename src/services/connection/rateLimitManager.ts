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
  warningThresholdReached?: boolean; // New field to indicate warning threshold
  safetyThresholdReached?: boolean; // New field to indicate safety cutoff threshold
}

/**
 * Rate limit threshold configuration
 */
export interface RateLimitThresholds {
  warningThreshold: number; // Percentage (0-1) of rate limit at which to show warnings
  safetyThreshold: number; // Percentage (0-1) of rate limit at which to enforce safety cutoff
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
  private thresholds: Map<string, RateLimitThresholds> = new Map();
  private thresholdListeners: Map<string, Set<(info: RateLimitInfo) => void>> =
    new Map();
  private preferWebSocket: boolean = true; // Default to preferring WebSocket over REST

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
      warningThresholdReached: false,
      safetyThresholdReached: false,
    });

    // Set default thresholds
    this.setThresholds('binance_testnet', {
      warningThreshold: 0.7, // 70% of rate limit
      safetyThreshold: 0.9, // 90% of rate limit
    });
  }

  /**
   * Set whether to prefer WebSocket over REST API
   * @param prefer Whether to prefer WebSocket
   */
  public setPreferWebSocket(prefer: boolean): void {
    this.preferWebSocket = prefer;
    console.log(
      `Rate limit manager: ${prefer ? 'Preferring' : 'Not preferring'} WebSocket over REST`,
    );
  }

  /**
   * Get whether to prefer WebSocket over REST API
   * @returns Whether to prefer WebSocket
   */
  public getPreferWebSocket(): boolean {
    return this.preferWebSocket;
  }

  /**
   * Set thresholds for an exchange
   * @param exchangeId The exchange ID
   * @param thresholds The threshold configuration
   */
  public setThresholds(
    exchangeId: string,
    thresholds: RateLimitThresholds,
  ): void {
    this.thresholds.set(exchangeId, thresholds);
  }

  /**
   * Get thresholds for an exchange
   * @param exchangeId The exchange ID
   * @returns The threshold configuration
   */
  public getThresholds(exchangeId: string): RateLimitThresholds {
    return (
      this.thresholds.get(exchangeId) || {
        warningThreshold: 0.7,
        safetyThreshold: 0.9,
      }
    );
  }

  /**
   * Register a listener for threshold events
   * @param exchangeId The exchange ID
   * @param listener The listener function
   * @returns A function to unregister the listener
   */
  public registerThresholdListener(
    exchangeId: string,
    listener: (info: RateLimitInfo) => void,
  ): () => void {
    if (!this.thresholdListeners.has(exchangeId)) {
      this.thresholdListeners.set(exchangeId, new Set());
    }

    this.thresholdListeners.get(exchangeId)!.add(listener);

    // Return unregister function
    return () => {
      const listeners = this.thresholdListeners.get(exchangeId);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Notify threshold listeners
   * @param exchangeId The exchange ID
   * @param info The rate limit information
   */
  private notifyThresholdListeners(
    exchangeId: string,
    info: RateLimitInfo,
  ): void {
    const listeners = this.thresholdListeners.get(exchangeId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(info);
        } catch (error) {
          console.error(
            `Error in threshold listener for ${exchangeId}:`,
            error,
          );
        }
      });
    }
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
    const thresholds = this.getThresholds(exchangeId);
    let thresholdsChanged = false;

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

      // When rate limited, both thresholds are reached
      if (
        !updatedInfo.warningThresholdReached ||
        !updatedInfo.safetyThresholdReached
      ) {
        updatedInfo.warningThresholdReached = true;
        updatedInfo.safetyThresholdReached = true;
        thresholdsChanged = true;
      }

      console.error(
        `[${exchangeId}] RATE LIMITED! IP banned until ${updatedInfo.resetTime.toLocaleString()}. ` +
          `Please use WebSocket streams for live updates to avoid bans.`,
      );
    } else {
      // If not rate limited, check if we need to reset the counter
      if (Date.now() > currentInfo.resetTime.getTime()) {
        updatedInfo.usedWeight = 0;
        updatedInfo.resetTime = new Date(Date.now() + 60000); // 1 minute from now
        updatedInfo.isRateLimited = false;
        updatedInfo.retryAfter = undefined;

        // Reset thresholds
        if (
          updatedInfo.warningThresholdReached ||
          updatedInfo.safetyThresholdReached
        ) {
          updatedInfo.warningThresholdReached = false;
          updatedInfo.safetyThresholdReached = false;
          thresholdsChanged = true;
        }
      }

      // Check thresholds
      const usageRatio = updatedInfo.usedWeight / updatedInfo.weightLimit;

      // Check safety threshold (higher priority)
      if (
        usageRatio >= thresholds.safetyThreshold &&
        !updatedInfo.safetyThresholdReached
      ) {
        updatedInfo.safetyThresholdReached = true;
        updatedInfo.warningThresholdReached = true; // Safety implies warning
        thresholdsChanged = true;

        console.warn(
          `[${exchangeId}] SAFETY THRESHOLD REACHED! Used ${updatedInfo.usedWeight}/${updatedInfo.weightLimit} ` +
            `(${Math.round(usageRatio * 100)}%). Enforcing WebSocket-only mode to prevent rate limiting.`,
        );
      } else if (
        usageRatio < thresholds.safetyThreshold &&
        updatedInfo.safetyThresholdReached
      ) {
        updatedInfo.safetyThresholdReached = false;
        thresholdsChanged = true;

        console.info(
          `[${exchangeId}] Safety threshold cleared. Used ${updatedInfo.usedWeight}/${updatedInfo.weightLimit} ` +
            `(${Math.round(usageRatio * 100)}%).`,
        );
      }

      // Check warning threshold (lower priority)
      if (
        usageRatio >= thresholds.warningThreshold &&
        !updatedInfo.warningThresholdReached &&
        !updatedInfo.safetyThresholdReached
      ) {
        updatedInfo.warningThresholdReached = true;
        thresholdsChanged = true;

        console.warn(
          `[${exchangeId}] WARNING THRESHOLD REACHED! Used ${updatedInfo.usedWeight}/${updatedInfo.weightLimit} ` +
            `(${Math.round(usageRatio * 100)}%). Consider using WebSocket for real-time data.`,
        );
      } else if (
        usageRatio < thresholds.warningThreshold &&
        updatedInfo.warningThresholdReached &&
        !updatedInfo.safetyThresholdReached
      ) {
        updatedInfo.warningThresholdReached = false;
        thresholdsChanged = true;

        console.info(
          `[${exchangeId}] Warning threshold cleared. Used ${updatedInfo.usedWeight}/${updatedInfo.weightLimit} ` +
            `(${Math.round(usageRatio * 100)}%).`,
        );
      }
    }

    // Update the rate limit info
    this.rateLimits.set(exchangeId, updatedInfo);

    // Notify listeners if thresholds changed
    if (thresholdsChanged) {
      this.notifyThresholdListeners(exchangeId, updatedInfo);
    }
  }

  /**
   * Check if a request can be made with the given weight
   * @param exchangeId The exchange ID
   * @param weight The request weight
   * @param forceRest Whether to force using REST API even if safety threshold is reached
   * @returns Whether the request can be made
   */
  public canMakeRequest(
    exchangeId: string,
    weight: number = 1,
    forceRest: boolean = false,
  ): boolean {
    const rateLimitInfo = this.getRateLimitInfo(exchangeId);

    // If we're rate limited, we can't make requests
    if (rateLimitInfo.isRateLimited) {
      return false;
    }

    // If safety threshold is reached and we're not forcing REST, suggest using WebSocket
    if (rateLimitInfo.safetyThresholdReached && !forceRest) {
      console.warn(
        `[${exchangeId}] Safety threshold reached (${rateLimitInfo.usedWeight}/${rateLimitInfo.weightLimit}). ` +
          `Request denied. Use WebSocket for real-time data or set forceRest=true for critical operations.`,
      );
      return false;
    }

    // Reset counter if we've passed the reset time
    if (Date.now() > rateLimitInfo.resetTime.getTime()) {
      const updatedInfo = {
        ...rateLimitInfo,
        usedWeight: 0,
        resetTime: new Date(Date.now() + 60000), // 1 minute from now
      };

      // Reset thresholds if they were reached
      if (
        rateLimitInfo.warningThresholdReached ||
        rateLimitInfo.safetyThresholdReached
      ) {
        updatedInfo.warningThresholdReached = false;
        updatedInfo.safetyThresholdReached = false;
        this.notifyThresholdListeners(exchangeId, updatedInfo);
      }

      this.rateLimits.set(exchangeId, updatedInfo);
      return true;
    }

    // Check if we have enough weight left
    const hasEnoughWeight =
      rateLimitInfo.usedWeight + weight <= rateLimitInfo.weightLimit;

    // If we don't have enough weight, log a warning
    if (!hasEnoughWeight) {
      console.warn(
        `[${exchangeId}] Not enough weight left for request. ` +
          `Current: ${rateLimitInfo.usedWeight}, Needed: ${weight}, Limit: ${rateLimitInfo.weightLimit}`,
      );
    }

    return hasEnoughWeight;
  }

  /**
   * Queue a request to be executed when rate limits allow
   * @param exchangeId The exchange ID
   * @param requestFn The request function
   * @param weight The request weight
   * @param options Additional options for the request
   * @returns A promise that resolves with the request result
   */
  public async queueRequest<T>(
    exchangeId: string,
    requestFn: () => Promise<T>,
    weight: number = 1,
    options: {
      forceRest?: boolean;
      isWebSocketAvailable?: boolean;
      webSocketFallbackFn?: () => Promise<T>;
    } = {},
  ): Promise<T> {
    const {
      forceRest = false,
      isWebSocketAvailable = false,
      webSocketFallbackFn = null,
    } = options;

    // Get current rate limit info
    const rateLimitInfo = this.getRateLimitInfo(exchangeId);

    // Check if we should use WebSocket instead of REST
    if (
      !forceRest &&
      isWebSocketAvailable &&
      webSocketFallbackFn &&
      (this.preferWebSocket ||
        rateLimitInfo.warningThresholdReached ||
        rateLimitInfo.safetyThresholdReached)
    ) {
      console.log(
        `[${exchangeId}] Using WebSocket instead of REST API for request ` +
          `(preferWebSocket=${this.preferWebSocket}, ` +
          `warningThreshold=${rateLimitInfo.warningThresholdReached}, ` +
          `safetyThreshold=${rateLimitInfo.safetyThresholdReached})`,
      );

      try {
        return await webSocketFallbackFn();
      } catch (error) {
        console.warn(
          `[${exchangeId}] WebSocket fallback failed, falling back to REST API:`,
          error,
        );
        // Fall through to REST API
      }
    }

    // If safety threshold is reached and we're not forcing REST, reject the request
    if (rateLimitInfo.safetyThresholdReached && !forceRest) {
      return Promise.reject(
        new Error(
          `[${exchangeId}] Safety threshold reached (${rateLimitInfo.usedWeight}/${rateLimitInfo.weightLimit}). ` +
            `Request denied. Use WebSocket for real-time data or set forceRest=true for critical operations.`,
        ),
      );
    }

    // Queue the request
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

      this.processQueue(exchangeId, weight, forceRest);
    });
  }

  /**
   * Process the queue of requests for an exchange
   * @param exchangeId The exchange ID
   * @param weight The request weight
   * @param forceRest Whether to force using REST API even if safety threshold is reached
   */
  private async processQueue(
    exchangeId: string,
    weight: number = 1,
    forceRest: boolean = false,
  ): Promise<void> {
    // If already processing, return
    if (this.processingQueues.get(exchangeId)) {
      return;
    }

    this.processingQueues.set(exchangeId, true);

    try {
      const queue = this.requestQueues.get(exchangeId) || [];

      while (queue.length > 0) {
        if (!this.canMakeRequest(exchangeId, weight, forceRest)) {
          // Wait until we can make requests again
          const rateLimitInfo = this.getRateLimitInfo(exchangeId);
          const waitTime = rateLimitInfo.resetTime.getTime() - Date.now();

          // Log waiting message
          console.log(
            `[${exchangeId}] Rate limit approaching threshold. Waiting ${Math.max(waitTime, 1000) / 1000} seconds before next request.`,
          );

          await new Promise((resolve) =>
            setTimeout(resolve, waitTime > 0 ? waitTime : 1000),
          );
          continue;
        }

        const request = queue.shift();
        if (request) {
          // Update the used weight before making the request
          const rateLimitInfo = this.getRateLimitInfo(exchangeId);

          // Calculate new usage and check if it will cross thresholds
          const newUsedWeight = rateLimitInfo.usedWeight + weight;
          const usageRatio = newUsedWeight / rateLimitInfo.weightLimit;
          const thresholds = this.getThresholds(exchangeId);

          // Log warning if approaching thresholds
          if (
            usageRatio >= thresholds.warningThreshold * 0.8 &&
            usageRatio < thresholds.warningThreshold
          ) {
            console.log(
              `[${exchangeId}] Approaching warning threshold: ${newUsedWeight}/${rateLimitInfo.weightLimit} ` +
                `(${Math.round(usageRatio * 100)}%)`,
            );
          }

          this.rateLimits.set(exchangeId, {
            ...rateLimitInfo,
            usedWeight: newUsedWeight,
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
      forceRest?: boolean;
      isWebSocketAvailable?: boolean;
      webSocketFallbackFn?: () => Promise<T>;
    } = {},
  ): Promise<T> {
    const {
      parseJson = true,
      retries = 3,
      retryDelay = 1000,
      forceRest = false,
      isWebSocketAvailable = false,
      webSocketFallbackFn = null,
    } = options;

    // Queue the request with WebSocket fallback support
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

              // Log detailed rate limit error
              console.error(
                `[${exchangeId}] RATE LIMITED! Status: ${response.status}, ` +
                  `Retry-After: ${retryAfter} seconds. ` +
                  `Consider using WebSocket streams for real-time data to avoid bans.`,
              );

              throw new Error(
                `Rate limited. Retry after ${retryAfter} seconds.`,
              );
            }

            // Check for other errors
            if (!response.ok) {
              // For 404 errors, try to get more information about the error
              if (response.status === 404) {
                try {
                  const errorText = await response.text();
                  console.error(`API 404 error: ${errorText}`);
                  console.error(`URL that returned 404: ${response.url}`);

                  // Clone the response since we've consumed the body
                  const clonedResponse = new Response(errorText, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                  });

                  // Return the cloned response
                  return clonedResponse as unknown as T;
                } catch (textError) {
                  console.error('Error reading response text:', textError);
                }
              }

              // For other non-OK responses, log and pass through
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
      {
        forceRest,
        isWebSocketAvailable,
        webSocketFallbackFn,
      },
    );
  }
}
