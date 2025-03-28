#!/bin/bash

echo "🔍 Cursor Extension Troubleshooter"
echo "This script will help you manage your Cursor extensions"

# Define the extension directory based on macOS
EXTENSION_DIR="$HOME/Library/Application Support/Cursor/User/extensions"

if [ ! -d "$EXTENSION_DIR" ]; then
  echo "❌ Could not find the extensions directory at: $EXTENSION_DIR"
  echo "Your Cursor installation may be in a non-standard location."
  exit 1
fi

# Create a backup of the extensions directory
backup_extensions() {
  echo "📦 Creating backup of your extensions..."
  BACKUP_DIR="$HOME/cursor-extensions-backup-$(date +%Y%m%d%H%M%S)"
  cp -r "$EXTENSION_DIR" "$BACKUP_DIR"
  echo "✅ Extensions backed up to: $BACKUP_DIR"
}

# List all installed extensions
list_extensions() {
  echo "📋 Currently installed extensions:"
  find "$EXTENSION_DIR" -mindepth 1 -maxdepth 1 -type d | while read dir; do
    basename "$dir"
  done
}

# Main menu
echo ""
echo "Please choose an option:"
echo "1) Backup all extensions"
echo "2) List installed extensions"
echo "3) Exit"
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    backup_extensions
    ;;
  2)
    list_extensions
    ;;
  3)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "✅ Operation completed."
echo "To resolve extension crashes, try using the safe-cursor.sh script to start Cursor without extensions."
echo "When using Cursor normally, try the 'Start Extension Bisect' option when prompted by the error message." 