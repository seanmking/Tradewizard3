export interface HSCodeNode {
  id: string;           // '01', '0101', '010121'
  code: string;         // Same as ID but more explicit naming
  level: 'chapter' | 'heading' | 'subheading';
  name: string;         // Human-readable name
  description: string;  // Detailed description
  examples: string[];   // Example products
  parentId?: string;    // Reference to parent (null for chapters)
}

export interface HSCodeHierarchy {
  nodes: Record<string, HSCodeNode>;
  chapters: string[];   // IDs of chapter-level nodes
  headingsByChapter: Record<string, string[]>;
  subheadingsByHeading: Record<string, string[]>;
}

export interface HSCodeSuggestion {
  code: string;
  confidence: number;
  description: string;
  path: string[];       // [chapter, heading, subheading]
}

export interface CountryHSCodeExtension {
  countryCode: string;  // 'UAE', 'UK', etc.
  hsCode: string;       // Full country-specific code (e.g., '0101.21.00.10')
  baseCode: string;     // International 6-digit code (e.g., '0101.21')
  additionalDigits: string; // Country-specific extension (e.g., '00.10')
  description: string;
  requirements: string[];
  restrictions: string[];
  tariffRate: number;
} 