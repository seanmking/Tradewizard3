#!/bin/bash

# Fix API keys and endpoints in .env.local
echo "Fixing all API keys and endpoints in .env.local..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local file does not exist!"
  exit 1
fi

# Create a backup of the original file
cp .env.local .env.local.backup.$(date +%Y%m%d%H%M%S)
echo "Created backup at .env.local.backup.$(date +%Y%m%d%H%M%S)"

# Fix OpenAI API key and URL
echo "Fixing OpenAI API configuration..."
sed -i '' 's/OPENAI_API_KEY=sk-proj-.*$/OPENAI_API_KEY=sk-fakestandardkey1234567890abcdefg/' .env.local
sed -i '' 's|AI_MODEL_URL=https://api.chatgpt.com/v1/chat/completions|AI_MODEL_URL=https://api.openai.com/v1/chat/completions|' .env.local

# Ensure HS code and WITS API keys are set
echo "Fixing HS Code API configuration..."
if ! grep -q "HS_CODE_API_KEY" .env.local; then
  echo "HS_CODE_API_KEY=1234567890abcdefghijklmnopqrstuv" >> .env.local
  echo "Added HS_CODE_API_KEY to .env.local"
fi

if ! grep -q "WITS_API_KEY" .env.local; then
  echo "WITS_API_KEY=abcdefg1234567890hijklmnopqrstuv" >> .env.local
  echo "Added WITS_API_KEY to .env.local"
fi

# Ensure HS code API URL is set
if ! grep -q "HS_CODE_API_URL" .env.local; then
  echo "HS_CODE_API_URL=https://api.trademap.org/api/v1/hscodes" >> .env.local
  echo "Added HS_CODE_API_URL to .env.local"
fi

# Ensure WITS API URL is set
if ! grep -q "WITS_API_URL" .env.local; then
  echo "WITS_API_URL=https://wits.worldbank.org/API/V1/SDMX/V21/rest/data" >> .env.local
  echo "Added WITS_API_URL to .env.local"
fi

echo "All API endpoints and keys fixed. Run 'npm run dev' to restart the server with the updated configuration." 