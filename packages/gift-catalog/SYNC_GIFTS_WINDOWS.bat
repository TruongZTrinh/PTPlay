@echo off
setlocal
cd /d "%~dp0"
echo [PTPlay] Fetch current gift metadata (all regions + VN)...
call npm run gifts:sync
if errorlevel 1 (
  echo ERROR: metadata sync failed. Check internet access.
  pause
  exit /b 1
)
echo.
echo [PTPlay] Download public ZIP of gift icons? (May be large)
choice /C YN /M "Download icons ZIP"
if errorlevel 2 goto END
call npm run gifts:icons
:END
echo.
echo Open catalog at: npm run gifts:browse
pause
