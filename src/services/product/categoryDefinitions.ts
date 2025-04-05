import { ProductCategory } from './categoryBasedConsolidation.service';

/**
 * Default product categories aligned with TradeWizard requirements
 */
export const productCategories: ProductCategory[] = [
  // Food Products Category
  {
    id: 'food_products',
    name: 'Food Products',
    description: 'Edible items including fresh, processed, frozen, and packaged foods',
    examples: ['Canned goods', 'Frozen meals', 'Snacks', 'Bakery items', 'Dairy products'],
    alternateNames: ['Food', 'Groceries', 'Edibles'],
    attributes: [
      {
        name: 'mainIngredient',
        displayName: 'Main Ingredient',
        type: 'string',
        required: true
      },
      {
        name: 'preparationType',
        displayName: 'Preparation Type',
        type: 'string',
        required: true,
        allowedValues: ['Fresh', 'Frozen', 'Dried', 'Canned', 'Processed', 'Ready-to-eat']
      },
      {
        name: 'storageType',
        displayName: 'Storage Requirements',
        type: 'string',
        required: true,
        allowedValues: ['Ambient', 'Refrigerated', 'Frozen']
      },
      {
        name: 'shelfLife',
        displayName: 'Shelf Life',
        type: 'string',
        required: false
      }
    ],
    keywords: ['food', 'eat', 'edible', 'meal', 'snack', 'grocery', 'ingredient', 'culinary'],
    hsCodeHints: ['02', '03', '04', '07', '08', '16', '19', '20', '21'],
    priority: 1,
    metadata: {
      exportPotential: 'high',
      sustainabilityImpact: 'medium',
      localAvailability: 'high'
    }
  },
  // Beverages Category
  {
    id: 'beverages',
    name: 'Beverages',
    description: 'Drinkable liquids including alcoholic and non-alcoholic options',
    examples: ['Soft drinks', 'Juices', 'Coffee', 'Tea', 'Wine', 'Beer', 'Spirits'],
    alternateNames: ['Drinks', 'Liquids', 'Refreshments'],
    attributes: [
      {
        name: 'beverageType',
        displayName: 'Beverage Type',
        type: 'string',
        required: true,
        allowedValues: ['Alcoholic', 'Non-alcoholic']
      },
      {
        name: 'containerType',
        displayName: 'Container Type',
        type: 'string',
        required: true,
        allowedValues: ['Bottle', 'Can', 'Carton', 'Pouch', 'Bulk']
      },
      {
        name: 'volume',
        displayName: 'Volume',
        type: 'string',
        required: true
      },
      {
        name: 'carbonated',
        displayName: 'Carbonated',
        type: 'boolean',
        required: false
      }
    ],
    keywords: ['drink', 'beverage', 'liquid', 'juice', 'water', 'soda', 'wine', 'beer', 'coffee', 'tea'],
    hsCodeHints: ['22'],
    priority: 2,
    metadata: {
      exportPotential: 'high',
      sustainabilityImpact: 'medium',
      localAvailability: 'high'
    }
  },
  // Ready-to-Wear Category
  {
    id: 'ready_to_wear',
    name: 'Ready-to-Wear',
    description: 'Clothing and accessories that are manufactured in standard sizes and sold in finished condition',
    examples: ['T-shirts', 'Jeans', 'Dresses', 'Coats', 'Hats', 'Scarves', 'Footwear'],
    alternateNames: ['Apparel', 'Clothing', 'Garments', 'Fashion'],
    attributes: [
      {
        name: 'apparelType',
        displayName: 'Apparel Type',
        type: 'string',
        required: true,
        allowedValues: ['Tops', 'Bottoms', 'Outerwear', 'Underwear', 'Footwear', 'Accessories']
      },
      {
        name: 'gender',
        displayName: 'Gender',
        type: 'string',
        required: true,
        allowedValues: ['Men', 'Women', 'Unisex', 'Children', 'Infant']
      },
      {
        name: 'material',
        displayName: 'Material',
        type: 'string',
        required: true
      },
      {
        name: 'season',
        displayName: 'Season',
        type: 'string',
        required: false,
        allowedValues: ['Spring', 'Summer', 'Fall', 'Winter', 'All-season']
      }
    ],
    keywords: ['clothing', 'apparel', 'wear', 'garment', 'fashion', 'outfit', 'dress', 'shirt', 'pants', 'shoes'],
    hsCodeHints: ['61', '62', '64', '65'],
    priority: 3,
    metadata: {
      exportPotential: 'medium',
      sustainabilityImpact: 'high',
      localAvailability: 'high'
    }
  },
  // Home Goods Category
  {
    id: 'home_goods',
    name: 'Home Goods',
    description: 'Products used in the home including furniture, kitchenware, decor, and household essentials',
    examples: ['Furniture', 'Kitchenware', 'Bed linens', 'Decorative items', 'Cleaning supplies'],
    alternateNames: ['Household items', 'Home essentials', 'Home furnishings', 'Domestic goods'],
    attributes: [
      {
        name: 'productType',
        displayName: 'Product Type',
        type: 'string',
        required: true,
        allowedValues: ['Furniture', 'Kitchen', 'Bathroom', 'Decor', 'Textiles', 'Cleaning', 'Garden']
      },
      {
        name: 'material',
        displayName: 'Material',
        type: 'string',
        required: true
      },
      {
        name: 'room',
        displayName: 'Room',
        type: 'string',
        required: true,
        allowedValues: ['Living room', 'Bedroom', 'Bathroom', 'Kitchen', 'Dining room', 'Office', 'Outdoor']
      },
      {
        name: 'assemblyRequired',
        displayName: 'Assembly Required',
        type: 'boolean',
        required: false
      }
    ],
    keywords: ['home', 'house', 'furniture', 'decor', 'kitchen', 'housewares', 'domestic', 'living', 'household'],
    hsCodeHints: ['39', '44', '69', '70', '94'],
    priority: 4,
    metadata: {
      exportPotential: 'medium',
      sustainabilityImpact: 'medium',
      localAvailability: 'high'
    }
  },
  // Non-Prescription Health Category
  {
    id: 'non_prescription_health',
    name: 'Non-Prescription Health',
    description: 'Over-the-counter health products, supplements, and personal care items',
    examples: ['Vitamins', 'Supplements', 'Bandages', 'Personal hygiene', 'First aid supplies'],
    alternateNames: ['OTC products', 'Health and wellness', 'Personal care', 'Self-care'],
    attributes: [
      {
        name: 'productType',
        displayName: 'Product Type',
        type: 'string',
        required: true,
        allowedValues: ['Vitamins', 'Supplements', 'First Aid', 'Personal Care', 'Hygiene', 'Pain Relief']
      },
      {
        name: 'format',
        displayName: 'Format',
        type: 'string',
        required: true,
        allowedValues: ['Tablet', 'Capsule', 'Liquid', 'Cream', 'Spray', 'Patch']
      },
      {
        name: 'applicationMethod',
        displayName: 'Application Method',
        type: 'string',
        required: true,
        allowedValues: ['Oral', 'Topical', 'Nasal', 'Ocular', 'External']
      },
      {
        name: 'ageGroup',
        displayName: 'Age Group',
        type: 'string',
        required: false,
        allowedValues: ['Adult', 'Children', 'Infant', 'All ages']
      }
    ],
    keywords: ['health', 'vitamin', 'supplement', 'medicine', 'care', 'wellness', 'first aid', 'hygiene', 'otc'],
    hsCodeHints: ['30', '33', '34'],
    priority: 5,
    metadata: {
      exportPotential: 'medium',
      sustainabilityImpact: 'low',
      localAvailability: 'medium'
    }
  }
];

export default productCategories; 