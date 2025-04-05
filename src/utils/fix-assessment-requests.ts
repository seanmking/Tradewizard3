'use client';

/**
 * This utility logs assessment-related requests for debugging
 */
export function fixAssessmentRequests() {
  if (typeof window === 'undefined') return;
  
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    let url = input.toString();
    
    // Log all assessment-related requests for debugging
    if (url.includes('assessment')) {
      console.log('Assessment-related fetch detected:', url);
    }
    
    return originalFetch(input, init);
  };
  
  // Also look for any XMLHttpRequest to /assessment
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async: boolean = true, username?: string | null, password?: string | null) {
    let urlStr = typeof url === 'string' ? url : url.toString();
    
    // Log all assessment-related XHR requests for debugging
    if (urlStr.includes('assessment')) {
      console.log('Assessment-related XHR detected:', urlStr);
    }
    
    return originalOpen.call(this, method, urlStr, async, username, password);
  };
  
  // Also provide a simple fix for window.check function if it exists
  // This appears to be from a third-party script making these requests
  let originalCheck: Function | undefined = undefined;
  if (typeof (window as any).check === 'function') {
    console.log('Found window.check function, patching it');
    originalCheck = (window as any).check;
    (window as any).check = function(...args: any[]) {
      console.log('check function intercepted, args:', args);
      // Try to prevent it from making further requests by returning a resolved promise
      return Promise.resolve({success: true, data: {status: 'OK'}});
    };
  }
  
  // Return a cleanup function to restore original behavior if needed
  return function cleanup() {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
    
    if (typeof originalCheck === 'function') {
      (window as any).check = originalCheck;
    }
  };
} 