export interface AIModelConfig {
  apiKey: string;
  model: string;
  url: string;
  maxTokens: number;
  temperature?: number;
} 