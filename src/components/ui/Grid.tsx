import React from 'react';
import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledGrid = styled(Grid)(({ theme }) => ({
  width: '100%',
  margin: 0,
  padding: theme.spacing(2),
}));

interface GridContainerProps {
  children: React.ReactNode;
  spacing?: number;
  sx?: any;
}

interface GridItemProps {
  children: React.ReactNode;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  sx?: any;
}

export function GridContainer({ children, spacing = 3, sx }: GridContainerProps) {
  console.log('Rendering GridContainer with MUI v7 compliant syntax');
  return (
    <StyledGrid container spacing={spacing} sx={sx}>
      {children}
    </StyledGrid>
  );
}

export function GridItem({ children, xs = 12, sm, md, lg, xl, sx }: GridItemProps) {
  console.log('Rendering GridItem with MUI v7 compliant syntax', { xs, sm, md, lg, xl });
  return (
    <Grid xs={xs} sm={sm} md={md} lg={lg} xl={xl} sx={sx}>
      {children}
    </Grid>
  );
} 