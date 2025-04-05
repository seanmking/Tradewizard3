import { v4 as uuidv4 } from 'uuid';
import { AssessmentData, AssessmentPhase, TargetMarket } from '@/types/assessment';
import { GlobalAssessmentPhase, CountryAssessmentPhase, ReportGenerationPhase } from '@/ai-agent/phases';
import { logger } from '@/utils/logger';

/**
 * Assessment Controller
 * 
 * Orchestrates the entire assessment process through the different phases:
 * 1. Global Assessment Phase
 * 2. Country-Specific Assessment Phase
 * 3. Report Generation Phase
 */
export class AssessmentController {
  private readonly globalAssessmentPhase: GlobalAssessmentPhase;
  private readonly countryAssessmentPhase: CountryAssessmentPhase;
  private readonly reportGenerationPhase: ReportGenerationPhase;
  
  constructor() {
    this.globalAssessmentPhase = new GlobalAssessmentPhase();
    this.countryAssessmentPhase = new CountryAssessmentPhase();
    this.reportGenerationPhase = new ReportGenerationPhase();
  }
  
  /**
   * Create a new assessment
   */
  public createAssessment(
    productDescription: string,
    targetMarket: TargetMarket,
    exporterCountry: string
  ): AssessmentData {
    return {
      id: uuidv4(),
      productDescription,
      targetMarket,
      exporterCountry,
      currentPhase: 'not-started',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      assessmentComplete: false
    };
  }
  
  /**
   * Start or continue the assessment process
   */
  public async processAssessment(assessment: AssessmentData): Promise<AssessmentData> {
    try {
      // Determine which phase to run next based on current state
      let updatedAssessment: AssessmentData = { ...assessment };
      
      switch (assessment.currentPhase) {
        case 'not-started':
          updatedAssessment.currentPhase = 'global-assessment';
          updatedAssessment.lastUpdated = new Date().toISOString();
          return this.processAssessment(updatedAssessment);
          
        case 'global-assessment':
          updatedAssessment = await this.globalAssessmentPhase.executePhase(updatedAssessment);
          return updatedAssessment;
          
        case 'global-assessment-complete':
          updatedAssessment.currentPhase = 'country-assessment';
          updatedAssessment.lastUpdated = new Date().toISOString();
          return this.processAssessment(updatedAssessment);
          
        case 'country-assessment':
          updatedAssessment = await this.countryAssessmentPhase.executePhase(updatedAssessment);
          return updatedAssessment;
          
        case 'country-assessment-complete':
          updatedAssessment.currentPhase = 'report-generation';
          updatedAssessment.lastUpdated = new Date().toISOString();
          return this.processAssessment(updatedAssessment);
          
        case 'report-generation':
          updatedAssessment = await this.reportGenerationPhase.executePhase(updatedAssessment);
          return updatedAssessment;
          
        case 'report-complete':
          logger.info(`Assessment ${assessment.id} completed successfully`);
          return updatedAssessment;
          
        default:
          throw new Error(`Unknown assessment phase: ${assessment.currentPhase}`);
      }
    } catch (error) {
      logger.error(`Error processing assessment ${assessment.id}:`, error);
      
      // Add error to assessment
      return {
        ...assessment,
        errors: [...(assessment.errors || []), {
          phase: assessment.currentPhase,
          message: `Error during assessment: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        }],
        lastUpdated: new Date().toISOString()
      };
    }
  }
  
  /**
   * Run a specific phase of the assessment (for re-runs or fixing errors)
   */
  public async runSpecificPhase(assessment: AssessmentData, phase: AssessmentPhase): Promise<AssessmentData> {
    let updatedAssessment = { ...assessment, currentPhase: phase, lastUpdated: new Date().toISOString() };
    
    try {
      // Run the specified phase
      switch (phase) {
        case 'global-assessment':
          return await this.globalAssessmentPhase.executePhase(updatedAssessment);
          
        case 'country-assessment':
          return await this.countryAssessmentPhase.executePhase(updatedAssessment);
          
        case 'report-generation':
          return await this.reportGenerationPhase.executePhase(updatedAssessment);
          
        default:
          throw new Error(`Cannot directly run phase: ${phase}`);
      }
    } catch (error) {
      logger.error(`Error running specific phase ${phase} for assessment ${assessment.id}:`, error);
      
      // Add error to assessment
      return {
        ...assessment,
        errors: [...(assessment.errors || []), {
          phase: phase,
          message: `Error during phase ${phase}: ${error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        }],
        lastUpdated: new Date().toISOString(),
        currentPhase: assessment.currentPhase // Preserve original phase on error
      };
    }
  }
} 