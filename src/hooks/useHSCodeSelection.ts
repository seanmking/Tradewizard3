import { useState, useEffect, useMemo, useCallback } from 'react';
import { HSCodeNode } from '../data/hs-codes/types';
import { HSCodeSelectionService } from '../services/hs-code/hsCodeSelection.service';

interface HSCodeSelectionReturn {
  selectedChapter: string | null;
  selectedHeading: string | null;
  selectedSubheading: string | null;
  
  availableChapters: HSCodeNode[];
  availableHeadings: HSCodeNode[];
  availableSubheadings: HSCodeNode[];
  
  selectChapter: (chapterId: string) => void;
  selectHeading: (headingId: string) => void;
  selectSubheading: (subheadingId: string) => void;
  selectFromPath: (path: string[]) => void;
  
  resetSelection: () => void;
  resetToChapter: () => void;
  
  isComplete: boolean;
  fullCode: string;
  hasUserInteracted: boolean;
}

/**
 * Custom hook for handling the cascading HS code selection
 */
export function useHSCodeSelection(initialCode?: string): HSCodeSelectionReturn {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedHeading, setSelectedHeading] = useState<string | null>(null);
  const [selectedSubheading, setSelectedSubheading] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  
  const hsCodeService = useMemo(() => new HSCodeSelectionService(), []);
  
  // Parse initial code if provided
  useEffect(() => {
    if (initialCode && !hasUserInteracted) {
      const parsed = hsCodeService.parseHSCode(initialCode);
      if (parsed) {
        setSelectedChapter(parsed.chapter);
        setSelectedHeading(parsed.heading);
        setSelectedSubheading(parsed.subheading);
      }
    }
  }, [initialCode, hsCodeService, hasUserInteracted]);
  
  // Get available chapters
  const availableChapters = useMemo(() => 
    hsCodeService.getChapters(),
    [hsCodeService]
  );
  
  // Get available headings based on selected chapter
  const availableHeadings = useMemo(() => 
    selectedChapter ? hsCodeService.getHeadingsForChapter(selectedChapter) : [],
    [hsCodeService, selectedChapter]
  );
  
  // Get available subheadings based on selected heading
  const availableSubheadings = useMemo(() => 
    selectedHeading ? hsCodeService.getSubheadingsForHeading(selectedHeading) : [],
    [hsCodeService, selectedHeading]
  );
  
  // Calculate if selection is complete
  const isComplete = useMemo(() => 
    !!selectedChapter && !!selectedHeading && !!selectedSubheading,
    [selectedChapter, selectedHeading, selectedSubheading]
  );
  
  // Calculate full HS code
  const fullCode = useMemo(() => 
    selectedSubheading || selectedHeading || selectedChapter || '',
    [selectedChapter, selectedHeading, selectedSubheading]
  );
  
  // Chapter selection
  const selectChapter = useCallback((chapterId: string) => {
    setHasUserInteracted(true);
    setSelectedChapter(chapterId);
    setSelectedHeading(null);
    setSelectedSubheading(null);
  }, []);
  
  // Heading selection
  const selectHeading = useCallback((headingId: string) => {
    setHasUserInteracted(true);
    setSelectedHeading(headingId);
    setSelectedSubheading(null);
  }, []);
  
  // Subheading selection
  const selectSubheading = useCallback((subheadingId: string) => {
    setHasUserInteracted(true);
    setSelectedSubheading(subheadingId);
  }, []);
  
  // Select from a path array [chapter, heading, subheading]
  const selectFromPath = useCallback((path: string[]) => {
    if (path.length >= 1 && path[0]) {
      setSelectedChapter(path[0]);
      
      if (path.length >= 2 && path[1]) {
        setSelectedHeading(path[1]);
        
        if (path.length >= 3 && path[2]) {
          setSelectedSubheading(path[2]);
        }
      }
    }
  }, []);
  
  // Reset selection
  const resetSelection = useCallback(() => {
    setSelectedChapter(null);
    setSelectedHeading(null);
    setSelectedSubheading(null);
  }, []);
  
  // Reset to chapter level
  const resetToChapter = useCallback(() => {
    setSelectedHeading(null);
    setSelectedSubheading(null);
  }, []);
  
  return {
    selectedChapter,
    selectedHeading,
    selectedSubheading,
    
    availableChapters,
    availableHeadings,
    availableSubheadings,
    
    selectChapter,
    selectHeading,
    selectSubheading,
    selectFromPath,
    
    resetSelection,
    resetToChapter,
    
    isComplete,
    fullCode,
    hasUserInteracted,
  };
} 