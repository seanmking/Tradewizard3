#!/bin/bash

# Script to update OpenAI API endpoints in environment files based on API key format
# Project API keys (starting with sk-proj-) should use api.chatgpt.com endpoints
# Standard API keys should use api.openai.com endpoints

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}OpenAI API Endpoint Updater${NC}"
echo "This script updates the API endpoints based on your API key format."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}Warning: .env.local not found. Creating from .env.example${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env.local
  else
    echo -e "${RED}Error: .env.example not found either. Cannot continue.${NC}"
    exit 1
  fi
fi

# Backup current .env.local file
BACKUP_FILE=".env.local.backup.$(date +%Y%m%d%H%M%S)"
cp .env.local $BACKUP_FILE
echo -e "${GREEN}Created backup at $BACKUP_FILE${NC}"

# Get the API key from .env.local
API_KEY=$(grep -o 'OPENAI_API_KEY=.*' .env.local | cut -d '=' -f2)

if [ -z "$API_KEY" ]; then
  echo -e "${RED}Error: No OpenAI API key found in .env.local${NC}"
  echo "Please add your API key to .env.local and run this script again."
  exit 1
fi

# Determine the correct endpoint based on API key format
if [[ $API_KEY == sk-proj-* ]]; then
  echo -e "${GREEN}Detected a project API key (starts with sk-proj-)${NC}"
  echo "Updating endpoint to api.chatgpt.com..."
  
  # Update AI_MODEL_URL to use api.chatgpt.com
  sed -i '' 's|AI_MODEL_URL=https://api.openai.com/v1/chat/completions|AI_MODEL_URL=https://api.chatgpt.com/chat/completions|g' .env.local
  sed -i '' 's|OPENAI_API_URL=https://api.openai.com/v1/chat/completions|OPENAI_API_URL=https://api.chatgpt.com/chat/completions|g' .env.local
else
  echo -e "${GREEN}Detected a standard API key (doesn't start with sk-proj-)${NC}"
  echo "Updating endpoint to api.openai.com..."
  
  # Update AI_MODEL_URL to use api.openai.com
  sed -i '' 's|AI_MODEL_URL=https://api.chatgpt.com/chat/completions|AI_MODEL_URL=https://api.openai.com/v1/chat/completions|g' .env.local
  sed -i '' 's|OPENAI_API_URL=https://api.chatgpt.com/chat/completions|OPENAI_API_URL=https://api.openai.com/v1/chat/completions|g' .env.local
fi

# Update .env.example to include a comment about API endpoints
if [ -f .env.example ]; then
  # Add comment about API endpoints if it doesn't exist already
  if ! grep -q "Project API keys" .env.example; then
    sed -i '' '/^# OpenAI Configuration/a\
# Project API keys (sk-proj-*) should use: AI_MODEL_URL=https://api.chatgpt.com/chat/completions\
# Standard API keys should use: AI_MODEL_URL=https://api.openai.com/v1/chat/completions' .env.example
    echo -e "${GREEN}Updated .env.example with API endpoint information${NC}"
  fi
fi

echo -e "${GREEN}API endpoints updated successfully!${NC}"
echo "You can now restart your application to use the correct endpoints." 