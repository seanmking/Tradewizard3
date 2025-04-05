import { HSCodeSuggestion } from '../data/hs-codes/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Singleton cache service for HS code data and queries
 */
export class HSCodeCache {
  private static instance: HSCodeCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): HSCodeCache {
    if (!HSCodeCache.instance) {
      HSCodeCache.instance = new HSCodeCache();
    }
    return HSCodeCache.instance;
  }
  
  /**
   * Get an item from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set an item in the cache with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Remove an item from the cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cached HS code classification suggestions
   */
  getCachedSuggestions(productQuery: string): HSCodeSuggestion[] | null {
    return this.get<HSCodeSuggestion[]>(`suggestions:${productQuery.toLowerCase()}`);
  }
  
  /**
   * Cache HS code classification suggestions
   */
  setCachedSuggestions(productQuery: string, suggestions: HSCodeSuggestion[]): void {
    // Cache suggestions for 30 minutes
    this.set(`suggestions:${productQuery.toLowerCase()}`, suggestions, 30 * 60 * 1000);
  }
  
  /**
   * Get statistics about the cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 