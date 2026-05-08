@echo off
echo ========================================
echo PALAYAN HEALTH CARD - BUILD CHECK
echo ========================================
echo.

cd /d "C:\Users\Julius M. Matro\Desktop\palayancard\playancardrevamp\healthcard-app"

echo [1/2] Installing dependencies...
call npm install
echo.

echo [2/2] Building project (checking for errors)...
call npm run build
if errorlevel 1 (
    echo.
    echo ========================================
    echo BUILD FAILED - Fix errors above
echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD SUCCESSFUL! Ready for deployment
echo ========================================
pause
