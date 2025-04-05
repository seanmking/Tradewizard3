import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment,
  Paper,
  Chip,
  LinearProgress,
  Breadcrumbs,
  Link,
  Button
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface SubheadingSelectorProps {
  selectedSubheading: string | null;
  selectedHeading: string;
  headingDescription: string;
  selectedChapter: string;
  chapterDescription: string;
  onSubheadingSelected: (subheading: string, description: string) => void;
  onBackToHeadings: () => void;
  onBackToChapters: () => void;
  suggestedSubheadings?: {
    code: string;
    description: string;
    confidence?: number;
  }[];
}

interface Subheading {
  code: string;
  description: string;
  confidence?: number;
  notes?: string;
}

const SubheadingSelector: React.FC<SubheadingSelectorProps> = ({
  selectedSubheading,
  selectedHeading,
  headingDescription,
  selectedChapter,
  chapterDescription,
  onSubheadingSelected,
  onBackToHeadings,
  onBackToChapters,
  suggestedSubheadings = []
}) => {
  const [subheadings, setSubheadings] = useState<Subheading[]>([]);
  const [filteredSubheadings, setFilteredSubheadings] = useState<Subheading[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubheadingDetails, setSelectedSubheadingDetails] = useState<Subheading | null>(null);

  // Helper function to get confidence color
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'gray';
    if (confidence >= 0.9) return 'success.main';
    if (confidence >= 0.75) return 'success.light';
    if (confidence >= 0.6) return 'warning.light';
    if (confidence >= 0.4) return 'warning.main';
    return 'error.main';
  };

  // Helper function to get confidence indicator
  const getConfidenceIndicator = (confidence?: number) => {
    if (!confidence) return '';
    if (confidence >= 0.9) return '★★★★★';
    if (confidence >= 0.75) return '★★★★☆';
    if (confidence >= 0.6) return '★★★☆☆';
    if (confidence >= 0.4) return '★★☆☆☆';
    return '★☆☆☆☆';
  };

  // Load subheadings
  useEffect(() => {
    const loadSubheadings = async () => {
      setLoading(true);
      try {
        // Here we would normally fetch from an API
        // For now, we're creating some static subheadings based on the heading
        
        // Define dummy subheadings for each heading
        const dummySubheadings: Record<string, Subheading[]> = {
          // Meat of bovine animals, fresh or chilled
          '0201': [
            { code: '020110', description: 'Carcasses and half-carcasses', notes: 'Includes whole animals, skinned and eviscerated after slaughter, and halves obtained by splitting the whole carcass through the spinal column.' },
            { code: '020120', description: 'Other cuts with bone in', notes: 'Includes T-bone steaks, osso buco, and other meat portions where bone is present.' },
            { code: '020130', description: 'Boneless', notes: 'Includes filet, sirloin, ribeye, and other premium cuts where all bones have been removed.' }
          ],
          // Wine of fresh grapes
          '2204': [
            { code: '220410', description: 'Sparkling wine', notes: 'Includes champagne and other wines with carbon dioxide formed during fermentation.' },
            { code: '220421', description: 'Other wine; grape must in containers of 2 l or less', notes: 'Includes bottled wines for retail in sizes up to 2 liters.' },
            { code: '220422', description: 'Other wine; grape must in containers of 2-10 l', notes: 'Includes wine sold in larger containers such as bag-in-box.' },
            { code: '220429', description: 'Other wine; grape must in containers > 10 l', notes: 'Includes bulk wine shipments.' },
            { code: '220430', description: 'Other grape must', notes: 'Includes partially fermented grape must.' }
          ],
          // T-shirts, singlets and other vests, knitted or crocheted
          '6109': [
            { code: '610910', description: 'Of cotton', notes: 'Includes cotton t-shirts and tank tops.' },
            { code: '610990', description: 'Of other textile materials', notes: 'Includes t-shirts made of synthetic fibers, wool, silk or other textile materials.' }
          ],
          // Default - if no specific heading data is available
          'default': [
            { code: `${selectedHeading}10`, description: 'Default Subheading 1' },
            { code: `${selectedHeading}20`, description: 'Default Subheading 2' },
            { code: `${selectedHeading}30`, description: 'Default Subheading 3' },
            { code: `${selectedHeading}40`, description: 'Default Subheading 4' },
            { code: `${selectedHeading}90`, description: 'Other' }
          ]
        };
        
        // Get subheadings for the selected heading or use default ones
        const headingSubheadings = dummySubheadings[selectedHeading] || dummySubheadings.default;
        
        // Update subheadings that have suggestions with confidence scores
        const allSubheadings = [...headingSubheadings];
        
        suggestedSubheadings.forEach(suggestion => {
          const existingIndex = allSubheadings.findIndex(s => s.code === suggestion.code);
          if (existingIndex >= 0) {
            allSubheadings[existingIndex] = {
              ...allSubheadings[existingIndex],
              confidence: suggestion.confidence
            };
          } else {
            allSubheadings.push({
              code: suggestion.code,
              description: suggestion.description,
              confidence: suggestion.confidence
            });
          }
        });
        
        // Sort subheadings by confidence
        const sortedSubheadings = allSubheadings.sort((a, b) => {
          if (a.confidence && b.confidence) {
            return b.confidence - a.confidence;
          }
          if (a.confidence) return -1;
          if (b.confidence) return 1;
          return a.code.localeCompare(b.code);
        });
        
        setSubheadings(sortedSubheadings);
        setFilteredSubheadings(sortedSubheadings);
        
        // Load recently used
        const recentlyUsedFromStorage = localStorage.getItem(`recentlyUsedSubheadings_${selectedHeading}`);
        if (recentlyUsedFromStorage) {
          setRecentlyUsed(JSON.parse(recentlyUsedFromStorage));
        }
        
        // Set details for the selected subheading if any
        if (selectedSubheading) {
          const details = sortedSubheadings.find(s => s.code === selectedSubheading) || null;
          setSelectedSubheadingDetails(details);
        }
      } catch (error) {
        console.error('Error loading subheadings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSubheadings();
  }, [selectedHeading, selectedSubheading, suggestedSubheadings]);

  // Filter subheadings based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredSubheadings(subheadings);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = subheadings.filter(
      subheading => 
        subheading.code.includes(query) || 
        subheading.description.toLowerCase().includes(query)
    );
    
    setFilteredSubheadings(filtered);
  }, [searchQuery, subheadings]);

  // Handle subheading selection
  const handleSubheadingClick = (subheading: Subheading) => {
    onSubheadingSelected(subheading.code, subheading.description);
    setSelectedSubheadingDetails(subheading);
    
    // Update recently used
    const updatedRecentlyUsed = [
      subheading.code,
      ...recentlyUsed.filter(code => code !== subheading.code)
    ].slice(0, 5); // Keep only the 5 most recent
    
    setRecentlyUsed(updatedRecentlyUsed);
    localStorage.setItem(`recentlyUsedSubheadings_${selectedHeading}`, JSON.stringify(updatedRecentlyUsed));
  };

  return (
    <Box>
      {/* Breadcrumb navigation */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link 
            component="button"
            onClick={onBackToChapters}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Typography variant="body2">
              Chapters
            </Typography>
          </Link>
          <Link
            component="button"
            onClick={onBackToHeadings}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Typography variant="body2">
              {selectedChapter} - {chapterDescription}
            </Typography>
          </Link>
          <Typography color="text.primary" variant="body2">
            {selectedHeading} - {headingDescription}
          </Typography>
        </Breadcrumbs>
        
        <Button 
          size="small" 
          startIcon={<ArrowBackIcon />} 
          onClick={onBackToHeadings}
        >
          Back to Headings
        </Button>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        Select Subheading (6-digit)
      </Typography>
      
      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by code or description..."
        variant="outlined"
        margin="normal"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      {loading ? (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
        </Box>
      ) : (
        <>
          {/* Subheadings grid */}
          <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Grid container spacing={2}>
              {filteredSubheadings.map((subheading) => (
                <Grid 
                  key={subheading.code}
                  sx={{
                    gridColumn: {
                      xs: 'span 12',
                      sm: 'span 6', 
                      md: 'span 4'
                    }
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      bgcolor: selectedSubheading === subheading.code ? 'primary.50' : 'background.paper',
                      border: '1px solid',
                      borderColor: selectedSubheading === subheading.code ? 'primary.main' : 'divider',
                      '&:hover': {
                        bgcolor: 'primary.50',
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      },
                    }}
                    onClick={() => handleSubheadingClick(subheading)}
                    elevation={0}
                  >
                    <Typography variant="h6" component="div" fontWeight="medium">
                      {subheading.code}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {subheading.description}
                    </Typography>
                    
                    {subheading.confidence && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={getConfidenceIndicator(subheading.confidence)}
                          size="small"
                          sx={{
                            color: getConfidenceColor(subheading.confidence),
                            bgcolor: 'background.paper',
                            borderColor: getConfidenceColor(subheading.confidence),
                            fontWeight: 'bold'
                          }}
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Recently used */}
          {recentlyUsed.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Recently Used:
              </Typography>
              
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {recentlyUsed.map(code => {
                  const subheading = subheadings.find(s => s.code === code);
                  return (
                    <Chip 
                      key={code}
                      label={`${code} ${subheading ? `(${subheading.description.slice(0, 15)}...)` : ''}`}
                      onClick={() => subheading && handleSubheadingClick(subheading)}
                      color={selectedSubheading === code ? 'primary' : 'default'}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
          
          {/* Selected subheading details */}
          {selectedSubheadingDetails && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Selected Classification: {selectedSubheadingDetails.code}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {selectedSubheadingDetails.description}
              </Typography>
              
              {selectedSubheadingDetails.notes && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Classification Notes:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedSubheadingDetails.notes}
                  </Typography>
                </>
              )}
              
              {selectedSubheadingDetails.confidence !== undefined && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Match Confidence:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {(selectedSubheadingDetails.confidence * 100).toFixed(0)}%
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={getConfidenceColor(selectedSubheadingDetails.confidence)}
                    >
                      {getConfidenceIndicator(selectedSubheadingDetails.confidence)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SubheadingSelector; 