import React from 'react';
import { Grid as MuiGrid } from '@mui/material';

// Helper component to wrap MUI Grid with proper types
export const Grid: React.FC<any> = (props) => {
  return <MuiGrid {...props} />;
};

// Container component
export const GridContainer: React.FC<React.PropsWithChildren<{
  spacing?: number;
  sx?: any;
}>> = ({ children, spacing = 3, sx }) => {
  return (
    <MuiGrid container spacing={spacing} sx={sx}>
      {children}
    </MuiGrid>
  );
};

// Item component that avoids deprecated props
export const GridItem: React.FC<React.PropsWithChildren<{
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  sx?: any;
}>> = ({ children, xs, sm, md, lg, xl, sx }) => {
  // Convert deprecated grid props to className and sx based approach
  const gridProps: any = {};
  
  // Only include size props if they're defined
  if (xs !== undefined) gridProps.xs = xs;
  if (sm !== undefined) gridProps.sm = sm;
  if (md !== undefined) gridProps.md = md;
  if (lg !== undefined) gridProps.lg = lg;
  if (xl !== undefined) gridProps.xl = xl;
  
  return (
    <MuiGrid {...gridProps} sx={sx} item>
      {children}
    </MuiGrid>
  );
}; 