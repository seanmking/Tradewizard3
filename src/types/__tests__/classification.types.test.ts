import {
  HSChapter,
  HSHeading,
  HSSubheading,
  ClassificationResult,
  ClassificationProgress,
  ClassificationState
} from '../classification.types';

describe('HS Code Data Structure', () => {
  // Test data
  const mockSubheading: HSSubheading = {
    level: 'subheading',
    code: '080390',
    description: 'Fresh or dried bananas',
    confidence: 0.95,
    parentHeading: '0803',
    examples: ['Cavendish bananas', 'Plantains'],
    searchTerms: ['banana', 'plantain', 'fresh fruit']
  };

  const mockHeading: HSHeading = {
    level: 'heading',
    code: '0803',
    description: 'Bananas, including plantains, fresh or dried',
    confidence: 0.9,
    parentChapter: '08',
    subheadings: [mockSubheading],
    examples: ['Bananas', 'Plantains'],
    searchTerms: ['banana', 'plantain', 'fruit']
  };

  const mockChapter: HSChapter = {
    level: 'chapter',
    code: '08',
    description: 'Edible fruit and nuts; peel of citrus fruit or melons',
    confidence: 0.85,
    headings: [mockHeading],
    examples: ['Fruits', 'Nuts'],
    searchTerms: ['fruit', 'nuts', 'food']
  };

  // Test the hierarchical relationship
  it('maintains proper hierarchical relationships', () => {
    // Chapter contains heading
    expect(mockChapter.headings).toContain(mockHeading);
    
    // Heading contains subheading
    expect(mockHeading.subheadings).toContain(mockSubheading);
    
    // Parent references are correct
    expect(mockHeading.parentChapter).toBe(mockChapter.code);
    expect(mockSubheading.parentHeading).toBe(mockHeading.code);
  });

  // Test classification result structure
  it('properly structures classification results', () => {
    const result: ClassificationResult = {
      chapter: mockChapter,
      selectedHeading: mockHeading,
      selectedSubheading: mockSubheading,
      confidence: 0.95,
      confidenceLevel: 'high',
      needsReview: false
    };

    expect(result.chapter).toBe(mockChapter);
    expect(result.selectedHeading).toBe(mockHeading);
    expect(result.selectedSubheading).toBe(mockSubheading);
    expect(result.confidence).toBeGreaterThan(0);
  });

  // Test classification progress tracking
  it('tracks classification progress correctly', () => {
    const progress: ClassificationProgress = {
      selectedChapter: mockChapter,
      selectedHeading: mockHeading,
      selectedSubheading: mockSubheading,
      status: 'complete',
      confidence: 0.95
    };

    expect(progress.selectedChapter).toBe(mockChapter);
    expect(progress.selectedHeading).toBe(mockHeading);
    expect(progress.selectedSubheading).toBe(mockSubheading);
    expect(progress.status).toBe('complete');
  });

  // Test state management structure
  it('properly structures classification state', () => {
    const state: ClassificationState = {
      chapters: {
        [mockChapter.code]: mockChapter
      },
      progress: {
        selectedChapter: mockChapter,
        selectedHeading: mockHeading,
        selectedSubheading: mockSubheading,
        status: 'complete',
        confidence: 0.95
      },
      history: [],
      metrics: []
    };

    expect(state.chapters[mockChapter.code]).toBe(mockChapter);
    expect(state.progress.selectedChapter).toBe(mockChapter);
    expect(state.progress.status).toBe('complete');
  });

  // Test code format validation
  it('validates HS code formats', () => {
    // Chapter should be 2 digits
    expect(mockChapter.code).toMatch(/^\d{2}$/);
    
    // Heading should be 4 digits
    expect(mockHeading.code).toMatch(/^\d{4}$/);
    
    // Subheading should be 6 digits
    expect(mockSubheading.code).toMatch(/^\d{6}$/);
  });
}); 