// This file helps identify if there's an older script causing the 404 errors
console.log('assessment.js loaded');

// Log information about what might be happening
(function() {
  console.log('Checking for polling requests to /assessment');
  
  // We'll log all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = input.toString();
    if (url.includes('/assessment')) {
      console.log('FETCH DETECTED:', {
        url,
        stack: new Error().stack
      });
    }
    return originalFetch(input, init);
  };
  
  // If there's a check function that's causing the repeated requests
  // we'll attempt to find it
  if (typeof window.check === 'function') {
    console.log('Found window.check function that might be causing requests');
    const originalCheck = window.check;
    window.check = function(...args) {
      console.log('check function called with:', args);
      return originalCheck.apply(this, args);
    };
  }
})(); 