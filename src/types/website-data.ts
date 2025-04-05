export interface StructuredData {
  type: string;
  data: Record<string, unknown>;
  source: string;
  confidence: number;
}

export interface ContentSection {
  heading?: string;
  content: string;
  type: 'text' | 'product' | 'contact' | 'about' | 'other';
}

export interface ContentData {
  title?: string;
  mainText: string;
  sections: ContentSection[];
  metadata: Record<string, unknown>;
}

export interface ProductData {
  name: string;
  description?: string;
  price?: number;
  specifications: Record<string, unknown>;
  images?: string[];
  category?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  socialMedia?: Record<string, string>;
}

export interface WebsiteAnalysisResult {
  structuredData: StructuredData[];
  mainContent: ContentData;
  products: ProductData[];
  contactInfo: ContactInfo;
  metadata: Record<string, unknown>;
} 