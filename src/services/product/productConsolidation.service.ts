// Replace logger import with native console
// import { logger } from '../../utils/logger';

export interface ProductVariant {
  id?: string;
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  attributes?: Record<string, any>;
  selected?: boolean;
}

export interface ProductAttributes {
  mainIngredient?: string;
  preparationType?: string;
  packagingType?: string;
  // HS Code classification information
  hsCode?: string; 
  hsCodeDescription?: string;
  hsCodeConfidence?: number;
  [key: string]: any; // Allow for other attributes
}

export interface ProductGroup {
  baseType: string;
  hsChapter?: string;
  description?: string;
  confidence?: number;
  variants: ProductVariant[];
  attributes: ProductAttributes;
}

export interface ConsolidationRule {
  pattern: RegExp;
  baseType: string;
  extractAttributes?: (name: string) => Partial<ProductGroup['attributes']>;
}

export interface ConsolidationConfig {
  rules: ConsolidationRule[];
  similarityThreshold?: number;
  enableFuzzyMatching?: boolean;
  maxVariantsPerGroup?: number;
}

/**
 * Enhances the product consolidation functionality by implementing better pattern matching,
 * similarity detection, and attribute extraction.
 * 
 * @version 2.0.0
 */
export class ProductConsolidationService {
  private readonly defaultConfig: ConsolidationConfig = {
    rules: [
      // Snack Products
      {
        pattern: /\b(snack|pocket|wrap)\b/i,
        baseType: 'Snack',
        extractAttributes: (name) => this.extractSnackAttributes(name)
      },
      // Corn Dogs/Corndog Products
      {
        pattern: /\b(corn ?dogs?|corn ?dog)/i,
        baseType: 'Corn Dog',
        extractAttributes: (name) => this.extractCornDogAttributes(name)
      },
      // Cheese Products
      {
        pattern: /\bcheese\b/i,
        baseType: 'Cheese',
        extractAttributes: (name) => this.extractCheeseAttributes(name)
      }
    ],
    similarityThreshold: 0.75,
    enableFuzzyMatching: true,
    maxVariantsPerGroup: 10
  };

  private config: ConsolidationConfig;

  constructor(config?: Partial<ConsolidationConfig>) {
    this.config = {
      ...this.defaultConfig,
      ...config
    };
    
    console.log('ProductConsolidationService initialized with config:', 
      JSON.stringify({
        ruleCount: this.config.rules.length,
        enableFuzzyMatching: this.config.enableFuzzyMatching,
        similarityThreshold: this.config.similarityThreshold
      }));
  }
  
  /**
   * Main method to consolidate products into groups with improved logging and error handling
   */
  consolidateProducts(products: ProductVariant[]): ProductGroup[] {
    console.log(`Starting product consolidation for ${products.length} products`);
    
    try {
      // First, extract attributes from all products
      const productsWithAttributes = products.map(product => ({
        ...product,
        extractedAttributes: this.extractProductAttributes(product)
      }));
      
      const groups = new Map<string, ProductGroup>();

      // Phase 1: Apply explicit rules with stronger pattern matching
      productsWithAttributes.forEach(product => {
        const match = this.findMatchingRule(product.name);
        if (match) {
          console.log(`Matched rule: ${product.name} -> ${match.baseType}`);
          this.addToGroup(groups, product, match);
        } else {
          console.log(`No rule match for: ${product.name}`);
        }
      });

      // Phase 2: Group similar products based on name and description
      if (this.config.enableFuzzyMatching) {
        const ungroupedProducts = productsWithAttributes.filter(product => 
          !this.isProductGrouped(groups, product)
        );
        console.log(`Fuzzy matching ${ungroupedProducts.length} unmatched products`);
        
        ungroupedProducts.forEach(product => {
          this.handleUnmatchedProductImproved(groups, product);
        });
      }

      // Phase 3: Post-process groups and enhance with extracted attributes
      const result = this.postProcessGroupsEnhanced(Array.from(groups.values()));
      
      // Debug: Log final groups
      console.log(`Consolidated ${products.length} products into ${result.length} groups`);
      result.forEach(group => {
        console.log(`Group: ${group.baseType} - ${group.variants.length} variants - Attributes: ${Object.keys(group.attributes).join(', ')}`);
      });
      
      return result;
    } catch (error) {
      console.error('Error consolidating products:', error);
      // Return individual products as fallback instead of empty array
      return products.map(p => ({
        baseType: p.name,
        variants: [p],
        attributes: {},
        confidence: 1.0,
        description: p.description || p.name
      }));
    }
  }

  /**
   * Find matching consolidation rule for a product name
   */
  private findMatchingRule(productName: string): ConsolidationRule | null {
    return this.config.rules.find(rule => rule.pattern.test(productName)) || null;
  }

  /**
   * Add a product to a group, creating the group if it doesn't exist
   */
  private addToGroup(groups: Map<string, ProductGroup>, product: ProductVariant, rule: ConsolidationRule) {
    const baseType = rule.baseType;
    
    if (!groups.has(baseType)) {
      groups.set(baseType, {
        baseType,
        variants: [],
        attributes: rule.extractAttributes?.(product.name) || {},
        description: this.generateGroupDescription(baseType)
      });
    }

    const group = groups.get(baseType)!;
    if (!this.isVariantInGroup(group, product)) {
      group.variants.push(product);
    }
  }

  /**
   * Handle products that don't match any explicit rules with improved similarity detection
   */
  private handleUnmatchedProductImproved(groups: Map<string, ProductGroup>, product: any) {
    // Find most similar group based on name, description, and extracted attributes
    const similarityThreshold = this.config.similarityThreshold || 0.75;
    let bestMatch: { group: ProductGroup; similarity: number } | null = null;
    
    for (const group of groups.values()) {
      // First check if attributes are compatible
      const attributeCompatibility = this.calculateAttributeCompatibility(
        product.extractedAttributes || {},
        group.attributes
      );
      
      // If attributes are incompatible, skip this group
      if (attributeCompatibility < 0.5) continue;
      
      // Calculate text similarity between product and group base type
      const nameSimilarity = this.calculateSimilarity(
        product.name, 
        group.baseType
      );
      
      // Calculate similarity with all variants in the group
      let highestVariantSimilarity = 0;
      for (const variant of group.variants) {
        const variantSimilarity = this.calculateSimilarity(product.name, variant.name);
        highestVariantSimilarity = Math.max(highestVariantSimilarity, variantSimilarity);
      }
      
      // Overall similarity is a weighted combination
      const overallSimilarity = (nameSimilarity * 0.5) + 
                              (highestVariantSimilarity * 0.3) + 
                              (attributeCompatibility * 0.2);
      
      if (overallSimilarity >= similarityThreshold && 
          (!bestMatch || overallSimilarity > bestMatch.similarity)) {
        bestMatch = { group, similarity: overallSimilarity };
      }
    }
    
    if (bestMatch) {
      // Add to most similar group
      this.addToGroupWithAttributes(groups, product, {
        pattern: new RegExp(bestMatch.group.baseType, 'i'),
        baseType: bestMatch.group.baseType
      }, product.extractedAttributes);
      console.log(`Grouped by similarity: ${product.name} -> ${bestMatch.group.baseType} (${bestMatch.similarity.toFixed(2)})`);
    } else {
      // Create new group based on product name and attributes
      const baseType = this.generateMeaningfulBaseType(product.name, product.extractedAttributes);
      this.addToGroupWithAttributes(groups, product, {
        pattern: new RegExp(baseType, 'i'),
        baseType
      }, product.extractedAttributes);
      console.log(`Created new group: ${baseType} for ${product.name}`);
    }
  }

  /**
   * Add a product to a group with its extracted attributes
   */
  private addToGroupWithAttributes(
    groups: Map<string, ProductGroup>, 
    product: any, 
    rule: ConsolidationRule,
    extractedAttributes: Record<string, any>
  ) {
    const baseType = rule.baseType;
    
    if (!groups.has(baseType)) {
      // Create new group with combined attributes
      const attributes = {
        ...(rule.extractAttributes?.(product.name) || {}),
        ...extractedAttributes
      };
      
      groups.set(baseType, {
        baseType,
        variants: [],
        attributes,
        description: this.generateEnhancedGroupDescription(baseType, attributes)
      });
    } else {
      // Merge attributes with existing group
      const group = groups.get(baseType)!;
      group.attributes = this.mergeAttributes(group.attributes, extractedAttributes);
    }

    // Add product to group if not already there
    const group = groups.get(baseType)!;
    if (!this.isVariantInGroup(group, product)) {
      // Clean up the product object by removing temporary attributes
      const { extractedAttributes, ...cleanProduct } = product;
      group.variants.push(cleanProduct);
    }
  }

  /**
   * Calculate compatibility between two sets of attributes
   */
  private calculateAttributeCompatibility(
    attrs1: Record<string, any>,
    attrs2: Record<string, any>
  ): number {
    // If either is empty, return neutral compatibility
    if (Object.keys(attrs1).length === 0 || Object.keys(attrs2).length === 0) {
      return 0.7;
    }
    
    let matchCount = 0;
    let totalAttributes = 0;
    
    // Count matching key-value pairs
    for (const [key, value1] of Object.entries(attrs1)) {
      if (key in attrs2) {
        totalAttributes++;
        
        const value2 = attrs2[key];
        if (value1 === value2 || 
            (typeof value1 === 'string' && 
             typeof value2 === 'string' && 
             this.calculateSimilarity(value1, value2) > 0.7)) {
          matchCount++;
        }
      }
    }
    
    // Count keys only in attrs2
    for (const key of Object.keys(attrs2)) {
      if (!(key in attrs1)) {
        totalAttributes++;
      }
    }
    
    return totalAttributes > 0 ? matchCount / totalAttributes : 0.5;
  }

  /**
   * Merge two sets of attributes
   */
  private mergeAttributes(
    attrs1: Record<string, any>,
    attrs2: Record<string, any>
  ): Record<string, any> {
    const result = { ...attrs1 };
    
    for (const [key, value] of Object.entries(attrs2)) {
      if (!(key in result)) {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Generate a more meaningful base type from product name and attributes
   */
  private generateMeaningfulBaseType(
    productName: string,
    attributes: Record<string, any>
  ): string {
    // Extract main noun phrase (usually 1-3 words)
    const words = productName.split(/\s+/);
    let baseType = words.slice(0, Math.min(3, words.length)).join(' ');
    
    // If there's a material or form attribute, add it to make the base type more specific
    if (attributes.material) {
      baseType = `${attributes.material} ${baseType}`;
    } else if (attributes.form) {
      baseType = `${attributes.form} ${baseType}`;
    }
    
    return baseType.replace(/[^\w\s]/g, '').trim();
  }

  /**
   * Generate enhanced group description using attributes
   */
  private generateEnhancedGroupDescription(
    baseType: string,
    attributes: Record<string, any>
  ): string {
    let description = `${baseType}`;
    
    const attributeDescriptions: string[] = [];
    
    if (attributes.material) {
      attributeDescriptions.push(`made of ${attributes.material}`);
    }
    
    if (attributes.quality) {
      attributeDescriptions.push(attributes.quality);
    }
    
    if (attributes.form) {
      attributeDescriptions.push(`in ${attributes.form} form`);
    }
    
    if (attributeDescriptions.length > 0) {
      description += ` - ${attributeDescriptions.join(', ')}`;
    }
    
    if (attributes.size || attributes.color || attributes.packaging) {
      description += ' (available in';
      
      if (attributes.size) description += ` different sizes`;
      if (attributes.color) description += `${attributes.size ? ',' : ''} various colors`;
      if (attributes.packaging) description += `${attributes.size || attributes.color ? ',' : ''} multiple packaging options`;
      
      description += ')';
    }
    
    return description;
  }

  /**
   * Post-process groups with enhanced attribute consolidation
   */
  private postProcessGroupsEnhanced(groups: ProductGroup[]): ProductGroup[] {
    return groups
      .filter(group => group.variants.length > 0)
      .map(group => {
        // Enhance group attributes with attributes from variants
        const variantAttributes = group.variants.flatMap(variant => 
          variant.attributes ? Object.entries(variant.attributes) : []
        );
        
        // Count attribute occurrences
        const attributeCounts = new Map<string, Map<string, number>>();
        
        for (const [key, value] of variantAttributes) {
          if (!attributeCounts.has(key)) {
            attributeCounts.set(key, new Map());
          }
          
          const valueCounts = attributeCounts.get(key)!;
          valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        }
        
        // Find most common values for each attribute
        const enhancedAttributes = { ...group.attributes };
        
        attributeCounts.forEach((valueCounts, key) => {
          // Get most frequent value
          let mostFrequentValue: string | null = null;
          let highestCount = 0;
          
          valueCounts.forEach((count, value) => {
            if (count > highestCount) {
              highestCount = count;
              mostFrequentValue = value;
            }
          });
          
          // Only add if it appears in at least 30% of variants
          if (mostFrequentValue && highestCount >= 0.3 * group.variants.length) {
            enhancedAttributes[key] = mostFrequentValue;
          }
        });
        
        return {
          ...group,
          attributes: enhancedAttributes,
          variants: this.limitVariants(group.variants)
        };
      });
  }

  /**
   * Extract attributes from a product using enhanced pattern recognition
   */
  private extractProductAttributes(product: ProductVariant): Record<string, any> {
    const attributes: Record<string, any> = {};
    const name = product.name || '';
    const description = product.description || '';
    const fullText = `${name} ${description}`.toLowerCase();
    
    // Extract size/weight patterns with more comprehensive regex
    const sizeRegex = /(\d+[\s-]*(ml|l|g|kg|cm|mm|oz|lb|inch|fl\.?\s*oz|pound|gal|gallon|pt|pint|qt|quart)s?)/gi;
    const sizeMatches = fullText.match(sizeRegex);
    if (sizeMatches && sizeMatches.length > 0) {
      attributes.size = sizeMatches[0].trim().replace(/\s+/g, ' ');
    }
    
    // Extract quantity information
    const quantityRegex = /(\d+[\s-]*(count|pack|piece|pc|pcs|set|sets|box|boxes|case|cases)s?)/gi;
    const quantityMatches = fullText.match(quantityRegex);
    if (quantityMatches && quantityMatches.length > 0) {
      attributes.quantity = quantityMatches[0].trim().replace(/\s+/g, ' ');
    }
    
    // Extract numerical dimensions
    const dimensionRegex = /(\d+[\s]*[xX×][\s]*\d+[\s]*[xX×]?[\s]*\d*\s*(cm|mm|m|inch|ft|feet|"|in)?)/gi;
    const dimensionMatches = fullText.match(dimensionRegex);
    if (dimensionMatches && dimensionMatches.length > 0) {
      attributes.dimensions = dimensionMatches[0].trim().replace(/\s+/g, ' ');
    }
    
    // Extract materials with expanded list
    const materialRegex = /\b(wood(en)?|cotton|leather|silk|metal(lic)?|glass|ceramic|plastic|steel|aluminum|nylon|polyester|rubber|fabric|wool|canvas|denim|satin|velvet|suede|bamboo|silicone|paper|cardboard)\b/gi;
    const materialMatches = fullText.match(materialRegex);
    if (materialMatches && materialMatches.length > 0) {
      attributes.material = materialMatches[0].toLowerCase();
    }
    
    // Extract color/variant with expanded list
    const colorRegex = /\b(red|green|blue|black|white|yellow|orange|purple|brown|grey|gray|pink|gold|silver|teal|navy|beige|ivory|turquoise|maroon|olive|violet|indigo|multicolored|multi\s*colored|multi\s*color)\b/gi;
    const colorMatches = fullText.match(colorRegex);
    if (colorMatches && colorMatches.length > 0) {
      attributes.color = colorMatches[0].toLowerCase();
    }
    
    // Extract flavors and scents
    const flavorRegex = /\b(vanilla|chocolate|strawberry|mint|cherry|lemon|orange|grape|apple|banana|cinnamon|coffee|caramel|berry|fruit|original|natural|unflavored|plain)\b/gi;
    const flavorMatches = fullText.match(flavorRegex);
    if (flavorMatches && flavorMatches.length > 0) {
      attributes.flavor = flavorMatches[0].toLowerCase();
    }
    
    // Extract quality indicators
    const qualityRegex = /\b(premium|organic|natural|handcrafted|artisan|deluxe|luxury|eco-friendly|sustainable|high-quality|authentic|genuine|pure|fresh|grade\s+a|homemade|traditional|certified|fair\s+trade)\b/gi;
    const qualityMatches = fullText.match(qualityRegex);
    if (qualityMatches && qualityMatches.length > 0) {
      attributes.quality = qualityMatches[0].toLowerCase();
    }
    
    // Extract packaging types
    const packagingRegex = /\b(box(ed)?|bottle|can|jar|pack|pouch|container|tube|bag|sachet|wrapped|package|carton|bundle|kit|case|set|tin|packet|roll|tray)\b/gi;
    const packagingMatches = fullText.match(packagingRegex);
    if (packagingMatches && packagingMatches.length > 0) {
      attributes.packaging = packagingMatches[0].toLowerCase();
    }
    
    // Extract product state/form
    const formRegex = /\b(liquid|solid|powder|cream|gel|spray|frozen|chilled|fresh|dried|concentrate|tablet|capsule|pill|lotion|oil|wax|foam|paste|crystal|granule|bar)\b/gi;
    const formMatches = fullText.match(formRegex);
    if (formMatches && formMatches.length > 0) {
      attributes.form = formMatches[0].toLowerCase();
    }
    
    // Extract product preparation
    const prepRegex = /\b(ready-to-(eat|drink|cook|serve|use)|ready(y|\s+)to\s+(eat|drink|cook|serve|use)|instant|quick|pre-cooked|raw|prepared|microwavable|easy|fast|pre-washed|pre-mixed|bake-at-home)\b/gi;
    const prepMatches = fullText.match(prepRegex);
    if (prepMatches && prepMatches.length > 0) {
      attributes.preparation = prepMatches[0].toLowerCase();
    }
    
    // Extract age groups
    const ageRegex = /\b(kids|children|toddler|baby|infant|adult|men|women|senior|elderly|teen|teenager|unisex)\b/gi;
    const ageMatches = fullText.match(ageRegex);
    if (ageMatches && ageMatches.length > 0) {
      attributes.ageGroup = ageMatches[0].toLowerCase();
    }
    
    // Extract existing product attributes if available
    if (product.attributes) {
      Object.assign(attributes, product.attributes);
    }
    
    // Add a signature string for easier similarity matching
    attributes.signature = this.generateProductSignature(name, attributes);
    
    return attributes;
  }
  
  /**
   * Generate a signature string from product name and attributes for similarity matching
   */
  private generateProductSignature(name: string, attributes: Record<string, any>): string {
    // Create a normalized base name by removing size, quantity, etc.
    let baseName = name.toLowerCase();
    
    // Remove common suffixes that indicate variants
    baseName = baseName
      .replace(/\d+\s*(ml|l|g|kg|oz|lb|inch|pack|piece|count)/gi, '')
      .replace(/\(.*?\)/g, '') // Remove anything in parentheses
      .replace(/small|medium|large|xl|xxl/gi, '')
      .replace(/single|double|triple|multi/gi, '')
      .trim();
    
    // Create a signature combining the base name with key attributes
    let signature = baseName;
    
    // Add key attributes that define the core product (not variants)
    if (attributes.material) signature += ` ${attributes.material}`;
    if (attributes.form) signature += ` ${attributes.form}`;
    if (attributes.quality) signature += ` ${attributes.quality}`;
    
    // Remove extra spaces and normalize
    return signature.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Calculate similarity between products based on name and attributes
   */
  private calculateProductSimilarity(product1: ProductVariant, product2: ProductVariant): number {
    // Extract or access signatures
    const signature1 = product1.attributes?.signature || 
                      this.generateProductSignature(product1.name, product1.attributes || {});
    const signature2 = product2.attributes?.signature || 
                      this.generateProductSignature(product2.name, product2.attributes || {});
    
    // String similarity for signatures (core similarity)
    const signatureSimilarity = this.calculateSimilarity(signature1, signature2);
    
    // If signatures are very different, they're not similar products
    if (signatureSimilarity < 0.6) {
      return signatureSimilarity;
    }
    
    // Check for attribute compatibility
    const attributeCompatibility = this.calculateAttributeCompatibility(
      product1.attributes || {},
      product2.attributes || {}
    );
    
    // Check if they differ only in variant attributes (indicates they're the same product type)
    const isVariant = this.isLikelyVariant(product1, product2);
    const variantBonus = isVariant ? 0.15 : 0;
    
    // Weighted combination
    return (signatureSimilarity * 0.6) + (attributeCompatibility * 0.25) + variantBonus;
  }
  
  /**
   * Determine if two products are likely variants of the same product
   */
  private isLikelyVariant(product1: ProductVariant, product2: ProductVariant): boolean {
    const attr1 = product1.attributes || {};
    const attr2 = product2.attributes || {};
    
    // Products are likely variants if they differ only in certain attributes
    const variantAttributes = ['size', 'color', 'flavor', 'quantity', 'packaging'];
    
    // Check if they have at least one differing variant attribute
    const hasDifferentVariantAttribute = variantAttributes.some(attr => 
      attr1[attr] && attr2[attr] && attr1[attr] !== attr2[attr]
    );
    
    // Check if they have similar core name (removing size/variant indicators)
    const name1 = product1.name.replace(/\d+\s*(ml|l|g|kg|oz|lb|inch|pack|piece|count)/gi, '').trim();
    const name2 = product2.name.replace(/\d+\s*(ml|l|g|kg|oz|lb|inch|pack|piece|count)/gi, '').trim();
    const nameSimilarity = this.calculateSimilarity(name1, name2);
    
    return hasDifferentVariantAttribute && nameSimilarity > 0.7;
  }
  
  /**
   * Find similar group based on enhanced similarity detection
   */
  private findSimilarGroup(groups: ProductGroup[], product: ProductVariant): ProductGroup | null {
    const similarityThreshold = this.config.similarityThreshold || 0.75;
    
    // Calculate similarity scores with each group
    const scores = groups.map(group => {
      // Compare with base type
      const baseTypeSimilarity = this.calculateSimilarity(
        product.name, 
        group.baseType
      );
      
      // Compare with variants (pick highest)
      const variantSimilarities = group.variants.map(variant => 
        this.calculateProductSimilarity(product, variant)
      );
      
      const maxVariantSimilarity = Math.max(...variantSimilarities, 0);
      
      // Calculate attribute compatibility
      const attributeCompatibility = this.calculateAttributeCompatibility(
        product.attributes || {},
        group.attributes
      );
      
      // Weighted combination
      const overallSimilarity = (baseTypeSimilarity * 0.3) + 
                             (maxVariantSimilarity * 0.5) + 
                             (attributeCompatibility * 0.2);
      
      return { group, similarity: overallSimilarity };
    });
    
    // Sort by similarity (highest first)
    scores.sort((a, b) => b.similarity - a.similarity);
    
    // Return the most similar group if it exceeds the threshold
    return scores.length > 0 && scores[0].similarity >= similarityThreshold
      ? scores[0].group
      : null;
  }

  /**
   * Utility methods
   */
  private isProductGrouped(groups: Map<string, ProductGroup>, product: ProductVariant): boolean {
    return Array.from(groups.values()).some(group => 
      this.isVariantInGroup(group, product)
    );
  }

  private isVariantInGroup(group: ProductGroup, product: ProductVariant): boolean {
    return group.variants.some(variant => variant.id === product.id);
  }

  private limitVariants(variants: ProductVariant[]): ProductVariant[] {
    return this.config.maxVariantsPerGroup 
      ? variants.slice(0, this.config.maxVariantsPerGroup)
      : variants;
  }

  private generateBaseType(productName: string): string {
    return productName
      .split(/\s+/)
      .slice(0, 2)
      .join(' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  private generateGroupDescription(baseType: string): string {
    return `${baseType} - Various preparations and flavors`;
  }

  private extractMainIngredient(name: string): string {
    // First check for cheese varieties in corn dogs
    if (name.toLowerCase().includes('corn dog') || name.toLowerCase().includes('corndog')) {
      if (name.toLowerCase().includes('cheese')) {
        if (name.toLowerCase().includes('jalapeno')) {
          return 'Jalapeno Cheese';
        } else if (name.toLowerCase().includes('creamy')) {
          return 'Creamy Cheese';
        } else {
          return 'Cheese';
        }
      }
      if (name.toLowerCase().includes('original')) {
        return 'Beef';
      }
      if (name.toLowerCase().includes('boerie')) {
        return 'Boerewors';
      }
      return 'Mixed';
    }
    
    // Check for snack pocket ingredients
    if (name.toLowerCase().includes('snack pocket')) {
      if (name.toLowerCase().includes('chicken')) {
        return 'Chicken';
      }
      if (name.toLowerCase().includes('cheeseburger') || name.toLowerCase().includes('beef')) {
        return 'Beef';
      }
      return 'Mixed';
    }
    
    // Generic ingredients
    const ingredients = [
      'Chicken', 'Beef', 'Pork', 'Fish', 'Cheese',
      'Vegetable', 'Corn', 'Potato'
    ];
    
    for (const ingredient of ingredients) {
      if (name.toLowerCase().includes(ingredient.toLowerCase())) {
        return ingredient;
      }
    }
    return 'Mixed';
  }

  private extractPreparationType(name: string): string {
    const types = {
      fried: /(fried|crispy)/i,
      baked: /baked/i,
      grilled: /grilled/i,
      breaded: /breaded/i
    };

    for (const [type, pattern] of Object.entries(types)) {
      if (pattern.test(name)) {
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
    }
    return 'Standard';
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Add missing attribute extraction methods
  private extractSnackAttributes(name: string): Partial<ProductAttributes> {
    const attributes: Partial<ProductAttributes> = {
      mainIngredient: 'Mixed',
      preparationType: 'Baked'
    };
    
    // Extract ingredients
    if (/\bcheese\b/i.test(name)) {
      attributes.mainIngredient = 'Cheese';
    } else if (/\bchicken\b/i.test(name)) {
      attributes.mainIngredient = 'Chicken';
    } else if (/\bbeef\b/i.test(name)) {
      attributes.mainIngredient = 'Beef';
    } else if (/\bvegetable\b/i.test(name)) {
      attributes.mainIngredient = 'Vegetables';
    }
    
    // Extract preparation type
    if (/\bfried\b/i.test(name)) {
      attributes.preparationType = 'Fried';
    } else if (/\bbaked\b/i.test(name)) {
      attributes.preparationType = 'Baked';
    }
    
    return attributes;
  }

  private extractCornDogAttributes(name: string): Partial<ProductAttributes> {
    const attributes: Partial<ProductAttributes> = {
      mainIngredient: 'Meat and Corn',
      preparationType: 'Fried'
    };
    
    // Extract specific variety
    if (/\bchicken\b/i.test(name)) {
      attributes.mainIngredient = 'Chicken and Corn';
    } else if (/\bbeef\b/i.test(name)) {
      attributes.mainIngredient = 'Beef and Corn';
    } else if (/\bturkey\b/i.test(name)) {
      attributes.mainIngredient = 'Turkey and Corn';
    }
    
    // Extract preparation
    if (/\bbaked\b/i.test(name)) {
      attributes.preparationType = 'Baked';
    }
    
    return attributes;
  }

  private extractCheeseAttributes(name: string): Partial<ProductAttributes> {
    const attributes: Partial<ProductAttributes> = {
      mainIngredient: 'Cheese',
      preparationType: 'Processed'
    };
    
    // Extract cheese type
    if (/\bcheddar\b/i.test(name)) {
      attributes.mainIngredient = 'Cheddar Cheese';
    } else if (/\bmozzarella\b/i.test(name)) {
      attributes.mainIngredient = 'Mozzarella Cheese';
    } else if (/\bparmesan\b/i.test(name)) {
      attributes.mainIngredient = 'Parmesan Cheese';
    } else if (/\bswiss\b/i.test(name)) {
      attributes.mainIngredient = 'Swiss Cheese';
    }
    
    return attributes;
  }
} 