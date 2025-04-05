export interface FocusArea {
  id: string;
  name: string;
  chapters: string[];
  description?: string;
}

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'food-products',
    name: 'Food Products',
    chapters: ['02', '04', '07', '08', '09', '10', '11', '12', '16', '17', '18', '19', '20', '21'],
    description: 'Fresh, frozen, or processed food items.'
  },
  {
    id: 'beverages',
    name: 'Beverages',
    chapters: ['22'],
    description: 'All types of drinks including alcoholic and non-alcoholic beverages.'
  },
  {
    id: 'ready-to-wear',
    name: 'Ready-to-Wear',
    chapters: ['42', '61', '62', '64', '71'],
    description: 'Clothing, footwear, accessories, and fashion items.'
  },
  {
    id: 'home-goods',
    name: 'Home Goods',
    chapters: ['42', '44', '46', '69', '94', '97'],
    description: 'Furniture, decorative items, household articles.'
  },
  {
    id: 'non-prescription-health',
    name: 'Non-Prescription Health',
    chapters: ['30', '33', '34'],
    description: 'Over-the-counter health products, cosmetics, and personal care.'
  }
];

// Map to quickly look up which focus area a chapter belongs to
export const CHAPTER_TO_FOCUS_AREA: Record<string, string[]> = {};

// Initialize the mapping
FOCUS_AREAS.forEach(area => {
  area.chapters.forEach(chapter => {
    if (!CHAPTER_TO_FOCUS_AREA[chapter]) {
      CHAPTER_TO_FOCUS_AREA[chapter] = [];
    }
    CHAPTER_TO_FOCUS_AREA[chapter].push(area.id);
  });
}); 