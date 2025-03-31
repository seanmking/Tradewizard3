import axios from 'axios';

// Types for our embedding service
export interface EmbeddingResponse {
  embeddings: number[][];
  dimensions: number;
}

export interface ClassificationResult {
  hsCode: string;
  confidence: number;
  description: string;
  chapter: string;
  heading: string;
}

/**
 * Service to generate and compare embeddings for product descriptions
 * and match them to appropriate HS codes
 */
export class EmbeddingService {
  private readonly apiUrl: string;
  private readonly dimensions: number;
  private readonly vectorDbUrl: string;
  
  constructor(
    apiUrl: string = process.env.EMBEDDING_API_URL || 'https://api.tradewizard.app/embeddings',
    vectorDbUrl: string = process.env.VECTOR_DB_URL || 'https://vectors.tradewizard.app',
    dimensions: number = 768
  ) {
    this.apiUrl = apiUrl;
    this.dimensions = dimensions;
    this.vectorDbUrl = vectorDbUrl;
  }
  
  /**
   * Generate embeddings for a product description
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await axios.post<EmbeddingResponse>(
        `${this.apiUrl}/generate`,
        { text }
      );
      
      return response.data.embeddings[0];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings for product description');
    }
  }
  
  /**
   * Find the most similar HS codes for a product description
   */
  async getSimilarHsCodes(
    productDescription: string,
    topK: number = 5
  ): Promise<ClassificationResult[]> {
    try {
      // 1. Generate embeddings for the product description
      const embeddings = await this.generateEmbeddings(productDescription);
      
      // 2. Query the vector database for similar vectors
      const response = await axios.post(`${this.vectorDbUrl}/query`, {
        vector: embeddings,
        topK
      });
      
      // 3. Return the results with confidence scores
      return response.data.matches.map((match: any) => ({
        hsCode: match.metadata.hsCode,
        confidence: match.score,
        description: match.metadata.description,
        chapter: match.metadata.chapter,
        heading: match.metadata.heading
      }));
    } catch (error) {
      console.error('Error finding similar HS codes:', error);
      throw new Error('Failed to classify product description');
    }
  }
  
  /**
   * Fallback search when vector similarity doesn't yield good results
   * Uses traditional keyword-based search
   */
  async fallbackKeywordSearch(productDescription: string): Promise<ClassificationResult[]> {
    try {
      // Implement keyword-based search as fallback
      const response = await axios.get(`${this.apiUrl}/keyword-search`, {
        params: { query: productDescription }
      });
      
      return response.data.results.map((result: any) => ({
        hsCode: result.hsCode,
        confidence: result.relevance,
        description: result.description,
        chapter: result.chapter,
        heading: result.heading
      }));
    } catch (error) {
      console.error('Error in fallback search:', error);
      // Return empty array instead of throwing to avoid breaking the chain
      return [];
    }
  }
  
  /**
   * Main method to get HS code suggestions for a product
   * Combines vector search with fallback mechanisms
   */
  async classifyProduct(
    productDescription: string,
    confidenceThreshold: number = 0.7
  ): Promise<ClassificationResult[]> {
    // Step 1: Try vector similarity search
    const vectorResults = await this.getSimilarHsCodes(productDescription);
    
    // Step 2: If we have high confidence results, return them
    const highConfidenceResults = vectorResults.filter(
      result => result.confidence >= confidenceThreshold
    );
    
    if (highConfidenceResults.length > 0) {
      return highConfidenceResults;
    }
    
    // Step 3: If vector search didn't yield confident results, try keyword fallback
    const fallbackResults = await this.fallbackKeywordSearch(productDescription);
    
    // Step 4: Combine both results, prioritizing vector results
    return [...vectorResults, ...fallbackResults].slice(0, 5);
  }
}

export default new EmbeddingService(); 