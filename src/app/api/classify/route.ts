import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import axios from 'axios';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Product description is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Log API key info without exposing full key
    const apiKeyPrefix = apiKey.substring(0, 10);
    const apiKeySuffix = apiKey.substring(apiKey.length - 4);
    logger.info(`Using API key ${apiKeyPrefix}...${apiKeySuffix}`);

    // Determine if this is an OpenAI Project API key
    const isProjectKey = apiKey.startsWith('sk-proj-');
    logger.info(`Using ${isProjectKey ? 'Project' : 'Standard'} API key format`);

    // Prepare headers based on key type
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (isProjectKey) {
      headers['OpenAI-Project-Key'] = apiKey;
      logger.info('Using OpenAI Project API authentication');
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
      logger.info('Using standard OpenAI API authentication');
    }

    // Prepare the prompt for classification
    const prompt = `
      Classify the following product with:
      1. A product category
      2. A subcategory if applicable
      3. The most appropriate HS (Harmonized System) code for export

      Product to classify:
      ${description}

      Return a JSON object in this format:
      {
        "hsCode": {
          "code": "6-digit HS code",
          "description": "HS code description",
          "chapter": "2-digit chapter number",
          "heading": "4-digit heading number"
        },
        "confidence": 0.95,
        "category": "main_category",
        "subcategory": "sub_category"
      }
    `;

    try {
      // First attempt with Project API key format
      const response = await axios.post<OpenAIResponse>(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a trade classification expert specializing in HS code assignment.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1
        },
        { headers }
      );

      const content = response.data.choices[0].message.content;
      const result = JSON.parse(content);

      return NextResponse.json(result);
    } catch (apiError: any) {
      // If first attempt fails with 401 and we're using a Project key, try standard format
      if (isProjectKey && apiError.response?.status === 401) {
        logger.info('First authentication attempt failed. Trying alternative Project API authentication...');

        // Try with standard Bearer token format
        const altHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };

        const retryResponse = await axios.post<OpenAIResponse>(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are a trade classification expert specializing in HS code assignment.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1
          },
          { headers: altHeaders }
        );

        const retryContent = retryResponse.data.choices[0].message.content;
        const retryResult = JSON.parse(retryContent);

        return NextResponse.json(retryResult);
      }

      // If retry also failed or wasn't attempted, throw the original error
      throw apiError;
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    logger.error(`Error in classification API: ${errorMessage}`);
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed with OpenAI API' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error classifying product', details: errorMessage },
      { status: 500 }
    );
  }
} 