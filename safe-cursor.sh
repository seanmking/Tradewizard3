#!/bin/bash

echo "🛡️ Starting Cursor in Safe Mode (extensions disabled)..."
echo "This will help identify if extensions are causing crashes."

# Find the Cursor application path
CURSOR_PATH="/Applications/Cursor.app"

if [ ! -d "$CURSOR_PATH" ]; then
  # Try to find Cursor in alternative locations
  CURSOR_PATH=$(find /Applications -name "Cursor.app" -type d -maxdepth 2 | head -n 1)
  
  if [ -z "$CURSOR_PATH" ]; then
    echo "❌ Cursor application not found. Please install Cursor or run this from the correct directory."
    exit 1
  fi
fi

# Close existing Cursor instances
echo "📴 Closing any running Cursor instances..."
killall "Cursor" 2>/dev/null

# Wait a moment
sleep 2

# Start Cursor with the disable-extensions flag
echo "🚀 Starting Cursor in Safe Mode..."
open -a "$CURSOR_PATH" --args --disable-extensions --user-data-dir="$HOME/cursor-safe-mode"

echo "✅ Cursor should be starting in Safe Mode"
echo "If Cursor runs stably in this mode, the issue is with one of your extensions." 