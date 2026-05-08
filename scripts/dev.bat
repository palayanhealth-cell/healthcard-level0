@echo off
echo ========================================
echo PALAYAN HEALTH CARD - DEV SERVER
echo ========================================
echo.

cd /d "C:\Users\Julius M. Matro\Desktop\palayancard\playancardrevamp\healthcard-app"

echo Starting development server...
echo.
echo URLs:
echo   Local:   http://localhost:5173
echo   Network: http://YOUR_IP:5173
echo.
echo Admin Login:
echo   Email:    palayanhealth@gmail.com
echo   Password: Admin@2026!
echo   Role:     Admin
echo.
echo Press Ctrl+C to stop
echo.

call npm run dev
