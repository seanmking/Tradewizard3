import { CacheService } from '@/utils/cache.service';
import { logger } from '../../utils/logger';
import { HSCode } from '../../types/classification.types';
import {
  WITSCacheConfig,
  WITSCacheEntry,
  WITSChangelogEntry,
  WITSQueueItem,
  DEFAULT_WITS_CONFIG
} from './types';

/**
 * WITS Cache Service - simplified version
 * Provides caching for WITS API data
 */
export class WITSCacheService {
  private static instance: WITSCacheService;
  private readonly hsCodeCache: CacheService;
  private readonly tariffCache: CacheService;
  
  private constructor() {
    this.hsCodeCache = new CacheService('wits-hscode');
    this.tariffCache = new CacheService('wits-tariff');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WITSCacheService {
    if (!WITSCacheService.instance) {
      WITSCacheService.instance = new WITSCacheService();
    }
    return WITSCacheService.instance;
  }

  /**
   * Get HS code data from cache
   */
  public getCachedHSCode(code: string): any {
    return this.hsCodeCache.get(code);
  }

  /**
   * Force update specific HS codes (simplified implementation)
   */
  public async forceUpdate(codes: string[]): Promise<void> {
    // Just clear the cache for these codes - actual implementation would
    // fetch fresh data from the API
    for (const code of codes) {
      this.hsCodeCache.delete(code);
    }
    logger.info(`Forced update for HS codes: ${codes.join(', ')}`);
  }

  /**
   * Get tariff data from cache
   */
  public getCachedTariff(key: string): any {
    return this.tariffCache.get(key);
  }

  /**
   * Set tariff data in cache
   */
  public setCachedTariff(key: string, data: any): void {
    this.tariffCache.set(key, data);
  }

  /**
   * Set HS code data in cache
   */
  public setCachedHSCode(key: string, data: any): void {
    this.hsCodeCache.set(key, data);
  }

  /**
   * Clear all cache
   */
  public clearAll(): void {
    this.hsCodeCache.clear();
    this.tariffCache.clear();
  }
} 