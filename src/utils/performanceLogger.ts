// src/utils/performanceLogger.ts

/**
 * Simple performance logging utility for API benchmarking
 */

export interface PerformanceLogEntry {
  endpoint: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'success' | 'error';
  responseSize?: number;
  rateLimitInfo?: {
    usedWeight?: number;
    orderCount?: number;
    retryAfter?: number;
  };
  error?: string;
}

class PerformanceLogger {
  private static instance: PerformanceLogger;
  private logs: PerformanceLogEntry[] = [];
  private isEnabled: boolean = false;
  private maxLogs: number = 1000; // Prevent memory issues by limiting log size

  /**
   * Get the singleton instance of PerformanceLogger
   */
  public static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}

  /**
   * Enable or disable performance logging
   * @param enabled Whether logging is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Performance logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if performance logging is enabled
   * @returns Whether logging is enabled
   */
  public isLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Start measuring performance for an API call
   * @param endpoint The API endpoint
   * @param method The HTTP method
   * @returns A function to call when the API call completes
   */
  public startMeasuring(
    endpoint: string,
    method: string
  ): (status: 'success' | 'error', options?: {
    responseSize?: number;
    rateLimitInfo?: {
      usedWeight?: number;
      orderCount?: number;
      retryAfter?: number;
    };
    error?: string;
  }) => void {
    if (!this.isEnabled) {
      // Return a no-op function if logging is disabled
      return () => {};
    }

    const startTime = performance.now();

    return (
      status: 'success' | 'error',
      options: {
        responseSize?: number;
        rateLimitInfo?: {
          usedWeight?: number;
          orderCount?: number;
          retryAfter?: number;
        };
        error?: string;
      } = {}
    ) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const logEntry: PerformanceLogEntry = {
        endpoint,
        method,
        startTime,
        endTime,
        duration,
        status,
        ...options,
      };

      this.addLogEntry(logEntry);
    };
  }

  /**
   * Add a log entry to the logs
   * @param entry The log entry to add
   */
  private addLogEntry(entry: PerformanceLogEntry): void {
    // Add the log entry
    this.logs.push(entry);

    // Trim logs if they exceed the maximum size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console for immediate feedback
    console.log(
      `[Performance] ${entry.method} ${entry.endpoint}: ${entry.duration.toFixed(2)}ms ${
        entry.status === 'error' ? '(ERROR)' : ''
      }`
    );

    // Log rate limit info if available
    if (entry.rateLimitInfo) {
      const { usedWeight, orderCount, retryAfter } = entry.rateLimitInfo;
      if (usedWeight !== undefined) {
        console.log(`[Rate Limit] Used Weight: ${usedWeight}/1200`);
      }
      if (orderCount !== undefined) {
        console.log(`[Rate Limit] Order Count: ${orderCount}/100000`);
      }
      if (retryAfter !== undefined) {
        console.log(`[Rate Limit] Retry After: ${retryAfter}s`);
      }
    }
  }

  /**
   * Get all log entries
   * @returns All log entries
   */
  public getLogs(): PerformanceLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get log entries for a specific endpoint
   * @param endpoint The endpoint to filter by
   * @returns Log entries for the endpoint
   */
  public getLogsByEndpoint(endpoint: string): PerformanceLogEntry[] {
    return this.logs.filter((log) => log.endpoint === endpoint);
  }

  /**
   * Clear all log entries
   */
  public clearLogs(): void {
    this.logs = [];
    console.log('Performance logs cleared');
  }

  /**
   * Export logs to JSON
   * @returns JSON string of logs
   */
  public exportLogsToJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Calculate statistics for all logs or filtered by endpoint
   * @param endpoint Optional endpoint to filter by
   * @returns Statistics for the logs
   */
  public calculateStats(endpoint?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    successRate: number;
    avgResponseSize?: number;
    avgUsedWeight?: number;
  } {
    const filteredLogs = endpoint
      ? this.getLogsByEndpoint(endpoint)
      : this.logs;

    if (filteredLogs.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        successRate: 0,
      };
    }

    // Sort durations for percentile calculations
    const durations = filteredLogs.map((log) => log.duration).sort((a, b) => a - b);
    const successCount = filteredLogs.filter((log) => log.status === 'success').length;

    // Calculate response size and rate limit stats
    const responseSizes = filteredLogs
      .filter((log) => log.responseSize !== undefined)
      .map((log) => log.responseSize as number);
    
    const usedWeights = filteredLogs
      .filter((log) => log.rateLimitInfo?.usedWeight !== undefined)
      .map((log) => log.rateLimitInfo?.usedWeight as number);

    return {
      count: filteredLogs.length,
      avgDuration: durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: this.getPercentile(durations, 50),
      p95Duration: this.getPercentile(durations, 95),
      p99Duration: this.getPercentile(durations, 99),
      successRate: (successCount / filteredLogs.length) * 100,
      ...(responseSizes.length > 0
        ? {
            avgResponseSize:
              responseSizes.reduce((sum, size) => sum + size, 0) / responseSizes.length,
          }
        : {}),
      ...(usedWeights.length > 0
        ? {
            avgUsedWeight:
              usedWeights.reduce((sum, weight) => sum + weight, 0) / usedWeights.length,
          }
        : {}),
    };
  }

  /**
   * Get a percentile value from a sorted array
   * @param sortedArray The sorted array
   * @param percentile The percentile to get (0-100)
   * @returns The percentile value
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    if (sortedArray.length === 1) return sortedArray[0];

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper === lower) return sortedArray[lower];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}

export default PerformanceLogger;
