import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid as MuiGrid, 
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
import SearchIcon from '@mui/icons-material/Search';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Create wrapper components for proper Grid usage
const Grid = MuiGrid;

interface HeadingSelectorProps {
  selectedHeading: string | null;
  selectedChapter: string;
  chapterDescription: string;
  onHeadingSelected: (heading: string, description: string) => void;
  onBack: () => void;
  suggestedHeadings?: {
    code: string;
    description: string;
    confidence?: number;
  }[];
}

interface Heading {
  code: string;
  description: string;
  confidence?: number;
}

const HeadingSelector: React.FC<HeadingSelectorProps> = ({
  selectedHeading,
  selectedChapter,
  chapterDescription,
  onHeadingSelected,
  onBack,
  suggestedHeadings = []
}) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [filteredHeadings, setFilteredHeadings] = useState<Heading[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Load headings
  useEffect(() => {
    const loadHeadings = async () => {
      setLoading(true);
      try {
        // Here we would normally fetch from an API
        // For now, we're creating some static headings based on the chapter
        
        // Define dummy headings for each chapter
        const dummyHeadings: Record<string, Heading[]> = {
          // Food Products
          '01': [
            { code: '0101', description: 'Live horses, asses, mules and hinnies' },
            { code: '0102', description: 'Live bovine animals' },
            { code: '0103', description: 'Live swine' },
            { code: '0104', description: 'Live sheep and goats' },
            { code: '0105', description: 'Live poultry' },
            { code: '0106', description: 'Other live animals' }
          ],
          '02': [
            { code: '0201', description: 'Meat of bovine animals, fresh or chilled' },
            { code: '0202', description: 'Meat of bovine animals, frozen' },
            { code: '0203', description: 'Meat of swine, fresh, chilled or frozen' },
            { code: '0204', description: 'Meat of sheep or goats, fresh, chilled or frozen' },
            { code: '0205', description: 'Meat of horses, asses, mules or hinnies' },
            { code: '0206', description: 'Edible offal of bovine animals, swine, sheep, goats, horses' },
            { code: '0207', description: 'Meat and edible offal of poultry' },
            { code: '0208', description: 'Other meat and edible meat offal, fresh, chilled or frozen' },
            { code: '0209', description: 'Pig fat and poultry fat' },
            { code: '0210', description: 'Meat and edible meat offal, salted, in brine, dried or smoked' }
          ],
          '03': [
            { code: '0301', description: 'Live fish' },
            { code: '0302', description: 'Fish, fresh or chilled' },
            { code: '0303', description: 'Fish, frozen' },
            { code: '0304', description: 'Fish fillets and other fish meat' },
            { code: '0305', description: 'Fish, dried, salted or in brine; smoked fish' },
            { code: '0306', description: 'Crustaceans' },
            { code: '0307', description: 'Molluscs' },
            { code: '0308', description: 'Aquatic invertebrates other than crustaceans and molluscs' }
          ],
          // Beverages
          '22': [
            { code: '2201', description: 'Waters, natural or artificial mineral waters' },
            { code: '2202', description: 'Waters, including mineral waters and aerated waters, containing added sugar' },
            { code: '2203', description: 'Beer made from malt' },
            { code: '2204', description: 'Wine of fresh grapes, including fortified wines' },
            { code: '2205', description: 'Vermouth and other wine of fresh grapes flavored with plants or aromatic substances' },
            { code: '2206', description: 'Other fermented beverages' },
            { code: '2207', description: 'Undenatured ethyl alcohol of an alcoholic strength by volume of 80% vol or higher' },
            { code: '2208', description: 'Undenatured ethyl alcohol of an alcoholic strength by volume of less than 80% vol' },
            { code: '2209', description: 'Vinegar and substitutes for vinegar obtained from acetic acid' }
          ],
          // Ready-to-Wear
          '61': [
            { code: '6101', description: 'Men\'s or boys\' overcoats, car-coats, capes, cloaks, anoraks, wind-cheaters' },
            { code: '6102', description: 'Women\'s or girls\' overcoats, car-coats, capes, cloaks, anoraks, wind-cheaters' },
            { code: '6103', description: 'Men\'s or boys\' suits, ensembles, jackets, blazers, trousers, bib and brace overalls' },
            { code: '6104', description: 'Women\'s or girls\' suits, ensembles, jackets, blazers, dresses, skirts' },
            { code: '6105', description: 'Men\'s or boys\' shirts, knitted or crocheted' },
            { code: '6106', description: 'Women\'s or girls\' blouses, shirts and shirt-blouses, knitted or crocheted' },
            { code: '6107', description: 'Men\'s or boys\' underpants, briefs, nightshirts, pajamas, bathrobes, dressing gowns' },
            { code: '6108', description: 'Women\'s or girls\' slips, petticoats, briefs, panties, nightdresses, pajamas' },
            { code: '6109', description: 'T-shirts, singlets and other vests, knitted or crocheted' },
            { code: '6110', description: 'Sweaters, pullovers, sweatshirts, waistcoats and similar articles' },
            { code: '6111', description: 'Babies\' garments and clothing accessories, knitted or crocheted' },
            { code: '6112', description: 'Track suits, ski suits and swimwear, knitted or crocheted' },
            { code: '6113', description: 'Garments, made up of knitted or crocheted fabrics of heading 5903, 5906 or 5907' },
            { code: '6114', description: 'Other garments, knitted or crocheted' },
            { code: '6115', description: 'Panty hose, tights, stockings, socks and other hosiery' },
            { code: '6116', description: 'Gloves, mittens and mitts, knitted or crocheted' },
            { code: '6117', description: 'Other made up clothing accessories, knitted or crocheted' }
          ],
          // Default
          'default': [
            { code: `${selectedChapter}01`, description: 'Dummy Heading 1' },
            { code: `${selectedChapter}02`, description: 'Dummy Heading 2' },
            { code: `${selectedChapter}03`, description: 'Dummy Heading 3' },
            { code: `${selectedChapter}04`, description: 'Dummy Heading 4' },
            { code: `${selectedChapter}05`, description: 'Dummy Heading 5' },
            { code: `${selectedChapter}06`, description: 'Dummy Heading 6' },
            { code: `${selectedChapter}07`, description: 'Dummy Heading 7' },
            { code: `${selectedChapter}08`, description: 'Dummy Heading 8' },
            { code: `${selectedChapter}09`, description: 'Dummy Heading 9' }
          ]
        };
        
        // Get headings for the selected chapter or use default ones
        const chapterHeadings = dummyHeadings[selectedChapter] || dummyHeadings.default;
        
        // Update headings that have suggestions with confidence scores
        const allHeadings = [...chapterHeadings];
        
        suggestedHeadings.forEach(suggestion => {
          const existingIndex = allHeadings.findIndex(h => h.code === suggestion.code);
          if (existingIndex >= 0) {
            allHeadings[existingIndex] = {
              ...allHeadings[existingIndex],
              confidence: suggestion.confidence
            };
          } else {
            allHeadings.push({
              code: suggestion.code,
              description: suggestion.description,
              confidence: suggestion.confidence
            });
          }
        });
        
        // Sort headings by confidence
        const sortedHeadings = allHeadings.sort((a, b) => {
          if (a.confidence && b.confidence) {
            return b.confidence - a.confidence;
          }
          if (a.confidence) return -1;
          if (b.confidence) return 1;
          return a.code.localeCompare(b.code);
        });
        
        setHeadings(sortedHeadings);
        setFilteredHeadings(sortedHeadings);
        
        // Load recently used
        const recentlyUsedFromStorage = localStorage.getItem(`recentlyUsedHeadings_${selectedChapter}`);
        if (recentlyUsedFromStorage) {
          setRecentlyUsed(JSON.parse(recentlyUsedFromStorage));
        }
      } catch (error) {
        console.error('Error loading headings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHeadings();
  }, [selectedChapter, suggestedHeadings]);

  // Filter headings based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredHeadings(headings);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = headings.filter(
      heading => 
        heading.code.includes(query) || 
        heading.description.toLowerCase().includes(query)
    );
    
    setFilteredHeadings(filtered);
  }, [searchQuery, headings]);

  // Handle heading selection
  const handleHeadingClick = (heading: Heading) => {
    onHeadingSelected(heading.code, heading.description);
    
    // Update recently used
    const updatedRecentlyUsed = [
      heading.code,
      ...recentlyUsed.filter(code => code !== heading.code)
    ].slice(0, 5); // Keep only the 5 most recent
    
    setRecentlyUsed(updatedRecentlyUsed);
    localStorage.setItem(`recentlyUsedHeadings_${selectedChapter}`, JSON.stringify(updatedRecentlyUsed));
  };

  return (
    <Box>
      {/* Breadcrumb navigation */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link 
            component="button"
            onClick={onBack}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Typography variant="body2">
              Chapters
            </Typography>
          </Link>
          <Typography color="text.primary" variant="body2">
            {selectedChapter} - {chapterDescription}
          </Typography>
        </Breadcrumbs>
        
        <Button 
          size="small" 
          startIcon={<ArrowBackIcon />} 
          onClick={onBack}
        >
          Back to Chapters
        </Button>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        Select Heading (4-digit)
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
          {/* Headings grid */}
          <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Grid container spacing={2}>
              {filteredHeadings.map((heading) => (
                <Grid 
                  key={heading.code}
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
                      bgcolor: selectedHeading === heading.code ? 'primary.50' : 'background.paper',
                      border: '1px solid',
                      borderColor: selectedHeading === heading.code ? 'primary.main' : 'divider',
                      '&:hover': {
                        bgcolor: 'primary.50',
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      },
                    }}
                    onClick={() => handleHeadingClick(heading)}
                    elevation={0}
                  >
                    <Typography variant="h6" component="div" fontWeight="medium">
                      {heading.code}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {heading.description}
                    </Typography>
                    
                    {heading.confidence && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={getConfidenceIndicator(heading.confidence)}
                          size="small"
                          sx={{
                            color: getConfidenceColor(heading.confidence),
                            bgcolor: 'background.paper',
                            borderColor: getConfidenceColor(heading.confidence),
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
              
              <Box display="flex" gap={1} flexWrap="wrap">
                {recentlyUsed.map(code => {
                  const heading = headings.find(h => h.code === code);
                  return (
                    <Chip 
                      key={code}
                      label={`${code} ${heading ? `(${heading.description.slice(0, 15)}...)` : ''}`}
                      onClick={() => heading && handleHeadingClick(heading)}
                      color={selectedHeading === code ? 'primary' : 'default'}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default HeadingSelector; 