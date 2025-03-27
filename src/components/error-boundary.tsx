'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { 
    hasError: false, 
    error: null 
  };
  
  static getDerivedStateFromError(error: Error) {
    return { 
      hasError: true, 
      error 
    };
  }
  
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("React error boundary caught:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-600 font-semibold mb-2">Something went wrong</h2>
          <pre className="text-sm text-red-800 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    
    return this.props.children;
  }
} 