#!/bin/bash

echo "===================="
echo "Running TypeScript Check..."
echo "===================="
pnpm typecheck

if [ $? -eq 0 ]; then
    echo ""
    echo "===================="
    echo "✅ TypeScript check passed! Building project..."
    echo "===================="
    pnpm build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "===================="
        echo "✅ Build succeeded! Project is ready for deployment."
        echo "===================="
    else
        echo ""
        echo "===================="
        echo "❌ Build failed. Check the errors above."
        echo "===================="
        exit 1
    fi
else
    echo ""
    echo "===================="
    echo "❌ TypeScript check failed. Fix the errors above before building."
    echo "===================="
    exit 1
fi
