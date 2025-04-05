import { GlobalHsCodeMCPService } from '@/mcp/global/hs-code-mcp';
import { logger } from '@/utils/logger';
import { AssessmentData } from '@/types/assessment';

/**
 * Global Assessment Phase
 * 
 * First phase of the assessment process that:
 * 1. Classifies the product using the Global HS Code MCP
 * 2. Gathers global market insights
 * 3. Collects global compliance requirements
 */
export class GlobalAssessmentPhase {
  private readonly hsCodeMCP: GlobalHsCodeMCPService;
  
  constructor() {
    this.hsCodeMCP = new GlobalHsCodeMCPService();
  }
  
  /**
   * Execute the global assessment phase
   */
  async executePhase(assessment: AssessmentData): Promise<AssessmentData> {
    try {
      logger.info('Executing Global Assessment Phase');
      
      // Step 1: Classify the product
      const classification = await this.hsCodeMCP.classifyProduct(assessment.productDescription);
      
      // Update the assessment data
      const updatedAssessment: AssessmentData = {
        ...assessment,
        globalClassification: classification,
        currentPhase: 'global-assessment-complete',
        lastUpdated: new Date().toISOString()
      };
      
      // Log success
      logger.info('Global Assessment Phase completed successfully');
      
      return updatedAssessment;
    } catch (error) {
      // Log failure
      logger.error('Error in Global Assessment Phase:', error);
      
      // Return assessment with error state
      return {
        ...assessment,
        errors: [...(assessment.errors || []), {
          phase: 'global-assessment',
          message: `Error during global assessment: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        }],
        lastUpdated: new Date().toISOString()
      };
    }
  }
} 