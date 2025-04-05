#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}TradeWizard 3.0 GitHub Repository Setup${NC}"
echo "This script will help set up the GitHub repository for technical review."

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) is not installed. Please install it first.${NC}"
    echo "Visit https://cli.github.com/ for installation instructions."
    exit 1
fi

# Check GitHub login status
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to log in to GitHub CLI.${NC}"
    gh auth login
fi

# Verify GitHub username
GITHUB_USERNAME=$(gh api user | jq -r .login)
if [ "$GITHUB_USERNAME" != "seanmking" ]; then
    echo -e "${YELLOW}Warning: You're logged in as ${GITHUB_USERNAME}, not seanmking.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please log in with the correct GitHub account."
        exit 1
    fi
fi

# Create the GitHub repository
echo -e "\n${GREEN}Creating the GitHub repository: tradewizard-3-review${NC}"
echo "This will be a private repository for technical review purposes."

gh repo create "${GITHUB_USERNAME}/tradewizard-3-review" --private --description "Technical review of TradeWizard 3.0 codebase" --confirm

# Add the new remote
echo -e "\n${GREEN}Adding the new GitHub repository as a remote${NC}"
git remote add review "https://github.com/${GITHUB_USERNAME}/tradewizard-3-review.git"

# Create the architecture-blueprint branch
echo -e "\n${GREEN}Creating the architecture-blueprint branch${NC}"
git checkout -b architecture-blueprint

# Path to core architecture files
mkdir -p .core-files

# Copy core architecture files
echo -e "\n${GREEN}Preparing core architecture files${NC}"
cp -r src/mcp/global/hscode-tariff-mcp .core-files/
cp -r src/services/product/hsCodeHierarchy.service.ts .core-files/
cp -r src/ai-agent/extractors/llm-website-extractor.ts .core-files/
cp -r src/components/ui/Grid.tsx .core-files/
cp -r src/components/ui/GridWrapper.tsx .core-files/
cp -r src/contexts/assessment-context.tsx .core-files/
cp MCP-ARCHITECTURE.md .core-files/
cp COMPONENT-RELATIONSHIPS.md .core-files/

# Commit architecture blueprint files
echo -e "\n${GREEN}Committing blueprint files${NC}"
git add .core-files/
git commit -m "Add core architecture blueprint files"

# Push architecture-blueprint branch to the new repository
echo -e "\n${GREEN}Pushing architecture-blueprint branch${NC}"
git push -u review architecture-blueprint

# Switch back to main branch
echo -e "\n${GREEN}Switching back to main branch${NC}"
git checkout main

# Clean up and ensure all files are added
echo -e "\n${GREEN}Preparing main branch${NC}"
rm -rf .core-files

# Make sure all new files are added
git add .
git commit -m "Prepare codebase for technical review" || echo "No changes to commit"

# Push main branch to the new repository
echo -e "\n${GREEN}Pushing main branch${NC}"
git push -u review main

echo -e "\n${GREEN}Repository setup complete!${NC}"
echo "Main branch: Contains the full implementation"
echo "Architecture-blueprint branch: Contains core architecture files"
echo -e "\nView your repository at: https://github.com/${GITHUB_USERNAME}/tradewizard-3-review" 