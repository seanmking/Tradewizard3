import { ProductCategory } from '../services/product/categoryBasedConsolidation.service';

/**
 * Predefined product categories focused on common South African exports
 */
export const productCategories: ProductCategory[] = [
  // Wine Categories
  {
    id: 'red-wine',
    name: 'Red Wine',
    description: 'Red wines from South African vineyards',
    examples: ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Shiraz', 'Pinotage'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Grapes']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Fermented']
      },
      {
        name: 'vintage',
        displayName: 'Vintage',
        type: 'string',
        required: false
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['ambient']
      }
    ],
    parentCategory: 'wine',
    keywords: ['red', 'wine', 'cabernet', 'merlot', 'shiraz', 'pinotage'],
    hsCodeHints: ['2204'],
    iconPath: 'icons/red-wine.svg',
    priority: 10,
    alternateNames: ['Red Wine Varieties', 'Red Wine Selection'],
    metadata: {
      regionInfo: 'Primarily from Western Cape',
      certification: ['Wine of Origin (WO)'],
      exportMarkets: ['EU', 'UK', 'USA', 'China']
    }
  },
  {
    id: 'white-wine',
    name: 'White Wine',
    description: 'White wines from South African vineyards',
    examples: ['Chardonnay', 'Sauvignon Blanc', 'Chenin Blanc', 'Semillon'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Grapes']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Fermented']
      },
      {
        name: 'vintage',
        displayName: 'Vintage',
        type: 'string',
        required: false
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['ambient', 'refrigerated']
      }
    ],
    parentCategory: 'wine',
    keywords: ['white', 'wine', 'chardonnay', 'sauvignon', 'chenin'],
    hsCodeHints: ['2204'],
    iconPath: 'icons/white-wine.svg',
    priority: 9,
    alternateNames: ['White Wine Varieties', 'White Wine Selection'],
    metadata: {
      regionInfo: 'Primarily from Western Cape, Stellenbosch',
      certification: ['Wine of Origin (WO)'],
      exportMarkets: ['EU', 'UK', 'USA', 'China']
    }
  },
  {
    id: 'sparkling-wine',
    name: 'Sparkling Wine',
    description: 'Sparkling wines produced using traditional and modern methods',
    examples: ['Cap Classique', 'Champagne-style', 'Prosecco-style', 'Sparkling Rosé'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Grapes']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Fermented', 'Carbonated', 'Traditional Method']
      },
      {
        name: 'vintage',
        displayName: 'Vintage',
        type: 'string',
        required: false
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['refrigerated']
      }
    ],
    parentCategory: 'wine',
    keywords: ['sparkling', 'champagne', 'cap classique', 'bubbly', 'carbonated'],
    hsCodeHints: ['2204'],
    iconPath: 'icons/sparkling-wine.svg',
    priority: 8,
    alternateNames: ['Cap Classique', 'South African Bubbly'],
    metadata: {
      regionInfo: 'Primarily from Western Cape',
      certification: ['Wine of Origin (WO)'],
      exportMarkets: ['EU', 'UK', 'USA']
    }
  },
  
  // Processed Foods
  {
    id: 'processed-meat',
    name: 'Processed Meat Products',
    description: 'Meat products that have undergone preservation or flavor enhancement',
    examples: ['Beef jerky', 'Biltong', 'Droëwors', 'Bacon', 'Sausages'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Beef', 'Pork', 'Chicken', 'Game', 'Mixed']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Dried', 'Cured', 'Smoked', 'Cooked', 'Fermented']
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['ambient', 'refrigerated', 'frozen']
      }
    ],
    parentCategory: 'processed-food',
    keywords: ['meat', 'jerky', 'biltong', 'sausage', 'bacon', 'processed', 'preserved'],
    hsCodeHints: ['1601', '1602'],
    iconPath: 'icons/processed-meat.svg',
    priority: 7,
    alternateNames: ['Meat Products', 'Prepared Meats', 'Cured Meats'],
    metadata: {
      certification: ['HACCP', 'Halal', 'Kosher'],
      regulatoryNotes: 'May require health certificates for export',
      targetMarkets: ['SADC', 'EU', 'Middle East']
    }
  },
  {
    id: 'frozen-foods',
    name: 'Frozen Food Products',
    description: 'Food products preserved through freezing for extended shelf life',
    examples: ['Frozen vegetables', 'Frozen fruits', 'Frozen ready meals', 'Frozen meat products'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Vegetables', 'Fruits', 'Meat', 'Seafood', 'Mixed']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Frozen', 'Flash-frozen', 'Freeze-dried']
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['frozen']
      }
    ],
    parentCategory: 'processed-food',
    keywords: ['frozen', 'ready meal', 'frozen vegetables', 'frozen fruits'],
    hsCodeHints: ['0710', '0811', '1604', '1605', '1602'],
    iconPath: 'icons/frozen-food.svg',
    priority: 6,
    alternateNames: ['Frozen Products', 'Freezer Foods'],
    metadata: {
      certification: ['HACCP', 'ISO 22000'],
      temperatureRequirements: '-18°C or below',
      exportMarkets: ['SADC', 'EU']
    }
  },
  {
    id: 'canned-foods',
    name: 'Canned and Preserved Foods',
    description: 'Food products preserved in cans or jars for extended shelf life',
    examples: ['Canned fruits', 'Canned vegetables', 'Canned fish', 'Preserves', 'Jams'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Fruits', 'Vegetables', 'Fish', 'Meat', 'Mixed']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Canned', 'Preserved', 'In syrup', 'In brine', 'In oil']
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['ambient']
      }
    ],
    parentCategory: 'processed-food',
    keywords: ['canned', 'preserved', 'jars', 'tinned', 'preserves', 'jam'],
    hsCodeHints: ['2005', '2006', '2007', '2008', '1604'],
    iconPath: 'icons/canned-food.svg',
    priority: 5,
    alternateNames: ['Preserved Foods', 'Tinned Foods'],
    metadata: {
      certification: ['HACCP', 'ISO 22000'],
      shelfLife: '12-36 months',
      exportMarkets: ['SADC', 'EU', 'USA']
    }
  },
  
  // Fresh Produce
  {
    id: 'fresh-fruits',
    name: 'Fresh Fruits',
    description: 'Fresh fruit products for export',
    examples: ['Citrus fruits', 'Table grapes', 'Apples', 'Pears', 'Avocados'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Fruit Type',
        type: 'string',
        required: true,
        allowedValues: ['Citrus', 'Grapes', 'Pome', 'Stone', 'Subtropical']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Fresh', 'Washed', 'Sorted']
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['refrigerated', 'ambient']
      }
    ],
    parentCategory: 'fresh-produce',
    keywords: ['fruit', 'fresh', 'citrus', 'apples', 'grapes', 'avocados'],
    hsCodeHints: ['0805', '0806', '0808', '0804'],
    iconPath: 'icons/fresh-fruit.svg',
    priority: 10,
    alternateNames: ['Fruit Exports', 'Fresh Produce'],
    metadata: {
      certification: ['GlobalGAP', 'LEAF'],
      seasonality: 'Varies by fruit type',
      exportMarkets: ['EU', 'UK', 'Middle East', 'Asia']
    }
  },
  
  // Beverages
  {
    id: 'fruit-juices',
    name: 'Fruit Juices',
    description: 'Natural juices made from South African fruits',
    examples: ['Orange juice', 'Apple juice', 'Mixed fruit juice', 'Grape juice'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Citrus', 'Apple', 'Grape', 'Mixed Fruit']
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Method',
        type: 'string',
        required: true,
        allowedValues: ['Fresh pressed', 'Concentrate', 'Not from concentrate', 'Cold pressed']
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['ambient', 'refrigerated']
      }
    ],
    parentCategory: 'beverages',
    keywords: ['juice', 'fruit juice', 'squeezed', 'natural', 'concentrate'],
    hsCodeHints: ['2009'],
    iconPath: 'icons/fruit-juice.svg',
    priority: 8,
    alternateNames: ['Natural Juices', 'Pressed Fruit Juices'],
    metadata: {
      certification: ['HACCP', 'Organic', 'Non-GMO'],
      packaging: ['Tetra Pak', 'Plastic bottles', 'Glass bottles'],
      exportMarkets: ['SADC', 'EU', 'Middle East']
    }
  },
  
  // Cosmetics and Beauty Products
  {
    id: 'natural-cosmetics',
    name: 'Natural Cosmetics and Beauty Products',
    description: 'Beauty products using natural South African ingredients',
    examples: ['Marula oil skincare', 'Rooibos infused products', 'African botanicals', 'Natural soaps'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true,
        allowedValues: ['Marula', 'Rooibos', 'Baobab', 'Aloe Vera', 'Mixed Botanicals']
      },
      {
        name: 'preparationType',
        displayName: 'Product Type',
        type: 'string',
        required: true,
        allowedValues: ['Skincare', 'Haircare', 'Body care', 'Cosmetics']
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['ambient']
      }
    ],
    parentCategory: 'beauty-products',
    keywords: ['natural', 'cosmetics', 'beauty', 'skin care', 'organic', 'botanical'],
    hsCodeHints: ['3304', '3305', '3307'],
    iconPath: 'icons/natural-cosmetics.svg',
    priority: 7,
    alternateNames: ['South African Beauty', 'Natural Skincare'],
    metadata: {
      certification: ['Organic', 'Cruelty-free', 'Natural', 'Fair Trade'],
      unique: 'Indigenous South African ingredients',
      exportMarkets: ['EU', 'UK', 'USA', 'Middle East']
    }
  }
];

/**
 * Get a category by its ID
 */
export function getCategoryById(id: string): ProductCategory | undefined {
  return productCategories.find(category => category.id === id);
}

/**
 * Get all categories with a specific parent category
 */
export function getCategoriesByParent(parentId: string): ProductCategory[] {
  return productCategories.filter(category => category.parentCategory === parentId);
}

/**
 * Get all root categories (no parent category)
 */
export function getRootCategories(): ProductCategory[] {
  return productCategories.filter(category => !category.parentCategory);
}

/**
 * Get category suggestions based on keywords
 */
export function getSuggestionsByKeywords(keywords: string[]): ProductCategory[] {
  const lowercaseKeywords = keywords.map(k => k.toLowerCase());
  
  return productCategories
    .map(category => {
      // Calculate match score based on keyword overlap
      const matchScore = category.keywords.reduce((score, keyword) => {
        return lowercaseKeywords.some(k => keyword.includes(k) || k.includes(keyword))
          ? score + 1
          : score;
      }, 0);
      
      return { category, matchScore };
    })
    .filter(result => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(result => result.category);
} 