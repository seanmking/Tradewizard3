import { logger } from '@/utils/logger';

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache, optional
}

interface CacheItem<T> {
  value: T;
  expiry: number;
}

export class CacheService<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private ttl: number;
  private maxSize: number;
  
  constructor(options: CacheOptions) {
    this.ttl = options.ttl;
    this.maxSize = options.maxSize || 1000; // Default max size is 1000 items
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value, or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // If item doesn't exist or has expired, return undefined
    if (!item || item.expiry < Date.now()) {
      if (item) {
        this.cache.delete(key); // Clean up expired item
      }
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * Store a value in the cache
   * @param key Cache key
   * @param value Value to store
   */
  set(key: string, value: T): void {
    // If cache is at max size, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // Add the new value with its expiry time
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }
  
  /**
   * Remove an item from the cache
   * @param key Cache key
   * @returns True if item was found and removed, false otherwise
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the number of items in the cache
   * @returns Number of items in cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is not expired, false otherwise
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item || item.expiry < Date.now()) {
      if (item) {
        this.cache.delete(key); // Clean up expired item
      }
      return false;
    }
    
    return true;
  }

  /**
   * Get or set an item in the cache with a callback
   */
  public async getOrSet(key: string, callback: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const data = await callback();
      this.set(key, data);
      return data;
    } catch (error) {
      logger.error(`Error fetching data for cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove expired items from the cache
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict the oldest item from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
} 