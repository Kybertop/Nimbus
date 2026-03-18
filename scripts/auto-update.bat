@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

echo [UPDATE] %date% %time% - Kontrolujem zmeny...

for /f %%i in ('git rev-parse HEAD 2^>nul') do set LOCAL=%%i
git fetch origin main 2>nul
for /f %%i in ('git rev-parse origin/main 2^>nul') do set REMOTE=%%i

if "!LOCAL!"=="!REMOTE!" (
    echo [UPDATE] Ziadne zmeny.
    exit /b 0
)

echo [UPDATE] Najdene zmeny! Stahujem...
git pull origin main

echo [UPDATE] Instalam dependencies...
call npm install

echo [UPDATE] Deployujem commandy...
call npm run deploy

where pm2 >nul 2>nul
if !errorlevel! equ 0 (
    echo [UPDATE] Restartujem cez PM2...
    pm2 restart nimbus nimbus-web
) else (
    echo [UPDATE] PM2 nenajdeny. Restartni bota manualne.
)

echo [UPDATE] Hotovo!
endlocal
