# TradeWizard 3.0 GitHub Setup Guide

This guide walks you through the process of pushing the TradeWizard 3.0 codebase to GitHub for technical review.

## Files Created for GitHub Repository

1. **Documentation Files**
   - `README.md`: Project overview, architecture, and setup instructions
   - `MCP-ARCHITECTURE.md`: Details on Model Context Protocol design
   - `COMPONENT-RELATIONSHIPS.md`: UI and service component interactions
   - `REVIEWER-GUIDE.md`: Instructions for technical reviewers
   - `CRITICAL-ISSUES.md`: Known critical issues (already exists)
   - `FIXES.md`: Documentation of fixed issues (already exists)

2. **Configuration Files**
   - `.env.example`: Template for environment configuration
   - `.gitignore`: Updated to exclude sensitive and unnecessary files

3. **GitHub Templates**
   - `.github/ISSUE_TEMPLATE/bug_report.md`: Bug report template
   - `.github/ISSUE_TEMPLATE/feature_request.md`: Feature request template
   - `.github/ISSUE_TEMPLATE/architecture_improvement.md`: Architecture improvement suggestion template

4. **Setup Scripts**
   - `setup-github-repo.sh`: Script to automate repository setup
   - `fix-api-keys.sh`: Helper script for API key configuration (already exists)

## Setup Process

### Prerequisites

1. Install GitHub CLI if not already installed:
   - **macOS**: `brew install gh`
   - **Windows**: `winget install --id GitHub.cli`
   - **Linux**: `apt install gh` (Debian/Ubuntu) or see [CLI installation docs](https://github.com/cli/cli#installation)

2. Make sure you are logged in with the correct GitHub account (seanmking):
   ```bash
   gh auth login
   ```

### Repository Setup Steps

1. Make the setup script executable (if not already):
   ```bash
   chmod +x setup-github-repo.sh
   ```

2. Review the setup script to ensure it does what you expect:
   ```bash
   cat setup-github-repo.sh
   ```
   
   The script will:
   - Create a new private GitHub repository named "tradewizard-3-review" under the seanmking account
   - Set up two branches: main and architecture-blueprint
   - Copy core files to the architecture-blueprint branch
   - Push both branches to the new repository

3. Run the setup script:
   ```bash
   ./setup-github-repo.sh
   ```

4. After the script completes, verify your repository on GitHub:
   - Visit https://github.com/seanmking/tradewizard-3-review
   - Check that both branches are present
   - Verify that documentation files are visible

### Manual Approach (If Script Fails)

If the script encounters issues, you can perform these steps manually:

1. Create a new repository on GitHub:
   ```bash
   gh repo create seanmking/tradewizard-3-review --private --description "Technical review of TradeWizard 3.0 codebase"
   ```

2. Add the new repository as a remote:
   ```bash
   git remote add review https://github.com/seanmking/tradewizard-3-review.git
   ```

3. Push the main branch:
   ```bash
   git push -u review main
   ```

4. Create and push the architecture-blueprint branch:
   ```bash
   git checkout -b architecture-blueprint
   mkdir -p .core-files
   
   # Copy core files - adjust paths as needed
   cp -r src/mcp/global/hscode-tariff-mcp .core-files/
   cp -r src/services/product/hsCodeHierarchy.service.ts .core-files/
   cp -r src/ai-agent/extractors/llm-website-extractor.ts .core-files/
   cp -r src/components/ui/Grid.tsx .core-files/
   cp -r src/components/ui/GridWrapper.tsx .core-files/
   cp -r src/contexts/assessment-context.tsx .core-files/
   cp MCP-ARCHITECTURE.md .core-files/
   cp COMPONENT-RELATIONSHIPS.md .core-files/
   
   git add .core-files/
   git commit -m "Add core architecture blueprint files"
   git push -u review architecture-blueprint
   ```

## Post-Setup Actions

After your repository is set up:

1. Configure branch protection rules in GitHub (optional):
   - Go to Settings > Branches
   - Add rule for main branch to require pull requests for changes

2. Review the repository settings:
   - Enable Issues if disabled
   - Configure collaborator access as needed

3. Share the repository with technical reviewers:
   - Invite collaborators via Settings > Collaborators
   - Or share the repository URL with appropriate permissions

4. Direct reviewers to `REVIEWER-GUIDE.md` for instructions

## Troubleshooting

If you encounter issues with the setup process:

1. **GitHub Authentication Errors**:
   - Verify your GitHub CLI authentication: `gh auth status`
   - Re-authenticate if needed: `gh auth login`

2. **Permission Errors**:
   - Check your GitHub account permissions
   - Ensure you're logged in as the seanmking account

3. **Push Errors**:
   - If you encounter errors pushing large files, check your `.gitignore` file
   - Remove any large build artifacts, node_modules, or environment files

4. **Script Execution Errors**:
   - Make sure the script is executable: `chmod +x setup-github-repo.sh`
   - Run with bash explicitly: `bash setup-github-repo.sh`

For additional assistance, refer to GitHub documentation or contact your technical team lead. 