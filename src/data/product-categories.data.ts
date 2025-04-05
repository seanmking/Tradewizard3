// Ensure every subcategory has an hsCode property
interface ProductSubcategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  hsCode: string; // HS code for this product subcategory
  hsCodes?: string[]; // Alternative HS codes
  requirements?: {
    documentation: string[];
    regulatoryBodies: string[];
  };
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  subcategories: ProductSubcategory[];
}

export const productCategories: ProductCategory[] = [
  {
    id: 'food-products',
    name: 'Food Products',
    description: 'Processed foods and fresh produce for export',
    hsCodePrefix: '07-21',
    subcategories: [
      {
        id: 'juices-purees',
        name: 'Juices & Purees',
        description: 'Fruit and vegetable juices and purees',
        hsCodes: ['2009', '2007'],
        examples: ['Orange juice', 'Apple puree', 'Mango juice', 'Fruit juice concentrate'],
        requirements: {
          certifications: ['HACCP', 'ISO 22000'],
          standards: ['FDA Food Safety', 'EU Food Standards'],
          documentation: ['Certificate of Analysis', 'Phytosanitary Certificate'],
          regulatoryBodies: ['Food Safety Authority']
        },
        hsCode: '2009.11'
      },
      {
        id: 'sauces-spices',
        name: 'Sauces & Spices',
        description: 'Prepared sauces, condiments, and spice mixtures',
        hsCodes: ['2103', '0910'],
        examples: ['Hot sauce', 'BBQ sauce', 'Mixed spices', 'Curry powder', 'Chutney'],
        requirements: {
          certifications: ['HACCP', 'ISO 22000'],
          standards: ['FDA Food Safety', 'EU Food Standards'],
          documentation: ['Certificate of Analysis'],
          regulatoryBodies: ['Food Safety Authority']
        },
        hsCode: '2103.00'
      },
      {
        id: 'dried-produce',
        name: 'Dried Fruits & Vegetables',
        description: 'Dehydrated fruits and vegetables',
        hsCodes: ['0813', '0712'],
        examples: ['Dried mango', 'Dried apple', 'Sun-dried tomatoes', 'Dried herbs'],
        requirements: {
          certifications: ['HACCP', 'Organic (optional)'],
          standards: ['FDA Food Safety', 'EU Food Standards'],
          documentation: ['Certificate of Analysis', 'Phytosanitary Certificate'],
          regulatoryBodies: ['Food Safety Authority']
        },
        hsCode: '0813.00'
      },
      {
        id: 'canned-produce',
        name: 'Canned Fruits & Vegetables',
        description: 'Preserved fruits and vegetables in cans or jars',
        hsCodes: ['2008', '2005'],
        examples: ['Canned peaches', 'Canned corn', 'Preserved fruits in syrup', 'Jarred vegetables'],
        requirements: {
          certifications: ['HACCP', 'ISO 22000'],
          standards: ['FDA Food Safety', 'EU Food Standards'],
          documentation: ['Certificate of Analysis', 'Phytosanitary Certificate'],
          regulatoryBodies: ['Food Safety Authority']
        },
        hsCode: '2008.00'
      }
    ]
  },
  {
    id: 'beverages',
    name: 'Beverages',
    description: 'Alcoholic and non-alcoholic beverages',
    hsCodePrefix: '22',
    subcategories: [
      {
        id: 'alcoholic-beverages',
        name: 'Alcoholic Beverages',
        description: 'Wine, beer, spirits and other alcoholic drinks',
        hsCodes: ['2203', '2204', '2205', '2206', '2208'],
        examples: ['Wine', 'Craft beer', 'Spirits', 'Liqueurs', 'Cider'],
        requirements: {
          certifications: ['HACCP'],
          standards: ['Legal drinking age compliance', 'Alcohol content labeling'],
          documentation: ['Certificate of Origin', 'Certificate of Analysis'],
          regulatoryBodies: ['Alcohol Regulatory Authority']
        },
        hsCode: '2203.00'
      },
      {
        id: 'non-alcoholic-beverages',
        name: 'Non-Alcoholic Beverages',
        description: 'Soft drinks, water, and other non-alcoholic beverages',
        hsCodes: ['2201', '2202'],
        examples: ['Mineral water', 'Soft drinks', 'Iced tea', 'Energy drinks', 'Sparkling juices'],
        requirements: {
          certifications: ['HACCP', 'ISO 22000'],
          standards: ['FDA Food Safety', 'EU Food Standards'],
          documentation: ['Certificate of Analysis'],
          regulatoryBodies: ['Food Safety Authority']
        },
        hsCode: '2202.10'
      }
    ]
  },
  {
    id: 'ready-to-wear',
    name: 'Ready-to-Wear',
    description: 'Apparel and jewellery products',
    hsCodePrefix: '61-71',
    subcategories: [
      {
        id: 'apparel',
        name: 'Apparel',
        description: 'Ready-made clothing and garments',
        hsCodes: ['6101', '6102', '6103', '6104', '6105', '6106', '6109', '6110', '6201', '6204'],
        examples: ['T-shirts', 'Dresses', 'Jackets', 'Pants', 'Traditional wear'],
        requirements: {
          certifications: ['Textile certifications', 'Fair Trade (optional)'],
          standards: ['Sizing standards', 'Labeling requirements'],
          documentation: ['Certificate of Origin'],
          regulatoryBodies: ['Consumer Protection Agency']
        },
        hsCode: '6205.20'
      },
      {
        id: 'jewellery',
        name: 'Jewellery',
        description: 'Ornamental items made from precious metals and stones',
        hsCodes: ['7113', '7114', '7116', '7117'],
        examples: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Traditional jewellery'],
        requirements: {
          certifications: ['Precious metal hallmarking', 'Diamond certification'],
          standards: ['Precious metal content', 'Gemstone standards'],
          documentation: ['Certificate of Origin', 'Certificate of Authenticity'],
          regulatoryBodies: ['Precious Metals Authority']
        },
        hsCode: '7113.00'
      }
    ]
  },
  {
    id: 'home-goods',
    name: 'Home Goods',
    description: 'Leather goods, gifting and decor items',
    hsCodePrefix: '42-94',
    subcategories: [
      {
        id: 'leather-goods',
        name: 'Leather Goods',
        description: 'Products made from leather',
        hsCodes: ['4202', '4203', '4205'],
        examples: ['Bags', 'Wallets', 'Belts', 'Leather accessories', 'Leather furnishings'],
        requirements: {
          certifications: ['Leather Working Group (LWG)'],
          standards: ['CITES (for exotic leathers)'],
          documentation: ['Certificate of Origin'],
          regulatoryBodies: ['Consumer Protection Agency']
        },
        hsCode: '4202.00'
      },
      {
        id: 'gifting-decor',
        name: 'Gifting & Decor',
        description: 'Decorative items and gift products for the home',
        hsCodes: ['4420', '6913', '6914', '7013', '9403', '9405'],
        examples: ['Wooden crafts', 'Ceramics', 'Glassware', 'Candles', 'Home textiles', 'Decorative items'],
        requirements: {
          certifications: ['Fair Trade (optional)'],
          standards: ['Product safety standards'],
          documentation: ['Certificate of Origin'],
          regulatoryBodies: ['Consumer Protection Agency']
        },
        hsCode: '9403.00'
      }
    ]
  },
  {
    id: 'non-prescription-health',
    name: 'Non-Prescription Health',
    description: 'Beauty, OTC health, wellness and vitamin products made with ingredients unique to South Africa',
    hsCodePrefix: '21-33',
    subcategories: [
      {
        id: 'beauty-products',
        name: 'Beauty Products',
        description: 'Cosmetics and skincare products',
        hsCodes: ['3304', '3305', '3307'],
        examples: ['Facial creams', 'Body lotions', 'Natural cosmetics', 'Hair care products', 'Indigenous ingredient cosmetics'],
        requirements: {
          certifications: ['Good Manufacturing Practices (GMP)', 'Organic (optional)'],
          standards: ['Cosmetic regulations', 'Ingredient disclosure'],
          documentation: ['Certificate of Analysis', 'Safety Assessment'],
          regulatoryBodies: ['Cosmetics Regulatory Authority']
        },
        hsCode: '3304.00'
      },
      {
        id: 'otc-health-wellness',
        name: 'OTC Health & Wellness',
        description: 'Over-the-counter health products and wellness supplements',
        hsCodes: ['2106', '3004'],
        examples: ['Herbal supplements', 'Vitamins', 'Natural remedies', 'Wellness teas', 'Indigenous medicinal products'],
        requirements: {
          certifications: ['Good Manufacturing Practices (GMP)'],
          standards: ['Health supplement regulations', 'Labeling requirements'],
          documentation: ['Certificate of Analysis', 'Product Registration'],
          regulatoryBodies: ['Health Products Regulatory Authority']
        },
        hsCode: '2106.90'
      }
    ]
  }
];

// Mapping of HS codes to categories for quick lookup
export const hsCodeCategoryMap: Record<string, { categoryId: string; subcategoryId: string }> = {
  // Food Products
  '2009': { categoryId: 'food-products', subcategoryId: 'juices-purees' },
  '2007': { categoryId: 'food-products', subcategoryId: 'juices-purees' },
  '2103': { categoryId: 'food-products', subcategoryId: 'sauces-spices' },
  '0910': { categoryId: 'food-products', subcategoryId: 'sauces-spices' },
  '0813': { categoryId: 'food-products', subcategoryId: 'dried-produce' },
  '0712': { categoryId: 'food-products', subcategoryId: 'dried-produce' },
  '2008': { categoryId: 'food-products', subcategoryId: 'canned-produce' },
  '2005': { categoryId: 'food-products', subcategoryId: 'canned-produce' },
  
  // Beverages
  '2204': { categoryId: 'beverages', subcategoryId: 'alcoholic-beverages' },
  '2208': { categoryId: 'beverages', subcategoryId: 'alcoholic-beverages' },
  '2202': { categoryId: 'beverages', subcategoryId: 'non-alcoholic-beverages' },
  '2201': { categoryId: 'beverages', subcategoryId: 'non-alcoholic-beverages' },
  
  // Ready-to-Wear
  '6104': { categoryId: 'ready-to-wear', subcategoryId: 'apparel' },
  '6204': { categoryId: 'ready-to-wear', subcategoryId: 'apparel' },
  '7113': { categoryId: 'ready-to-wear', subcategoryId: 'jewellery' },
  '7117': { categoryId: 'ready-to-wear', subcategoryId: 'jewellery' },
  
  // Home Goods
  '4202': { categoryId: 'home-goods', subcategoryId: 'leather-goods' },
  '4205': { categoryId: 'home-goods', subcategoryId: 'leather-goods' },
  '9403': { categoryId: 'home-goods', subcategoryId: 'gifting-decor' },
  '7013': { categoryId: 'home-goods', subcategoryId: 'gifting-decor' },
  
  // Non-Prescription Health
  '3304': { categoryId: 'non-prescription-health', subcategoryId: 'beauty-products' },
  '3307': { categoryId: 'non-prescription-health', subcategoryId: 'beauty-products' },
  '2106': { categoryId: 'non-prescription-health', subcategoryId: 'otc-health-wellness' },
  '3004': { categoryId: 'non-prescription-health', subcategoryId: 'otc-health-wellness' }
}; 