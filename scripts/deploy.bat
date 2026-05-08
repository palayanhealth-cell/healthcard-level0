@echo off
echo ========================================
echo PALAYAN HEALTH CARD - DEPLOY TO VERCEL
echo ========================================
echo.

set PROJECT_DIR=C:\Users\Julius M. Matro\Desktop\palayancard\playancardrevamp\healthcard-app
cd /d "%PROJECT_DIR%"

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo.

echo [2/4] Building project...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build SUCCESS!
echo.

echo [3/4] Deploying to Vercel...
call npx vercel --prod
if errorlevel 1 (
    echo ERROR: Deploy failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Admin Login:
echo   Email: palayanhealth@gmail.com
echo   Password: Admin@2026!
echo   Role: Admin
echo.
pause
