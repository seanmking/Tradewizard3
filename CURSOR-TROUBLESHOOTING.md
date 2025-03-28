# Cursor IDE Troubleshooting Guide

## Fixing "Extension host terminated unexpectedly" Errors

If you're seeing this error message in Cursor, follow these steps to resolve it:

### Quick Fix Option 1: Run the Optimization Script

```bash
./cursor-optimize.sh
```

This script will:
- Clear Cursor's cache
- Update your .gitignore
- Apply performance optimizations

### Quick Fix Option 2: Start Cursor in Safe Mode

```bash
./safe-cursor.sh
```

This will:
- Close any running instances of Cursor
- Start Cursor with all extensions disabled
- Create a separate profile at ~/cursor-safe-mode

### Option 3: Use Extension Bisect (Recommended by Cursor)

When you see the error popup:
1. Click the "Start Extension Bisect" button
2. Follow the on-screen instructions to identify which extension is causing problems
3. Once identified, disable or uninstall that extension

### Option 4: Manage Your Extensions

```bash
./fix-extensions.sh
```

This script allows you to:
- Backup your extensions
- List all installed extensions
- Get guidance on troubleshooting

### Manual Fix Steps

If none of the above options work:

1. **Close Cursor completely**

2. **Delete Cursor's cache folders**:
   ```bash
   rm -rf ~/Library/Application\ Support/Cursor/Cache/*
   rm -rf ~/Library/Application\ Support/Cursor/CachedData/*
   ```

3. **Check for problematic extensions**:
   Look in `~/Library/Application Support/Cursor/User/extensions` for recently installed extensions that might be causing issues.

4. **Update Cursor to the latest version**

## Additional Performance Improvements

The `.vscode/settings.json` file has been updated with optimized settings to:
- Reduce memory usage
- Limit TypeScript language server operations
- Disable unnecessary features

## If Problems Persist

If you continue to experience issues:
1. Use Cursor in Safe Mode (with `./safe-cursor.sh`)
2. Gradually re-enable extensions one by one until you identify the problematic one
3. Consider reinstalling Cursor completely 