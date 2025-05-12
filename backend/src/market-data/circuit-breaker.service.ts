import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation, requests allowed
  OPEN = 'OPEN', // Circuit is open, requests blocked
  HALF_OPEN = 'HALF_OPEN', // Testing if service is back to normal
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Timeout in ms before trying again
  halfOpenMaxRequests: number; // Max requests to allow in half-open state
}

/**
 * Circuit breaker service for protecting external API calls
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits: Map<string, {
    state: CircuitBreakerState;
    failures: number;
    lastFailure: number;
    lastReset: number;
    config: CircuitBreakerConfig;
    halfOpenRequests: number;
  }> = new Map();

  /**
   * Default circuit breaker configuration
   */
  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60 * 1000, // 1 minute
    halfOpenMaxRequests: 3,
  };

  /**
   * Register a new circuit
   */
  registerCircuit(
    name: string,
    config: Partial<CircuitBreakerConfig> = {},
  ): void {
    if (this.circuits.has(name)) {
      this.logger.warn(`Circuit ${name} already registered`);
      return;
    }

    this.circuits.set(name, {
      state: CircuitBreakerState.CLOSED,
      failures: 0,
      lastFailure: 0,
      lastReset: Date.now(),
      config: { ...this.defaultConfig, ...config },
      halfOpenRequests: 0,
    });

    this.logger.log(`Circuit ${name} registered`);
  }

  /**
   * Check if a circuit is closed (requests allowed)
   */
  isAllowed(name: string): boolean {
    // If circuit doesn't exist, register it with default config
    if (!this.circuits.has(name)) {
      this.registerCircuit(name);
    }

    const circuit = this.circuits.get(name)!;
    const now = Date.now();

    // If circuit is OPEN, check if we should try half-open
    if (circuit.state === CircuitBreakerState.OPEN) {
      if (now - circuit.lastFailure > circuit.config.resetTimeout) {
        this.logger.log(`Circuit ${name} transitioning from OPEN to HALF_OPEN`);
        circuit.state = CircuitBreakerState.HALF_OPEN;
        circuit.halfOpenRequests = 0;
        return true; // Allow one test request
      }
      return false; // Circuit still open, block requests
    }

    // If circuit is HALF_OPEN, only allow a limited number of requests
    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      if (circuit.halfOpenRequests < circuit.config.halfOpenMaxRequests) {
        circuit.halfOpenRequests++;
        return true;
      }
      return false; // Too many half-open requests, block until success/failure recorded
    }

    // Circuit is CLOSED, allow requests
    return true;
  }

  /**
   * Record a successful API call
   */
  recordSuccess(name: string): void {
    if (!this.circuits.has(name)) {
      this.registerCircuit(name);
      return;
    }

    const circuit = this.circuits.get(name)!;

    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      this.logger.log(`Circuit ${name} test request succeeded, closing circuit`);
      circuit.state = CircuitBreakerState.CLOSED;
      circuit.failures = 0;
      circuit.lastReset = Date.now();
    }
  }

  /**
   * Record a failed API call
   */
  recordFailure(name: string): void {
    if (!this.circuits.has(name)) {
      this.registerCircuit(name);
    }

    const circuit = this.circuits.get(name)!;
    const now = Date.now();

    circuit.failures++;
    circuit.lastFailure = now;

    // If we're in HALF_OPEN state, any failure reopens the circuit
    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      this.logger.warn(`Circuit ${name} test request failed, reopening circuit`);
      circuit.state = CircuitBreakerState.OPEN;
      return;
    }

    // If we've reached the failure threshold, open the circuit
    if (
      circuit.state === CircuitBreakerState.CLOSED &&
      circuit.failures >= circuit.config.failureThreshold
    ) {
      this.logger.warn(
        `Circuit ${name} threshold reached (${circuit.failures} failures), opening circuit`,
      );
      circuit.state = CircuitBreakerState.OPEN;
    }
  }

  /**
   * Get the current state of a circuit
   */
  getState(name: string): CircuitBreakerState {
    if (!this.circuits.has(name)) {
      this.registerCircuit(name);
    }

    return this.circuits.get(name)!.state;
  }

  /**
   * Get all circuit states
   */
  getAllCircuits(): Record<string, { state: CircuitBreakerState; failures: number }> {
    const result: Record<string, { state: CircuitBreakerState; failures: number }> = {};

    this.circuits.forEach((circuit, name) => {
      result[name] = {
        state: circuit.state,
        failures: circuit.failures,
      };
    });

    return result;
  }

  /**
   * Get the timestamp of the last failure for a circuit
   * @param name The name of the circuit
   * @returns The timestamp of the last failure, or null if no failures
   */
  getLastFailureTime(name: string): number | null {
    if (!this.circuits.has(name)) {
      return null;
    }

    const circuit = this.circuits.get(name)!;
    return circuit.lastFailure > 0 ? circuit.lastFailure : null;
  }

  /**
   * Reset a circuit to closed state
   */
  resetCircuit(name: string): void {
    if (!this.circuits.has(name)) {
      this.registerCircuit(name);
      return;
    }

    const circuit = this.circuits.get(name)!;
    circuit.state = CircuitBreakerState.CLOSED;
    circuit.failures = 0;
    circuit.lastReset = Date.now();

    this.logger.log(`Circuit ${name} manually reset to CLOSED state`);
  }
}
