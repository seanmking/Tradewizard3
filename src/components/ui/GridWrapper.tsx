import React from 'react';
import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledGrid = styled(Grid)(({ theme }) => ({
  width: '100%',
  margin: 0,
  padding: theme.spacing(2),
}));

interface GridContainerProps extends React.PropsWithChildren {
  spacing?: number;
  sx?: any;
}

interface GridItemProps extends React.PropsWithChildren {
  gridSize?: {
    xs?: number | boolean;
    sm?: number | boolean;
    md?: number | boolean;
    lg?: number | boolean;
    xl?: number | boolean;
  };
  sx?: any;
}

// Container component
export const GridContainer: React.FC<GridContainerProps> = ({ children, spacing = 3, sx }) => {
  return (
    <StyledGrid container spacing={spacing} sx={sx}>
      {children}
    </StyledGrid>
  );
};

// Item component using Grid v2 syntax
export const GridItem: React.FC<GridItemProps> = ({ children, gridSize, sx }) => {
  return (
    <Grid {...gridSize} sx={sx}>
      {children}
    </Grid>
  );
}; 