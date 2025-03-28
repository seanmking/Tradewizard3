import React from 'react';
import { Grid, GridProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledGrid = styled(Grid)(({ theme }) => ({
  width: '100%',
  margin: 0,
  padding: theme.spacing(2),
}));

interface GridContainerProps {
  children: React.ReactNode;
  spacing?: number;
}

interface GridItemProps {
  children: React.ReactNode;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
}

export function GridContainer({ children, spacing = 3 }: GridContainerProps) {
  return (
    <StyledGrid container spacing={spacing}>
      {children}
    </StyledGrid>
  );
}

export function GridItem({ children, xs = 12, sm = 6, md = 4, lg = 3 }: GridItemProps) {
  return (
    <Grid item xs={xs} sm={sm} md={md} lg={lg}>
      {children}
    </Grid>
  );
} 