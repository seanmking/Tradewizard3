/**
 * BusinessProfile Model
 * 
 * Represents a business profile with information extracted from digital sources
 */

export interface Product {
  id: string;
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

export interface SocialProfile {
  platform: string;
  handle: string;
  url: string;
  followers?: number;
  lastUpdated?: Date;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  fax?: string;
  contactPerson?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ProductReference {
  id: string;
  name: string;
  category?: string;
  hsCode?: string;
  confidenceScore: number;
}

export interface ExportReadiness {
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  strengths: string[];
  opportunities: string[];
  challenges: string[];
  recommendations: string[];
}

export class BusinessProfileModel {
  // In a real implementation, this would connect to a database
  // For now, we'll use in-memory storage for demonstration
  private static profiles: BusinessProfile[] = [];
  
  /**
   * Create a new business profile
   */
  static async create(profile: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessProfile> {
    const newProfile: BusinessProfile = {
      ...profile,
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.profiles.push(newProfile);
    return newProfile;
  }
  
  /**
   * Find a profile by ID
   */
  static async findById(id: string): Promise<BusinessProfile | null> {
    const profile = this.profiles.find(p => p.id === id);
    return profile || null;
  }
  
  /**
   * Update a profile by ID
   */
  static async update(id: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile | null> {
    const index = this.profiles.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedProfile = {
      ...this.profiles[index],
      ...updates,
      id,
      updatedAt: new Date()
    };
    
    this.profiles[index] = updatedProfile;
    return updatedProfile;
  }
  
  /**
   * List all profiles with optional pagination
   */
  static async list(limit: number = 10, offset: number = 0): Promise<BusinessProfile[]> {
    return this.profiles.slice(offset, offset + limit);
  }
  
  /**
   * Delete a profile by ID
   */
  static async delete(id: string): Promise<boolean> {
    const initialLength = this.profiles.length;
    this.profiles = this.profiles.filter(p => p.id !== id);
    return this.profiles.length < initialLength;
  }
} 