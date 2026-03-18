@echo off
REM ============================================
REM Weather Bot — Auto-Update Script (Windows)
REM ============================================
REM Automaticky pullne zmeny z GitHubu a restartne bota.
REM
REM Pouzitie:
REM   Spusti manualne: scripts\auto-update.bat
REM   Alebo cez Task Scheduler na opakovanie
REM ============================================

cd /d "%~dp0\.."

echo [UPDATE] %date% %time% — Kontrolujem zmeny...

REM Uloz aktualny hash
for /f %%i in ('git rev-parse HEAD') do set LOCAL=%%i

REM Fetch zmeny
git fetch origin main 2>nul

for /f %%i in ('git rev-parse origin/main') do set REMOTE=%%i

if "%LOCAL%"=="%REMOTE%" (
    echo [UPDATE] Ziadne zmeny.
    exit /b 0
)

echo [UPDATE] Najdene zmeny! Stahujem...
git pull origin main

REM Check ci sa zmenil package.json
git diff %LOCAL% HEAD --name-only | findstr "package.json" >nul
if %errorlevel%==0 (
    echo [UPDATE] package.json sa zmenil, instalam dependencies...
    call npm install
)

REM Restartni bota
where pm2 >nul 2>nul
if %errorlevel%==0 (
    echo [UPDATE] Restartujem cez PM2...
    pm2 restart weather-bot
) else (
    echo [UPDATE] Restartni bota manualne! Alebo pouzi: npm start
)

echo [UPDATE] Hotovo!
