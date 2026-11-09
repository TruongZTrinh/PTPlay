@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title PTPlay Admin Center - Central Management Web for All Games

echo ========================================================
echo   PTPLAY ADMIN CENTER - UNIFIED WEB MANAGEMENT
echo   Games: Mini War Arena (5173) & Cafe Moe (5174)
echo ========================================================
echo [PTPlay Admin] Working directory: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not found on your system PATH!
  echo Please install Node.js LTS from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

:: Check and start Live Bridge if not running
set "BRIDGE_DIR=..\bridge"
if not exist "%BRIDGE_DIR%" set "BRIDGE_DIR=..\PTPlay-Mini-War-Arena\ptplay-live-bridge"
if exist "%BRIDGE_DIR%" (
  echo [PTPlay Admin] Checking PTPlay Live Bridge at: %BRIDGE_DIR%
  if not exist "%BRIDGE_DIR%\node_modules\ws" (
    echo [PTPlay Admin] Installing Bridge dependencies...
    call npm install --prefix "%BRIDGE_DIR%"
  )
  echo [PTPlay Admin] Ensuring PTPlay Live Bridge is running on Port 8088...
  start "PTPlay Live Bridge [Port 8088]" /D "%BRIDGE_DIR%" cmd /c "npm start"
)

echo.
echo [PTPlay Admin] Starting PTPlay Admin Web Server on Port 8080...
echo [PTPlay Admin] Opening browser at http://localhost:8080 ...

start "PTPlay Admin Browser" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8080"

node src/server.js

pause

