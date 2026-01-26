#!/bin/bash

set -e

MODE=${1:-new}

echo "=============================================="
echo "Build Statistics JSON Export - Test Runner"
echo "Mode: $MODE"
echo "=============================================="

# Build Vite before running tests (required for vitest to work)
echo "Building Vite..."
pnpm build

if [ "$MODE" = "base" ]; then
    echo ""
    echo "BASE MODE: Running baseline tests (excluding new feature)"
    echo ""
    
    pnpm vitest run packages/vite/src/node/__tests__/build.spec.ts
    
    echo ""
    echo "PASS: Baseline is stable"
    exit 0
    
elif [ "$MODE" = "new" ]; then
    echo ""
    echo "NEW MODE: Running new feature tests only"
    echo ""
    
    if [ ! -f "packages/vite/src/node/__tests__/buildStats.spec.ts" ]; then
        echo "ERROR: buildStats.spec.ts does not exist"
        exit 1
    fi
    
    pnpm vitest run packages/vite/src/node/__tests__/buildStats.spec.ts
    
    echo ""
    echo "PASS: New feature tests passed"
    exit 0
else
    echo "ERROR: Unknown mode: $MODE"
    echo ""
    echo "Usage: ./test.sh [base|new]"
    echo "  base - Run baseline tests"
    echo "  new  - Run new feature tests"
    exit 1
fi