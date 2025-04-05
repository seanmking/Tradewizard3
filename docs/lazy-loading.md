# Progressive Lazy Loading for HS Code Hierarchy

This document details the progressive lazy loading approach implemented for the HS code hierarchy in the HSCodeHierarchyService.

## The Challenge

The Harmonized System (HS) code hierarchy presents several challenges for efficient implementation:

1. **Size**: The full hierarchy contains:
   - ~97 chapters (2-digit codes)
   - ~1,200 headings (4-digit codes)
   - ~5,000+ subheadings (6-digit codes)
   - Country-specific extensions (8-10 digit codes)

2. **Access Patterns**:
   - Users typically navigate from general to specific codes
   - Most sessions only explore a subset of the full hierarchy
   - Different product categories focus on different hierarchy branches

3. **Performance Requirements**:
   - Fast initial loading time
   - Responsive navigation between levels
   - Efficient memory usage

## Lazy Loading Implementation

To address these challenges, we've implemented a progressive lazy loading approach that loads data just-in-time as it's needed.

### 1. Hierarchy Structure

The HS code hierarchy is represented as a map of nodes:

```typescript
// In-memory representation
private hsCodeMap: Map<string, HSCodeNode> = new Map();

// Node structure
interface HSCodeNode {
  code: string;
  description: string;
  level: 'chapter' | 'heading' | 'subheading';
  parent?: string;
  children?: string[];
  notes?: string[];
  examples?: string[];
  confidence?: number;
}
```

### 2. Progressive Loading Stages

The service loads the hierarchy in stages based on user interaction:

#### Stage 1: Initial Load (Chapters Only)

On service initialization, only the 2-digit chapter codes (01-97) are loaded:

```typescript
public async initialize(): Promise<void> {
  // Attempt to load from cache first
  if (this.config.useCaching) {
    const cacheKey = `${this.cacheKeyPrefix}hierarchy:base`;
    const cachedHierarchy = await this.cacheService.get(cacheKey);
    
    if (cachedHierarchy) {
      // Restore hierarchy from cache
      for (const [code, node] of cachedHierarchy) {
        this.hsCodeMap.set(code, node);
      }
      return;
    }
  }
  
  // Load chapters (01-97)
  const chapterCodes = Array.from({ length: 97 }, (_, i) => 
    (i + 1).toString().padStart(2, '0')
  );
  
  // Load concurrently but with limit to avoid API rate limits
  await this.loadConcurrently(
    chapterCodes, 
    this.loadChapterInfo.bind(this),
    this.config.maxConcurrentRequests
  );
  
  // Cache the base hierarchy
  if (this.config.useCaching) {
    await this.cacheService.set(
      cacheKey, 
      Array.from(this.hsCodeMap.entries())
    );
  }
}
```

This minimal initial load ensures the service is quickly ready for use while minimizing memory usage and API calls.

#### Stage 2: On-Demand Loading of Headings

When a specific chapter is accessed, its 4-digit headings are loaded:

```typescript
private async loadHSCodeHeadings(chapterCode: string): Promise<string[]> {
  // Check if we already have this chapter's headings
  const chapter = this.hsCodeMap.get(chapterCode);
  if (chapter?.children?.length) {
    return chapter.children;
  }
  
  // Check cache first
  const cacheKey = `${this.cacheKeyPrefix}headings:${chapterCode}`;
  if (this.config.useCaching) {
    const cachedHeadings = await this.cacheService.get(cacheKey);
    if (cachedHeadings) {
      // Update the chapter with cached headings
      if (chapter) {
        chapter.children = cachedHeadings.map(h => h.code);
        this.hsCodeMap.set(chapterCode, chapter);
      }
      
      // Add each heading to the map
      for (const heading of cachedHeadings) {
        this.hsCodeMap.set(heading.code, heading);
      }
      
      return cachedHeadings.map(h => h.code);
    }
  }
  
  // Load headings from API
  try {
    const headings = await this.hsCodeService.getHeadingsForChapter(chapterCode);
    
    // Process and store headings
    const processedHeadings = headings.map(heading => ({
      code: heading.code,
      description: heading.description,
      level: 'heading' as const,
      parent: chapterCode,
      children: []
    }));
    
    // Update the chapter with headings
    if (chapter) {
      chapter.children = processedHeadings.map(h => h.code);
      this.hsCodeMap.set(chapterCode, chapter);
    }
    
    // Add each heading to the map
    for (const heading of processedHeadings) {
      this.hsCodeMap.set(heading.code, heading);
    }
    
    // Cache the results
    if (this.config.useCaching) {
      await this.cacheService.set(
        cacheKey,
        processedHeadings
      );
    }
    
    return processedHeadings.map(h => h.code);
  } catch (error) {
    logger.error(`Error loading headings for chapter ${chapterCode}:`, error);
    return [];
  }
}
```

#### Stage 3: On-Demand Loading of Subheadings

Similarly, when a heading is accessed, its 6-digit subheadings are loaded:

```typescript
private async loadHSCodeSubheadings(headingCode: string): Promise<string[]> {
  // Check if we already have this heading's subheadings
  const heading = this.hsCodeMap.get(headingCode);
  if (heading?.children?.length) {
    return heading.children;
  }
  
  // Check cache first
  const cacheKey = `${this.cacheKeyPrefix}subheadings:${headingCode}`;
  if (this.config.useCaching) {
    const cachedSubheadings = await this.cacheService.get(cacheKey);
    if (cachedSubheadings) {
      // Process cached data
      // ...similar to headings processing
      return cachedSubheadings.map(s => s.code);
    }
  }
  
  // Load subheadings from API
  try {
    const subheadings = await this.hsCodeService.getSubheadingsForHeading(headingCode);
    
    // Process subheadings
    // ...similar to headings processing
    
    return processedSubheadings.map(s => s.code);
  } catch (error) {
    logger.error(`Error loading subheadings for heading ${headingCode}:`, error);
    return [];
  }
}
```

### 3. Smart Preloading

To optimize user experience, we implement intelligent preloading strategies:

#### Preloading of Top Suggestions

When returning HS code suggestions, we proactively load the children of top suggestions:

```typescript
async getSuggestedHSCodes(request: HSCodeRequest): Promise<HSCodeSuggestion[]> {
  // ... fetch suggestions logic ...
  
  // Get top suggestions based on confidence
  const topSuggestions = suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, this.config.maxSuggestions);
  
  // Preload children for top suggestions
  for (const suggestion of topSuggestions) {
    if (suggestion.level === 'chapter') {
      // Preload headings for this chapter
      const childCodes = await this.loadHSCodeHeadings(suggestion.code);
      
      // Add children to suggestion
      suggestion.children = childCodes.map(code => {
        const child = this.hsCodeMap.get(code);
        return {
          code,
          description: child?.description || `Code ${code}`,
          level: 'heading',
          confidence: suggestion.confidence * 0.9 // Slightly lower confidence
        };
      });
    }
  }
  
  return topSuggestions;
}
```

#### Configurable Preload Depth

The service supports configurable preload depth to balance responsiveness and resource usage:

```typescript
interface HSCodeHierarchyConfig {
  // ... other config options ...
  preloadDepth: 'none' | 'headings' | 'subheadings';
}

// Implementation in service
private async preloadHierarchy(): Promise<void> {
  if (this.config.preloadDepth === 'none') {
    return;
  }
  
  // Preload headings for all chapters
  if (this.config.preloadDepth === 'headings' || this.config.preloadDepth === 'subheadings') {
    const chapterCodes = Array.from(this.hsCodeMap.keys())
      .filter(code => this.hsCodeMap.get(code)?.level === 'chapter');
      
    await this.loadConcurrently(
      chapterCodes,
      this.loadHSCodeHeadings.bind(this),
      this.config.maxConcurrentRequests
    );
  }
  
  // Preload subheadings for all headings
  if (this.config.preloadDepth === 'subheadings') {
    const headingCodes = Array.from(this.hsCodeMap.keys())
      .filter(code => this.hsCodeMap.get(code)?.level === 'heading');
      
    await this.loadConcurrently(
      headingCodes,
      this.loadHSCodeSubheadings.bind(this),
      this.config.maxConcurrentRequests
    );
  }
}
```

## Performance Optimizations

Beyond basic lazy loading, several optimizations are implemented:

### 1. Concurrent Loading with Rate Limiting

To balance speed and API limits, we load multiple items concurrently but with a configurable limit:

```typescript
private async loadConcurrently<T>(
  items: T[],
  loadFn: (item: T) => Promise<any>,
  concurrencyLimit: number
): Promise<void> {
  // Process in batches of concurrencyLimit
  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const batch = items.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map(item => loadFn(item)));
  }
}
```

### 2. Prioritized Loading

For frequently accessed parts of the hierarchy:

```typescript
private getFrequentlyAccessedChapters(): string[] {
  // Based on product categories
  return [
    '22', // Beverages
    '61', '62', // Apparel
    '85', // Electronics
    '30', // Pharmaceuticals
    '87'  // Vehicles
  ];
}

public async prepareFrequentlyAccessedData(): Promise<void> {
  const frequentChapters = this.getFrequentlyAccessedChapters();
  
  // Load these chapters with higher priority
  await this.loadConcurrently(
    frequentChapters,
    async (chapter) => {
      await this.loadHSCodeHeadings(chapter);
      // Optionally load subheadings for key headings
    },
    this.config.maxConcurrentRequests
  );
}
```

### 3. Background Loading

For improved perceived performance, non-critical data is loaded in the background:

```typescript
public backgroundLoad(): void {
  // Start background loading process without awaiting completion
  setTimeout(() => {
    this.preloadHierarchy().catch(error => 
      logger.error('Error in background loading:', error)
    );
  }, 0);
}
```

## Memory Management

To prevent memory issues with large hierarchies, we implement memory management strategies:

### 1. Selective Branch Unloading

When memory pressure is detected, rarely used branches can be unloaded:

```typescript
public manageMemoryUsage(): void {
  // Get current memory usage
  const memoryUsage = process.memoryUsage();
  
  // If memory usage exceeds threshold
  if (memoryUsage.heapUsed > this.config.maxHeapUsageMB * 1024 * 1024) {
    this.unloadRarelyUsedBranches();
  }
}

private unloadRarelyUsedBranches(): void {
  // Track access frequency
  const accessCounts = new Map<string, number>();
  
  // Find least accessed branches
  // ... implementation ...
  
  // Unload least used branches while keeping essential nodes
  // ... implementation ...
}
```

### 2. Usage-Based Retention

We track access patterns to inform memory management decisions:

```typescript
private recordAccess(code: string): void {
  const now = Date.now();
  this.lastAccessTime.set(code, now);
  
  const accessCount = (this.accessCounts.get(code) || 0) + 1;
  this.accessCounts.set(code, accessCount);
}
```

## Monitoring and Tuning

To ensure optimal operation, the service includes monitoring capabilities:

```typescript
public getLoadingStatistics(): HierarchyLoadingStats {
  return {
    totalNodes: this.hsCodeMap.size,
    loadedByLevel: {
      chapter: this.countNodesByLevel('chapter'),
      heading: this.countNodesByLevel('heading'),
      subheading: this.countNodesByLevel('subheading')
    },
    cacheHitRate: this.calculateCacheHitRate(),
    averageLoadTime: this.calculateAverageLoadTime()
  };
}
```

These statistics can be used to fine-tune configuration parameters:

```typescript
public autoTuneConfiguration(): void {
  const stats = this.getLoadingStatistics();
  
  // Adjust preload depth based on cache hit rate and load times
  if (stats.cacheHitRate < 0.5 && stats.averageLoadTime > 200) {
    // Increase preloading to improve performance
    this.config.preloadDepth = 'headings';
  } else if (stats.cacheHitRate > 0.9 && this.hsCodeMap.size > 2000) {
    // Reduce preloading to save memory
    this.config.preloadDepth = 'none';
  }
}
```

## Conclusion

The progressive lazy loading approach provides several key benefits:

1. **Minimal Initial Footprint**: Only essential hierarchy components are loaded at startup
2. **Just-in-Time Loading**: Data is loaded as needed, reducing memory usage and API calls
3. **Optimized User Experience**: Intelligent preloading of likely-to-be-accessed nodes
4. **Scalability**: Graceful handling of the full HS code hierarchy without overwhelming resources
5. **Configurability**: Flexible tuning options to balance performance, memory usage, and responsiveness

This approach enables efficient navigation of the HS code hierarchy while maintaining responsive performance and reasonable resource usage. 