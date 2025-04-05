'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FADE_IN_ANIMATION } from '@/lib/animation';
import { useAssessment } from '@/contexts/assessment-context';
import type { Certification, Budget, TargetMarket } from '@/contexts/assessment-context';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  List,
  ListItem,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Slider,
  Chip,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SarahBox } from '@/components/sarah/SarahBox';
import { InfoBox } from '@/components/ui/InfoBox';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { GridContainer, GridItem } from '@/components/ui/GridWrapper';

const StyledPaper = styled(Paper)({
  padding: 32,
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  marginBottom: 24,
});

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

// Status chip component
function StatusChip({ status }: { status: string }) {
  let color: 'success' | 'warning' | 'info' = 'info';
  let label = 'Need It';
  
  switch (status) {
    case 'obtained':
      color = 'success';
      label = 'Obtained';
      break;
    case 'in-progress':
      color = 'warning';
      label = 'In Progress';
      break;
    default:
      color = 'info';
      label = 'Need It';
  }
  
  return (
    <Chip 
      label={label}
      color={color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
}

// Enhanced certification type with more details
interface EnhancedCertification {
  id: string;
  name: string;
  description: string;
  timeline: string;
  cost: number;
  applicableMarkets: {
    code: string;
    name: string;
  }[];
}

// Certification data with costs and descriptions
const certificationData: EnhancedCertification[] = [
  { 
    id: 'iso9001', 
    name: 'ISO 9001 - Quality Management', 
    description: 'International standard for quality management systems, ensuring products consistently meet customer requirements.',
    timeline: '6-12 months', 
    cost: 8500,
    applicableMarkets: [
      { code: 'eu', name: 'European Union' },
      { code: 'us', name: 'United States' },
      { code: 'ca', name: 'Canada' },
      { code: 'jp', name: 'Japan' },
      { code: 'sadc', name: 'SADC Countries' },
    ] 
  },
  { 
    id: 'iso14001', 
    name: 'ISO 14001 - Environmental Management', 
    description: 'Standard for environmental management to minimize environmental impact of business operations.',
    timeline: '6-10 months', 
    cost: 7500,
    applicableMarkets: [
      { code: 'eu', name: 'European Union' },
      { code: 'jp', name: 'Japan' },
      { code: 'kr', name: 'South Korea' },
      { code: 'sadc', name: 'SADC Countries' },
    ] 
  },
  { 
    id: 'haccp', 
    name: 'HACCP - Food Safety', 
    description: 'Hazard Analysis Critical Control Points system for food safety management and risk prevention.',
    timeline: '3-6 months', 
    cost: 5000,
    applicableMarkets: [
      { code: 'us', name: 'United States' },
      { code: 'eu', name: 'European Union' },
      { code: 'ca', name: 'Canada' },
      { code: 'au', name: 'Australia' },
      { code: 'sadc', name: 'SADC Countries' },
    ] 
  },
  { 
    id: 'fda', 
    name: 'FDA Registration', 
    description: 'Registration with the U.S. Food and Drug Administration for food, drug, and cosmetic products.',
    timeline: '4-8 months', 
    cost: 4200,
    applicableMarkets: [
      { code: 'us', name: 'United States' },
    ] 
  },
  { 
    id: 'ce', 
    name: 'CE Marking (European Conformity)', 
    description: 'Certification that indicates conformity with health, safety, and environmental protection standards for products sold in the European Economic Area.',
    timeline: '2-6 months', 
    cost: 6000,
    applicableMarkets: [
      { code: 'eu', name: 'European Union' },
    ] 
  },
  { 
    id: 'halal', 
    name: 'Halal Certification', 
    description: 'Certification that products comply with Islamic dietary laws and are permissible for consumption by Muslims.',
    timeline: '3-5 months', 
    cost: 3500,
    applicableMarkets: [
      { code: 'ae', name: 'UAE' },
      { code: 'sa', name: 'Saudi Arabia' },
      { code: 'my', name: 'Malaysia' },
      { code: 'id', name: 'Indonesia' },
    ] 
  },
  { 
    id: 'fair-trade', 
    name: 'Fair Trade Certification', 
    description: 'Certification that products meet ethical standards in terms of worker conditions, sustainability, and fair pricing.',
    timeline: '6-12 months', 
    cost: 5500,
    applicableMarkets: [
      { code: 'eu', name: 'European Union' },
      { code: 'us', name: 'United States' },
      { code: 'ca', name: 'Canada' },
      { code: 'sadc', name: 'SADC Countries' },
    ] 
  },
];

export function CertificationsBudgetStep() {
  const { state, dispatch } = useAssessment();
  const [certifications, setCertifications] = React.useState<Certification[]>(
    state.certifications || []
  );
  const [monthlyBudget, setMonthlyBudget] = React.useState<number>(5000);
  const [budget, setBudget] = React.useState<Budget>(
    state.budget || {
      amount: 100000,
      currency: 'USD',
      timeline: 12,
      allocation: {
        certifications: 30,
        marketing: 40,
        logistics: 20,
        other: 10,
      },
    }
  );

  // Get the selected markets from the state
  const selectedMarkets = state.marketInfo?.targetMarkets || [];
  
  // Filter certifications that are applicable to the selected markets
  const relevantCertifications = certificationData.filter(cert => {
    return cert.applicableMarkets.some(market => 
      selectedMarkets.some(selectedMarket => 
        selectedMarket.code.toLowerCase() === market.code.toLowerCase())
    );
  });
  
  // Initialize with relevant certifications if none are selected yet
  React.useEffect(() => {
    if (selectedMarkets.length > 0) {
      // Only initialize if we have markets selected and no certifications yet
      if (certifications.length === 0 && relevantCertifications.length > 0) {
        const initialCerts = relevantCertifications.map(cert => ({
          id: cert.id,
          name: cert.name,
          status: 'planned' as const
        }));
        
        setCertifications(initialCerts);
      } else if (relevantCertifications.length > 0) {
        // Add any new relevant certifications not in the list yet
        const existingCertIds = certifications.map(c => c.id);
        const newCerts = relevantCertifications
          .filter(cert => !existingCertIds.includes(cert.id))
          .map(cert => ({
            id: cert.id,
            name: cert.name,
            status: 'planned' as const
          }));
        
        if (newCerts.length > 0) {
          setCertifications([...certifications, ...newCerts]);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkets.length, relevantCertifications.length, certifications.length]);

  const handleCertificationStatusChange = (id: string, status: Certification['status']) => {
    setCertifications(
      certifications.map((cert) =>
        cert.id === id ? { ...cert, status } : cert
      )
    );
  };

  // Calculate total certification costs
  const calculateTotalCost = () => {
    let total = 0;
    
    relevantCertifications.forEach(cert => {
      const userCert = certifications.find(c => c.id === cert.id);
      if (userCert && userCert.status === 'planned') {
        total += cert.cost;
      }
    });
    
    return total;
  };
  
  const totalCertificationCost = calculateTotalCost();
  
  // Get longest certification timeline
  const getLongestCertificationTime = () => {
    let maxMonths = 0;
    
    relevantCertifications.forEach(cert => {
      const userCert = certifications.find(c => c.id === cert.id);
      if (userCert && userCert.status === 'planned') {
        // Parse timeline like "6-12 months" to get max value
        const timelineMatch = cert.timeline.match(/(\d+)-(\d+)/);
        if (timelineMatch && timelineMatch[2]) {
          const maxTimeMonths = parseInt(timelineMatch[2]);
          maxMonths = Math.max(maxMonths, maxTimeMonths);
        }
      }
    });
    
    return maxMonths;
  };
  
  const longestCertificationMonths = getLongestCertificationTime();
  
  // Calculate how many months it will take to afford all certifications
  const calculateTimeToExport = () => {
    if (monthlyBudget <= 0) return Infinity;
    
    // Financial timeline (how long to afford certifications)
    const financialTimeline = Math.ceil(totalCertificationCost / monthlyBudget);
    
    // Processing timeline (how long to process certifications)
    const processingTimeline = longestCertificationMonths;
    
    // Return the longer of the two timelines
    return Math.max(financialTimeline, processingTimeline);
  };
  
  const timeToExport = calculateTimeToExport();

  const handleFinish = () => {
    dispatch({ type: 'SET_CERTIFICATIONS', payload: certifications });
    
    // Update budget with certification costs
    const updatedBudget = {
      ...budget,
      amount: Math.max(budget.amount, totalCertificationCost),
      allocation: {
        ...budget.allocation,
        certifications: Math.round((totalCertificationCost / budget.amount) * 100)
      }
    };
    
    dispatch({ type: 'SET_BUDGET', payload: updatedBudget });
    
    // Save assessment state to localStorage for persistence across page navigation
    try {
      localStorage.setItem('assessmentState', JSON.stringify({
        businessProfile: state.businessProfile,
        selectedProducts: state.selectedProducts,
        productionCapacity: state.productionCapacity,
        marketInfo: state.marketInfo,
        certifications,
        budget: updatedBudget
      }));
      console.log('Assessment state saved to localStorage');
    } catch (error) {
      console.error('Error saving assessment state:', error);
    }
    
    // Navigate to the report page
    console.log('Assessment completed! Redirecting to report page...');
    window.location.href = '/report';
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 4 }); // Move back to Market Assessment
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
            Certifications & Budget
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Let's identify which certifications you'll need for your target markets and plan your budget.
          </Typography>
          
          <SarahBox>
            Based on your selected markets ({selectedMarkets.map(m => m.name).join(', ')}), 
            here are the certifications you'll likely need. Review each one, update its status, 
            and use the budget slider to determine how quickly you can begin exporting.
          </SarahBox>
          
          {/* Certifications Table Section */}
          <Box sx={{ mt: 4, mb: 5 }}>
            <Typography variant="h5" gutterBottom>
              Required Certifications for Your Target Markets
            </Typography>
            
            {relevantCertifications.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.50' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Certification</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Applicable Markets</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {relevantCertifications.map((cert) => {
                      const userCert = certifications.find(c => c.id === cert.id);
                      return (
                        <StyledTableRow key={cert.id}>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {cert.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {cert.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {cert.applicableMarkets
                                .filter(market => 
                                  selectedMarkets.some(selectedMarket => 
                                    selectedMarket.code.toLowerCase() === market.code.toLowerCase() ||
                                    (market.code === 'eu' && selectedMarket.code === 'gb') || // Special case for UK/EU
                                    (market.code === 'sadc' && selectedMarket.id === 'sadc') // Match SADC regions
                                  )
                                )
                                .map(market => {
                                  // Find the corresponding selected market (if available)
                                  const matchedSelectedMarket = selectedMarkets.find(selectedMarket => 
                                    selectedMarket.code.toLowerCase() === market.code.toLowerCase() ||
                                    (market.code === 'eu' && selectedMarket.code === 'gb') ||
                                    (market.code === 'sadc' && selectedMarket.id === 'sadc')
                                  );
                                  
                                  const displayName = matchedSelectedMarket?.name || market.name;
                                  
                                  // Special case for SADC to use custom display instead of flag
                                  if (market.code === 'sadc') {
                                    return (
                                      <Box key={market.code} sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        mb: 0.5
                                      }}>
                                        <Box sx={{ 
                                          display: 'inline-flex', 
                                          mr: 1, 
                                          width: 24, 
                                          height: 16, 
                                          backgroundColor: '#f0f4f8',
                                          color: '#4a5568',
                                          fontSize: '8px',
                                          fontWeight: 'bold',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          border: '1px solid #cbd5e0'
                                        }}>
                                          SADC
                                        </Box>
                                        <Typography variant="body2">
                                          {displayName}
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                  
                                  return (
                                    <Box key={market.code} sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      mb: 0.5
                                    }}>
                                      <Box sx={{ display: 'inline-block', mr: 1, width: 24, height: 16 }}>
                                        <CountryFlag countryCode={market.code} />
                                      </Box>
                                      <Typography variant="body2">
                                        {displayName}
                                      </Typography>
                                    </Box>
                                  );
                                })
                              }
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              ${cert.cost.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cert.timeline}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={userCert?.status || 'planned'}
                                onChange={(e) => handleCertificationStatusChange(cert.id, e.target.value as Certification['status'])}
                                renderValue={(value) => <StatusChip status={value} />}
                                sx={{ minWidth: 120 }}
                              >
                                <MenuItem value="planned">Need It</MenuItem>
                                <MenuItem value="in-progress">In Progress</MenuItem>
                                <MenuItem value="obtained">Obtained</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.100' }}>
                <Typography>
                  Please select target markets in the previous step to see applicable certifications.
                </Typography>
              </Paper>
            )}
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          {/* Budget Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Certification Budget Planning
            </Typography>
            
            <GridContainer spacing={4}>
              <GridItem xs={12} md={5}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    backgroundColor: 'primary.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'primary.200'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Certification Cost Summary
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1">
                      Total cost for required certifications:
                    </Typography>
                    <Typography variant="h4" color="primary.main" sx={{ my: 1 }}>
                      ${totalCertificationCost.toLocaleString()}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Monthly budget for certifications:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body1" sx={{ mr: 2, minWidth: 60 }}>
                        ${monthlyBudget.toLocaleString()}
                      </Typography>
                      <Slider
                        value={monthlyBudget}
                        onChange={(_, value) => setMonthlyBudget(value as number)}
                        valueLabelDisplay="auto"
                        step={500}
                        min={1000}
                        max={20000}
                        sx={{ flexGrow: 1 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Estimated time to acquire all certifications:
                    </Typography>
                    <Typography variant="h6" color={timeToExport > 24 ? 'error.main' : timeToExport > 12 ? 'warning.main' : 'success.main'}>
                      {timeToExport === Infinity ? (
                        'Insufficient monthly budget'
                      ) : (
                        `${timeToExport} month${timeToExport !== 1 ? 's' : ''}`
                      )}
                    </Typography>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (timeToExport / 24) * 100)} 
                      sx={{ 
                        mt: 2, 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'grey.300'
                      }} 
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption">Immediate</Typography>
                      <Typography variant="caption">12 months</Typography>
                      <Typography variant="caption">24+ months</Typography>
                    </Box>
                  </Box>
                </Paper>
              </GridItem>
              
              <GridItem xs={12} md={7}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    backgroundColor: 'info.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'info.200',
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Export Readiness Timeline
                  </Typography>
                  
                  <Box sx={{ my: 2 }}>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                      Based on your monthly budget of <strong>${monthlyBudget.toLocaleString()}</strong>, 
                      your certifications will be fully funded in <strong>{Math.ceil(totalCertificationCost / monthlyBudget)} months</strong>.
                      However, certification processing takes time regardless of funding.
                    </Typography>
                    
                    {timeToExport === Infinity ? (
                      <Typography variant="body1" color="error.main" sx={{ fontWeight: 'bold' }}>
                        Your monthly budget is too low to project a timeline. Please increase your monthly budget.
                      </Typography>
                    ) : (
                      <>
                        <Box sx={{ 
                          p: 2, 
                          mt: 2, 
                          mb: 3, 
                          backgroundColor: 'white', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'grey.300'
                        }}>
                          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            Why {timeToExport} months until export-ready?
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: '45%' }}>
                              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                                Funding timeline:
                              </Typography>
                              <Typography variant="body2">
                                {Math.ceil(totalCertificationCost / monthlyBudget)} months
                              </Typography>
                            </Box>
                            <Box sx={{ width: '10%', textAlign: 'center' }}>
                              <Typography variant="body1">
                                vs
                              </Typography>
                            </Box>
                            <Box sx={{ width: '45%' }}>
                              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                                Processing timeline:
                              </Typography>
                              <Typography variant="body2">
                                {longestCertificationMonths} months
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                            Your export timeline is limited by the {longestCertificationMonths > Math.ceil(totalCertificationCost / monthlyBudget) ? 
                              'certification processing time' : 
                              'funding availability'}.
                          </Typography>
                        </Box>
                        
                        <Box sx={{ px: 1 }}>
                          <Box sx={{ 
                            position: 'relative', 
                            height: 50, 
                            mt: 4, 
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Box sx={{ 
                              position: 'absolute',
                              top: '50%',
                              left: 0,
                              right: 0,
                              height: 4,
                              bgcolor: 'grey.200',
                              transform: 'translateY(-50%)',
                              zIndex: 0
                            }} />
                            
                            {/* Start point */}
                            <Box sx={{ 
                              position: 'absolute',
                              left: 0,
                              width: 25,
                              height: 25,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1
                            }}>
                              1
                            </Box>
                            
                            {/* Funding point */}
                            <Box sx={{ 
                              position: 'absolute',
                              left: `${Math.min(100, (Math.ceil(totalCertificationCost / monthlyBudget) / timeToExport) * 100)}%`,
                              width: 25,
                              height: 25,
                              borderRadius: '50%',
                              bgcolor: 'warning.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1,
                              transform: 'translateX(-50%)'
                            }}>
                              2
                            </Box>
                            
                            {/* Final point */}
                            <Box sx={{ 
                              position: 'absolute',
                              right: 0,
                              width: 25,
                              height: 25,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1
                            }}>
                              3
                            </Box>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            mt: 3,
                            mb: 1
                          }}>
                            <Box sx={{ width: '25%' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Start process
                              </Typography>
                              <Typography variant="caption">
                                Month 0
                              </Typography>
                            </Box>
                            
                            <Box sx={{ width: '45%', textAlign: 'center', ml: -2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Funding complete
                              </Typography>
                              <Typography variant="caption">
                                Month {Math.ceil(totalCertificationCost / monthlyBudget)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ width: '25%', textAlign: 'right' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Export ready
                              </Typography>
                              <Typography variant="caption">
                                Month {timeToExport}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                  
                  <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Pro Tip:</strong> Many export support programs offer grants and subsidies 
                      for certification costs. Check with your local trade department or chamber of commerce 
                      for financial assistance options.
                    </Typography>
                  </Box>
                </Paper>
              </GridItem>
            </GridContainer>
          </Box>
          
          <InfoBox tooltipText="Certifications are critical for market access">
            The right certifications are your passport to international markets. They not only help you 
            meet regulatory requirements but also build trust with foreign buyers and distributors.
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
            Back to Market Assessment
          </Button>
          
          <Button
            variant="contained"
            onClick={handleFinish}
            sx={{ 
              backgroundColor: 'success.main',
              '&:hover': {
                backgroundColor: 'success.dark',
              },
              borderRadius: 20,
              px: 4
            }}
          >
            Complete Assessment
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
} 