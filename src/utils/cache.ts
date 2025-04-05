/**
 * Cache configuration interface
 */
export interface CacheConfig {
  ttl: number; // Time-to-live in milliseconds
  maxSize?: number; // Maximum number of items in the cache
}

/**
 * Simple in-memory cache implementation with TTL support
 */
export class Cache<K, V> {
  private cache: Map<K, { value: V; expiry: number }>;
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.ttl = config.ttl;
    this.maxSize = config.maxSize || 1000;
  }

  /**
   * Set a value in the cache with the default TTL
   */
  set(key: K, value: V): void {
    this.cleanup();
    
    // If we're at capacity, remove the oldest item
    if (this.cache.size >= this.maxSize) {
      const keys = Array.from(this.cache.keys());
      if (keys.length > 0) {
        this.cache.delete(keys[0]);
      }
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  /**
   * Get a value from the cache if it exists and hasn't expired
   */
  get(key: K): V | null {
    const item = this.cache.get(key);
    
    // Return null if the item doesn't exist
    if (!item) {
      return null;
    }
    
    // Return null if the item has expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Check if a key exists in the cache and hasn't expired
   */
  has(key: K): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    // Return false if the item has expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete an item from the cache
   */
  delete(key: K): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of items in the cache
   */
  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  /**
   * Remove expired items from the cache
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
} 