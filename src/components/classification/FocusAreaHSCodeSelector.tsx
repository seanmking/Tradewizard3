import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Grid,
  SelectChangeEvent,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { FOCUS_AREAS } from './types/focus-areas';
import { HsCodeMCPService } from '../../mcp/global/hs-code-mcp';
import { HSCodeSelection, HSCodeChapter, HSCodeHeading, HSCodeSubheading, ClassificationStep } from './types/classification.interface';
import HSCodeInfoPopover from './HSCodeInfoPopover';

interface FocusAreaHSCodeSelectorProps {
  productName: string;
  initialSelection?: HSCodeSelection;
  onUpdateSelection: (selection: HSCodeSelection, step: ClassificationStep) => void;
}

const FocusAreaHSCodeSelector: React.FC<FocusAreaHSCodeSelectorProps> = ({
  productName,
  initialSelection = { chapter: null, heading: null, subheading: null },
  onUpdateSelection
}) => {
  // State for the focused area and steps
  const [focusArea, setFocusArea] = useState<string>('');
  const [selection, setSelection] = useState<HSCodeSelection>(initialSelection);
  const [classificationStep, setClassificationStep] = useState<ClassificationStep>(
    initialSelection.chapter ? 
      initialSelection.heading ? 
        initialSelection.subheading ? 
          ClassificationStep.Complete : ClassificationStep.SubheadingSelected 
        : ClassificationStep.ChapterSelected 
      : ClassificationStep.Unstarted
  );
  
  // Data loading states
  const [loading, setLoading] = useState<{chapters: boolean; headings: boolean; subheadings: boolean}>({
    chapters: false,
    headings: false,
    subheadings: false
  });
  
  // Data for the dropdowns
  const [availableChapters, setAvailableChapters] = useState<HSCodeChapter[]>([]);
  const [headings, setHeadings] = useState<HSCodeHeading[]>([]);
  const [subheadings, setSubheadings] = useState<HSCodeSubheading[]>([]);
  
  // Initialize service
  const hsCodeService = new HsCodeMCPService();

  // Handle focus area selection
  const handleFocusAreaChange = (event: SelectChangeEvent) => {
    const selectedFocusArea = event.target.value;
    setFocusArea(selectedFocusArea);
    
    // Reset selection
    setSelection({ chapter: null, heading: null, subheading: null });
    setHeadings([]);
    setSubheadings([]);
    
    // Update available chapters based on focus area
    if (selectedFocusArea) {
      const focusAreaObj = FOCUS_AREAS.find(area => area.id === selectedFocusArea);
      if (focusAreaObj) {
        loadChaptersForFocusArea(focusAreaObj.chapters);
      }
    }
    
    setClassificationStep(ClassificationStep.Unstarted);
  };
  
  // Load chapters for a specific focus area
  const loadChaptersForFocusArea = async (chapterCodes: string[]) => {
    setLoading(prev => ({ ...prev, chapters: true }));
    
    try {
      const allChapters = await hsCodeService.getChapters();
      
      // Filter chapters based on the focus area
      const filteredChapters = allChapters.filter(chapter => 
        chapterCodes.includes(chapter.code)
      );
      
      // Sort chapters by code
      const sortedChapters = filteredChapters.sort(
        (a, b) => parseInt(a.code) - parseInt(b.code)
      );
      
      setAvailableChapters(sortedChapters);
    } catch (error) {
      console.error('Error loading chapters for focus area:', error);
      // Fallback to displaying the chapter codes
      const fallbackChapters = chapterCodes.map(code => ({
        code,
        description: `Chapter ${code}`
      }));
      setAvailableChapters(fallbackChapters);
    } finally {
      setLoading(prev => ({ ...prev, chapters: false }));
    }
  };
  
  // Handle chapter selection
  const handleChapterChange = (event: SelectChangeEvent) => {
    const chapterCode = event.target.value;
    const selectedChapter = availableChapters.find(chapter => chapter.code === chapterCode) || null;
    
    const newSelection = { 
      chapter: selectedChapter, 
      heading: null, 
      subheading: null 
    };
    
    setSelection(newSelection);
    setClassificationStep(ClassificationStep.ChapterSelected);
    
    // Load headings for this chapter
    if (selectedChapter) {
      loadHeadingsForChapter(selectedChapter.code);
    }
  };
  
  // Load headings for a specific chapter
  const loadHeadingsForChapter = async (chapterCode: string) => {
    setLoading(prev => ({ ...prev, headings: true }));
    
    try {
      const result = await hsCodeService.getHeadings(chapterCode);
      if (result && result.length > 0) {
        setHeadings(result);
      }
    } catch (error) {
      console.error(`Error loading headings for chapter ${chapterCode}:`, error);
      // Fallback headings
      setHeadings([
        { code: `${chapterCode}01`, description: `Heading 01 for Chapter ${chapterCode}` },
        { code: `${chapterCode}02`, description: `Heading 02 for Chapter ${chapterCode}` },
      ]);
    } finally {
      setLoading(prev => ({ ...prev, headings: false }));
    }
  };
  
  // Handle heading selection
  const handleHeadingChange = (event: SelectChangeEvent) => {
    const headingCode = event.target.value;
    const selectedHeading = headings.find(heading => heading.code === headingCode) || null;
    
    const newSelection = { 
      ...selection, 
      heading: selectedHeading, 
      subheading: null 
    };
    
    setSelection(newSelection);
    setClassificationStep(ClassificationStep.HeadingSelected);
    
    // Load subheadings for this heading
    if (selectedHeading) {
      loadSubheadingsForHeading(selectedHeading.code);
    }
  };
  
  // Load subheadings for a specific heading
  const loadSubheadingsForHeading = async (headingCode: string) => {
    setLoading(prev => ({ ...prev, subheadings: true }));
    
    try {
      const result = await hsCodeService.getSubheadings(headingCode);
      if (result && result.length > 0) {
        setSubheadings(result);
      }
    } catch (error) {
      console.error(`Error loading subheadings for heading ${headingCode}:`, error);
      // Fallback subheadings
      setSubheadings([
        { code: `${headingCode}10`, description: `Subheading 10 for Heading ${headingCode}` },
        { code: `${headingCode}90`, description: `Subheading 90 for Heading ${headingCode}` },
      ]);
    } finally {
      setLoading(prev => ({ ...prev, subheadings: false }));
    }
  };
  
  // Handle subheading selection
  const handleSubheadingChange = (event: SelectChangeEvent) => {
    const subheadingCode = event.target.value;
    const selectedSubheading = subheadings.find(subheading => subheading.code === subheadingCode) || null;
    
    const newSelection = { 
      ...selection, 
      subheading: selectedSubheading 
    };
    
    setSelection(newSelection);
    setClassificationStep(ClassificationStep.SubheadingSelected);
    
    // Complete the classification and notify parent
    setTimeout(() => {
      setClassificationStep(ClassificationStep.Complete);
      onUpdateSelection(newSelection, ClassificationStep.Complete);
    }, 500);
  };
  
  // Format the code display
  const formatHSCodeDisplay = () => {
    const parts = [];
    if (selection.chapter) parts.push(selection.chapter.code);
    if (selection.heading) parts.push(selection.heading.code.slice(2));
    if (selection.subheading) parts.push(selection.subheading.code.slice(4));
    
    // Show dots between segments
    return parts.join('.');
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        HS Code Classification
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
          What is an HS Code? <HSCodeInfoPopover iconSize={16} />
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Start by selecting a product focus area below to narrow down the HS code options.
      </Alert>
      
      {/* Progress Indicators */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 3 }}>
        <Box sx={{ 
          height: 8, 
          width: 36, 
          borderRadius: 4, 
          bgcolor: focusArea ? 'primary.main' : 'grey.200',
          transition: 'background-color 0.3s'
        }} />
        <Box sx={{ height: 1, width: 16, bgcolor: 'grey.200' }} />
        <Box sx={{ 
          height: 8, 
          width: 36, 
          borderRadius: 4, 
          bgcolor: classificationStep >= ClassificationStep.ChapterSelected ? 'primary.main' : 'grey.200',
          transition: 'background-color 0.3s' 
        }} />
        <Box sx={{ height: 1, width: 16, bgcolor: 'grey.200' }} />
        <Box sx={{ 
          height: 8, 
          width: 36, 
          borderRadius: 4, 
          bgcolor: classificationStep >= ClassificationStep.HeadingSelected ? 'primary.main' : 'grey.200',
          transition: 'background-color 0.3s' 
        }} />
        <Box sx={{ height: 1, width: 16, bgcolor: 'grey.200' }} />
        <Box sx={{ 
          height: 8, 
          width: 36, 
          borderRadius: 4, 
          bgcolor: classificationStep >= ClassificationStep.SubheadingSelected ? 'primary.main' : 'grey.200',
          transition: 'background-color 0.3s' 
        }} />
      </Box>
      
      {/* Step 1: Focus Area Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Step 1: Select Product Focus Area
        </Typography>
        
        <FormControl fullWidth>
          <InputLabel id="focus-area-select-label">Product Focus Area</InputLabel>
          <Select
            labelId="focus-area-select-label"
            id="focus-area-select"
            value={focusArea}
            onChange={handleFocusAreaChange}
            label="Product Focus Area"
          >
            <MenuItem value="" disabled>Select a focus area</MenuItem>
            {FOCUS_AREAS.map(area => (
              <MenuItem key={area.id} value={area.id}>
                {area.name} {area.description && `(${area.description})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* Step 2: Chapter Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium" color={focusArea ? 'text.primary' : 'text.disabled'}>
          Step 2: Select Chapter (2-digit)
        </Typography>
        
        <FormControl fullWidth disabled={!focusArea || loading.chapters}>
          <InputLabel id="chapter-select-label">Chapter</InputLabel>
          <Select
            labelId="chapter-select-label"
            id="chapter-select"
            value={selection.chapter?.code || ''}
            onChange={handleChapterChange}
            label="Chapter"
          >
            <MenuItem value="" disabled>Select a chapter</MenuItem>
            {availableChapters.map(chapter => (
              <MenuItem key={chapter.code} value={chapter.code}>
                {chapter.code}: {chapter.description}
              </MenuItem>
            ))}
          </Select>
          {loading.chapters && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Loading chapters...
              </Typography>
            </Box>
          )}
        </FormControl>
      </Box>
      
      {/* Step 3: Heading Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium" color={selection.chapter ? 'text.primary' : 'text.disabled'}>
          Step 3: Select Heading (4-digit)
        </Typography>
        
        <FormControl fullWidth disabled={!selection.chapter || loading.headings}>
          <InputLabel id="heading-select-label">Heading</InputLabel>
          <Select
            labelId="heading-select-label"
            id="heading-select"
            value={selection.heading?.code || ''}
            onChange={handleHeadingChange}
            label="Heading"
          >
            <MenuItem value="" disabled>Select a heading</MenuItem>
            {headings.map(heading => (
              <MenuItem key={heading.code} value={heading.code}>
                {heading.code}: {heading.description}
              </MenuItem>
            ))}
          </Select>
          {loading.headings && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Loading headings...
              </Typography>
            </Box>
          )}
        </FormControl>
      </Box>
      
      {/* Step 4: Subheading Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium" color={selection.heading ? 'text.primary' : 'text.disabled'}>
          Step 4: Select Subheading (6-digit)
        </Typography>
        
        <FormControl fullWidth disabled={!selection.heading || loading.subheadings}>
          <InputLabel id="subheading-select-label">Subheading</InputLabel>
          <Select
            labelId="subheading-select-label"
            id="subheading-select"
            value={selection.subheading?.code || ''}
            onChange={handleSubheadingChange}
            label="Subheading"
          >
            <MenuItem value="" disabled>Select a subheading</MenuItem>
            {subheadings.map(subheading => (
              <MenuItem key={subheading.code} value={subheading.code}>
                {subheading.code}: {subheading.description}
              </MenuItem>
            ))}
          </Select>
          {loading.subheadings && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Loading subheadings...
              </Typography>
            </Box>
          )}
        </FormControl>
      </Box>
      
      {/* Current Selection Summary */}
      {(selection.chapter || selection.heading || selection.subheading) && (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Selection:
          </Typography>
          
          <Grid container spacing={1}>
            {selection.chapter && (
              <Grid sx={{ gridColumn: { xs: 12 } }}>
                <Typography variant="body2">
                  <strong>Chapter {selection.chapter.code}:</strong> {selection.chapter.description}
                </Typography>
              </Grid>
            )}
            
            {selection.heading && (
              <Grid sx={{ gridColumn: { xs: 12 } }}>
                <Typography variant="body2">
                  <strong>Heading {selection.heading.code}:</strong> {selection.heading.description}
                </Typography>
              </Grid>
            )}
            
            {selection.subheading && (
              <Grid sx={{ gridColumn: { xs: 12 } }}>
                <Typography variant="body2">
                  <strong>Subheading {selection.subheading.code}:</strong> {selection.subheading.description}
                </Typography>
              </Grid>
            )}
            
            {selection.chapter && (
              <Grid sx={{ gridColumn: { xs: 12 } }}>
                <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>
                  HS Code: {formatHSCodeDisplay()}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default FocusAreaHSCodeSelector; 