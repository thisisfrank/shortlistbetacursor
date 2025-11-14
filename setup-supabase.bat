@echo off
echo ========================================
echo Super Recruiter - Supabase Setup
echo ========================================
echo.

echo Checking current setup...
echo.

REM Check if .env file exists
if exist ".env" (
    echo ✓ .env file found
) else (
    echo ⚠  No .env file found
    echo    Creating .env.example template...
    echo.
    echo # Supabase Configuration > .env.example
    echo VITE_SUPABASE_URL=your_supabase_project_url >> .env.example
    echo VITE_SUPABASE_ANON_KEY=your_supabase_anon_key >> .env.example
    echo. >> .env.example
    echo # Optional: Additional API Keys >> .env.example
    echo VITE_APIFY_API_TOKEN=your_apify_api_token >> .env.example
    echo VITE_SCRAPINGDOG_API_KEY=your_scrapingdog_api_key >> .env.example
    echo.
    echo Please copy .env.example to .env and fill in your values
)

echo.
echo ========================================
echo Setup Steps:
echo ========================================
echo.
echo 1. Create a Supabase project at https://supabase.com
echo 2. Get your project URL and anon key from Settings > API
echo 3. Create a .env file with your Supabase credentials
echo 4. Run database migrations
echo 5. Deploy edge functions
echo 6. Test the application
echo.
echo For detailed instructions, see SUPABASE_SETUP.md
echo.
pause 