import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Paper,
  Stack,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  MobileStepper,
  Button,
  Divider,
  Collapse,
} from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Search as SearchIcon,
  Info as InfoIcon,
  AutoAwesome as AutoAwesomeIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { HSCodeNode, HSCodeSuggestion } from '../../data/hs-codes/types';
import { useHSCodeSelection } from '../../hooks/useHSCodeSelection';
import { useAIHSCodeSuggestion } from '../../hooks/useAIHSCodeSuggestion';

interface ProductDetails {
  name: string;
  description?: string;
  category?: string;
}

interface HSCodeSelectorProps {
  productDetails?: ProductDetails;
  initialValue?: string;
  onChange?: (code: string) => void;
  showConfidence?: boolean;
  variant?: 'standard' | 'compact';
}

/**
 * Chapter selection component
 */
const ChapterSelect: React.FC<{
  value: string | null;
  onChange: (chapterId: string) => void;
  options: HSCodeNode[];
  highlightedOption?: string;
  isMobile?: boolean;
}> = ({ value, onChange, options, highlightedOption, isMobile = false }) => {
  const theme = useTheme();
  
  return isMobile ? (
    // Card-based grid layout for mobile
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Select a HS Chapter (2-digit)
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {options.map((chapter) => (
          <Box key={chapter.id} sx={{ width: 'calc(50% - 8px)' }}>
            <Card 
              elevation={1}
              sx={{
                cursor: 'pointer',
                bgcolor: value === chapter.id ? 'primary.light' : 'background.paper',
                color: value === chapter.id ? 'primary.contrastText' : 'text.primary',
                border: value === chapter.id ? 
                  `2px solid ${theme.palette.primary.main}` : 
                  highlightedOption === chapter.id ? 
                    `2px solid ${theme.palette.info.main}` : 
                    'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: 1.5,
                '&:hover': {
                  bgcolor: value === chapter.id ? 'primary.light' : 'action.hover',
                },
              }}
              onClick={() => onChange(chapter.id)}
            >
              <Typography variant="body2" fontWeight="medium">
                {chapter.id}: {chapter.name}
              </Typography>
              
              {chapter.examples && chapter.examples.length > 0 && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  e.g., {chapter.examples.slice(0, 2).join(', ')}
                </Typography>
              )}
              
              {highlightedOption === chapter.id && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <AutoAwesomeIcon sx={{ fontSize: 14, color: 'info.main', mr: 0.5 }} />
                  <Typography variant="caption" color="info.main">
                    Suggested
                  </Typography>
                </Box>
              )}
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  ) : (
    // Dropdown select for desktop
    <FormControl fullWidth>
      <InputLabel>HS Chapter (2-digit)</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        label="HS Chapter (2-digit)"
      >
        <MenuItem value="">
          <em>Select a chapter</em>
        </MenuItem>
        
        {options.map((chapter) => (
          <MenuItem 
            key={chapter.id} 
            value={chapter.id}
            sx={{
              ...(highlightedOption === chapter.id && {
                bgcolor: 'info.light',
                '&:hover': {
                  bgcolor: 'info.light',
                }
              })
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography>
                {chapter.id}: {chapter.name}
              </Typography>
              
              {highlightedOption === chapter.id && (
                <Chip 
                  size="small" 
                  label="Suggested" 
                  color="info" 
                  icon={<AutoAwesomeIcon />} 
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>
        Select the 2-digit HS chapter that best matches your product category
      </FormHelperText>
    </FormControl>
  );
};

/**
 * Heading selection component
 */
const HeadingSelect: React.FC<{
  value: string | null;
  onChange: (headingId: string) => void;
  options: HSCodeNode[];
  highlightedOption?: string;
  isMobile?: boolean;
}> = ({ value, onChange, options, highlightedOption, isMobile = false }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  if (options.length === 0) {
    return null;
  }
  
  return isMobile ? (
    // List-based layout for mobile
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Select a HS Heading (4-digit)
      </Typography>
      
      <Stack spacing={1}>
        {options.map((heading) => (
          <Paper
            key={heading.id}
            elevation={1}
            sx={{
              cursor: 'pointer',
              bgcolor: value === heading.id ? 'primary.light' : 'background.paper',
              color: value === heading.id ? 'primary.contrastText' : 'text.primary',
              border: value === heading.id ? 
                '2px solid #3f51b5' : 
                highlightedOption === heading.id ? 
                  '2px solid #2196f3' : 
                  'none',
              p: 1.5,
              '&:hover': {
                bgcolor: value === heading.id ? 'primary.light' : 'action.hover',
              },
            }}
            onClick={() => onChange(heading.id)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="body2" fontWeight="medium">
                {heading.id}: {heading.name}
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(prev => ({
                    ...prev,
                    [heading.id]: !prev[heading.id]
                  }));
                }}
              >
                <ExpandMoreIcon fontSize="small" 
                  sx={{
                    transform: expanded[heading.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </IconButton>
            </Box>
            
            <Collapse in={expanded[heading.id]}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {heading.description}
              </Typography>
              
              {heading.examples && heading.examples.length > 0 && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  <strong>Examples:</strong> {heading.examples.join(', ')}
                </Typography>
              )}
            </Collapse>
            
            {highlightedOption === heading.id && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <AutoAwesomeIcon sx={{ fontSize: 14, color: 'info.main', mr: 0.5 }} />
                <Typography variant="caption" color="info.main">
                  Suggested
                </Typography>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  ) : (
    // Dropdown select for desktop
    <FormControl fullWidth>
      <InputLabel>HS Heading (4-digit)</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        label="HS Heading (4-digit)"
      >
        <MenuItem value="">
          <em>Select a heading</em>
        </MenuItem>
        
        {options.map((heading) => (
          <MenuItem 
            key={heading.id} 
            value={heading.id}
            sx={{
              ...(highlightedOption === heading.id && {
                bgcolor: 'info.light',
                '&:hover': {
                  bgcolor: 'info.light',
                }
              })
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography>
                  {heading.id}: {heading.name}
                </Typography>
                {heading.examples && heading.examples.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    e.g., {heading.examples.join(', ')}
                  </Typography>
                )}
              </Box>
              
              {highlightedOption === heading.id && (
                <Chip 
                  size="small" 
                  label="Suggested" 
                  color="info" 
                  icon={<AutoAwesomeIcon />} 
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>
        Select the 4-digit HS heading that best matches your product type
      </FormHelperText>
    </FormControl>
  );
};

/**
 * Subheading selection component
 */
const SubheadingSelect: React.FC<{
  value: string | null;
  onChange: (subheadingId: string) => void;
  options: HSCodeNode[];
  highlightedOption?: string;
  isMobile?: boolean;
}> = ({ value, onChange, options, highlightedOption, isMobile = false }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  if (options.length === 0) {
    return null;
  }
  
  return isMobile ? (
    // List-based layout for mobile
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Select a HS Subheading (6-digit)
      </Typography>
      
      <Stack spacing={1}>
        {options.map((subheading) => (
          <Paper
            key={subheading.id}
            elevation={1}
            sx={{
              cursor: 'pointer',
              bgcolor: value === subheading.id ? 'primary.light' : 'background.paper',
              color: value === subheading.id ? 'primary.contrastText' : 'text.primary',
              border: value === subheading.id ? 
                '2px solid #3f51b5' : 
                highlightedOption === subheading.id ? 
                  '2px solid #2196f3' : 
                  'none',
              p: 1.5,
              '&:hover': {
                bgcolor: value === subheading.id ? 'primary.light' : 'action.hover',
              },
            }}
            onClick={() => onChange(subheading.id)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="body2" fontWeight="medium">
                {subheading.id}: {subheading.name}
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(prev => ({
                    ...prev,
                    [subheading.id]: !prev[subheading.id]
                  }));
                }}
              >
                <ExpandMoreIcon fontSize="small" 
                  sx={{
                    transform: expanded[subheading.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </IconButton>
            </Box>
            
            <Collapse in={expanded[subheading.id]}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subheading.description}
              </Typography>
              
              {subheading.examples && subheading.examples.length > 0 && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  <strong>Examples:</strong> {subheading.examples.join(', ')}
                </Typography>
              )}
            </Collapse>
            
            {highlightedOption === subheading.id && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <AutoAwesomeIcon sx={{ fontSize: 14, color: 'info.main', mr: 0.5 }} />
                <Typography variant="caption" color="info.main">
                  Suggested
                </Typography>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  ) : (
    // Dropdown select for desktop
    <FormControl fullWidth>
      <InputLabel>HS Subheading (6-digit)</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        label="HS Subheading (6-digit)"
      >
        <MenuItem value="">
          <em>Select a subheading</em>
        </MenuItem>
        
        {options.map((subheading) => (
          <MenuItem 
            key={subheading.id} 
            value={subheading.id}
            sx={{
              ...(highlightedOption === subheading.id && {
                bgcolor: 'info.light',
                '&:hover': {
                  bgcolor: 'info.light',
                }
              })
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography>
                  {subheading.id}: {subheading.name}
                </Typography>
                
                {highlightedOption === subheading.id && (
                  <Chip 
                    size="small" 
                    label="Suggested" 
                    color="info" 
                    icon={<AutoAwesomeIcon />} 
                    sx={{ ml: 'auto' }}
                  />
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {subheading.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>
        Select the 6-digit HS subheading that best matches your specific product
      </FormHelperText>
    </FormControl>
  );
};

/**
 * Confidence indicator component
 */
const ConfidenceIndicator: React.FC<{
  hsCode: string;
  aiSuggestions: HSCodeSuggestion[];
  userSelected: boolean;
}> = ({ hsCode, aiSuggestions, userSelected }) => {
  // Find if the current code matches an AI suggestion
  const matchingSuggestion = aiSuggestions.find(s => s.code === hsCode);
  
  // Different display for user-selected vs AI-suggested
  if (userSelected && !matchingSuggestion) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          Manual selection
        </Typography>
      </Box>
    );
  }
  
  if (matchingSuggestion) {
    const confidence = matchingSuggestion.confidence;
    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <AutoAwesomeIcon 
            sx={{ 
              mr: 1, 
              color: confidence > 0.8 ? 'success.main' : 
                   confidence > 0.5 ? 'info.main' : 'warning.main' 
            }} 
          />
          <Typography 
            variant="body2" 
            color={confidence > 0.8 ? 'success.main' : 
                 confidence > 0.5 ? 'info.main' : 'warning.main'}
          >
            AI Confidence: {(confidence * 100).toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={confidence * 100}
          color={confidence > 0.8 ? 'success' : 
               confidence > 0.5 ? 'info' : 'warning'}
          sx={{ height: 4, borderRadius: 2 }}
        />
      </Box>
    );
  }
  
  return null;
};

/**
 * Main HS Code Selector component
 */
export const HSCodeSelector: React.FC<HSCodeSelectorProps> = ({
  productDetails = { name: '' },
  initialValue,
  onChange,
  showConfidence = true,
  variant = 'standard',
}) => {
  // Detect device type
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Mobile stepper state
  const [activeStep, setActiveStep] = useState(0);
  
  // Get AI suggestions for this product
  const { suggestions, isLoading: suggestionsLoading, error } = useAIHSCodeSuggestion(productDetails);
  
  // Core HS code selection logic
  const selection = useHSCodeSelection(initialValue);
  
  // Apply suggestions if confidence is high enough and no manual selection yet
  useEffect(() => {
    if (suggestions.length > 0 && !selection.hasUserInteracted) {
      const topSuggestion = suggestions[0];
      
      // Only auto-select if confidence is high
      if (topSuggestion.confidence > 0.8) {
        // Auto-select the entire path
        selection.selectFromPath(topSuggestion.path);
      } else if (topSuggestion.confidence > 0.6) {
        // Only suggest the chapter and heading with medium confidence
        selection.selectChapter(topSuggestion.path[0]);
        selection.selectHeading(topSuggestion.path[1]);
      } else if (topSuggestion.confidence > 0.4) {
        // Just suggest the chapter with lower confidence
        selection.selectChapter(topSuggestion.path[0]);
      }
    }
  }, [suggestions, selection]);
  
  // Notify parent when selection changes
  useEffect(() => {
    if (onChange && selection.isComplete) {
      onChange(selection.fullCode);
    }
  }, [selection.isComplete, selection.fullCode, onChange]);
  
  // Handle mobile stepper navigation
  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, 2));
  };
  
  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };
  
  // Determine if can proceed to next step
  const canProceed = (step: number): boolean => {
    switch (step) {
      case 0: return !!selection.selectedChapter;
      case 1: return !!selection.selectedHeading;
      case 2: return !!selection.selectedSubheading;
      default: return false;
    }
  };
  
  // Get highlighted options from suggestions
  const highlightedChapter = suggestions.length > 0 ? suggestions[0].path[0] : undefined;
  const highlightedHeading = suggestions.length > 0 ? suggestions[0].path[1] : undefined;
  const highlightedSubheading = suggestions.length > 0 ? suggestions[0].path[2] : undefined;
  
  // Compact variant has simpler layout
  if (variant === 'compact') {
    return (
      <Box>
        {suggestionsLoading && <LinearProgress sx={{ mb: 2 }} />}
        
        <Stack spacing={2}>
          {selection.selectedChapter ? (
            <Chip 
              label={`Chapter: ${selection.selectedChapter}`} 
              onDelete={() => selection.resetSelection()} 
              color="primary"
            />
          ) : (
            <ChapterSelect 
              value={selection.selectedChapter} 
              onChange={selection.selectChapter}
              options={selection.availableChapters}
              highlightedOption={highlightedChapter}
              isMobile={false}
            />
          )}
          
          {selection.selectedChapter && (
            selection.selectedHeading ? (
              <Chip 
                label={`Heading: ${selection.selectedHeading}`} 
                onDelete={() => selection.resetToChapter()} 
                color="primary"
              />
            ) : (
              <HeadingSelect 
                value={selection.selectedHeading} 
                onChange={selection.selectHeading}
                options={selection.availableHeadings}
                highlightedOption={highlightedHeading}
                isMobile={false}
              />
            )
          )}
          
          {selection.selectedHeading && (
            <SubheadingSelect 
              value={selection.selectedSubheading} 
              onChange={selection.selectSubheading}
              options={selection.availableSubheadings}
              highlightedOption={highlightedSubheading}
              isMobile={false}
            />
          )}
          
          {selection.isComplete && showConfidence && (
            <ConfidenceIndicator 
              hsCode={selection.fullCode}
              aiSuggestions={suggestions}
              userSelected={selection.hasUserInteracted}
            />
          )}
        </Stack>
      </Box>
    );
  }
  
  // Mobile-optimized layout
  if (isMobile) {
    return (
      <Box sx={{ width: '100%' }}>
        {suggestionsLoading && <LinearProgress />}
        
        {/* AI Suggestion alert */}
        {suggestions.length > 0 && (
          <Alert 
            severity={suggestions[0].confidence > 0.8 ? "success" : "info"}
            sx={{ mb: 2 }}
          >
            <AlertTitle>AI Suggestion</AlertTitle>
            Based on your product details, we suggest:
            <Typography variant="body1" fontWeight="medium">
              {suggestions[0].code} - {suggestions[0].description}
            </Typography>
            <Typography variant="caption">
              Confidence: {(suggestions[0].confidence * 100).toFixed(0)}%
            </Typography>
          </Alert>
        )}
        
        {/* Mobile stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Chapter</StepLabel>
          </Step>
          <Step>
            <StepLabel>Heading</StepLabel>
          </Step>
          <Step>
            <StepLabel>Subheading</StepLabel>
          </Step>
        </Stepper>
        
        {/* Step content */}
        <Box sx={{ mt: 2, mb: 4, minHeight: 200 }}>
          {activeStep === 0 && (
            <ChapterSelect 
              value={selection.selectedChapter} 
              onChange={selection.selectChapter}
              options={selection.availableChapters}
              highlightedOption={highlightedChapter}
              isMobile={true}
            />
          )}
          
          {activeStep === 1 && (
            <HeadingSelect 
              value={selection.selectedHeading} 
              onChange={selection.selectHeading}
              options={selection.availableHeadings}
              highlightedOption={highlightedHeading}
              isMobile={true}
            />
          )}
          
          {activeStep === 2 && (
            <SubheadingSelect 
              value={selection.selectedSubheading} 
              onChange={selection.selectSubheading}
              options={selection.availableSubheadings}
              highlightedOption={highlightedSubheading}
              isMobile={true}
            />
          )}
        </Box>
        
        {/* Navigation buttons */}
        <MobileStepper
          variant="text"
          steps={3}
          position="static"
          activeStep={activeStep}
          nextButton={
            <Button 
              size="small" 
              onClick={handleNext}
              disabled={activeStep === 2 || !canProceed(activeStep)}
            >
              Next
              <KeyboardArrowRight />
            </Button>
          }
          backButton={
            <Button 
              size="small" 
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              <KeyboardArrowLeft />
              Back
            </Button>
          }
        />
        
        {/* Show final selection */}
        {selection.isComplete && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <AlertTitle>Complete HS Code</AlertTitle>
            <Chip label={selection.fullCode} color="success" />
            
            {showConfidence && (
              <Box sx={{ mt: 1 }}>
                <ConfidenceIndicator 
                  hsCode={selection.fullCode}
                  aiSuggestions={suggestions}
                  userSelected={selection.hasUserInteracted}
                />
              </Box>
            )}
          </Alert>
        )}
      </Box>
    );
  }
  
  // Desktop layout
  return (
    <Box>
      {suggestionsLoading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* AI Suggestion alert */}
      {suggestions.length > 0 && (
        <Alert 
          severity={suggestions[0].confidence > 0.8 ? "success" : "info"}
          sx={{ mb: 2 }}
        >
          <AlertTitle>AI Suggestion</AlertTitle>
          Based on your product details, we suggest:
          <Typography variant="body1" fontWeight="medium">
            {suggestions[0].code} - {suggestions[0].description}
          </Typography>
          <Typography variant="caption">
            Confidence: {(suggestions[0].confidence * 100).toFixed(0)}%
          </Typography>
        </Alert>
      )}
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      
      <Stack spacing={3}>
        <ChapterSelect 
          value={selection.selectedChapter} 
          onChange={selection.selectChapter}
          options={selection.availableChapters}
          highlightedOption={highlightedChapter}
        />
        
        {selection.selectedChapter && (
          <>
            <Divider />
            <HeadingSelect 
              value={selection.selectedHeading} 
              onChange={selection.selectHeading}
              options={selection.availableHeadings}
              highlightedOption={highlightedHeading}
            />
          </>
        )}
        
        {selection.selectedHeading && (
          <>
            <Divider />
            <SubheadingSelect 
              value={selection.selectedSubheading} 
              onChange={selection.selectSubheading}
              options={selection.availableSubheadings}
              highlightedOption={highlightedSubheading}
            />
          </>
        )}
        
        {selection.isComplete && showConfidence && (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected HS Code: <Chip label={selection.fullCode} color="primary" />
            </Typography>
            
            <ConfidenceIndicator 
              hsCode={selection.fullCode}
              aiSuggestions={suggestions}
              userSelected={selection.hasUserInteracted}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
}; 