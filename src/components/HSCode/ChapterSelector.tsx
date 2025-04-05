import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import { Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface ChapterSelectorProps {
  selectedChapter: string | null;
  onChapterSelected: (chapter: string, description: string) => void;
  suggestedChapters?: {
    code: string;
    description: string;
    confidence?: number;
  }[];
  productCategory: string;
}

interface Chapter {
  code: string;
  description: string;
  confidence?: number;
  category?: string;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  selectedChapter,
  onChapterSelected,
  suggestedChapters = [],
  productCategory
}) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
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

  // Load chapters
  useEffect(() => {
    const loadChapters = async () => {
      setLoading(true);
      try {
        // Here we would normally fetch from an API
        // For now, we're creating a static list of important chapters for South African exports
        
        // Define the main categories relevant to South Africa
        const categories = {
          food: 'Food Products',
          beverages: 'Beverages',
          readyToWear: 'Ready-to-Wear',
          homeGoods: 'Home Goods',
          health: 'Non-Prescription Health'
        };
        
        // Define chapters important for South Africa
        const southAfricanChapters: Chapter[] = [
          // Food Products (HS Chapters 1-24)
          { code: '01', description: 'Live Animals', category: 'food' },
          { code: '02', description: 'Meat and Edible Meat Offal', category: 'food' },
          { code: '03', description: 'Fish and Crustaceans', category: 'food' },
          { code: '04', description: 'Dairy Products', category: 'food' },
          { code: '07', description: 'Edible Vegetables', category: 'food' },
          { code: '08', description: 'Edible Fruits and Nuts', category: 'food' },
          { code: '09', description: 'Coffee, Tea, Mate and Spices', category: 'food' },
          { code: '16', description: 'Preparations of Meat or Fish', category: 'food' },
          { code: '19', description: 'Preparations of Cereals', category: 'food' },
          { code: '20', description: 'Preparations of Vegetables, Fruit, Nuts', category: 'food' },
          { code: '21', description: 'Miscellaneous Edible Preparations', category: 'food' },
          
          // Beverages (HS Chapter 22)
          { code: '22', description: 'Beverages, Spirits and Vinegar', category: 'beverages' },
          
          // Ready-to-Wear (HS Chapters 42-71)
          { code: '42', description: 'Articles of Leather', category: 'readyToWear' },
          { code: '61', description: 'Apparel, Knitted or Crocheted', category: 'readyToWear' },
          { code: '62', description: 'Apparel, Not Knitted or Crocheted', category: 'readyToWear' },
          { code: '64', description: 'Footwear', category: 'readyToWear' },
          { code: '65', description: 'Headgear', category: 'readyToWear' },
          { code: '71', description: 'Precious Stones, Metals, Jewelry', category: 'readyToWear' },
          
          // Home Goods (HS Chapters 42-97)
          { code: '44', description: 'Wood and Articles of Wood', category: 'homeGoods' },
          { code: '69', description: 'Ceramic Products', category: 'homeGoods' },
          { code: '70', description: 'Glass and Glassware', category: 'homeGoods' },
          { code: '94', description: 'Furniture, Bedding, Lamps', category: 'homeGoods' },
          { code: '95', description: 'Toys, Games and Sports Equipment', category: 'homeGoods' },
          
          // Non-Prescription Health (HS Chapters 30-34)
          { code: '30', description: 'Pharmaceutical Products', category: 'health' },
          { code: '33', description: 'Essential Oils and Cosmetics', category: 'health' },
          { code: '34', description: 'Soap, Washing Preparations', category: 'health' },
          
          // Other important South African export categories
          { code: '25', description: 'Salt, Sulphur, Earth, Stone', category: 'other' },
          { code: '26', description: 'Ores, Slag and Ash', category: 'other' },
          { code: '27', description: 'Mineral Fuels, Oils', category: 'other' },
          { code: '72', description: 'Iron and Steel', category: 'other' },
          { code: '84', description: 'Machinery and Mechanical Appliances', category: 'other' },
          { code: '85', description: 'Electrical Machinery and Equipment', category: 'other' },
          { code: '87', description: 'Vehicles', category: 'other' }
        ];
        
        // Add suggested chapters to the list with their confidence scores
        const allChapters = [...southAfricanChapters];
        
        // Update chapters that have suggestions with confidence scores
        suggestedChapters.forEach(suggestion => {
          const existingIndex = allChapters.findIndex(c => c.code === suggestion.code);
          if (existingIndex >= 0) {
            allChapters[existingIndex] = {
              ...allChapters[existingIndex],
              confidence: suggestion.confidence
            };
          } else {
            allChapters.push({
              code: suggestion.code,
              description: suggestion.description,
              confidence: suggestion.confidence
            });
          }
        });
        
        // Sort chapters: first by category relevance to productCategory, then by confidence
        const sortedChapters = allChapters.sort((a, b) => {
          // If both have confidences, sort by confidence
          if (a.confidence && b.confidence) {
            return b.confidence - a.confidence;
          }
          
          // If only one has confidence, prioritize it
          if (a.confidence) return -1;
          if (b.confidence) return 1;
          
          // Otherwise sort by category relevance to productCategory
          if (a.category === productCategory && b.category !== productCategory) return -1;
          if (a.category !== productCategory && b.category === productCategory) return 1;
          
          // Finally sort by code
          return a.code.localeCompare(b.code);
        });
        
        setChapters(sortedChapters);
        setFilteredChapters(sortedChapters);
        
        // Load recently used
        const recentlyUsedFromStorage = localStorage.getItem('recentlyUsedChapters');
        if (recentlyUsedFromStorage) {
          setRecentlyUsed(JSON.parse(recentlyUsedFromStorage));
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChapters();
  }, [suggestedChapters, productCategory]);

  // Filter chapters based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredChapters(chapters);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = chapters.filter(
      chapter => 
        chapter.code.includes(query) || 
        chapter.description.toLowerCase().includes(query)
    );
    
    setFilteredChapters(filtered);
  }, [searchQuery, chapters]);

  // Handle chapter selection
  const handleChapterClick = (chapter: Chapter) => {
    onChapterSelected(chapter.code, chapter.description);
    
    // Update recently used
    const updatedRecentlyUsed = [
      chapter.code,
      ...recentlyUsed.filter(code => code !== chapter.code)
    ].slice(0, 5); // Keep only the 5 most recent
    
    setRecentlyUsed(updatedRecentlyUsed);
    localStorage.setItem('recentlyUsedChapters', JSON.stringify(updatedRecentlyUsed));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Chapter (2-digit Tariff Heading)
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
          {/* Chapter grid */}
          <Box sx={{ flexGrow: 1, mt: 1 }}>
            <Grid container spacing={2}>
              {filteredChapters.map((chapter) => (
                <Grid key={chapter.code} sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 3'
                  }
                }}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      bgcolor: selectedChapter === chapter.code ? 'primary.50' : 'background.paper',
                      border: selectedChapter === chapter.code ? '1px solid' : '1px solid',
                      borderColor: selectedChapter === chapter.code ? 'primary.main' : 'divider',
                      '&:hover': {
                        bgcolor: 'primary.50',
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      },
                    }}
                    onClick={() => handleChapterClick(chapter)}
                    elevation={0}
                  >
                    <Typography variant="h5" component="div" fontWeight="bold">
                      {chapter.code}
                    </Typography>
                    <Typography variant="body2">
                      {chapter.description}
                    </Typography>
                    
                    {chapter.confidence && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={getConfidenceIndicator(chapter.confidence)}
                          size="small"
                          sx={{
                            color: getConfidenceColor(chapter.confidence),
                            bgcolor: 'background.paper',
                            borderColor: getConfidenceColor(chapter.confidence),
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
              
              <Box sx={{ display: "flex", gap: 1 }}>
                {recentlyUsed.map(code => {
                  const chapter = chapters.find(c => c.code === code);
                  return (
                    <Chip 
                      key={code}
                      label={`${code} ${chapter ? `(${chapter.description.slice(0, 10)}...)` : ''}`}
                      onClick={() => chapter && handleChapterClick(chapter)}
                      color={selectedChapter === code ? 'primary' : 'default'}
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

export default ChapterSelector; 