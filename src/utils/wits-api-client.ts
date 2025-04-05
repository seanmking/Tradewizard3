// Update the base URL to use our proxy instead of calling WITS API directly
private getBaseUrl(): string {
  // Use our internal proxy to avoid CORS issues
  return '/api/wits-proxy';
}

// Update the API request method to use the proxy endpoints
public async request<T>(endpoint: string, hsCode?: string, format: string = 'json'): Promise<T> {
  try {
    this.logRequest(`GET ${endpoint}`);

    // Build query parameters for the proxy
    const params = new URLSearchParams();
    params.append('endpoint', endpoint);
    if (hsCode) params.append('hsCode', hsCode);
    params.append('format', format);
    
    const url = `${this.getBaseUrl()}?${params.toString()}`;
    
    return this.makeRequestWithRetry<T>(url);
  } catch (error) {
    this.logError(`WITS API Error: ${this.getErrorMessage(error)}`);
    throw error;
  }
} 