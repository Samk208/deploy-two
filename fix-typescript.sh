#!/bin/bash
# TypeScript Fix Script - Apply systematic fixes to all files

echo "Starting TypeScript fixes..."

# Backup current state
git add -A
git commit -m "Backup before TypeScript fixes - $(date +%Y-%m-%d-%H%M%S)" || true
git tag fix-backup-$(date +%Y-%m-%d-%H%M%S)

echo "✅ Backup created"

# Fix count
FIXED=0

# Function to replace .single() with .maybeSingle() in a file
fix_single_to_maybe() {
    local file=$1
    if grep -q "\.single()" "$file"; then
        sed -i 's/\.single()/\.maybeSingle()/g' "$file"
        echo "  ✓ Fixed .single() in $file"
        ((FIXED++))
    fi
}

# Fix all API routes
echo "Fixing API routes..."
find app/api -name "*.ts" -type f | while read file; do
    fix_single_to_maybe "$file"
done

echo "Total files fixed: $FIXED"
echo "✅ TypeScript fixes applied"

# Run type check
echo "Running type check..."
pnpm typecheck

echo "Fix complete!"
