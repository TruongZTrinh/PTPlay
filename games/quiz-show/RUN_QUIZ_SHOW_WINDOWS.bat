@echo off
title PTPlay Quiz Show -- Do Vui Co Thuong (Port 5176)
color 0B
echo ===================================================
echo   PTPLAY QUIZ SHOW -- DO VUI CO THUONG (PORT 5176)
echo ===================================================
cd /d "%~dp0..\.."
echo Starting PTPlay Quiz Show on Port 5176...
npm run dev -w @ptplay/quiz-show
pause

