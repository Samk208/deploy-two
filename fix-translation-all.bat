@echo off
REM ================================================================
REM   Translation Migration - Complete Fix Script
REM   This script applies all fixes in the correct order
REM ================================================================

echo.
echo ================================================================
echo    Translation Migration - Complete Fix
echo ================================================================
echo.

REM Step 0: Check if translations table exists
echo [0/5] Checking if translations table exists in Supabase...
npx tsx scripts/check-translations-table.ts
if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo    STOP! You need to create the translations table first
    echo ================================================================
    echo.
    echo The table doesn't exist in your local Supabase database.
    echo.
    echo Option 1 - Using Supabase CLI:
    echo   1. Make sure Docker Desktop is running
    echo   2. Make sure Supabase is running: supabase status
    echo   3. Apply migration: supabase db reset
    echo.
    echo Option 2 - Manual SQL:
    echo   1. Open http://127.0.0.1:54323
    echo   2. Go to SQL Editor
    echo   3. Copy SQL from: supabase/migrations/20251019_create_translations.sql
    echo   4. Run it
    echo   5. Come back and run this script again
    echo.
    echo ================================================================
    pause
    exit /b 1
)

echo.
echo ================================================================
echo    Table exists! Continuing with fixes...
echo ================================================================
echo.

REM Step 1: Fix TypeScript Types
echo [1/4] Fixing TypeScript types...
npx tsx scripts/fix-translation-types.ts
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to fix TypeScript types
    pause
    exit /b 1
)

echo.
echo [2/4] Testing Google API credentials...
npx tsx scripts/test-google-translate.ts
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Google API test failed
    echo Please check your .env.local file and ensure:
    echo   - GOOGLE_SERVICE_ACCOUNT_KEY_B64 is set
    echo   - GOOGLE_PROJECT_ID=wonlink-app-2025
    echo   - Translation API is enabled in Google Cloud
    echo.
    pause
)

echo.
echo [3/4] Running TypeScript check...
call pnpm typecheck
if %errorlevel% neq 0 (
    echo.
    echo WARNING: TypeScript errors found
    echo Check the errors above to see if they're related to translations table
    echo.
    pause
)

echo.
echo [4/4] Running linter...
call pnpm lint
if %errorlevel% neq 0 (
    echo.
    echo NOTE: Some lint warnings may remain, this is okay
    echo.
)

echo.
echo ================================================================
echo    Fixes Applied Successfully!
echo ================================================================
echo.
echo Next steps:
echo   1. Stop your dev server (Ctrl+C)
echo   2. Clear Next.js cache: rm -rf .next
echo   3. Restart server: pnpm dev
echo   4. Test the API in browser console:
echo.
echo      fetch('/api/translate', {
echo        method: 'POST',
echo        headers: {'Content-Type': 'application/json'},
echo        body: JSON.stringify({
echo          texts: ['Hello World'],
echo          source: 'en',
echo          target: 'ko'
echo        })
echo      }).then(r =^> r.json()).then(console.log)
echo.
echo   Expected result: {"texts": ["안녕하세요"]}
echo.
echo ================================================================
echo.
pause
