export interface HSCode {
  code: string;
  description: string;
  confidence?: number;
  metadata?: {
    chapter?: string;
    section?: string;
    notes?: string[];
    restrictions?: string[];
  };
}

export interface ClassificationResult {
  hsCode: HSCode;
  alternatives?: HSCode[];
  confidence: number;
  timestamp: string;
}

export interface ClassificationError {
  message: string;
  code: string;
  details?: {
    field?: string;
    value?: string;
    constraint?: string;
  };
}

export type ClassificationStatus = 'idle' | 'loading' | 'success' | 'error'; 