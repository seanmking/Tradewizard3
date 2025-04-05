import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import ChapterSelector from './ChapterSelector';
import HeadingSelector from './HeadingSelector';
import SubheadingSelector from './SubheadingSelector';

interface HSCodeNavigatorProps {
  initialHsCode?: string;
  productName?: string;
  productCategory?: string;
  onHsCodeSelected: (hsCode: string, description: string) => void;
  suggestedCodes?: {
    code: string;
    description: string;
    confidence: number;
  }[];
}

export interface HSCodeSelection {
  chapter: {
    code: string | null;
    description: string;
  };
  heading: {
    code: string | null;
    description: string;
  };
  subheading: {
    code: string | null;
    description: string;
  };
}

const HSCodeNavigator: React.FC<HSCodeNavigatorProps> = ({
  initialHsCode,
  productName = '',
  productCategory = '',
  onHsCodeSelected,
  suggestedCodes = []
}) => {
  // Current view state (which selector is visible)
  const [view, setView] = useState<'chapter' | 'heading' | 'subheading'>('chapter');
  
  // Selected codes at each level
  const [selection, setSelection] = useState<HSCodeSelection>({
    chapter: { code: null, description: '' },
    heading: { code: null, description: '' },
    subheading: { code: null, description: '' }
  });
  
  // Filtered suggestions for each level
  const [suggestedChapters, setSuggestedChapters] = useState<Array<{code: string, description: string, confidence?: number}>>([]);
  const [suggestedHeadings, setSuggestedHeadings] = useState<Array<{code: string, description: string, confidence?: number}>>([]);
  const [suggestedSubheadings, setSuggestedSubheadings] = useState<Array<{code: string, description: string, confidence?: number}>>([]);

  // Parse initialHsCode if provided
  useEffect(() => {
    if (initialHsCode) {
      const code = initialHsCode.replace(/[^0-9]/g, '');
      
      if (code.length >= 2) {
        const chapterCode = code.substring(0, 2);
        // Find chapter description from suggested codes or set default
        const chapterSuggestion = suggestedCodes.find(
          suggestion => suggestion.code.startsWith(chapterCode)
        );
        
        setSelection(prev => ({
          ...prev,
          chapter: {
            code: chapterCode,
            description: chapterSuggestion?.description.split(' - ')[0] || 'Chapter ' + chapterCode
          }
        }));
        
        if (code.length >= 4) {
          const headingCode = code.substring(0, 4);
          // Find heading description
          const headingSuggestion = suggestedCodes.find(
            suggestion => suggestion.code.startsWith(headingCode)
          );
          
          setSelection(prev => ({
            ...prev,
            heading: {
              code: headingCode,
              description: headingSuggestion?.description || 'Heading ' + headingCode
            }
          }));
          
          if (code.length >= 6) {
            const subheadingCode = code.substring(0, 6);
            // Find subheading description
            const subheadingSuggestion = suggestedCodes.find(
              suggestion => suggestion.code === subheadingCode
            );
            
            setSelection(prev => ({
              ...prev,
              subheading: {
                code: subheadingCode,
                description: subheadingSuggestion?.description || 'Subheading ' + subheadingCode
              }
            }));
            
            setView('subheading');
          } else {
            setView('heading');
          }
        } else {
          setView('chapter');
        }
      }
    }
  }, [initialHsCode, suggestedCodes]);

  // Filter suggested codes for each level based on the current selections
  useEffect(() => {
    // Filter chapter suggestions (2-digit codes)
    const uniqueChapters = new Map<string, {code: string, description: string, confidence: number}>();
    
    suggestedCodes.forEach(suggestion => {
      const chapterCode = suggestion.code.substring(0, 2);
      const existingSuggestion = uniqueChapters.get(chapterCode);
      
      if (!existingSuggestion || suggestion.confidence > existingSuggestion.confidence) {
        uniqueChapters.set(chapterCode, {
          code: chapterCode,
          description: suggestion.description.split(' - ')[0] || 'Chapter ' + chapterCode,
          confidence: suggestion.confidence
        });
      }
    });
    
    setSuggestedChapters(Array.from(uniqueChapters.values()));
    
    // Filter heading suggestions (4-digit codes) if a chapter is selected
    if (selection.chapter.code) {
      const filteredHeadings = new Map<string, {code: string, description: string, confidence: number}>();
      
      suggestedCodes
        .filter(suggestion => suggestion.code.startsWith(selection.chapter.code!))
        .forEach(suggestion => {
          const headingCode = suggestion.code.substring(0, 4);
          const existingSuggestion = filteredHeadings.get(headingCode);
          
          if (!existingSuggestion || suggestion.confidence > existingSuggestion.confidence) {
            filteredHeadings.set(headingCode, {
              code: headingCode,
              description: suggestion.description.split(' - ').slice(0, 2).join(' - ') || 'Heading ' + headingCode,
              confidence: suggestion.confidence
            });
          }
        });
      
      setSuggestedHeadings(Array.from(filteredHeadings.values()));
    } else {
      setSuggestedHeadings([]);
    }
    
    // Filter subheading suggestions (6-digit codes) if a heading is selected
    if (selection.heading.code) {
      const filteredSubheadings = suggestedCodes
        .filter(suggestion => 
          suggestion.code.startsWith(selection.heading.code!) && 
          suggestion.code.length >= 6
        )
        .map(suggestion => ({
          code: suggestion.code.substring(0, 6),
          description: suggestion.description,
          confidence: suggestion.confidence
        }));
      
      setSuggestedSubheadings(filteredSubheadings);
    } else {
      setSuggestedSubheadings([]);
    }
  }, [suggestedCodes, selection.chapter.code, selection.heading.code]);

  // Handle chapter selection
  const handleChapterSelected = (chapterCode: string, chapterDescription: string) => {
    setSelection(prev => ({
      chapter: { code: chapterCode, description: chapterDescription },
      heading: { code: null, description: '' },
      subheading: { code: null, description: '' }
    }));
    
    setView('heading');
  };

  // Handle heading selection
  const handleHeadingSelected = (headingCode: string, headingDescription: string) => {
    setSelection(prev => ({
      ...prev,
      heading: { code: headingCode, description: headingDescription },
      subheading: { code: null, description: '' }
    }));
    
    setView('subheading');
  };

  // Handle subheading selection
  const handleSubheadingSelected = (subheadingCode: string, subheadingDescription: string) => {
    setSelection(prev => ({
      ...prev,
      subheading: { code: subheadingCode, description: subheadingDescription }
    }));
    
    onHsCodeSelected(subheadingCode, subheadingDescription);
  };

  // Navigate back to chapter selection
  const handleBackToChapters = () => {
    setView('chapter');
  };

  // Navigate back to heading selection
  const handleBackToHeadings = () => {
    setView('heading');
  };

  // Render information about the product
  const renderProductInfo = () => {
    if (!productName && !productCategory) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle1" gutterBottom>
            Product Information
          </Typography>
          
          {productName && (
            <Typography variant="body1">
              <strong>Name:</strong> {productName}
            </Typography>
          )}
          
          {productCategory && (
            <Typography variant="body1">
              <strong>Category:</strong> {productCategory}
            </Typography>
          )}
          
          {suggestedCodes.length > 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {suggestedCodes.length} suggested classifications available
            </Alert>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      {renderProductInfo()}
      
      {/* Use exclusive conditional rendering so only one view is shown */}
      {view === 'chapter' ? (
        <ChapterSelector
          selectedChapter={selection.chapter.code}
          onChapterSelected={handleChapterSelected}
          suggestedChapters={suggestedChapters}
          productCategory={productCategory}
        />
      ) : view === 'heading' && selection.chapter.code ? (
        <HeadingSelector
          selectedHeading={selection.heading.code}
          selectedChapter={selection.chapter.code}
          chapterDescription={selection.chapter.description}
          onHeadingSelected={handleHeadingSelected}
          onBack={handleBackToChapters}
          suggestedHeadings={suggestedHeadings}
        />
      ) : view === 'subheading' && selection.chapter.code && selection.heading.code ? (
        <SubheadingSelector
          selectedSubheading={selection.subheading.code}
          selectedHeading={selection.heading.code}
          headingDescription={selection.heading.description}
          selectedChapter={selection.chapter.code}
          chapterDescription={selection.chapter.description}
          onSubheadingSelected={handleSubheadingSelected}
          onBackToHeadings={handleBackToHeadings}
          onBackToChapters={handleBackToChapters}
          suggestedSubheadings={suggestedSubheadings}
        />
      ) : null}
      
      {selection.chapter.code && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Current selection: 
            {selection.chapter.code && ` Chapter ${selection.chapter.code}`}
            {selection.heading.code && ` > Heading ${selection.heading.code}`}
            {selection.subheading.code && ` > Subheading ${selection.subheading.code}`}
          </Typography>
          
          {selection.subheading.code && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => onHsCodeSelected(selection.subheading.code!, selection.subheading.description)}
            >
              Confirm Selection
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default HSCodeNavigator; 