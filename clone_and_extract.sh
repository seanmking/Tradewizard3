#!/bin/bash

# Exit on any error
set -e

# Repository URLs
REPO_URL="https://github.com/seanmking/tradewizard-digital-footprint-analyzer.git"
CLONE_DIR="temp_repo"

# Create temp directory
mkdir -p $CLONE_DIR

echo "Cloning repository..."
git clone $REPO_URL $CLONE_DIR

# Check if clone was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to clone repository"
    rm -rf $CLONE_DIR
    exit 1
fi

echo "Repository cloned successfully."

# Create directories if they don't exist
mkdir -p src/ai-agent/services
mkdir -p src/utils
mkdir -p src/models

# Copy the needed files
echo "Copying files..."

# Updated paths based on the repository structure
if [ -f "$CLONE_DIR/src/ai-agent/services/intelligence-service.ts" ]; then
    cp "$CLONE_DIR/src/ai-agent/services/intelligence-service.ts" "src/ai-agent/services/"
    echo "Copied intelligence-service.ts"
else
    echo "Warning: intelligence-service.ts not found"
fi

if [ -f "$CLONE_DIR/src/ai-agent/extractors/website-extractor.ts" ]; then
    cp "$CLONE_DIR/src/ai-agent/extractors/website-extractor.ts" "src/ai-agent/services/website-analyzer.service.ts"
    echo "Copied website-extractor.ts as website-analyzer.service.ts"
else
    echo "Warning: website-extractor.ts not found"
fi

if [ -f "$CLONE_DIR/src/utils/logger.ts" ]; then
    cp "$CLONE_DIR/src/utils/logger.ts" "src/utils/"
    echo "Copied logger.ts"
else
    echo "Warning: logger.ts not found"
fi

if [ -f "$CLONE_DIR/src/database/models/business-profile.model.ts" ]; then
    cp "$CLONE_DIR/src/database/models/business-profile.model.ts" "src/models/"
    echo "Copied business-profile.model.ts"
else
    echo "Warning: business-profile.model.ts not found"
fi

# Clean up
echo "Cleaning up..."
rm -rf $CLONE_DIR

echo "Done! Files have been extracted to the appropriate directories." 