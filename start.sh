#!/bin/bash

# Define colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting TradeWizard 3.0...${NC}"

# Kill any running processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
pkill -f "next" > /dev/null 2>&1
pkill -f "node" > /dev/null 2>&1

# Remove .next folder for a clean build
echo -e "${BLUE}🗑️  Cleaning build artifacts...${NC}"
rm -rf .next

# Configure environment variables
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export NODE_OPTIONS="--max-old-space-size=4096"

# Warn about Cursor extension issues
echo -e "${YELLOW}⚠️  If you're experiencing 'Extension host terminated unexpectedly':${NC}"
echo -e "${YELLOW}   1. Run ./safe-cursor.sh to start Cursor without extensions${NC}"
echo -e "${YELLOW}   2. Or click 'Start Extension Bisect' when prompted${NC}"

# Start the app
echo -e "${GREEN}🌟 Starting development server...${NC}"
npm run dev 