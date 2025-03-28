/**
 * Intelligence Service
 * 
 * This service orchestrates the extraction, classification, and analysis
 * of entities from various content sources using a combination of NLP
 * techniques and AI models.
 */

import { NlpManager } from 'node-nlp';
import axios from 'axios';
import { logger } from '@/utils/logger';
import { 
  ContentAnalysisRequest, 
  ContentAnalysisResponse, 
  AnalyzedEntity,
  ClassificationResult,
  EntityClassification,
  TextContext
} from '@/types/intelligence';
import { EntityType } from '@/types/extraction';

interface AIModelConfig {
  apiKey: string;
  url: string;
  model: string;
  maxTokens: number;
}

export class IntelligenceService {
  private nlpManager: NlpManager;
  private modelConfig: AIModelConfig;
  private ready: boolean = false;
  
  /**
   * Initialize the intelligence service with required NLP models
   */
  constructor() {
    // Initialize NLP Manager
    this.nlpManager = new NlpManager({ 
      languages: ['en'],
      forceNER: true,
      modelFileName: 'model.nlp'
    });
    
    // Load AI model configuration
    this.modelConfig = {
      apiKey: process.env.AI_MODEL_API_KEY || '',
      url: process.env.AI_MODEL_URL || 'https://api.openai.com/v1/chat/completions',
      model: process.env.AI_MODEL_NAME || 'gpt-4',
      maxTokens: parseInt(process.env.AI_MODEL_MAX_TOKENS || '2000')
    };
    
    this.initialize();
  }
  
  /**
   * Initialize NLP models and ensure they're ready
   */
  private async initialize(): Promise<void> {
    try {
      // Add named entity recognition for business entities
      this.addBusinessEntityRecognition();
      
      // Add product entity recognition
      this.addProductEntityRecognition();
      
      // Add location entity recognition
      this.addLocationEntityRecognition();
      
      // Add contact entity recognition
      this.addContactEntityRecognition();
      
      // Train the model
      await this.nlpManager.train();
      
      this.ready = true;
      logger.info('Intelligence Service initialized and ready');
    } catch (error) {
      logger.error(`Failed to initialize Intelligence Service: ${error}`);
      throw new Error(`Intelligence Service initialization failed: ${error}`);
    }
  }
  
  /**
   * Add recognition for business entities
   */
  private addBusinessEntityRecognition(): void {
    // Add named entity recognition for business names
    this.nlpManager.addNamedEntityText(
      'business',
      'name',
      ['en'],
      ['Company', 'Inc', 'Ltd', 'LLC', 'Corporation', 'Co', 'Enterprise', 'Enterprises']
    );
    
    // Add recognition for business types
    this.nlpManager.addNamedEntityText(
      'business',
      'type',
      ['en'],
      ['retailer', 'manufacturer', 'wholesaler', 'service provider', 'exporter', 'importer']
    );
  }
  
  /**
   * Add recognition for product entities
   */
  private addProductEntityRecognition(): void {
    // Add named entity recognition for product types
    this.nlpManager.addNamedEntityText(
      'product',
      'type',
      ['en'],
      ['laptop', 'phone', 'device', 'tool', 'software', 'service', 'solution']
    );
    
    // Add recognition for product attributes
    this.nlpManager.addNamedEntityText(
      'product',
      'attribute',
      ['en'],
      ['premium', 'lightweight', 'durable', 'fast', 'reliable', 'efficient']
    );
  }
  
  /**
   * Add recognition for location entities
   */
  private addLocationEntityRecognition(): void {
    // Add named entity recognition for common address terms
    this.nlpManager.addNamedEntityText(
      'location',
      'type',
      ['en'],
      ['Street', 'Avenue', 'Boulevard', 'Lane', 'Road', 'Drive', 'Court', 'Plaza', 'Square', 'Highway']
    );
  }
  
  /**
   * Add recognition for contact entities
   */
  private addContactEntityRecognition(): void {
    // Add named entity recognition for contact types
    this.nlpManager.addNamedEntityText(
      'contact',
      'type',
      ['en'],
      ['Email', 'Phone', 'Contact', 'Call', 'Telephone', 'Mobile', 'Fax']
    );
  }
  
  /**
   * Analyze content to extract and classify entities
   * 
   * @param request - The content analysis request
   * @returns A content analysis response with extracted entities
   */
  public async analyzeContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResponse> {
    if (!this.ready) {
      throw new Error('Intelligence Service is not ready. Please wait for initialization to complete.');
    }
    
    const startTime = Date.now();
    logger.info(`Analyzing content from ${request.sourceUrl}`);
    
    try {
      // Extract entities using NLP
      const nlpEntities = await this.extractEntitiesWithNLP(request.content);
      
      // Extract entities using AI model
      const aiEntities = await this.extractEntitiesWithAI(request.content, request.entityTypes);
      
      // Merge entities from both sources and remove duplicates
      const mergedEntities = this.mergeEntities(nlpEntities, aiEntities);
      
      // Classify entities (e.g., product categorization)
      const classifiedEntities = await this.classifyEntities(mergedEntities);
      
      // Calculate confidence scores
      const entitiesWithConfidence = this.calculateEntityConfidence(classifiedEntities);
      
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(entitiesWithConfidence);
      
      const processingTime = Date.now() - startTime;
      logger.info(`Content analysis completed in ${processingTime}ms with confidence ${overallConfidence}`);
      
      return {
        entities: entitiesWithConfidence,
        confidence: overallConfidence,
        processingTime
      };
    } catch (error) {
      logger.error(`Error analyzing content: ${error}`);
      throw new Error(`Content analysis failed: ${error}`);
    }
  }
  
  /**
   * Extract entities using NLP techniques
   * 
   * @param content - The content to analyze
   * @returns Array of extracted entities
   */
  private async extractEntitiesWithNLP(content: string): Promise<AnalyzedEntity[]> {
    try {
      // Process the content with NLP Manager
      const result = await this.nlpManager.process('en', content);
      
      // Convert NLP entities to our format
      return this.convertNlpEntitiesToAnalyzedEntities(result.entities);
    } catch (error) {
      logger.error(`Error extracting entities with NLP: ${error}`);
      return [];
    }
  }
  
  /**
   * Convert NLP extracted entities to our AnalyzedEntity format
   * 
   * @param nlpEntities - Entities extracted by NLP
   * @returns Converted analyzed entities
   */
  private convertNlpEntitiesToAnalyzedEntities(nlpEntities: any[]): AnalyzedEntity[] {
    const analyzedEntities: AnalyzedEntity[] = [];
    
    for (const entity of nlpEntities) {
      // Map NLP entity types to our EntityType
      let type: EntityType;
      
      switch (entity.entity) {
        case 'business':
          type = 'business';
          break;
        case 'product':
          type = 'product';
          break;
        case 'location':
          type = 'location';
          break;
        case 'contact':
          type = 'contact';
          break;
        case 'person':
          type = 'person';
          break;
        default:
          // Skip entities we don't support
          continue;
      }
      
      // Create a new analyzed entity
      const analyzedEntity: AnalyzedEntity = {
        type,
        name: entity.utterance,
        attributes: {
          category: entity.option
        },
        rawText: entity.utterance,
        confidence: entity.accuracy,
        contexts: [{
          text: entity.utterance,
          importance: 1
        }]
      };
      
      analyzedEntities.push(analyzedEntity);
    }
    
    return analyzedEntities;
  }
  
  /**
   * Extract entities using AI models for more advanced extraction
   * 
   * @param content - The content to analyze
   * @param entityTypes - Types of entities to extract
   * @returns Array of analyzed entities
   */
  private async extractEntitiesWithAI(content: string, entityTypes: EntityType[]): Promise<AnalyzedEntity[]> {
    try {
      // Construct prompt for AI model
      const prompt = this.constructEntityExtractionPrompt(content, entityTypes);
      
      // Call AI model
      const response = await this.callAIModel(prompt);
      
      // Parse response to extract entities
      return this.parseAIResponseToEntities(response, entityTypes);
    } catch (error) {
      logger.error(`Error extracting entities with AI: ${error}`);
      return [];
    }
  }
  
  /**
   * Construct a prompt for entity extraction
   * 
   * @param content - The content to analyze
   * @param entityTypes - Types of entities to extract
   * @returns A structured prompt for the AI model
   */
  private constructEntityExtractionPrompt(content: string, entityTypes: EntityType[]): string {
    const entityTypesStr = entityTypes.join(', ');
    const jsonFormat = `
    {
      "entities": [
        {
          "type": "entity_type",
          "name": "entity_name",
          "attributes": {
            "key1": "value1",
            "key2": "value2"
          },
          "confidence": 0.95
        }
      ]
    }`;
    
    return `
      Extract the following entity types from the text: ${entityTypesStr}.
      
      For each entity found, include:
      - type: The type of entity (${entityTypesStr})
      - name: The name or primary identifier of the entity
      - attributes: Any relevant attributes or properties of the entity
      - confidence: Your confidence in this extraction (0.0 to 1.0)
      
      Respond with a JSON object using this format:
      ${jsonFormat}
      
      Text to analyze:
      ${content.substring(0, 15000)} // Limit to prevent token overflow
    `;
  }
  
  /**
   * Call an AI model with a prompt
   * 
   * @param prompt - The prompt to send to the AI model
   * @returns The AI model's response
   */
  private async callAIModel(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.modelConfig.url,
        {
          model: this.modelConfig.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.modelConfig.maxTokens,
          temperature: 0.1, // Low temperature for more deterministic outputs
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.modelConfig.apiKey}`
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error(`Error calling AI model: ${error}`);
      throw new Error(`AI model call failed: ${error}`);
    }
  }
  
  /**
   * Parse AI model response to extract entities
   * 
   * @param response - The AI model's response
   * @param entityTypes - Types of entities to extract
   * @returns Array of analyzed entities
   */
  private parseAIResponseToEntities(response: string, entityTypes: EntityType[]): AnalyzedEntity[] {
    try {
      // Extract JSON from response (in case model adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in AI response');
        return [];
      }
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      if (!jsonResponse.entities || !Array.isArray(jsonResponse.entities)) {
        logger.warn('No entities array found in AI response');
        return [];
      }
      
      // Filter and map entities
      return jsonResponse.entities
        .filter((entity: any) => entityTypes.includes(entity.type as EntityType))
        .map((entity: any) => {
          // Convert to our AnalyzedEntity format
          return {
            type: entity.type as EntityType,
            name: entity.name,
            attributes: entity.attributes || {},
            rawText: entity.name,
            confidence: entity.confidence || 0.5,
            contexts: [{
              text: entity.context || entity.name,
              importance: 0.8
            }]
          };
        });
    } catch (error) {
      logger.error(`Error parsing AI response: ${error}`);
      return [];
    }
  }
  
  /**
   * Merge entities from multiple extraction sources and remove duplicates
   * 
   * @param nlpEntities - Entities extracted with NLP
   * @param aiEntities - Entities extracted with AI
   * @returns Merged array of entities with duplicates removed
   */
  private mergeEntities(nlpEntities: AnalyzedEntity[], aiEntities: AnalyzedEntity[]): AnalyzedEntity[] {
    // Combine all entities
    const allEntities = [...nlpEntities, ...aiEntities];
    
    // Map to track entities by their normalized name and type
    const entityMap = new Map<string, AnalyzedEntity>();
    
    for (const entity of allEntities) {
      // Create a key using type and normalized name
      const key = `${entity.type}:${entity.name.toLowerCase().trim()}`;
      
      if (entityMap.has(key)) {
        // Entity already exists, merge them
        const existingEntity = entityMap.get(key)!;
        
        // Merge attributes
        existingEntity.attributes = {
          ...existingEntity.attributes,
          ...entity.attributes
        };
        
        // Combine contexts
        existingEntity.contexts = [
          ...existingEntity.contexts,
          ...entity.contexts
        ];
        
        // Update confidence (taking the higher one)
        existingEntity.confidence = Math.max(existingEntity.confidence, entity.confidence);
      } else {
        // New entity, add to map
        entityMap.set(key, {...entity});
      }
    }
    
    // Convert map back to array
    return Array.from(entityMap.values());
  }
  
  /**
   * Classify entities (e.g., categorize products)
   * 
   * @param entities - Entities to classify
   * @returns Classified entities
   */
  private async classifyEntities(entities: AnalyzedEntity[]): Promise<AnalyzedEntity[]> {
    // Clone the entities array to avoid modifying the original
    const classifiedEntities = [...entities];
    
    // Group entities by type for efficient processing
    const productEntities = classifiedEntities.filter(entity => entity.type === 'product');
    
    if (productEntities.length > 0) {
      // Classify product entities
      const classifiedProducts = await this.classifyProductEntities(productEntities);
      
      // Update the entities with classification results
      for (const entity of classifiedEntities) {
        if (entity.type === 'product') {
          const classification = classifiedProducts.find(cp => cp.name === entity.name);
          if (classification) {
            entity.attributes.category = classification.attributes.category;
            entity.attributes.hsCode = classification.attributes.hsCode;
          }
        }
      }
    }
    
    return classifiedEntities;
  }
  
  /**
   * Classify product entities with categories and HS codes
   * 
   * @param productEntities - Product entities to classify
   * @returns Classified product entities
   */
  private async classifyProductEntities(productEntities: AnalyzedEntity[]): Promise<AnalyzedEntity[]> {
    try {
      // Construct a prompt for product classification
      const prompt = this.constructProductClassificationPrompt(productEntities);
      
      // Call AI model
      const response = await this.callAIModel(prompt);
      
      // Parse response
      return this.parseProductClassificationResponse(response, productEntities);
    } catch (error) {
      logger.error(`Error classifying product entities: ${error}`);
      return productEntities;
    }
  }
  
  /**
   * Construct a prompt for product classification
   * 
   * @param productEntities - Product entities to classify
   * @returns A prompt for the AI model
   */
  private constructProductClassificationPrompt(productEntities: AnalyzedEntity[]): string {
    const productList = productEntities
      .map(entity => {
        const attributes = Object.entries(entity.attributes)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        return `- Name: ${entity.name}${attributes ? `, Attributes: ${attributes}` : ''}`;
      })
      .join('\n');
    
    return `
      Classify the following products with:
      1. A product category
      2. A subcategory if applicable
      3. The most appropriate HS (Harmonized System) code for export
      
      Products to classify:
      ${productList}
      
      Respond with a JSON object in this format:
      {
        "classifications": [
          {
            "name": "product_name",
            "category": "main_category",
            "subcategory": "sub_category",
            "hsCode": "6-digit HS code",
            "confidence": 0.95
          }
        ]
      }
    `;
  }
  
  /**
   * Parse product classification response
   * 
   * @param response - The AI model's response
   * @param originalEntities - Original product entities
   * @returns Classified product entities
   */
  private parseProductClassificationResponse(
    response: string, 
    originalEntities: AnalyzedEntity[]
  ): AnalyzedEntity[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No valid JSON found in classification response');
        return originalEntities;
      }
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      if (!jsonResponse.classifications || !Array.isArray(jsonResponse.classifications)) {
        logger.warn('No classifications array found in response');
        return originalEntities;
      }
      
      // Create a map of original entities
      const entityMap = new Map<string, AnalyzedEntity>();
      for (const entity of originalEntities) {
        entityMap.set(entity.name.toLowerCase(), {...entity});
      }
      
      // Apply classifications to original entities
      for (const classification of jsonResponse.classifications) {
        const entityKey = classification.name.toLowerCase();
        if (entityMap.has(entityKey)) {
          const entity = entityMap.get(entityKey)!;
          
          // Update entity with classification info
          entity.attributes.category = classification.category;
          if (classification.subcategory) {
            entity.attributes.subcategory = classification.subcategory;
          }
          if (classification.hsCode) {
            entity.attributes.hsCode = classification.hsCode;
          }
          
          // Update confidence if provided
          if (classification.confidence) {
            entity.confidence = (entity.confidence + classification.confidence) / 2;
          }
        }
      }
      
      return Array.from(entityMap.values());
    } catch (error) {
      logger.error(`Error parsing classification response: ${error}`);
      return originalEntities;
    }
  }
  
  /**
   * Calculate confidence scores for entities
   * 
   * @param entities - Entities to calculate confidence for
   * @returns Entities with updated confidence scores
   */
  private calculateEntityConfidence(entities: AnalyzedEntity[]): AnalyzedEntity[] {
    // Apply confidence scoring logic to each entity
    return entities.map(entity => {
      let adjustedConfidence = entity.confidence;
      
      // Adjust confidence based on entity type
      switch (entity.type) {
        case 'business':
          // Business entities with longer names are often more reliable
          adjustedConfidence *= (1 + Math.min(entity.name.length / 50, 0.3));
          break;
        case 'product':
          // Product confidence boosted by presence of classifications
          if (entity.attributes.category || entity.attributes.hsCode) {
            adjustedConfidence *= 1.2;
          }
          break;
        case 'location':
          // Location confidence boosted by structure
          if (entity.attributes.countryCode || entity.attributes.postalCode) {
            adjustedConfidence *= 1.1;
          }
          break;
      }
      
      // Cap confidence at 1.0
      adjustedConfidence = Math.min(adjustedConfidence, 1.0);
      
      // Update entity confidence
      return {
        ...entity,
        confidence: adjustedConfidence
      };
    });
  }
  
  /**
   * Calculate overall confidence for the extraction
   * 
   * @param entities - Extracted entities
   * @returns Overall confidence score
   */
  private calculateOverallConfidence(entities: AnalyzedEntity[]): number {
    if (entities.length === 0) {
      return 0;
    }
    
    // Weight entities by type
    const typeWeights: Record<EntityType, number> = {
      'business': 1.0,
      'product': 0.8,
      'location': 0.7,
      'contact': 0.6,
      'person': 0.5,
      'service': 0.8
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const entity of entities) {
      const weight = typeWeights[entity.type] || 0.5;
      weightedSum += entity.confidence * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Validate data using the LLM model
   * 
   * @param prompt - The validation prompt to send to the LLM
   * @returns The LLM's response as a string
   */
  public async validateWithLLM(prompt: string): Promise<string> {
    try {
      // Call the AI model with the validation prompt
      const response = await this.callAIModel(prompt);
      return response;
    } catch (error) {
      logger.error(`Error in LLM validation: ${error}`);
      throw new Error(`LLM validation failed: ${error}`);
    }
  }
} 