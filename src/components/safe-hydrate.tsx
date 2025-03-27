'use client';

import { useEffect, useState, ReactNode } from 'react';

interface SafeHydrateProps {
  children: ReactNode;
}

export function SafeHydrate({ children }: SafeHydrateProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted ? <>{children}</> : null;
} 