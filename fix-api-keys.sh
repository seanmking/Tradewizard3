#!/bin/bash

# Script to check and fix API key configuration issues

echo "TradeWizard 3.0 - API Key Configuration Checker"
echo "==============================================="

ENV_FILE=".env.local"
TEMPLATE_FILE=".env.example"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found!"
  
  if [ -f "$TEMPLATE_FILE" ]; then
    echo "Creating from template $TEMPLATE_FILE..."
    cp "$TEMPLATE_FILE" "$ENV_FILE"
  else
    echo "Creating new $ENV_FILE file..."
    touch "$ENV_FILE"
  fi
fi

# Function to check and update an API key
check_api_key() {
  KEY_NAME=$1
  KEY_DESCRIPTION=$2
  
  if grep -q "^$KEY_NAME=" "$ENV_FILE"; then
    KEY_VALUE=$(grep "^$KEY_NAME=" "$ENV_FILE" | cut -d '=' -f2)
    if [ -z "$KEY_VALUE" ]; then
      echo "⚠️  $KEY_DESCRIPTION is empty"
    else
      echo "✅ $KEY_DESCRIPTION is configured"
    fi
  else
    echo "❌ $KEY_DESCRIPTION is missing"
    echo "$KEY_NAME=" >> "$ENV_FILE"
    echo "   Added $KEY_NAME to $ENV_FILE. Please edit and add your key."
  fi
}

echo "Checking API keys configuration..."

# Check OpenAI API keys
check_api_key "OPENAI_API_KEY" "OpenAI API Key"
check_api_key "AI_MODEL_URL" "OpenAI Model URL"
check_api_key "AI_MODEL_NAME" "OpenAI Model Name"

# Check Perplexity API keys
check_api_key "PERPLEXITY_API_KEY" "Perplexity API Key"
check_api_key "PERPLEXITY_URL" "Perplexity API URL"
check_api_key "PERPLEXITY_MODEL" "Perplexity Model"

# Check HS Code and WITS API keys
check_api_key "HS_CODE_API_KEY" "HS Code API Key"
check_api_key "WITS_API_KEY" "WITS API Key"

# Check MCP configuration
check_api_key "COMPLIANCE_MCP_URL" "Compliance MCP URL"
check_api_key "MARKET_INTELLIGENCE_MCP_URL" "Market Intelligence MCP URL"

echo ""
echo "Note: For OpenAI Project API keys (starting with 'sk-proj-'),"
echo "      ensure AI_MODEL_URL is set to 'https://api.chatgpt.com/v1/chat/completions'"
echo ""
echo "For standard OpenAI API keys,"
echo "      ensure AI_MODEL_URL is set to 'https://api.openai.com/v1/chat/completions'"

echo ""
echo "Configuration check complete. Please update any missing keys in $ENV_FILE"
echo "After updating the keys, restart the application with: npm run dev" 