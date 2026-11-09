@echo off
title PTPlay Duoi Hinh Bat Chu -- Thu Tai IQ (Port 5177)
color 0E
echo ===================================================
echo   PTPLAY DUOI HINH BAT CHU -- THU TAI IQ (PORT 5177)
echo ===================================================
cd /d "%~dp0..\.."
echo Starting PTPlay Duoi Hinh Bat Chu on Port 5177...
npm run dev -w @ptplay/duoi-hinh-bat-chu
pause
