@echo off
chcp 65001 >nul
title Warennummern-Checker (Destatis Sova-Leitdatei)
echo ========================================================
echo   Warennummern-Checker - Lokale Offline-Pruefung
echo ========================================================
echo.
echo Starte lokalen Entwicklungsserver...
cd /d "C:\EORI_Check"

start "" http://localhost:5174/
call npm run dev
pause
