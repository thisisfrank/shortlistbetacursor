@echo off
echo ========================================
echo   DEPLOYMENT STATUS CHECKER
echo ========================================

REM Check if we're in the right directory
if not exist "project" (
    echo ERROR: Not in project root directory!
    echo Please run from project-bolt-beta2/
    exit /b 1
)

if not exist ".git" (
    echo ERROR: Not a git repository!
    exit /b 1
)

echo ✓ In correct project root directory

echo.
echo GIT STATUS:
git status --short

echo.
echo BRANCH STATUS:
git status | findstr "Your branch"

echo.
echo ENVIRONMENT CHECK:
if exist "project\.env" (
    echo ✓ Environment file found: project\.env
) else (
    echo WARNING: No .env file found in project/
)

echo.
echo ========================================
echo TO DEPLOY: git add . ^&^& git commit -m "description" ^&^& git push
echo ======================================== 