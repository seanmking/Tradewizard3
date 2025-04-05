import { logger } from '../../utils/logger';

export interface RateLimiterConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  apiKey: string;        // API key to track
}

interface RequestWindow {
  timestamps: number[];  // Array of request timestamps
  apiKey: string;       // API key for this window
}

export class RateLimiter {
  private windows: Map<string, RequestWindow> = new Map();
  private readonly config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Check if a request can be made and record it if allowed
   * @returns boolean indicating if request is allowed
   */
  public async checkAndRecord(): Promise<boolean> {
    const now = Date.now();
    const window = this.getOrCreateWindow(this.config.apiKey);
    
    // Remove timestamps outside the current window
    window.timestamps = window.timestamps.filter(
      timestamp => now - timestamp < this.config.windowMs
    );

    // Check if we're under the limit
    if (window.timestamps.length >= this.config.maxRequests) {
      logger.warn(`Rate limit exceeded for API key ${this.config.apiKey}`, {
        windowMs: this.config.windowMs,
        maxRequests: this.config.maxRequests,
        currentRequests: window.timestamps.length
      });
      return false;
    }

    // Record this request
    window.timestamps.push(now);
    return true;
  }

  /**
   * Get current usage metrics
   */
  public getMetrics(): {
    remainingRequests: number;
    resetTime: number;
    totalRequests: number;
  } {
    const now = Date.now();
    const window = this.getOrCreateWindow(this.config.apiKey);
    
    // Clean up old timestamps
    window.timestamps = window.timestamps.filter(
      timestamp => now - timestamp < this.config.windowMs
    );

    // Calculate metrics
    const oldestTimestamp = window.timestamps[0] || now;
    const resetTime = oldestTimestamp + this.config.windowMs;
    
    return {
      remainingRequests: this.config.maxRequests - window.timestamps.length,
      resetTime,
      totalRequests: window.timestamps.length
    };
  }

  /**
   * Get or create a request window for an API key
   */
  private getOrCreateWindow(apiKey: string): RequestWindow {
    let window = this.windows.get(apiKey);
    
    if (!window) {
      window = {
        timestamps: [],
        apiKey
      };
      this.windows.set(apiKey, window);
    }

    return window;
  }

  /**
   * Clean up old windows to prevent memory leaks
   */
  public cleanup(): void {
    const now = Date.now();
    
    for (const [apiKey, window] of this.windows.entries()) {
      // Remove timestamps outside the current window
      window.timestamps = window.timestamps.filter(
        timestamp => now - timestamp < this.config.windowMs
      );

      // Remove empty windows
      if (window.timestamps.length === 0) {
        this.windows.delete(apiKey);
      }
    }
  }
} 