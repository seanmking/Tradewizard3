export enum ClassificationStep {
  Unstarted = 0,
  ChapterSelected = 1,
  HeadingSelected = 2,
  SubheadingSelected = 3,
  Complete = 4
}

export interface HSCodeChapter {
  code: string;
  description: string;
}

export interface HSCodeHeading {
  code: string;
  description: string;
}

export interface HSCodeSubheading {
  code: string;
  description: string;
}

export interface HSCodeSelection {
  chapter: HSCodeChapter | null;
  heading: HSCodeHeading | null;
  subheading: HSCodeSubheading | null;
}

export interface ClassificationResult {
  code: string;
  description: string;
  confidence: number;
  alternatives?: Array<{
    code: string;
    description: string;
    confidence: number;
  }>;
} 