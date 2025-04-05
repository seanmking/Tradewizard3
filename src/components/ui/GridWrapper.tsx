import React from 'react';
import { Grid, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)(({ theme }) => ({
  width: '100%',
  margin: 0,
  padding: theme.spacing(2),
}));

interface GridContainerProps extends React.PropsWithChildren {
  spacing?: number;
  sx?: any;
}

interface GridItemProps extends React.PropsWithChildren {
  size?: {
    xs?: number | boolean;
    sm?: number | boolean;
    md?: number | boolean;
    lg?: number | boolean;
    xl?: number | boolean;
  };
  sx?: any;
}

/**
 * Container component for a grid layout using MUI v7 syntax
 */
export const GridContainer: React.FC<GridContainerProps> = ({ children, spacing = 3, sx }) => {
  return (
    <StyledBox sx={sx}>
      <Grid container spacing={spacing}>
        {children}
      </Grid>
    </StyledBox>
  );
};

/**
 * Item component for grid layout using MUI v7 syntax
 */
export const GridItem: React.FC<GridItemProps> = ({ children, size, sx }) => {
  // Convert the size object to Grid v7 compatible sx prop
  const { xs, sm, md, lg, xl } = size || {};
  
  // These style props need to be applied directly through the sx prop in v7
  const gridStyles = {
    ...(xs !== undefined && { gridColumn: { xs: `span ${xs}` } }),
    ...(sm !== undefined && { gridColumn: { sm: `span ${sm}` } }),
    ...(md !== undefined && { gridColumn: { md: `span ${md}` } }),
    ...(lg !== undefined && { gridColumn: { lg: `span ${lg}` } }),
    ...(xl !== undefined && { gridColumn: { xl: `span ${xl}` } }),
    ...(sx || {})
  };
  
  return (
    <Grid sx={gridStyles}>
      {children}
    </Grid>
  );
}; 