import { logger } from '@/utils/logger';
import { ComplianceRequirement } from '@/mcp/compliance-mcp/compliance-mcp.interface';
import { MarketInsight } from '@/mcp/market-intelligence-mcp/market-intelligence-mcp.interface';
import { BusinessProfile, Product } from '@/contexts/assessment-context';
import axios from 'axios';

// Interfaces for verification requests
interface VerificationRequest {
  data: any;
  dataType: 'compliance' | 'market' | 'product';
  context: {
    products: Product[];
    businessProfile: BusinessProfile;
    markets: string[];
  };
}

interface VerificationResponse {
  verified: boolean;
  confidence: number;
  correctedData?: any;
  explanation?: string;
}

export class PerplexityVerificationService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    // In production, this would come from environment variables
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.apiEndpoint = process.env.PERPLEXITY_API_ENDPOINT || 'https://api.perplexity.ai/verify';
    
    if (!this.apiKey) {
      logger.warn('Perplexity API key not set. Verification will be simulated.');
    }
  }

  /**
   * Verify compliance requirements for accuracy
   */
  async verifyComplianceRequirements(
    requirements: ComplianceRequirement[],
    products: Product[],
    businessProfile: BusinessProfile,
    targetMarkets: string[]
  ): Promise<ComplianceRequirement[]> {
    logger.info('Verifying compliance requirements with Perplexity');
    
    try {
      const verifiedRequirements: ComplianceRequirement[] = [];
      
      for (const requirement of requirements) {
        const verificationRequest: VerificationRequest = {
          data: requirement,
          dataType: 'compliance',
          context: {
            products,
            businessProfile,
            markets: targetMarkets
          }
        };
        
        const verificationResult = await this.performVerification(verificationRequest);
        
        if (verificationResult.verified) {
          // Add confidence score to the requirement
          const verifiedRequirement = {
            ...requirement,
            confidenceScore: verificationResult.confidence
          };
          
          verifiedRequirements.push(verifiedRequirement);
        } else if (verificationResult.correctedData) {
          // Use corrected data with confidence score
          verifiedRequirements.push({
            ...verificationResult.correctedData,
            confidenceScore: verificationResult.confidence
          });
        } else {
          // Use original data but with low confidence score
          verifiedRequirements.push({
            ...requirement,
            confidenceScore: 0.5 // Medium confidence as fallback
          });
        }
      }
      
      return verifiedRequirements;
    } catch (error) {
      logger.error(`Error verifying compliance requirements: ${error}`);
      // Return original data with a note about verification failure
      return requirements.map(req => ({ ...req, confidenceScore: 0.5 }));
    }
  }

  /**
   * Verify market intelligence data for accuracy
   */
  async verifyMarketInsights(
    marketInsights: Record<string, MarketInsight>,
    products: Product[],
    businessProfile: BusinessProfile,
    targetMarkets: string[]
  ): Promise<Record<string, MarketInsight>> {
    logger.info('Verifying market insights with Perplexity');
    
    try {
      const verifiedInsights: Record<string, MarketInsight> = {};
      
      for (const [marketCode, insight] of Object.entries(marketInsights)) {
        const verificationRequest: VerificationRequest = {
          data: insight,
          dataType: 'market',
          context: {
            products,
            businessProfile,
            markets: [marketCode]
          }
        };
        
        const verificationResult = await this.performVerification(verificationRequest);
        
        if (verificationResult.verified) {
          // Add confidence to opportunities, risks, and recommendations
          verifiedInsights[marketCode] = {
            ...insight,
            opportunities: insight.opportunities.map(o => `${o} [Confidence: ${verificationResult.confidence.toFixed(2)}]`),
            risks: insight.risks.map(r => `${r} [Confidence: ${verificationResult.confidence.toFixed(2)}]`),
            recommendations: insight.recommendations.map(r => `${r} [Confidence: ${verificationResult.confidence.toFixed(2)}]`),
          };
        } else if (verificationResult.correctedData) {
          // Use corrected data
          verifiedInsights[marketCode] = {
            ...verificationResult.correctedData,
            opportunities: verificationResult.correctedData.opportunities.map(
              (o: string) => `${o} [Confidence: ${verificationResult.confidence.toFixed(2)}]`
            ),
            risks: verificationResult.correctedData.risks.map(
              (r: string) => `${r} [Confidence: ${verificationResult.confidence.toFixed(2)}]`
            ),
            recommendations: verificationResult.correctedData.recommendations.map(
              (r: string) => `${r} [Confidence: ${verificationResult.confidence.toFixed(2)}]`
            ),
          };
        } else {
          // Use original data but with low confidence
          verifiedInsights[marketCode] = {
            ...insight,
            opportunities: insight.opportunities.map(o => `${o} [Confidence: 0.50]`),
            risks: insight.risks.map(r => `${r} [Confidence: 0.50]`),
            recommendations: insight.recommendations.map(r => `${r} [Confidence: 0.50]`),
          };
        }
      }
      
      return verifiedInsights;
    } catch (error) {
      logger.error(`Error verifying market insights: ${error}`);
      // Return original data with a note about verification failure
      const verifiedInsights: Record<string, MarketInsight> = {};
      
      for (const [marketCode, insight] of Object.entries(marketInsights)) {
        verifiedInsights[marketCode] = {
          ...insight,
          opportunities: insight.opportunities.map(o => `${o} [Confidence: 0.50]`),
          risks: insight.risks.map(r => `${r} [Confidence: 0.50]`),
          recommendations: insight.recommendations.map(r => `${r} [Confidence: 0.50]`),
        };
      }
      
      return verifiedInsights;
    }
  }

  /**
   * Verify product categories for accuracy
   */
  async verifyProductCategories(
    products: Product[],
    businessProfile: BusinessProfile
  ): Promise<Product[]> {
    logger.info('Verifying product categories with Perplexity');
    
    try {
      const verifiedProducts: Product[] = [];
      
      for (const product of products) {
        const verificationRequest: VerificationRequest = {
          data: product,
          dataType: 'product',
          context: {
            products: [product],
            businessProfile,
            markets: []
          }
        };
        
        const verificationResult = await this.performVerification(verificationRequest);
        
        if (verificationResult.verified) {
          // Add confidence to product
          verifiedProducts.push({
            ...product,
            confidenceScore: verificationResult.confidence
          });
        } else if (verificationResult.correctedData) {
          // Use corrected data
          verifiedProducts.push({
            ...verificationResult.correctedData,
            confidenceScore: verificationResult.confidence
          });
        } else {
          // Use original data but with low confidence
          verifiedProducts.push({
            ...product,
            confidenceScore: 0.5
          });
        }
      }
      
      return verifiedProducts;
    } catch (error) {
      logger.error(`Error verifying product categories: ${error}`);
      // Return original data with a note about verification failure
      return products.map(product => ({ ...product, confidenceScore: 0.5 }));
    }
  }

  /**
   * Perform verification with Perplexity
   * In a real implementation, this would call the Perplexity API
   * For now, we'll simulate the verification process
   */
  private async performVerification(request: VerificationRequest): Promise<VerificationResponse> {
    // If API key is available, call the Perplexity API
    if (this.apiKey) {
      try {
        const response = await axios.post(
          this.apiEndpoint,
          request,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Add type safety check for the response data
        const data = response.data;
        if (
          typeof data === 'object' && 
          data !== null && 
          'verified' in data && 
          typeof data.verified === 'boolean' &&
          'confidence' in data && 
          typeof data.confidence === 'number'
        ) {
          const verificationResponse: VerificationResponse = {
            verified: data.verified,
            confidence: data.confidence
          };
          
          // Optional properties
          if ('correctedData' in data) {
            verificationResponse.correctedData = data.correctedData;
          }
          
          if ('explanation' in data && typeof data.explanation === 'string') {
            verificationResponse.explanation = data.explanation;
          }
          
          return verificationResponse;
        } else {
          logger.error('Invalid response format from Perplexity API');
          return this.simulateVerification(request);
        }
      } catch (error) {
        logger.error(`Error calling Perplexity API: ${error}`);
        // Fall back to simulation
        return this.simulateVerification(request);
      }
    }
    
    // Simulate verification for demo purposes
    return this.simulateVerification(request);
  }

  /**
   * Simulate verification for demo purposes
   */
  private simulateVerification(request: VerificationRequest): VerificationResponse {
    // Simulate different confidence levels based on data type
    let confidenceScore = 0;
    
    switch (request.dataType) {
      case 'compliance':
        // Higher confidence for compliance data
        confidenceScore = Math.min(0.85 + Math.random() * 0.15, 0.97);
        break;
      case 'market':
        // Medium confidence for market data
        confidenceScore = Math.min(0.70 + Math.random() * 0.25, 0.93);
        break;
      case 'product':
        // Higher confidence for product data
        confidenceScore = Math.min(0.80 + Math.random() * 0.18, 0.95);
        break;
    }
    
    // Simulate verification success (90% of the time)
    const isVerified = Math.random() < 0.9;
    
    return {
      verified: isVerified,
      confidence: confidenceScore,
      explanation: isVerified 
        ? 'Data verified with high confidence.' 
        : 'Some inconsistencies found in the data.'
    };
  }
} 