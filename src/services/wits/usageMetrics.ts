import { logger } from '../../utils/logger';

export interface APICallMetric {
  timestamp: number;
  endpoint: string;
  responseTime: number;
  success: boolean;
  errorType?: string;
  apiKey: string;
}

export interface EndpointMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  p95ResponseTime: number;  // 95th percentile response time
  errorTypes: Map<string, number>;
}

export class UsageMetrics {
  private metrics: Map<string, APICallMetric[]> = new Map();
  private readonly retentionPeriod: number;  // How long to keep metrics for (in ms)

  constructor(retentionPeriodDays = 30) {
    this.retentionPeriod = retentionPeriodDays * 24 * 60 * 60 * 1000;
    
    // Start periodic cleanup
    setInterval(() => this.cleanup(), this.retentionPeriod / 30); // Clean up monthly
  }

  /**
   * Record a new API call
   */
  public recordCall(metric: APICallMetric): void {
    const apiKey = metric.apiKey;
    const metrics = this.getOrCreateMetrics(apiKey);
    metrics.push(metric);

    // Log for analysis
    logger.info('API Call recorded', {
      apiKey: metric.apiKey,
      endpoint: metric.endpoint,
      responseTime: metric.responseTime,
      success: metric.success,
      errorType: metric.errorType
    });
  }

  /**
   * Get metrics for a specific API key and time window
   */
  public getMetrics(apiKey: string, startTime?: number, endTime: number = Date.now()): EndpointMetrics {
    const metrics = this.metrics.get(apiKey) || [];
    const filteredMetrics = metrics.filter(m => 
      (!startTime || m.timestamp >= startTime) && m.timestamp <= endTime
    );

    const endpointMetrics = new Map<string, APICallMetric[]>();
    
    // Group by endpoint
    for (const metric of filteredMetrics) {
      const metrics = endpointMetrics.get(metric.endpoint) || [];
      metrics.push(metric);
      endpointMetrics.set(metric.endpoint, metrics);
    }

    // Calculate aggregate metrics
    const totalCalls = filteredMetrics.length;
    const successfulCalls = filteredMetrics.filter(m => m.success).length;
    const failedCalls = totalCalls - successfulCalls;
    
    // Calculate response times
    const responseTimes = filteredMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / totalCalls || 0;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p95ResponseTime = responseTimes[p95Index] || 0;

    // Count error types
    const errorTypes = new Map<string, number>();
    for (const metric of filteredMetrics) {
      if (metric.errorType) {
        const count = errorTypes.get(metric.errorType) || 0;
        errorTypes.set(metric.errorType, count + 1);
      }
    }

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime,
      p95ResponseTime,
      errorTypes
    };
  }

  /**
   * Get usage patterns (calls per hour) for an API key
   */
  public getUsagePattern(apiKey: string, days = 7): Map<number, number> {
    const metrics = this.metrics.get(apiKey) || [];
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const hourlyUsage = new Map<number, number>();
    
    for (const metric of metrics) {
      if (metric.timestamp >= startTime) {
        const hour = Math.floor(metric.timestamp / (60 * 60 * 1000));
        const count = hourlyUsage.get(hour) || 0;
        hourlyUsage.set(hour, count + 1);
      }
    }

    return hourlyUsage;
  }

  /**
   * Get recommendations for rate limits based on usage patterns
   */
  public getRateLimitRecommendations(apiKey: string): {
    perMinute: number;
    perHour: number;
    perDay: number;
  } {
    const metrics = this.metrics.get(apiKey) || [];
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Get recent metrics
    const recentMetrics = metrics.filter(m => m.timestamp >= oneDayAgo);
    
    // Calculate peak usage per minute/hour/day
    const minuteUsage = new Map<number, number>();
    const hourUsage = new Map<number, number>();
    let dayTotal = 0;

    for (const metric of recentMetrics) {
      const minute = Math.floor(metric.timestamp / (60 * 1000));
      const hour = Math.floor(metric.timestamp / (60 * 60 * 1000));
      
      minuteUsage.set(minute, (minuteUsage.get(minute) || 0) + 1);
      hourUsage.set(hour, (hourUsage.get(hour) || 0) + 1);
      dayTotal++;
    }

    // Get peak values with 20% buffer
    const peakPerMinute = Math.max(...Array.from(minuteUsage.values()), 0);
    const peakPerHour = Math.max(...Array.from(hourUsage.values()), 0);

    return {
      perMinute: Math.ceil(peakPerMinute * 1.2),
      perHour: Math.ceil(peakPerHour * 1.2),
      perDay: Math.ceil(dayTotal * 1.2)
    };
  }

  private getOrCreateMetrics(apiKey: string): APICallMetric[] {
    let metrics = this.metrics.get(apiKey);
    if (!metrics) {
      metrics = [];
      this.metrics.set(apiKey, metrics);
    }
    return metrics;
  }

  /**
   * Clean up old metrics to prevent memory bloat
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.retentionPeriod;
    
    for (const [apiKey, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp >= cutoff);
      if (filteredMetrics.length === 0) {
        this.metrics.delete(apiKey);
      } else {
        this.metrics.set(apiKey, filteredMetrics);
      }
    }
  }
} 