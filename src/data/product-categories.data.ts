import { ProductCategory } from '../types/product-categories.types';

export const productCategories: ProductCategory[] = [
  {
    id: 'apparel',
    name: 'Apparel & Footwear',
    hsCodePrefix: '61',
    subcategories: [
      {
        id: 'footwear',
        name: 'Footwear',
        examples: ['Shoes', 'Boots', 'Sandals', 'Athletic footwear'],
        description: 'All types of footwear and shoes',
        hsCode: '6403',
        requirements: {
          certifications: ['ISO 9001', 'SATRA'],
          standards: ['Size Standards', 'Material Safety'],
          documentation: ['Material Safety Data Sheets', 'Size Charts'],
          regulatoryBodies: ['NRCS', 'Bureau of Standards']
        }
      },
      {
        id: 'clothing',
        name: 'Clothing',
        examples: ['Dresses', 'Shirts', 'Pants', 'Jackets'],
        description: 'Ready-to-wear clothing and apparel',
        hsCode: '6204',
        requirements: {
          certifications: ['ISO 9001', 'WRAP'],
          standards: ['Textile Standards', 'Size Standards'],
          documentation: ['Material Composition', 'Care Instructions'],
          regulatoryBodies: ['NRCS', 'Department of Trade and Industry']
        }
      }
    ]
  },
  {
    id: 'food-products',
    name: 'Food Products',
    hsCodePrefix: '16',
    subcategories: [
      {
        id: 'frozen-foods',
        name: 'Frozen Foods',
        examples: ['Frozen meals', 'Frozen snacks', 'Frozen vegetables', 'Ice cream'],
        description: 'Food products requiring frozen storage and cold chain logistics',
        hsCode: '1904',
        requirements: {
          certifications: ['HACCP', 'ISO 22000', 'FSSC 22000'],
          standards: ['Cold Chain Management', 'Food Safety Standards'],
          documentation: ['Temperature Control Records', 'Food Safety Certificates'],
          regulatoryBodies: ['Department of Agriculture, Land Reform and Rural Development']
        }
      },
      {
        id: 'processed-foods',
        name: 'Processed Foods',
        examples: ['Snacks', 'Confectionery', 'Baked goods', 'Dry mixes'],
        description: 'Shelf-stable processed food products',
        hsCode: '1905',
        requirements: {
          certifications: ['HACCP', 'ISO 22000'],
          standards: ['Food Safety Standards', 'Labeling Requirements'],
          documentation: ['Product Analysis Certificates', 'Ingredient Lists'],
          regulatoryBodies: ['Department of Health', 'NRCS']
        }
      }
    ]
  },
  {
    id: 'beverages',
    name: 'Beverages',
    hsCodePrefix: '22',
    subcategories: [
      {
        id: 'alcoholic-beverages',
        name: 'Alcoholic Beverages',
        examples: ['Wine', 'Beer', 'Spirits', 'Cider'],
        description: 'Beverages containing alcohol',
        hsCode: '2204',
        requirements: {
          certifications: ['Wine of Origin', 'Liquor License'],
          standards: ['Alcohol Content Standards', 'Labeling Requirements'],
          documentation: ['Certificate of Origin', 'Laboratory Analysis'],
          regulatoryBodies: ['Department of Agriculture', 'Wine and Spirit Board']
        }
      },
      {
        id: 'non-alcoholic-beverages',
        name: 'Non-Alcoholic Beverages',
        examples: ['Fruit juices', 'Soft drinks', 'Water', 'Tea products'],
        description: 'Non-alcoholic drinks and beverages',
        hsCode: '2202',
        requirements: {
          certifications: ['HACCP', 'ISO 22000'],
          standards: ['Food Safety Standards', 'Water Quality Standards'],
          documentation: ['Product Analysis', 'Water Quality Reports'],
          regulatoryBodies: ['Department of Health', 'NRCS']
        }
      }
    ]
  }
];

// Mapping of HS codes to categories for quick lookup
export const hsCodeCategoryMap: Record<string, { categoryId: string; subcategoryId: string }> = {
  '6403': { categoryId: 'apparel', subcategoryId: 'footwear' },
  '6204': { categoryId: 'apparel', subcategoryId: 'clothing' },
  '1904': { categoryId: 'food-products', subcategoryId: 'frozen-foods' },
  '1905': { categoryId: 'food-products', subcategoryId: 'processed-foods' },
  '2204': { categoryId: 'beverages', subcategoryId: 'alcoholic-beverages' },
  '2202': { categoryId: 'beverages', subcategoryId: 'non-alcoholic-beverages' }
}; 