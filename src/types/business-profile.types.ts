export interface Product {
  name: string;
  description?: string;
  category?: string;
  specifications?: Record<string, string>;
}

export interface BusinessProfile {
  name: string;
  description?: string;
  industry?: string;
  products: Product[];
  location?: {
    country?: string;
    city?: string;
    address?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    socialMedia?: Record<string, string>;
  };
  websiteUrl: string;
  extractedAt: Date;
} 