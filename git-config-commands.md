# Git Configuration for Line Endings

To ensure consistent line endings across all environments, run the following Git commands:

## Global Configuration (Recommended)

```bash
# Configure Git to automatically handle line endings
git config --global core.autocrlf input

# Ensure Git uses LF internally
git config --global core.eol lf

# Warn about whitespace issues
git config --global core.whitespace trailing-space,space-before-tab
```

## Project-Specific Configuration (Alternative)

If you prefer to only apply these settings to this project:

```bash
# Configure Git to automatically handle line endings for this repository
git config core.autocrlf input

# Ensure Git uses LF internally for this repository
git config core.eol lf

# Warn about whitespace issues for this repository
git config core.whitespace trailing-space,space-before-tab
```

## Checking Your Configuration

To verify your Git configuration:

```bash
# Check global settings
git config --global --list | grep core

# Check repository-specific settings
git config --list | grep core
```

## Fixing Line Endings in Existing Files

If you need to fix line endings in existing files:

```bash
# Normalize all text files in the repository
git add --renormalize .

# Commit the changes
git commit -m "Normalize line endings"
```
