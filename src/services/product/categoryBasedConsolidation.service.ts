// Replace logger with console.log to avoid setImmediate errors
// import { logger } from '../../utils/logger';
import { ProductVariant, ProductGroup } from './productConsolidation.service';
import { EmbeddingService } from '../classification/embeddingService';
import { IntelligenceMCPService } from '../../mcp/intelligence-mcp/intelligence-mcp.service';
import { CacheService } from '../cache-service';
import { productCategories } from '../../data/product-categories';

/**
 * Represents a product category with its metadata
 */
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  attributes: AttributeDefinition[];
  parentCategory?: string;
  keywords: string[];
  hsCodeHints: string[];
  iconPath?: string;
  priority: number;
  alternateNames: string[];
  metadata: Record<string, any>;
}

/**
 * Defines a product attribute with validation rules
 */
export interface AttributeDefinition {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  allowedValues?: string[];
  min?: number;
  max?: number;
}

/**
 * Extracted product attributes
 */
export interface ProductAttributes {
  mainIngredient?: string;
  preparationType?: string;
  storageType?: 'ambient' | 'refrigerated' | 'frozen';
  packagingType?: string;
  targetMarket?: string;
  primaryUse?: string;
  [key: string]: any;
}

/**
 * Interface for category results
 */
export interface CategoryResult {
  id: string;
  name: string;
  products: ProductVariant[];
  confidence: number;
  attributes: {
    itemCount: number;
    source: string;
  };
}

/**
 * Configuration options for the consolidation service
 */
export interface CategoryConsolidationConfig {
  similarityThreshold: number;
  confidenceThreshold: number;
  enableLLM: boolean;
  maxLLMRetries: number;
  useCaching: boolean;
  cacheExpiryMinutes: number;
  categories?: ProductCategory[];
  batchSize: number;
  maxConcurrentRequests: number;
}

/**
 * Enhanced service for consolidating products based on categories
 * with improved error handling and fallbacks
 * 
 * @version 2.0.0
 */
export class CategoryBasedConsolidationService {
  private readonly defaultConfig: CategoryConsolidationConfig = {
    similarityThreshold: 0.75,
    confidenceThreshold: 0.75,
    enableLLM: true,
    maxLLMRetries: 3,
    useCaching: true,
    cacheExpiryMinutes: 43200, // 30 days
    batchSize: 10,
    maxConcurrentRequests: 5
  };

  private config: CategoryConsolidationConfig;
  private categories: ProductCategory[] = [];
  private cacheKeyPrefix = 'category-consolidation:';

  constructor(
    private embeddingService: EmbeddingService,
    private llmService: IntelligenceMCPService,
    private cacheService: CacheService<any>,
    config?: Partial<CategoryConsolidationConfig>
  ) {
    this.config = {
      ...this.defaultConfig,
      ...config
    };

    // Load predefined categories if not provided in config
    if (!this.config.categories) {
      this.loadDefaultCategories();
    } else {
      this.categories = this.config.categories;
    }

    console.log('CategoryBasedConsolidationService initialized');
  }

  /**
   * Main method to consolidate products into categories
   * @param products Array of product variants to consolidate
   * @returns Array of category results with grouped products
   */
  async consolidateProducts(products: ProductVariant[]): Promise<CategoryResult[]> {
    try {
      console.log(`Consolidating ${products.length} products using category-based approach`);

      // 1. Generate embeddings for all products
      const productEmbeddings = await this.getProductEmbeddings(products);

      // 2. Perform hierarchical clustering
      const clusters = await this.clusterProducts(products, productEmbeddings);

      // 3. Categorize each cluster
      const categorizedClusters = await this.categorizeClusters(clusters, products);

      // 4. Post-process and format results
      const results = this.formatResults(categorizedClusters, products);

      console.log(`Consolidated ${products.length} products into ${results.length} categories`);
      return results;
    } catch (error) {
      console.error('Error consolidating products:', error);
      
      // Fallback: Return products in basic categories if clustering fails
      return this.fallbackCategorization(products);
    }
  }

  /**
   * Generate embeddings for all products
   * @param products Array of products
   * @returns Map of product IDs to embeddings
   */
  private async getProductEmbeddings(products: ProductVariant[]): Promise<Map<string, number[]>> {
    try {
      console.log(`Generating embeddings for ${products.length} products`);
      const productEmbeddings = new Map<string, number[]>();
      
      // Process in batches to avoid overloading the embedding service
      const batchSize = this.config.batchSize;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const batchTexts = batch.map(product => this.getProductText(product));
        
        // Process batch concurrently
        const batchPromises = batchTexts.map(text => 
          this.getCachedEmbedding(text)
        );
        
        const batchEmbeddings = await Promise.all(batchPromises);
        
        // Store results in map
        batch.forEach((product, index) => {
          productEmbeddings.set(product.id, batchEmbeddings[index]);
        });
        
        console.debug(`Processed embeddings batch ${i / batchSize + 1}/${Math.ceil(products.length / batchSize)}`);
      }
      
      console.log(`Generated embeddings for ${productEmbeddings.size} products`);
      return productEmbeddings;
    } catch (error) {
      console.error('Error generating product embeddings:', error);
      throw new Error('Failed to generate product embeddings');
    }
  }
  
  /**
   * Get cached embedding or generate a new one
   */
  private async getCachedEmbedding(text: string): Promise<number[]> {
    if (!this.config.useCaching) {
      return this.embeddingService.generateEmbeddings(text);
    }
    
    const cacheKey = `${this.cacheKeyPrefix}embedding:${this.hashText(text)}`;
    
    try {
      // Try to get from cache first
      return await this.cacheService.getOrSet(
        cacheKey,
        async () => this.embeddingService.generateEmbeddings(text)
      );
    } catch (error) {
      // On cache error, generate without caching
      console.warn('Cache error, generating embedding without cache:', error);
      return this.embeddingService.generateEmbeddings(text);
    }
  }
  
  /**
   * Get text representation of a product for embedding
   */
  private getProductText(product: ProductVariant): string {
    const parts = [
      product.name,
      product.description || '',
      product.category || ''
    ];
    
    // Add any additional attributes that might be useful
    if (product.attributes) {
      const attrText = Object.entries(product.attributes)
        .filter(([key, value]) => value && typeof value === 'string')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      if (attrText) {
        parts.push(attrText);
      }
    }
    
    return parts.filter(Boolean).join(' ');
  }
  
  /**
   * Simple hash function for text
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Cluster products based on embedding similarity using hierarchical agglomerative clustering
   * @param products Array of products
   * @param embeddings Map of product IDs to embeddings
   * @returns Array of clusters (arrays of product IDs)
   */
  private async clusterProducts(
    products: ProductVariant[],
    embeddings: Map<string, number[]>
  ): Promise<string[][]> {
    try {
      console.log('Clustering products using hierarchical agglomerative clustering');
      
      // Create a list of product IDs that have embeddings
      const productIds = products
        .filter(p => embeddings.has(p.id))
        .map(p => p.id);
      
      if (productIds.length === 0) {
        console.warn('No products with embeddings found');
        return [];
      }
      
      if (productIds.length === 1) {
        console.info('Only one product found, no clustering needed');
        return [productIds];
      }
      
      // Calculate similarity matrix
      const similarityMatrix = this.calculateSimilarityMatrix(productIds, embeddings);
      
      // Perform hierarchical clustering
      const clusters = this.performHierarchicalClustering(
        productIds, 
        similarityMatrix,
        this.config.similarityThreshold
      );
      
      console.log(`Clustered ${productIds.length} products into ${clusters.length} clusters`);
      
      // Debug info about cluster sizes
      const clusterSizes = clusters.map(c => c.length);
      console.debug(`Cluster sizes: ${JSON.stringify(clusterSizes)}`);
      
      return clusters;
    } catch (error) {
      console.error('Error clustering products:', error);
      // On error, return each product in its own cluster
      return products.map(p => [p.id]);
    }
  }
  
  /**
   * Calculate similarity matrix between all product embeddings
   */
  private calculateSimilarityMatrix(
    productIds: string[], 
    embeddings: Map<string, number[]>
  ): number[][] {
    const n = productIds.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      const embedding1 = embeddings.get(productIds[i])!;
      
      // Diagonal is always 1 (self-similarity)
      matrix[i][i] = 1;
      
      for (let j = i + 1; j < n; j++) {
        const embedding2 = embeddings.get(productIds[j])!;
        const similarity = this.cosineSimilarity(embedding1, embedding2);
        
        // Similarity is symmetric
        matrix[i][j] = similarity;
        matrix[j][i] = similarity;
      }
    }
    
    return matrix;
  }
  
  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0; // Avoid division by zero
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Perform hierarchical agglomerative clustering
   */
  private performHierarchicalClustering(
    productIds: string[],
    similarityMatrix: number[][],
    similarityThreshold: number
  ): string[][] {
    const n = productIds.length;
    
    // Start with each product in its own cluster
    let clusters: Set<string>[] = productIds.map(id => new Set([id]));
    
    // Working copy of the similarity matrix
    const workingSimilarities = similarityMatrix.map(row => [...row]);
    
    // Keep merging until we reach the threshold or only one cluster remains
    while (clusters.length > 1) {
      // Find the most similar pair of clusters
      let maxSimilarity = -1;
      let mergeI = -1;
      let mergeJ = -1;
      
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          // Calculate average linkage (mean similarity between all points in the clusters)
          const similarity = this.calculateClusterSimilarity(
            clusters[i], 
            clusters[j], 
            workingSimilarities, 
            productIds
          );
          
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mergeI = i;
            mergeJ = j;
          }
        }
      }
      
      // If highest similarity is below threshold, stop merging
      if (maxSimilarity < similarityThreshold) {
        break;
      }
      
      // Merge the most similar clusters
      const merged = new Set([...clusters[mergeI], ...clusters[mergeJ]]);
      
      // Remove the merged clusters and add the new one
      clusters = [
        ...clusters.slice(0, mergeI),
        ...clusters.slice(mergeI + 1, mergeJ),
        ...clusters.slice(mergeJ + 1),
        merged
      ];
      
      // Update the similarity matrix (not needed if we're using the original matrix)
    }
    
    // Convert Sets back to arrays
    return clusters.map(cluster => Array.from(cluster));
  }
  
  /**
   * Calculate similarity between clusters using Ward's method
   * (minimizes the increase in variance when merging clusters)
   */
  private calculateClusterSimilarity(
    clusterA: Set<string>,
    clusterB: Set<string>,
    similarityMatrix: number[][],
    productIds: string[]
  ): number {
    let totalSimilarity = 0;
    let comparisons = 0;
    
    // For each pair of items between the two clusters, sum their similarity
    for (const idA of clusterA) {
      const indexA = productIds.indexOf(idA);
      
      for (const idB of clusterB) {
        const indexB = productIds.indexOf(idB);
        totalSimilarity += similarityMatrix[indexA][indexB];
        comparisons++;
      }
    }
    
    // Return the average similarity
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Categorize clusters using LLM
   * @param clusters Array of clusters (arrays of product IDs)
   * @param products Array of products
   * @returns Map of categories to arrays of product IDs
   */
  private async categorizeClusters(
    clusters: string[][],
    products: ProductVariant[]
  ): Promise<Map<string, string[]>> {
    try {
      console.log(`Categorizing ${clusters.length} clusters using LLM`);
      
      // Create a map from product ID to product for easy lookup
      const productMap = new Map(products.map(p => [p.id, p]));
      
      // Create a map from category IDs to product IDs
      const categoryMap = new Map<string, string[]>();
      
      // Process each cluster
      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        console.debug(`Processing cluster ${i + 1}/${clusters.length} with ${cluster.length} products`);
        
        // Check if cluster is empty
        if (cluster.length === 0) {
          continue;
        }
        
        try {
          // If caching is enabled, try to get from cache first
          if (this.config.useCaching) {
            const cacheResult = await this.getCachedCategorizationForCluster(cluster, productMap);
            if (cacheResult) {
              for (const [categoryId, productIds] of cacheResult.entries()) {
                this.addToCategory(categoryMap, categoryId, productIds);
              }
              continue; // Skip to next cluster if we got a cache hit
            }
          }
          
          // Get products in this cluster
          const clusterProducts = cluster
            .map(id => productMap.get(id))
            .filter(Boolean) as ProductVariant[];
          
          // Get category using LLM
          const categorization = await this.callLLMForCategorization(clusterProducts);
          
          // Store the result in cache if enabled
          if (this.config.useCaching) {
            await this.cacheClusterCategorization(cluster, categorization);
          }
          
          // Process categorization results
          for (const result of categorization) {
            this.addToCategory(categoryMap, result.categoryId, result.productIds);
          }
        } catch (error) {
          console.error(`Error categorizing cluster ${i}: ${error}`);
          
          // If we hit an error, assign products to a fallback category based on name similarity
          await this.handleClusterCategorizationFailure(cluster, productMap, categoryMap);
        }
      }
      
      console.log(`Categorization complete. Found ${categoryMap.size} categories`);
      return categoryMap;
    } catch (error) {
      console.error('Error in cluster categorization:', error);
      
      // On complete failure, use fallback approach - one category per cluster
      const fallbackMap = new Map<string, string[]>();
      clusters.forEach((cluster, i) => {
        fallbackMap.set(`fallback-${i}`, cluster);
      });
      
      return fallbackMap;
    }
  }
  
  /**
   * Add products to a category in the category map
   */
  private addToCategory(categoryMap: Map<string, string[]>, categoryId: string, productIds: string[]): void {
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, []);
    }
    
    const currentProducts = categoryMap.get(categoryId)!;
    categoryMap.set(categoryId, [...currentProducts, ...productIds]);
  }
  
  /**
   * Get cached categorization for a cluster
   */
  private async getCachedCategorizationForCluster(
    cluster: string[],
    productMap: Map<string, ProductVariant>
  ): Promise<Map<string, string[]> | null> {
    // Sort IDs to ensure consistent cache keys
    const sortedIds = [...cluster].sort();
    const clusterKey = sortedIds.join(',');
    const cacheKey = `${this.cacheKeyPrefix}cluster:${this.hashText(clusterKey)}`;
    
    try {
      const cachedResult = this.cacheService.get(cacheKey);
      if (cachedResult) {
        return new Map(cachedResult as [string, string[]][]);
      }
    } catch (error) {
      console.warn('Error accessing cache:', error);
    }
    
    return null;
  }
  
  /**
   * Cache cluster categorization results
   */
  private async cacheClusterCategorization(
    cluster: string[],
    categorization: Array<{ categoryId: string; productIds: string[] }>
  ): Promise<void> {
    // Sort IDs to ensure consistent cache keys
    const sortedIds = [...cluster].sort();
    const clusterKey = sortedIds.join(',');
    const cacheKey = `${this.cacheKeyPrefix}cluster:${this.hashText(clusterKey)}`;
    
    try {
      // Convert to a format that can be serialized
      const serializableResult = categorization.map(
        result => [result.categoryId, result.productIds] as [string, string[]]
      );
      
      this.cacheService.set(cacheKey, serializableResult);
    } catch (error) {
      console.warn('Error caching cluster categorization:', error);
    }
  }
  
  /**
   * Call LLM to categorize products
   */
  private async callLLMForCategorization(
    products: ProductVariant[]
  ): Promise<Array<{ categoryId: string; productIds: string[]; confidence: number }>> {
    if (!this.config.enableLLM || products.length === 0) {
      return this.fallbackCategorization(products);
    }
    
    try {
      const prompt = this.buildCategorizationPrompt(products);
      
      // Simplified LLM call for now - to be expanded with retries and fallbacks
      // This will be integrated with the intelligence service in a future update
      const result = await this.simulateLLMCall(prompt, products);
      
      return result;
    } catch (error) {
      console.error('Error calling LLM for categorization:', error);
      return this.fallbackCategorization(products);
    }
  }
  
  /**
   * Build a prompt for product categorization
   */
  private buildCategorizationPrompt(products: ProductVariant[]): string {
    // Format product information
    const productsText = products.map((product, index) => {
      return `Product ${index + 1}: ${product.name}
Description: ${product.description || 'N/A'}
Category (if known): ${product.category || 'N/A'}
Attributes: ${product.attributes ? JSON.stringify(product.attributes) : 'N/A'}
`;
    }).join('\n');
    
    // Format available categories
    const categoriesText = this.categories.map(category => {
      return `${category.id}: ${category.name}
Description: ${category.description}
Examples: ${category.examples.join(', ')}
`;
    }).join('\n');
    
    // Build the full prompt
    return `You are a product categorization expert helping to classify exported products.

PRODUCT INFORMATION:
${productsText}

AVAILABLE CATEGORIES:
${categoriesText}

TASK:
1. Determine which category each product belongs to from the provided list
2. Extract the following product attributes for each category:
   - Main ingredient/material
   - Preparation/manufacturing method
   - Storage requirements (ambient, refrigerated, frozen)
   - Target market segment
3. Assign a confidence score (0-100%) for each categorization
4. If products could belong to multiple categories, list all possibilities with confidence scores

FORMAT YOUR RESPONSE AS JSON:
{
  "categorizations": [
    {
      "categoryId": "exact_matching_category_id",
      "confidence": 85,
      "products": [0, 1, 2], // indexes of products in this category
      "attributes": {
        "mainIngredient": "value",
        "preparationType": "value",
        "storageType": "ambient|refrigerated|frozen",
        "targetMarket": "value"
      },
      "reasoning": "Brief explanation of categorization decision"
    }
  ]
}`;
  }
  
  /**
   * Temporary method to simulate LLM categorization
   * Will be replaced with actual LLM integration
   */
  private async simulateLLMCall(
    prompt: string,
    products: ProductVariant[]
  ): Promise<Array<{ categoryId: string; productIds: string[]; confidence: number }>> {
    // Create a map to store results
    const results: Array<{ categoryId: string; productIds: string[]; confidence: number }> = [];
    
    // Create maps for products by category
    const groupedProducts = new Map<string, { productIds: string[], similarities: number[] }>();
    
    for (const product of products) {
      const text = this.getProductText(product);
      let bestCategory = '';
      let bestSimilarity = 0;
      
      // For each category, calculate similarity score
      for (const category of this.categories) {
        // Build category profile from name, description, and keywords
        const categoryProfile = [
          category.name,
          category.description,
          ...category.keywords,
          ...category.examples,
          ...category.alternateNames
        ].join(' ');
        
        // Calculate similarity between product and category
        const similarity = this.calculateTextSimilarity(text, categoryProfile);
        
        // Check if this is the best match so far
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCategory = category.id;
        }
      }
      
      // If no good match, use fallback
      if (bestSimilarity < this.config.confidenceThreshold / 2) {
        bestCategory = this.findBestCategoryMatch(text);
        bestSimilarity = 0.6; // Base similarity for fallback matching
      }
      
      // If still no match, use first category as default
      if (!bestCategory && this.categories.length > 0) {
        bestCategory = this.categories[0].id;
        bestSimilarity = 0.5; // Base similarity for default assignment
      }
      
      // Add product to the appropriate category group
      if (bestCategory) {
        if (!groupedProducts.has(bestCategory)) {
          groupedProducts.set(bestCategory, { productIds: [], similarities: [] });
        }
        const group = groupedProducts.get(bestCategory)!;
        group.productIds.push(product.id);
        group.similarities.push(bestSimilarity);
      }
    }
    
    // Convert to expected format with calculated confidence
    for (const [categoryId, group] of groupedProducts.entries()) {
      // Calculate confidence based on average similarity and number of products
      // The more products in a consistent category, the higher the confidence
      const avgSimilarity = group.similarities.reduce((sum, val) => sum + val, 0) / group.similarities.length;
      const sizeBonus = Math.min(0.1, group.productIds.length * 0.02); // Small bonus for larger groups (max 0.1)
      
      // Confidence is a combination of similarity and group size, capped at 0.98
      const confidence = Math.min(0.98, avgSimilarity + sizeBonus);
      
      results.push({
        categoryId,
        productIds: group.productIds,
        confidence
      });
    }
    
    return results;
  }
  
  /**
   * Calculate similarity between two text strings by comparing terms
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Normalize and tokenize both texts
    const tokens1 = this.tokenizeText(text1);
    const tokens2 = this.tokenizeText(text2);
    
    // Create sets for unique tokens
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    // Calculate Jaccard similarity (intersection over union)
    const intersection = new Set([...set1].filter(token => set2.has(token)));
    const union = new Set([...set1, ...set2]);
    
    // Calculate TF-IDF weighted similarity
    let weightedSimilarity = 0;
    let maxPossibleScore = 0;
    
    // Count token frequency in text2 (the category profile)
    const tokenFrequency = new Map<string, number>();
    for (const token of tokens2) {
      tokenFrequency.set(token, (tokenFrequency.get(token) || 0) + 1);
    }
    
    // For each token in the intersection, add its weight to the similarity score
    for (const token of intersection) {
      // Important tokens (keywords, attributes) get higher weight
      const isImportant = token.length > 3; // Simple heuristic: longer tokens are more important
      const weight = isImportant ? 2 : 1;
      weightedSimilarity += weight;
      maxPossibleScore += weight;
    }
    
    // For each token in text1, add potential weight to max possible score
    for (const token of set1) {
      if (!intersection.has(token)) {
        const isImportant = token.length > 3;
        const weight = isImportant ? 2 : 1;
        maxPossibleScore += weight;
      }
    }
    
    // If no tokens in common or no tokens at all, return 0
    if (maxPossibleScore === 0) {
      return 0;
    }
    
    // Normalize similarity score
    return weightedSimilarity / maxPossibleScore;
  }
  
  /**
   * Tokenize text into words, removing stopwords and normalizing
   */
  private tokenizeText(text: string): string[] {
    // Common stopwords to filter out
    const stopwords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
      'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'about',
      'of', 'that', 'this', 'these', 'those'
    ]);
    
    // Normalize text: lowercase, remove punctuation, split into words
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 1 && !stopwords.has(word)); // Remove stopwords and single-letter words
  }
  
  /**
   * Find the best category match for a text using fuzzy matching
   */
  private findBestCategoryMatch(text: string): string {
    let bestMatch = '';
    let bestScore = 0;
    
    for (const category of this.categories) {
      // Check name
      const nameScore = this.calculateSimilarityScore(text, category.name);
      
      // Check alternate names
      const altNameScores = category.alternateNames.map(name => 
        this.calculateSimilarityScore(text, name)
      );
      
      // Use best score
      const bestAltScore = Math.max(0, ...altNameScores);
      const categoryScore = Math.max(nameScore, bestAltScore);
      
      if (categoryScore > bestScore) {
        bestScore = categoryScore;
        bestMatch = category.id;
      }
    }
    
    // Only return a match if the score is reasonable
    return bestScore > 0.4 ? bestMatch : '';
  }
  
  /**
   * Calculate a simple similarity score between two texts
   */
  private calculateSimilarityScore(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    // Count words in common
    let inCommon = 0;
    for (const word of words1) {
      if (words2.has(word)) {
        inCommon++;
      }
    }
    
    // Calculate Jaccard similarity coefficient
    const union = words1.size + words2.size - inCommon;
    return union > 0 ? inCommon / union : 0;
  }
  
  /**
   * Provides a simple fallback categorization if the main process fails
   */
  private fallbackCategorization(products: ProductVariant[]): CategoryResult[] {
    console.log('Using fallback categorization method');
    
    // Create simple categories based on keywords in product names
    const categories = new Map<string, ProductVariant[]>();
    
    // Basic categorization rules
    const categoryRules: Array<{pattern: RegExp, category: string}> = [
      { pattern: /\bcorn\s*dog\b/i, category: 'Corn Dogs' },
      { pattern: /\bcheese\b/i, category: 'Cheese Products' },
      { pattern: /\bsnack|pocket|wrap\b/i, category: 'Snack Items' },
      { pattern: /\bchicken\b/i, category: 'Chicken Products' },
      { pattern: /\bbeef\b/i, category: 'Beef Products' }
    ];
    
    // Apply simple rules
    products.forEach(product => {
      let assigned = false;
      
      for (const rule of categoryRules) {
        if (rule.pattern.test(product.name)) {
          if (!categories.has(rule.category)) {
            categories.set(rule.category, []);
          }
          categories.get(rule.category)!.push(product);
          assigned = true;
          break;
        }
      }
      
      // If no category matched, put in "Other"
      if (!assigned) {
        if (!categories.has('Other Products')) {
          categories.set('Other Products', []);
        }
        categories.get('Other Products')!.push(product);
      }
    });
    
    // Convert to CategoryResult format
    return Array.from(categories.entries()).map(([name, variants]) => ({
      id: this.generateCategoryId(name),
      name,
      confidence: 0.7,
      products: variants,
      attributes: {
        itemCount: variants.length,
        source: 'fallback'
      }
    }));
  }
  
  /**
   * Generate a consistent ID for a category name
   */
  private generateCategoryId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Format categorization results
   * @param categorizedClusters Map of categories to arrays of product IDs
   * @param products Array of products
   * @returns Array of category results
   */
  private formatResults(
    categorizedClusters: Map<string, string[]>,
    products: ProductVariant[]
  ): CategoryResult[] {
    try {
      console.log('Formatting categorization results');
      
      // Create a map from product ID to product for easy lookup
      const productMap = new Map(products.map(p => [p.id, p]));
      
      const results: CategoryResult[] = [];
      
      // Process each category
      for (const [categoryId, productIds] of categorizedClusters.entries()) {
        // Skip empty categories
        if (productIds.length === 0) {
          continue;
        }
        
        // Get the category from our list
        const category = this.getCategoryById(categoryId);
        
        // Skip if category not found (shouldn't happen, but just in case)
        if (!category) {
          console.warn(`Category not found: ${categoryId}`);
          continue;
        }
        
        // Get products in this category
        const variants = productIds
          .map(id => productMap.get(id))
          .filter(Boolean) as ProductVariant[];
        
        // Extract common attributes for this category
        const attributes = this.extractCategoryAttributes(variants, category);
        
        // Calculate confidence (could be refined in the future)
        const confidence = 0.85; // Placeholder confidence level
        
        // Add the result
        results.push({
          id: this.generateCategoryId(category.name),
          name: category.name,
          products: variants,
          confidence,
          attributes
        });
      }
      
      // Sort results by confidence (highest first)
      results.sort((a, b) => b.confidence - a.confidence);
      
      console.log(`Formatted ${results.length} category results`);
      return results;
    } catch (error) {
      console.error('Error formatting results:', error);
      return [];
    }
  }
  
  /**
   * Get a category by ID
   */
  private getCategoryById(categoryId: string): ProductCategory | undefined {
    // Check for exact match
    const exactMatch = this.categories.find(c => c.id === categoryId);
    if (exactMatch) {
      return exactMatch;
    }
    
    // If it's a fallback ID, return the first category or a generated one
    if (categoryId.startsWith('fallback-')) {
      return this.categories[0] || this.generateFallbackCategory(categoryId);
    }
    
    // For 'uncategorized', create a generic category
    if (categoryId === 'uncategorized') {
      return {
        id: 'uncategorized',
        name: 'Uncategorized Products',
        description: 'Products that could not be categorized automatically',
        examples: [],
        attributes: [],
        keywords: [],
        hsCodeHints: [],
        priority: 0,
        alternateNames: [],
        metadata: {}
      };
    }
    
    // If no match found, return undefined
    return undefined;
  }
  
  /**
   * Generate a fallback category
   */
  private generateFallbackCategory(fallbackId: string): ProductCategory {
    return {
      id: fallbackId,
      name: `Automatically Detected Group ${fallbackId.replace('fallback-', '')}`,
      description: 'A group of similar products detected by the system',
      examples: [],
      attributes: [],
      keywords: [],
      hsCodeHints: [],
      priority: 0,
      alternateNames: [],
      metadata: {
        isAutoGenerated: true
      }
    };
  }
  
  /**
   * Extract common attributes for a category based on its products
   */
  private extractCategoryAttributes(
    products: ProductVariant[],
    category: ProductCategory
  ): ProductAttributes {
    if (products.length === 0) {
      return {};
    }
    
    const attributes: ProductAttributes = {};
    
    // Get attribute definitions from the category
    const attributeDefs = category.attributes;
    
    // For each attribute type, try to extract the most common value
    for (const attrDef of attributeDefs) {
      if (attrDef.name === 'mainIngredient') {
        attributes.mainIngredient = this.extractMainIngredient(products);
      } else if (attrDef.name === 'preparationType') {
        attributes.preparationType = this.extractPreparationType(products);
      } else if (attrDef.name === 'storageType') {
        attributes.storageType = this.extractStorageType(products);
      }
      
      // Extract other attribute types defined in the category
      // This could be expanded in the future
    }
    
    return attributes;
  }
  
  /**
   * Extract the most common main ingredient from a list of products
   */
  private extractMainIngredient(products: ProductVariant[]): string {
    const ingredients = products
      .map(p => p.attributes?.mainIngredient || this.guessMainIngredient(p))
      .filter(Boolean);
    
    return this.getMostCommonValue(ingredients);
  }
  
  /**
   * Extract the most common preparation type from a list of products
   */
  private extractPreparationType(products: ProductVariant[]): string {
    const prepTypes = products
      .map(p => p.attributes?.preparationType || this.guessPreparationType(p))
      .filter(Boolean);
    
    return this.getMostCommonValue(prepTypes);
  }
  
  /**
   * Extract the most common storage type from a list of products
   */
  private extractStorageType(products: ProductVariant[]): 'ambient' | 'refrigerated' | 'frozen' | undefined {
    const storageTypes = products
      .map(p => p.attributes?.storageType || this.guessStorageType(p))
      .filter(Boolean);
    
    const mostCommon = this.getMostCommonValue(storageTypes);
    
    // Convert to valid storage type
    if (mostCommon === 'ambient' || mostCommon === 'refrigerated' || mostCommon === 'frozen') {
      return mostCommon;
    }
    
    return undefined;
  }
  
  /**
   * Guess the main ingredient from product name/description
   */
  private guessMainIngredient(product: ProductVariant): string | undefined {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase();
    
    // Common ingredients to check for
    const ingredients = [
      'chicken', 'beef', 'pork', 'fish', 'grapes', 'apple', 'orange',
      'cheese', 'milk', 'cream', 'butter', 'chocolate', 'coffee',
      'tomato', 'potato', 'wheat', 'rice', 'corn', 'soy'
    ];
    
    for (const ingredient of ingredients) {
      if (text.includes(ingredient)) {
        return ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
      }
    }
    
    return undefined;
  }
  
  /**
   * Guess the preparation type from product name/description
   */
  private guessPreparationType(product: ProductVariant): string | undefined {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase();
    
    // Common preparation types to check for
    const prepTypes = [
      'frozen', 'canned', 'dried', 'fresh', 'smoked', 'cured',
      'fermented', 'roasted', 'baked', 'fried', 'breaded'
    ];
    
    for (const prepType of prepTypes) {
      if (text.includes(prepType)) {
        return prepType.charAt(0).toUpperCase() + prepType.slice(1);
      }
    }
    
    return undefined;
  }
  
  /**
   * Guess the storage type from product name/description
   */
  private guessStorageType(product: ProductVariant): string | undefined {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase();
    
    if (text.includes('frozen') || text.includes('freezer')) {
      return 'frozen';
    }
    
    if (text.includes('refrigerat') || text.includes('chilled') || text.includes('cold')) {
      return 'refrigerated';
    }
    
    if (text.includes('shelf') || text.includes('ambient') || text.includes('pantry')) {
      return 'ambient';
    }
    
    return undefined;
  }
  
  /**
   * Get the most common value from an array
   */
  private getMostCommonValue<T>(values: T[]): T | undefined {
    if (values.length === 0) {
      return undefined;
    }
    
    const counts = new Map<T, number>();
    
    for (const value of values) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    
    let mostCommonValue: T | undefined = undefined;
    let highestCount = 0;
    
    for (const [value, count] of counts.entries()) {
      if (count > highestCount) {
        highestCount = count;
        mostCommonValue = value;
      }
    }
    
    return mostCommonValue;
  }

  /**
   * Load default product categories
   */
  private loadDefaultCategories() {
    this.categories = productCategories;
    console.log(`Loaded ${this.categories.length} default product categories`);
  }
} 