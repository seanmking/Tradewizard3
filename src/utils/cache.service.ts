import { Cache } from './cache';

/**
 * Service for managing cache data with namespaces
 */
export class CacheService {
  private cache: Cache<string, any>;
  private namespace: string;
  
  /**
   * Create a new cache service with a namespace
   * @param namespace Namespace for this cache instance
   */
  constructor(namespace: string) {
    this.namespace = namespace;
    this.cache = new Cache<string, any>({
      ttl: 24 * 60 * 60 * 1000, // 24 hours default TTL
      maxSize: 1000 // Maximum 1000 items
    });
  }
  
  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get(key: string): any {
    return this.cache.get(this.getNamespacedKey(key));
  }
  
  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to cache
   */
  set(key: string, value: any): void {
    this.cache.set(this.getNamespacedKey(key), value);
  }
  
  /**
   * Check if an item exists in the cache
   * @param key Cache key
   * @returns True if the item exists
   */
  has(key: string): boolean {
    return this.cache.has(this.getNamespacedKey(key));
  }
  
  /**
   * Delete an item from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(this.getNamespacedKey(key));
  }
  
  /**
   * Clear all items in this namespace
   */
  clear(): void {
    // Since we don't have a way to enumerate keys, we'll just
    // clear the entire cache. In a production implementation,
    // we would want a more sophisticated approach.
    this.cache.clear();
  }
  
  /**
   * Get a key with the namespace prefix
   * @param key Original key
   * @returns Namespaced key
   */
  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
} 