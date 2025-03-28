#!/bin/bash

echo "🛠️ Optimizing Cursor IDE performance..."

# Create directories if they don't exist
mkdir -p .vscode .cursor

# Create a tempdir for caching
mkdir -p .cursor-cache

# Clear Cursor's cache
echo "🧹 Clearing extension host cache..."
rm -rf ~/Library/Application\ Support/Cursor/Cache/*
rm -rf ~/Library/Application\ Support/Cursor/CachedData/*

# Create a .gitignore entry for cursor-specific files
echo "📝 Updating .gitignore..."
if ! grep -q ".cursor-cache" .gitignore; then
  echo -e "\n# Cursor cache\n.cursor-cache/\n.cursor/extensions.json" >> .gitignore
fi

echo "✅ Cursor performance optimization complete!"
echo "Please restart Cursor for changes to take effect." 