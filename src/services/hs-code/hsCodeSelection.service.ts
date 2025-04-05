import { hsCodeData } from '../../data/hs-codes/hs-code-data';
import { HSCodeNode } from '../../data/hs-codes/types';

export class HSCodeSelectionService {
  private hsCodeData = hsCodeData;
  
  /**
   * Gets all chapters (2-digit HS codes)
   */
  getChapters(): HSCodeNode[] {
    return this.hsCodeData.chapters.map(id => this.hsCodeData.nodes[id]);
  }
  
  /**
   * Gets a specific chapter by ID
   */
  getChapter(chapterId: string): HSCodeNode | null {
    return this.hsCodeData.nodes[chapterId] || null;
  }
  
  /**
   * Gets all headings for a specific chapter
   */
  getHeadingsForChapter(chapterId: string): HSCodeNode[] {
    const headings = this.hsCodeData.headingsByChapter[chapterId] || [];
    return headings.map(id => this.hsCodeData.nodes[id]);
  }
  
  /**
   * Gets a specific heading by ID
   */
  getHeading(headingId: string): HSCodeNode | null {
    return this.hsCodeData.nodes[headingId] || null;
  }
  
  /**
   * Gets all subheadings for a specific heading
   */
  getSubheadingsForHeading(headingId: string): HSCodeNode[] {
    const subheadings = this.hsCodeData.subheadingsByHeading[headingId] || [];
    return subheadings.map(id => this.hsCodeData.nodes[id]);
  }
  
  /**
   * Gets a specific subheading by ID
   */
  getSubheading(subheadingId: string): HSCodeNode | null {
    return this.hsCodeData.nodes[subheadingId] || null;
  }
  
  /**
   * Gets the complete path from chapter to subheading
   */
  getNodePath(nodeId: string): HSCodeNode[] {
    const node = this.hsCodeData.nodes[nodeId];
    if (!node) return [];
    
    const path: HSCodeNode[] = [node];
    let currentNode = node;
    
    // Traverse up the tree until we reach a node with no parent
    while (currentNode.parentId) {
      const parent = this.hsCodeData.nodes[currentNode.parentId];
      if (parent) {
        path.unshift(parent);
        currentNode = parent;
      } else {
        break;
      }
    }
    
    return path;
  }
  
  /**
   * Gets the parent headings and chapter for a subheading
   */
  getParentsForSubheading(subheadingId: string): { chapter: HSCodeNode | null, heading: HSCodeNode | null } {
    const subheading = this.hsCodeData.nodes[subheadingId];
    if (!subheading || subheading.level !== 'subheading' || !subheading.parentId) {
      return { chapter: null, heading: null };
    }
    
    const heading = this.hsCodeData.nodes[subheading.parentId];
    if (!heading || heading.level !== 'heading' || !heading.parentId) {
      return { chapter: null, heading };
    }
    
    const chapter = this.hsCodeData.nodes[heading.parentId];
    return { chapter, heading };
  }
  
  /**
   * Searches for HS codes by keyword across all levels
   */
  search(query: string, level?: 'chapter' | 'heading' | 'subheading'): HSCodeNode[] {
    if (!query || query.length < 2) return [];
    
    const normalizedQuery = query.toLowerCase();
    const results: HSCodeNode[] = [];
    
    Object.values(this.hsCodeData.nodes).forEach(node => {
      // Filter by level if specified
      if (level && node.level !== level) return;
      
      // Search in code, name, description, and examples
      if (
        node.code.includes(normalizedQuery) ||
        node.name.toLowerCase().includes(normalizedQuery) ||
        node.description.toLowerCase().includes(normalizedQuery) ||
        node.examples.some(ex => ex.toLowerCase().includes(normalizedQuery))
      ) {
        results.push(node);
      }
    });
    
    return results;
  }
  
  /**
   * Parses a HS code and extracts chapter, heading, and subheading
   */
  parseHSCode(hsCode: string): { chapter: string; heading: string; subheading: string } | null {
    if (!hsCode) return null;
    
    const cleanCode = hsCode.replace(/\./g, '');
    
    if (cleanCode.length < 6) return null;
    
    return {
      chapter: cleanCode.substring(0, 2),
      heading: cleanCode.substring(0, 4),
      subheading: cleanCode.substring(0, 6)
    };
  }
} 