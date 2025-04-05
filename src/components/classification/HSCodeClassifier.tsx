import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  InputAdornment,
  FormHelperText,
  LinearProgress,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { HSCodeSelection, ClassificationStep, HSCodeChapter, HSCodeHeading, HSCodeSubheading } from './types/classification.interface';
import { HsCodeMCPService } from '../../mcp/global/hs-code-mcp';
import HSCodeInfoPopover from './HSCodeInfoPopover';

interface HSCodeClassifierProps {
  productName: string;
  initialSelection?: HSCodeSelection;
  classificationStep: ClassificationStep;
  onUpdateSelection: (selection: HSCodeSelection, step: ClassificationStep) => void;
}

const HSCodeClassifier: React.FC<HSCodeClassifierProps> = ({
  productName,
  initialSelection = { chapter: null, heading: null, subheading: null },
  classificationStep,
  onUpdateSelection
}) => {
  const [selection, setSelection] = useState<HSCodeSelection>(initialSelection);
  const [loading, setLoading] = useState<{chapters: boolean; headings: boolean; subheadings: boolean}>({
    chapters: false,
    headings: false,
    subheadings: false
  });
  const [chapters, setChapters] = useState<HSCodeChapter[]>([]);
  const [headings, setHeadings] = useState<HSCodeHeading[]>([]);
  const [subheadings, setSubheadings] = useState<HSCodeSubheading[]>([]);
  
  // Initialize service
  const hsCodeService = new HsCodeMCPService();

  // Load chapters on component mount
  useEffect(() => {
    const loadChapters = async () => {
      setLoading(prev => ({ ...prev, chapters: true }));
      try {
        const result = await hsCodeService.getChapters();
        if (result && result.length > 0) {
          setChapters(result.map((chapter: any) => ({
            code: chapter.code,
            description: chapter.description
          })));
        }
      } catch (error) {
        console.error('Error loading HS code chapters:', error);
        // Fallback to some common chapters
        setChapters([
          { code: '22', description: 'Beverages, spirits and vinegar' },
          { code: '09', description: 'Coffee, tea, maté and spices' },
          { code: '44', description: 'Wood and articles of wood; wood charcoal' },
          { code: '16', description: 'Preparations of meat, fish or crustaceans' },
          { code: '19', description: 'Preparations of cereals, flour, starch or milk' },
          { code: '20', description: 'Preparations of vegetables, fruit, nuts' }
        ]);
      } finally {
        setLoading(prev => ({ ...prev, chapters: false }));
      }
    };
    
    loadChapters();
  }, []);
  
  // Load headings when chapter is selected
  useEffect(() => {
    if (!selection.chapter) return;
    
    const loadHeadings = async () => {
      const chapterCode = selection.chapter?.code;
      if (!chapterCode) return;
      
      setLoading(prev => ({ ...prev, headings: true }));
      try {
        const result = await hsCodeService.getHeadings(chapterCode);
        if (result && result.length > 0) {
          setHeadings(result.map((heading: any) => ({
            code: heading.code,
            description: heading.description
          })));
        }
      } catch (error) {
        console.error(`Error loading headings for chapter ${chapterCode}:`, error);
        // Fallback to sample headings for common chapters
        if (chapterCode === '22') {
          setHeadings([
            { code: '2204', description: 'Wine of fresh grapes, including fortified wines' },
            { code: '2208', description: 'Spirits, liqueurs and other spirituous beverages' }
          ]);
        } else if (chapterCode === '09') {
          setHeadings([
            { code: '0902', description: 'Tea, whether or not flavoured' }
          ]);
        } else if (chapterCode === '44') {
          setHeadings([
            { code: '4419', description: 'Tableware and kitchenware, of wood' },
            { code: '4420', description: 'Wood marquetry and inlaid wood; ornaments of wood' }
          ]);
        } else {
          setHeadings([
            { code: `${chapterCode}01`, description: 'Sample heading 1' },
            { code: `${chapterCode}02`, description: 'Sample heading 2' }
          ]);
        }
      } finally {
        setLoading(prev => ({ ...prev, headings: false }));
      }
    };
    
    loadHeadings();
  }, [selection.chapter]);
  
  // Load subheadings when heading is selected
  useEffect(() => {
    if (!selection.heading) return;
    
    const loadSubheadings = async () => {
      const headingCode = selection.heading?.code;
      if (!headingCode) return;
      
      setLoading(prev => ({ ...prev, subheadings: true }));
      try {
        const result = await hsCodeService.getSubheadings(headingCode);
        if (result && result.length > 0) {
          setSubheadings(result.map((subheading: any) => ({
            code: subheading.code,
            description: subheading.description
          })));
        }
      } catch (error) {
        console.error(`Error loading subheadings for heading ${headingCode}:`, error);
        // Fallback to sample subheadings
        if (headingCode === '2204') {
          setSubheadings([
            { code: '220421', description: 'In containers holding 2 litres or less' },
            { code: '220422', description: 'In containers holding more than 2 litres but not more than 10 litres' }
          ]);
        } else if (headingCode === '0902') {
          setSubheadings([
            { code: '090230', description: 'Black tea (fermented) and partly fermented tea' },
            { code: '090240', description: 'Other black tea (fermented) and other partly fermented tea' }
          ]);
        } else {
          setSubheadings([
            { code: `${headingCode}10`, description: 'Sample subheading 1' },
            { code: `${headingCode}90`, description: 'Sample subheading 2' }
          ]);
        }
      } finally {
        setLoading(prev => ({ ...prev, subheadings: false }));
      }
    };
    
    loadSubheadings();
  }, [selection.heading]);
  
  // Handle chapter selection 
  const handleChapterChange = (event: SelectChangeEvent) => {
    const chapterCode = event.target.value;
    const selectedChapter = chapters.find(chapter => chapter.code === chapterCode) || null;
    
    const newSelection = { 
      chapter: selectedChapter, 
      heading: null, 
      subheading: null 
    };
    
    setSelection(newSelection);
    onUpdateSelection(newSelection, ClassificationStep.ChapterSelected);
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
    onUpdateSelection(newSelection, ClassificationStep.HeadingSelected);
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
    onUpdateSelection(newSelection, ClassificationStep.SubheadingSelected);
    
    // Complete the classification after subheading is selected
    setTimeout(() => {
      onUpdateSelection(newSelection, ClassificationStep.Complete);
    }, 500);
  };
  
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
          What is an HS Code? <HSCodeInfoPopover iconSize={16} />
        </Typography>
      </Box>
      
      {/* Progress Indicators */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ 
          height: 8, 
          width: 48, 
          borderRadius: 4, 
          bgcolor: classificationStep >= ClassificationStep.ChapterSelected ? 'primary.main' : 'grey.200' 
        }} />
        <Box sx={{ height: 1, width: 24, bgcolor: 'grey.200' }} />
        <Box sx={{ 
          height: 8, 
          width: 48, 
          borderRadius: 4, 
          bgcolor: classificationStep >= ClassificationStep.HeadingSelected ? 'primary.main' : 'grey.200' 
        }} />
        <Box sx={{ height: 1, width: 24, bgcolor: 'grey.200' }} />
        <Box sx={{ 
          height: 8, 
          width: 48, 
          borderRadius: 4, 
          bgcolor: classificationStep >= ClassificationStep.SubheadingSelected ? 'primary.main' : 'grey.200' 
        }} />
      </Box>
      
      {/* Chapter Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Step 1: Select Chapter (2-digit)
        </Typography>
        
        <FormControl fullWidth>
          <InputLabel id="chapter-select-label">Select a chapter...</InputLabel>
          <Select
            labelId="chapter-select-label"
            value={selection.chapter?.code || ''}
            onChange={handleChapterChange}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            }
            disabled={loading.chapters}
            label="Select a chapter..."
          >
            {chapters.map(chapter => (
              <MenuItem key={chapter.code} value={chapter.code}>
                {chapter.code} - {chapter.description}
              </MenuItem>
            ))}
          </Select>
          {loading.chapters && <LinearProgress sx={{ mt: 1 }} />}
        </FormControl>
      </Box>
      
      {/* Heading Selection - Only show when chapter is selected */}
      {classificationStep >= ClassificationStep.ChapterSelected && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 2: Select Heading (4-digit)
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel id="heading-select-label">Select a heading...</InputLabel>
            <Select
              labelId="heading-select-label"
              value={selection.heading?.code || ''}
              onChange={handleHeadingChange}
              disabled={loading.headings}
              label="Select a heading..."
            >
              {headings.map(heading => (
                <MenuItem key={heading.code} value={heading.code}>
                  {heading.code} - {heading.description}
                </MenuItem>
              ))}
            </Select>
            {loading.headings && <LinearProgress sx={{ mt: 1 }} />}
          </FormControl>
        </Box>
      )}
      
      {/* Subheading Selection - Only show when heading is selected */}
      {classificationStep >= ClassificationStep.HeadingSelected && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 3: Select Subheading (6-digit)
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel id="subheading-select-label">Select a subheading...</InputLabel>
            <Select
              labelId="subheading-select-label"
              value={selection.subheading?.code || ''}
              onChange={handleSubheadingChange}
              disabled={loading.subheadings}
              label="Select a subheading..."
            >
              {subheadings.map(subheading => (
                <MenuItem key={subheading.code} value={subheading.code}>
                  {subheading.code} - {subheading.description}
                </MenuItem>
              ))}
            </Select>
            {loading.subheadings && <LinearProgress sx={{ mt: 1 }} />}
          </FormControl>
        </Box>
      )}
      
      <FormHelperText sx={{ fontStyle: 'italic', mt: 1 }}>
        Not sure where to start? Just pick what feels closest — you can change it later.
      </FormHelperText>
    </Box>
  );
};

export default HSCodeClassifier;