# Cache Invalidation Strategy for HSCodeHierarchyService

This document details the cache invalidation mechanisms implemented for the HSCodeHierarchyService to ensure data freshness while optimizing performance.

## Overview

The HSCodeHierarchyService uses a sophisticated multi-layered caching strategy to optimize performance while maintaining data freshness. The service handles a large dataset (thousands of HS codes) that changes infrequently but requires efficient access patterns.

## Cache Structure

The service employs several cache layers with different invalidation strategies:

1. **Base Hierarchy Cache**
   - Cache Key: `${cacheKeyPrefix}v1:hierarchy:base`
   - Contents: Core hierarchy structure (chapters)
   - TTL: 30 days (configurable)

2. **Chapter-Level Caches**
   - Cache Key: `${cacheKeyPrefix}v1:chapter:${chapterCode}`
   - Contents: Chapter metadata and descriptions
   - TTL: 30 days (configurable)

3. **Heading-Level Caches**
   - Cache Key: `${cacheKeyPrefix}v1:headings:${chapterCode}`
   - Contents: Headings (4-digit codes) within a chapter
   - TTL: 30 days (configurable)

4. **Subheading-Level Caches**
   - Cache Key: `${cacheKeyPrefix}v1:subheadings:${headingCode}`
   - Contents: Subheadings (6-digit codes) within a heading
   - TTL: 30 days (configurable)

5. **Search Result Caches**
   - Cache Key: `${cacheKeyPrefix}v1:suggestion:${hashOfRequest}`
   - Contents: HS code suggestions for specific product descriptions
   - TTL: 7 days (shorter to account for algorithm improvements)

## Invalidation Mechanisms

The system implements three complementary invalidation mechanisms to balance performance and accuracy:

### 1. Time-Based Expiration

Each cache entry has a Time-To-Live (TTL) that automatically invalidates the entry after a specified period:

```typescript
// Cache initialization in constructor
this.cacheService = cacheService;
this.config = {
  cacheExpiryMinutes: 43200, // 30 days default
  ...defaultConfig,
  ...config
};

// When setting cache entries
await this.cacheService.set(
  cacheKey,
  data
);
```

Key characteristics:
- Different TTLs for different cache types based on update frequency
- Configurable via `cacheExpiryMinutes` in service configuration
- Automatic invalidation by the underlying CacheService

### 2. Manual Invalidation API

For scenarios requiring immediate cache invalidation (updates to HS codes, algorithm improvements), a manual invalidation API is provided:

```typescript
/**
 * Invalidates all cached data or specific parts of the cache
 * @param type Optional cache type to invalidate ('hierarchy', 'search', or 'all')
 */
public invalidateCache(type: 'hierarchy' | 'search' | 'all' = 'all'): void {
  const cacheKeys: string[] = [];
  
  if (type === 'hierarchy' || type === 'all') {
    // Add hierarchy-related cache keys
    cacheKeys.push(`${this.cacheKeyPrefix}v1:hierarchy:base`);
    
    // Add chapter and heading cache keys
    for (const key of this.cacheService.keys()) {
      if (key.startsWith(`${this.cacheKeyPrefix}v1:chapter:`) || 
          key.startsWith(`${this.cacheKeyPrefix}v1:headings:`) ||
          key.startsWith(`${this.cacheKeyPrefix}v1:subheadings:`)) {
        cacheKeys.push(key);
      }
    }
    
    // Clear internal map
    this.hsCodeMap.clear();
  }
  
  if (type === 'search' || type === 'all') {
    // Add search result cache keys
    for (const key of this.cacheService.keys()) {
      if (key.startsWith(`${this.cacheKeyPrefix}v1:suggestion:`)) {
        cacheKeys.push(key);
      }
    }
  }
  
  // Delete all identified keys
  for (const key of cacheKeys) {
    this.cacheService.delete(key);
  }
  
  // Reinitialize if hierarchy was invalidated
  if (type === 'hierarchy' || type === 'all') {
    this.initialize();
  }
}
```

Key characteristics:
- Granular invalidation options (hierarchy only, search only, or all)
- Support for selective invalidation by key pattern
- Automatic reinitialization of necessary components

### 3. Version-Based Cache Keys

To handle major updates to the HS code system or significant algorithm changes, the service uses versioned cache keys:

```typescript
// In initialization
this.cacheKeyPrefix = 'hscode:v1:';

// When accessing cache
const cacheKey = `${this.cacheKeyPrefix}hierarchy:base`;
```

When a major update is needed:

```typescript
// Update version in code deployment
this.cacheKeyPrefix = 'hscode:v2:';
```

Key characteristics:
- Clean invalidation of all previous cache without affecting other systems
- Allows gradual migration to new versions
- No need to explicitly clear old cache entries

## Invalidation Triggers

The following events should trigger cache invalidation:

1. **Annual HS Code Updates**
   - The World Customs Organization typically updates HS codes every 5 years with the latest version being HS 2022
   - Individual countries may make modifications more frequently
   - These require a manual cache invalidation or version increment

2. **Algorithm Improvements**
   - Enhancements to the confidence scoring algorithm
   - Changes to category-to-chapter mappings
   - Improvements in search functionality
   - These typically require only search cache invalidation

3. **Data Quality Issues**
   - Discovery of incorrect or outdated HS code descriptions
   - Issues with hierarchical relationships
   - These require hierarchy cache invalidation

4. **System Maintenance**
   - During major system deployments
   - When troubleshooting cache-related issues
   - These may require full cache invalidation

## Implementation in Admin Interface

A cache management section in the admin interface allows authorized users to:

1. **View Cache Statistics**
   - Current cache size
   - Hit/miss ratios
   - Cache entry counts by type

2. **Trigger Invalidation**
   - Select invalidation scope (hierarchy, search, or all)
   - View invalidation history
   - Schedule future invalidations for system updates

3. **Configure Cache Parameters**
   - Update TTL settings
   - Adjust preload depth settings
   - Modify other cache-related parameters

## Best Practices

1. **Scheduled Invalidation**
   - Schedule hierarchy cache invalidation during low-traffic periods
   - Coordinate with known HS code update schedules

2. **Selective Invalidation**
   - Use the most specific invalidation type needed
   - Avoid invalidating all cache unless necessary

3. **Monitoring**
   - Track cache hit/miss ratios before and after invalidation
   - Monitor system performance during reinitialization
   - Log all manual invalidation events for audit purposes

4. **Version Management**
   - Increment cache version for major HS code system updates
   - Document version changes and their rationale
   - Consider data migration needs when changing versions 