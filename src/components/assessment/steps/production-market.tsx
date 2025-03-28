'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FADE_IN_ANIMATION } from '@/lib/animation';
import { useAssessment } from '@/contexts/assessment-context';
import type { ProductionCapacity, MarketInfo, Product } from '@/contexts/assessment-context';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  Checkbox,
  MenuItem,
  CircularProgress,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SarahBox } from '@/components/sarah/SarahBox';
import { InfoBox } from '@/components/ui/InfoBox';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { GridContainer, GridItem } from '@/components/ui/GridWrapper';
import { MarketCard as MarketCardComponent } from '@/components/ui/MarketCard';

const StyledPaper = styled(Paper)({
  padding: 32, // theme.spacing(4)
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  marginBottom: 24, // theme.spacing(3)
});

const ProductCapacityCard = styled(Paper)({
  padding: 24, // theme.spacing(3)
  borderRadius: 8,
  marginBottom: 24, // theme.spacing(3)
  backgroundColor: '#f7fafc',
  border: '1px solid #e2e8f0',
});

const CapacityProgressBar = styled(LinearProgress)({
  height: 25,
  borderRadius: 4,
  marginTop: 8, // theme.spacing(1)
  marginBottom: 8, // theme.spacing(1)
  backgroundColor: '#edf2f7',
  '& .MuiLinearProgress-bar': {
    backgroundColor: '#4299e1',
  }
});

const MarketCard = styled(Card)({
  borderRadius: 8,
  height: '100%',
  backgroundColor: '#f7fafc',
  border: '1px solid #e2e8f0',
});

interface Market {
  id: string;
  name: string;
  flag: string;
  marketSize: string;
  growthRate: string;
  saExports: string;
  tariff: string;
  selected: boolean;
}

// Production Capacity Step
export function ProductionCapacityStep() {
  const { state, dispatch } = useAssessment();
  const [productionData, setProductionData] = React.useState<{
    [key: string]: {
      currentCapacity: number;
      maximumCapacity: number;
      unit: string;
    }
  }>({});
  const [manufacturingApproach, setManufacturingApproach] = React.useState('in-house');
  const [leadTime, setLeadTime] = React.useState(0);
  const [consolidatedUnits, setConsolidatedUnits] = React.useState('units');
  const [totalCurrentCapacity, setTotalCurrentCapacity] = React.useState(0);
  const [totalMaxCapacity, setTotalMaxCapacity] = React.useState(0);

  // Initialize with products from context
  React.useEffect(() => {
    const selectedProducts = state.selectedProducts;
    
    if (selectedProducts.length > 0 && Object.keys(productionData).length === 0) {
      const initialData: any = {};
      
      selectedProducts.forEach(product => {
        initialData[product.id] = {
          currentCapacity: 0,
          maximumCapacity: 0,
          unit: 'units'
        };
      });
      
      setProductionData(initialData);
    }
  }, [state.selectedProducts, productionData]);

  // Update consolidated capacity values
  const updateConsolidatedCapacity = (
    productId: string, 
    field: 'currentCapacity' | 'maximumCapacity', 
    value: number
  ) => {
    setProductionData(prevData => {
      const newData = {
        ...prevData,
        [productId]: {
          ...prevData[productId],
          [field]: value
        }
      };
      
      calculateTotals(newData);
      return newData;
    });
  };

  // Calculate totals for the same unit type
  const calculateTotals = (data = productionData) => {
    let current = 0;
    let max = 0;
    
    Object.values(data).forEach(item => {
      if (item.unit === consolidatedUnits) {
        current += item.currentCapacity;
        max += item.maximumCapacity;
      }
    });
    
    setTotalCurrentCapacity(current);
    setTotalMaxCapacity(max);
  };
  
  // Handle unit change for the consolidated view
  const handleConsolidatedUnitChange = (unit: string) => {
    setConsolidatedUnits(unit);
    
    // Reset all product units to match
    const newData = { ...productionData };
    Object.keys(newData).forEach(id => {
      newData[id].unit = unit;
    });
    
    setProductionData(newData);
    calculateTotals(newData);
  };
  
  // Calculate capacity percentage for the progress bar
  const getCapacityPercentage = (current: number, maximum: number) => {
    if (maximum <= 0) return 0;
    return Math.min((current / maximum) * 100, 100);
  };

  const handleNext = () => {
    const productionCapacity: ProductionCapacity = {
      monthlyCapacity: totalCurrentCapacity,
      unit: consolidatedUnits as any,
      leadTime: leadTime,
      minimumOrderQuantity: Math.floor(totalCurrentCapacity * 0.1) // 10% of current capacity as MOQ
    };
    
    dispatch({ type: 'SET_PRODUCTION_CAPACITY', payload: productionCapacity });
    dispatch({ type: 'SET_STEP', payload: 4 }); // Move to next step (Market Assessment)
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 2 }); // Move back to Product Selection
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={FADE_IN_ANIMATION}
      >
        <StyledPaper>
          <Typography variant="h4" component="h2" color="secondary.main" sx={{ mb: 2 }}>
            Production Capacity
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Let's evaluate your production capacity for each product you've selected for export.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 4 }}>
            Successful exporters typically maintain production volumes that are 30-40% higher than their domestic needs. 
            This buffer helps manage unexpected international orders while maintaining local commitments.
          </Alert>
          
          {/* Selected Products Summary */}
          <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Selected Products for Export
            </Typography>
            <Box sx={{ mb: 3 }}>
              {state.selectedProducts.map(product => (
                <Box key={product.id} sx={{ 
                  py: 1.5, 
                  borderBottom: '1px solid',
                  borderColor: 'primary.200',
                  '&:last-of-type': { borderBottom: 0 }
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {product.name}
                    <Typography 
                      component="span" 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ ml: 1 }}
                    >
                      ({product.category})
                    </Typography>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Consolidated Capacity Entry Section */}
          <Paper 
            sx={{ 
              p: 3, 
              mb: 3, 
              border: '1px solid',
              borderColor: 'primary.200',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" sx={{ mb: 3 }}>
              Consolidated Production Capacity
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 3 }}>
              Please provide your total production capacity across all selected products.
              For accurate planning, use the same unit of measurement for all products.
            </Typography>
            
            <GridContainer spacing={3} sx={{ mb: 3 }}>
              <GridItem xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Current Monthly Production
                </Typography>
                <TextField 
                  type="number"
                  variant="outlined"
                  fullWidth
                  value={totalCurrentCapacity}
                  onChange={(e) => setTotalCurrentCapacity(parseInt(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: consolidatedUnits,
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Maximum Monthly Capacity
                </Typography>
                <TextField 
                  type="number"
                  variant="outlined"
                  fullWidth
                  value={totalMaxCapacity}
                  onChange={(e) => setTotalMaxCapacity(parseInt(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: consolidatedUnits,
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Unit of Measurement
                </Typography>
                <TextField
                  select
                  variant="outlined"
                  fullWidth
                  value={consolidatedUnits}
                  onChange={(e) => handleConsolidatedUnitChange(e.target.value)}
                >
                  <MenuItem value="units">Units</MenuItem>
                  <MenuItem value="kg">Kilograms</MenuItem>
                  <MenuItem value="tons">Tons</MenuItem>
                  <MenuItem value="pieces">Pieces</MenuItem>
                  <MenuItem value="cases">Cases</MenuItem>
                  <MenuItem value="pallets">Pallets</MenuItem>
                </TextField>
              </GridItem>
            </GridContainer>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Production Capacity Utilization
              </Typography>
              <CapacityProgressBar 
                variant="determinate" 
                value={getCapacityPercentage(totalCurrentCapacity, totalMaxCapacity)} 
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">
                  Current: {totalCurrentCapacity} {consolidatedUnits}
                </Typography>
                <Typography variant="caption">
                  Maximum: {totalMaxCapacity} {consolidatedUnits}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: '#e6fffa', border: '1px solid #b2f5ea', borderRadius: 1 }}>
              <Typography variant="body2">
                {totalCurrentCapacity < totalMaxCapacity * 0.7 ? (
                  <>You have <strong>{Math.round((1 - totalCurrentCapacity / totalMaxCapacity) * 100)}%</strong> additional capacity available for export orders.</>
                ) : totalCurrentCapacity < totalMaxCapacity ? (
                  <>You're operating at <strong>high capacity</strong>. Consider increasing your production capabilities to accommodate export growth.</>
                ) : (
                  <>You're at <strong>maximum capacity</strong>. To export successfully, you'll need to increase your production capabilities.</>
                )}
              </Typography>
            </Box>
          </Paper>
          
          <Box sx={{ mt: 4, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Manufacturing Approach
            </Typography>
            
            <FormControl component="fieldset">
              <RadioGroup 
                value={manufacturingApproach}
                onChange={(e) => setManufacturingApproach(e.target.value)}
                row
              >
                <FormControlLabel 
                  value="in-house" 
                  control={<Radio color="primary" />} 
                  label="In-house only" 
                />
                <FormControlLabel 
                  value="outsourced" 
                  control={<Radio color="primary" />} 
                  label="Outsourced only" 
                />
                <FormControlLabel 
                  value="both" 
                  control={<Radio color="primary" />} 
                  label="Both in-house and outsourced" 
                />
              </RadioGroup>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Lead Time (days)
            </Typography>
            <Typography variant="body2" color="#718096" sx={{ mb: 2 }}>
              Average time from order to shipment readiness
            </Typography>
            
            <TextField 
              type="number"
              variant="outlined"
              value={leadTime}
              onChange={(e) => setLeadTime(parseInt(e.target.value) || 0)}
              sx={{ width: '250px' }}
            />
          </Box>

          <InfoBox tooltipText="Production capacity impacts your export potential">
            Having sufficient production capacity is essential for fulfilling export orders reliably.
            International buyers typically require consistent quality and quantity, so understanding
            your capacity limits helps establish realistic export targets.
          </InfoBox>
        </StyledPaper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 6 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{ 
              borderColor: 'primary.main', 
              color: 'primary.main',
              borderRadius: 20,
              px: 4
            }}
          >
            Back to Product Selection
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ 
              backgroundColor: 'primary.main',
              borderRadius: 20,
              px: 4
            }}
          >
            Continue to Market Assessment
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
}

// Market Assessment Step
export function MarketAssessmentStep() {
  const { state, dispatch } = useAssessment();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Initialize markets state
  const [markets, setMarkets] = React.useState<Market[]>([]);
  const [competitorAnalysis, setCompetitorAnalysis] = React.useState('');

  // Get selected product categories
  const getSelectedCategories = () => {
    if (!state.selectedProducts) return [];
    return Array.from(new Set(state.selectedProducts.map(p => p.category)));
  };

  // Fetch market data when products or their categories change
  React.useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const categories = getSelectedCategories();
        if (categories.length === 0) {
          setError('Please select products and their categories first');
          return;
        }

        // Use uppercase market codes to match backend expectations
        const marketCodes = ['UAE', 'US', 'GB', 'SADC'];
        const marketData: Market[] = [];

        for (const code of marketCodes) {
          try {
            // Call MarketIntelligenceMCP for each market
            const response = await fetch('/api/market-intelligence', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                marketCode: code,
                productCategories: categories,
                businessProfile: state.businessProfile
              })
            });

            if (!response.ok) throw new Error('Failed to fetch market data');
            
            const data = await response.json();
            const marketDataResponse = data[code] || {}; // Renamed from marketData to marketDataResponse
            
            // Validate market size data
            const marketSizeValue = marketDataResponse?.marketSize?.value ?? 0;
            const marketSizeGrowthRate = marketDataResponse?.marketSize?.growthRate ?? 0;
            
            const marketSize = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(marketSizeValue);

            marketData.push({
              id: code.toLowerCase(),
              name: getMarketName(code.toLowerCase()),
              flag: code.toLowerCase(),
              marketSize: `${marketSize} (${categories.join(', ')})`,
              growthRate: `${marketSizeGrowthRate.toFixed(1)}% annually`,
              saExports: formatExports(marketSizeValue, code.toLowerCase()),
              tariff: formatTariffs(marketDataResponse.tariffs, categories),
              selected: code === 'SADC' // Default SADC selected
            });
          } catch (error) {
            console.error(`Error fetching data for market ${code}:`, error);
            // Use fallback data for this market
            marketData.push(getFallbackMarketData(code.toLowerCase()));
          }
        }

        setMarkets(marketData);
      } catch (error) {
        console.error('Error fetching market data:', error);
        setError('Failed to load market data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [state.selectedProducts, state.businessProfile]);

  // Helper functions
  const getMarketName = (code: string) => {
    const names: Record<string, string> = {
      'uae': 'United Arab Emirates',
      'usa': 'United States',
      'uk': 'United Kingdom',
      'sadc': 'SADC Countries'
    };
    return names[code] || code.toUpperCase();
  };

  const formatExports = (marketSize: number, code: string) => {
    const exportPercentages: Record<string, number> = {
      'uae': 0.08,  // 8% market share
      'usa': 0.003, // 0.3% market share
      'uk': 0.01,   // 1% market share
      'sadc': 0.1   // 10% market share
    };
    
    const exports = marketSize * (exportPercentages[code] || 0.01);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(exports) + ' (2024)';
  };

  const formatTariffs = (tariffs: Record<string, any>, categories: string[]) => {
    if (!tariffs || Object.keys(tariffs).length === 0) {
      return getFallbackTariff(categories[0]);
    }

    const rates = Object.values(tariffs).map(t => t.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    
    if (min === max) {
      return `${min}% for your products`;
    }
    return `${min}-${max}% for your products`;
  };

  const getFallbackTariff = (category: string) => {
    const fallbackRates: Record<string, string> = {
      'uae': '0-5%',
      'usa': '0-10%',
      'uk': '0-15%',
      'sadc': '0-5%'
    };
    return fallbackRates[category] || '0-10%';
  };

  const getFallbackMarketData = (code: string): Market => ({
    id: code,
    name: getMarketName(code),
    flag: code === 'sadc' ? 'sadc' : code,
    marketSize: '$4.2B (Food & Beverage)',
    growthRate: '8.3% annually',
    saExports: '$340M (2024)',
    tariff: '0-5% for your products',
    selected: code === 'sadc'
  });

  const handleNext = () => {
    // Create proper market objects with id, code, and name
    const selectedMarkets = markets
      .filter(m => m.selected)
      .map(m => ({
        id: m.id,
        code: m.flag,
        name: m.name
      }));
    
    const marketInfo = {
      targetMarkets: selectedMarkets,
      existingMarkets: state.marketInfo?.existingMarkets || [],
      competitorAnalysis: competitorAnalysis
    };
    
    dispatch({ type: 'SET_MARKET_INFO', payload: marketInfo });
    dispatch({ type: 'SET_STEP', payload: 5 }); // Move to next step (Certifications & Budget)
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 3 }); // Move back to Production Capacity
  };

  // Toggle market selection
  const handleToggleMarket = (id: string) => {
    setMarkets(markets.map(market => 
      market.id === id ? { ...market, selected: !market.selected } : market
    ));
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={FADE_IN_ANIMATION}
      >
        <StyledPaper>
          <Typography variant="h4" component="h2" color="secondary.main" sx={{ mb: 2 }}>
            Market Assessment
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Select your target export markets and analyze competitors to prepare your market entry strategy.
          </Typography>
          
          <SarahBox>
            Based on your products and production capacity, I've analyzed potential target markets for export. 
            Review the market cards below and select those you're interested in.
          </SarahBox>
          
          <Typography variant="h6" sx={{ mb: 3 }}>
            Available Export Markets
          </Typography>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ mb: 3, color: 'error.main' }}>
              <Typography>{error}</Typography>
            </Box>
          )}

          <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 4 }}>
              <GridContainer spacing={3}>
                {markets.map(market => (
                  <GridItem key={market.id} xs={12} sm={6} md={4}>
                    <MarketCardComponent 
                      market={market}
                      onToggle={handleToggleMarket}
                    />
                  </GridItem>
                ))}
              </GridContainer>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Competitor Analysis
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Describe your main competitors and their market position..."
              value={competitorAnalysis}
              onChange={(e) => setCompetitorAnalysis(e.target.value)}
            />
          </Box>

          <InfoBox tooltipText="Market selection is a critical part of your export strategy">
            Choosing the right target markets is one of the most important decisions in your export journey. 
            Factors like market size, growth potential, cultural compatibility, and competitive landscape 
            all influence your chances of success.
          </InfoBox>
        </StyledPaper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 6 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{ 
              borderColor: 'primary.main', 
              color: 'primary.main',
              borderRadius: 20,
              px: 4
            }}
          >
            Back to Production Capacity
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!markets.some(m => m.selected)}
            sx={{ 
              backgroundColor: 'primary.main',
              borderRadius: 20,
              px: 4
            }}
          >
            Continue to Certifications & Budget
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
}

// Original step for compatibility
export function ProductionMarketStep() {
  const { state, dispatch } = useAssessment();
  
  React.useEffect(() => {
    // If the user lands on this page, redirect to the Production Capacity step
    dispatch({ type: 'SET_STEP', payload: 3 });
  }, [dispatch]);
  
  return null;
} 