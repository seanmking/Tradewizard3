import { ClassificationResult } from '../../../services/classification/embeddingService';

export interface HsClassificationRequest {
  productDescription: string;
  confidenceThreshold?: number;
  maxResults?: number;
  useKeywordSearch?: boolean;
  useVectorSearch?: boolean;
}

export interface HsClassificationResult {
  hsCodes: ClassificationResult[];
  query: string;
  timestamp: string;
}

export interface HsCodeMCP {
  /**
   * Classify a product description to get suggested HS codes
   * @param request The classification request with product description
   */
  classifyProduct(request: HsClassificationRequest): Promise<HsClassificationResult>;
  
  /**
   * Get classification results using vector similarity search
   * @param productDescription The product description to classify
   * @param maxResults Maximum number of results to return
   */
  getVectorClassification(productDescription: string, maxResults?: number): Promise<ClassificationResult[]>;
  
  /**
   * Get classification results using keyword-based search
   * @param productDescription The product description to classify
   */
  getKeywordClassification(productDescription: string): Promise<ClassificationResult[]>;
  
  /**
   * Combine and enhance classification results from multiple sources
   * @param productDescription The original product description
   * @param keywordResults Results from keyword-based classification
   * @param vectorResults Results from vector-based classification
   */
  getCombinedClassification(
    productDescription: string,
    keywordResults: ClassificationResult[],
    vectorResults: ClassificationResult[]
  ): Promise<HsClassificationResult>;
} 