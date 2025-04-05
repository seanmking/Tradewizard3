import { HSCodeHierarchy, HSCodeNode } from './types';

// Sample HS code data with focus on South African exports
// This is a small subset for demonstration purposes

// Create normalized data structure
const createNode = (
  id: string,
  name: string,
  description: string,
  examples: string[] = [],
  parentId?: string
): HSCodeNode => {
  let level: 'chapter' | 'heading' | 'subheading';
  
  if (id.length === 2) {
    level = 'chapter';
  } else if (id.length === 4) {
    level = 'heading';
  } else {
    level = 'subheading';
  }
  
  return {
    id,
    code: id,
    level,
    name,
    description,
    examples,
    parentId,
  };
};

// Build normalized structure
const nodes: Record<string, HSCodeNode> = {};
const chapters: string[] = [];
const headingsByChapter: Record<string, string[]> = {};
const subheadingsByHeading: Record<string, string[]> = {};

// Chapter 01 - Live Animals
const chapter01 = createNode(
  '01', 
  'Live Animals',
  'Live animals including horses, bovine, swine, sheep, goats, poultry, etc.',
  ['Cattle', 'Horses', 'Sheep', 'Poultry']
);
chapters.push(chapter01.id);
nodes[chapter01.id] = chapter01;
headingsByChapter[chapter01.id] = [];

// Heading 0101 - Horses, asses, mules and hinnies, live
const heading0101 = createNode(
  '0101',
  'Live Horses, Asses, Mules And Hinnies',
  'Live horses, asses, mules and hinnies.',
  ['Horses', 'Racehorses', 'Donkeys'],
  '01'
);
headingsByChapter[chapter01.id].push(heading0101.id);
nodes[heading0101.id] = heading0101;
subheadingsByHeading[heading0101.id] = [];

// Subheading 010121 - Pure-bred breeding animals
const subheading010121 = createNode(
  '010121',
  'Pure-bred breeding horses',
  'Live horses, pure-bred breeding animals.',
  ['Thoroughbreds', 'Breeding horses'],
  '0101'
);
subheadingsByHeading[heading0101.id].push(subheading010121.id);
nodes[subheading010121.id] = subheading010121;

// Chapter 08 - Edible Fruits and Nuts
const chapter08 = createNode(
  '08',
  'Edible Fruits And Nuts',
  'Edible fruit and nuts; peel of citrus fruit or melons.',
  ['Oranges', 'Grapes', 'Apples', 'Nuts']
);
chapters.push(chapter08.id);
nodes[chapter08.id] = chapter08;
headingsByChapter[chapter08.id] = [];

// Heading 0805 - Citrus fruit, fresh or dried
const heading0805 = createNode(
  '0805',
  'Citrus Fruit, Fresh Or Dried',
  'Citrus fruit, fresh or dried.',
  ['Oranges', 'Lemons', 'Grapefruit'],
  '08'
);
headingsByChapter[chapter08.id].push(heading0805.id);
nodes[heading0805.id] = heading0805;
subheadingsByHeading[heading0805.id] = [];

// Subheading 080510 - Oranges
const subheading080510 = createNode(
  '080510',
  'Oranges',
  'Oranges, fresh or dried.',
  ['Valencia oranges', 'Navel oranges'],
  '0805'
);
subheadingsByHeading[heading0805.id].push(subheading080510.id);
nodes[subheading080510.id] = subheading080510;

// Chapter 22 - Beverages, Spirits and Vinegar
const chapter22 = createNode(
  '22',
  'Beverages, Spirits And Vinegar',
  'Beverages, spirits and vinegar.',
  ['Wine', 'Beer', 'Spirits']
);
chapters.push(chapter22.id);
nodes[chapter22.id] = chapter22;
headingsByChapter[chapter22.id] = [];

// Heading 2204 - Wine of fresh grapes
const heading2204 = createNode(
  '2204',
  'Wine Of Fresh Grapes',
  'Wine of fresh grapes, including fortified wines; grape must other than that of heading 2009.',
  ['Red wine', 'White wine', 'Sparkling wine'],
  '22'
);
headingsByChapter[chapter22.id].push(heading2204.id);
nodes[heading2204.id] = heading2204;
subheadingsByHeading[heading2204.id] = [];

// Subheading 220410 - Sparkling wine
const subheading220410 = createNode(
  '220410',
  'Sparkling Wine',
  'Sparkling wine of fresh grapes.',
  ['Champagne', 'Prosecco', 'Sparkling wine'],
  '2204'
);
subheadingsByHeading[heading2204.id].push(subheading220410.id);
nodes[subheading220410.id] = subheading220410;

// Subheading 220421 - Other wine
const subheading220421 = createNode(
  '220421',
  'Other Wine; Grape Must With Fermentation Prevented',
  'Other wine of fresh grapes, including fortified wines, and grape must with fermentation prevented or arrested by the addition of alcohol, in containers of 2 l or less.',
  ['Cabernet Sauvignon', 'Merlot', 'Chardonnay'],
  '2204'
);
subheadingsByHeading[heading2204.id].push(subheading220421.id);
nodes[subheading220421.id] = subheading220421;

// Chapter 64 - Footwear, Gaiters and the Like
const chapter64 = createNode(
  '64',
  'Footwear, Gaiters And The Like',
  'Footwear, gaiters and the like; parts of such articles.',
  ['Shoes', 'Boots', 'Sandals']
);
chapters.push(chapter64.id);
nodes[chapter64.id] = chapter64;
headingsByChapter[chapter64.id] = [];

// Heading 6403 - Footwear with outer soles of rubber
const heading6403 = createNode(
  '6403',
  'Footwear With Outer Soles Of Rubber',
  'Footwear with outer soles of rubber, plastics, leather or composition leather and uppers of leather.',
  ['Leather shoes', 'Boots', 'Dress shoes'],
  '64'
);
headingsByChapter[chapter64.id].push(heading6403.id);
nodes[heading6403.id] = heading6403;
subheadingsByHeading[heading6403.id] = [];

// Subheading 640399 - Other footwear
const subheading640399 = createNode(
  '640399',
  'Other Footwear With Outer Soles Of Rubber',
  'Other footwear with outer soles of rubber, plastics, leather or composition leather and uppers of leather.',
  ['Casual shoes', 'Men\'s leather shoes', 'Women\'s leather shoes'],
  '6403'
);
subheadingsByHeading[heading6403.id].push(subheading640399.id);
nodes[subheading640399.id] = subheading640399;

// Export normalized data structure
export const hsCodeData: HSCodeHierarchy = {
  nodes,
  chapters,
  headingsByChapter,
  subheadingsByHeading,
}; 