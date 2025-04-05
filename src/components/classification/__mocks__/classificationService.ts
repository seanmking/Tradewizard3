import { HSCode, ClassificationResult } from '../../../types/hs-code.types';

export const mockHSCodes: HSCode[] = [
  {
    code: '8471.30',
    description: 'Portable automatic data processing machines, weighing not more than 10 kg',
    confidence: 0.95,
    metadata: {
      chapter: '84',
      section: 'XVI',
      notes: ['Includes laptops and tablets']
    }
  },
  {
    code: '8471.41',
    description: 'Other automatic data processing machines comprising in the same housing at least a central processing unit and an input and output unit',
    confidence: 0.85,
    metadata: {
      chapter: '84',
      section: 'XVI',
      notes: ['Includes desktop computers']
    }
  },
  {
    code: '8471.49',
    description: 'Other automatic data processing machines, presented in the form of systems',
    confidence: 0.75,
    metadata: {
      chapter: '84',
      section: 'XVI',
      notes: ['Includes computer systems']
    }
  }
];

export const mockClassificationService = {
  classifyProduct: jest.fn().mockImplementation((description: string): Promise<ClassificationResult> => {
    if (!description) {
      throw new Error('Product description is required');
    }
    return Promise.resolve({
      hsCode: mockHSCodes[0],
      confidence: mockHSCodes[0].confidence || 0,
      alternatives: mockHSCodes.slice(1),
      timestamp: new Date().toISOString()
    });
  }),

  getSuggestions: jest.fn().mockImplementation((description: string): Promise<HSCode[]> => {
    if (!description) {
      throw new Error('Product description is required');
    }
    return Promise.resolve(mockHSCodes);
  }),

  manualClassify: jest.fn().mockImplementation((hsCode: HSCode): Promise<ClassificationResult> => {
    return Promise.resolve({
      hsCode,
      confidence: 1,
      timestamp: new Date().toISOString()
    });
  })
}; 