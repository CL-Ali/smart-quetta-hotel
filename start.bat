@echo off
title Smart Quetta Hotel
color 0A

echo.
echo  ==========================================
echo   Smart Quetta Hotel - Starting...
echo  ==========================================
echo.

:: ── Check Node.js ────────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed!
    echo.
    echo  Please download and install Node.js from:
    echo  https://nodejs.org  (download the LTS version)
    echo.
    echo  After installing Node.js, run this file again.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_RAW=%%i
for /f "tokens=1 delims=." %%i in ('node -v') do (
    set NODE_MAJOR=%%i
)
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% LSS 18 (
    color 0C
    echo  [ERROR] Node.js version is too old (v%NODE_MAJOR% found, v18+ required)
    echo.
    echo  Please update Node.js from: https://nodejs.org
    pause
    exit /b 1
)
echo  [OK] Node.js found
echo.

:: ── Create .env if missing ───────────────────────────────────────────────────
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [OK] Created .env from .env.example
    ) else (
        echo NODE_ENV=development > .env
        echo JWT_SECRET=local-dev-secret >> .env
        echo  [OK] Created default .env
    )
) else (
    echo  [OK] .env already exists
)
echo.

:: ── Install dependencies (npm, no pnpm needed) ───────────────────────────────
echo  Installing dependencies (this may take a few minutes on first run)...
echo.
npm install --legacy-peer-deps --loglevel=error
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] npm install failed. Trying with --force...
    echo.
    npm install --force --loglevel=warn
    if %errorlevel% neq 0 (
        echo  [ERROR] Installation failed. Check your internet connection.
        pause
        exit /b 1
    )
)
echo.
echo  [OK] Dependencies installed
echo.

:: ── Rebuild native modules for current Node version ─────────────────────────
echo  Rebuilding native modules (better-sqlite3)...
npm rebuild better-sqlite3 --loglevel=error >nul 2>&1
echo  [OK] Native modules ready
echo.

:: ── Start the app ────────────────────────────────────────────────────────────
echo  ==========================================
echo   App is starting at http://localhost:3000
echo   Press Ctrl+C to stop the server
echo  ==========================================
echo.

:: Open browser after 4 seconds
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

:: Start dev server
npm run dev
