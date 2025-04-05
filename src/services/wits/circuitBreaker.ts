import { logger } from '../../utils/logger';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  onStateChange?: (state: CircuitBreakerState) => void;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.setState('HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    const now = Date.now();
    return now - this.lastFailureTime >= this.config.resetTimeout;
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.setState('CLOSED');
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.setState('OPEN');
    }
  }

  private setState(newState: CircuitBreakerState): void {
    if (this.state !== newState) {
      this.state = newState;
      logger.info(`Circuit breaker state changed to ${newState}`);
      this.config.onStateChange?.(newState);
    }
  }

  public getState(): CircuitBreakerState {
    return this.state;
  }

  public getMetrics(): {
    state: CircuitBreakerState;
    failureCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
} 