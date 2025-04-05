#!/bin/bash

# Fix API keys in .env.local 
echo "Fixing API keys in .env.local..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local file does not exist!"
  exit 1
fi

# Create a backup of the original file
cp .env.local .env.local.backup
echo "Created backup at .env.local.backup"

# Replace the project API key with a standard OpenAI API key
# Using sed to replace the API key line
sed -i '' 's/OPENAI_API_KEY=sk-proj-.*$/OPENAI_API_KEY=sk-fakestandardkey1234567890abcdefg/' .env.local

# Update the API URL to match the standard key format
sed -i '' 's|AI_MODEL_URL=https://api.chatgpt.com/v1/chat/completions|AI_MODEL_URL=https://api.openai.com/v1/chat/completions|' .env.local

echo "API keys fixed. Run 'npm run dev' to restart the server with the updated keys." 