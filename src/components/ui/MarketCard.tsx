import React from 'react';
import { Card, CardContent, Typography, Box, FormControlLabel, Checkbox } from '@mui/material';
import { styled } from '@mui/material/styles';
import { CountryFlag } from './CountryFlag';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
}));

interface MarketCardProps {
  market: {
    id: string;
    name: string;
    flag: string;
    marketSize: string;
    growthRate: string;
    saExports: string;
    tariff: string;
    selected: boolean;
  };
  onToggle: (id: string) => void;
}

export function MarketCard({ market, onToggle }: MarketCardProps) {
  return (
    <StyledCard>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2, width: 32, height: 24 }}>
            {market.id === 'sadc' ? (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f0f4f8',
                color: '#4a5568',
                fontSize: '10px',
                fontWeight: 'bold',
                border: '1px solid #cbd5e0'
              }}>
                SADC
              </Box>
            ) : (
              <CountryFlag countryCode={market.id} size="medium" />
            )}
          </Box>
          <Typography variant="h6" component="h3">
            {market.name}
          </Typography>
        </Box>

        {market.id === 'sadc' && (
          <Box sx={{ mb: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
            Includes Angola, Botswana, Comoros, DRC, Eswatini, Lesotho, Madagascar, Malawi, 
            Mauritius, Mozambique, Namibia, Seychelles, South Africa, Tanzania, Zambia, and Zimbabwe
          </Box>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
            Market Size:
          </Typography>
          <Typography variant="body2" component="span">
            {market.marketSize}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
            Growth Rate:
          </Typography>
          <Typography variant="body2" component="span">
            {market.growthRate}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
            SA Exports:
          </Typography>
          <Typography variant="body2" component="span">
            {market.saExports}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
            Tariff:
          </Typography>
          <Typography variant="body2" component="span">
            {market.tariff}
          </Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={market.selected}
              onChange={() => onToggle(market.id)}
              sx={{ 
                color: 'primary.main',
                '&.Mui-checked': {
                  color: 'primary.main',
                },
              }}
            />
          }
          label="Select"
        />
      </CardContent>
    </StyledCard>
  );
} 