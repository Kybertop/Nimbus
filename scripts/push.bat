@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

echo.
echo  Nimbus - Push na GitHub
echo  ========================
echo.

echo [1/5] Stahujem najnovsiu verziu...
git pull origin main
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Chyba pri pull! Mozno mas konflikty.
    pause
    exit /b 1
)

echo.
echo [2/5] Zmenene subory:
echo ----------------------
git status --short
echo.

git status --short | findstr /r "." >nul 2>nul
if !errorlevel! neq 0 (
    echo [OK] Ziadne zmeny na pushnutie.
    pause
    exit /b 0
)

echo [3/5] Napis popis zmeny:
echo        Priklady: fix: opraveny bug, feat: novy command
echo.
set /p COMMIT_MSG="        Popis: "

if "!COMMIT_MSG!"=="" (
    echo [ERROR] Popis nemoze byt prazdny!
    pause
    exit /b 1
)

echo.
echo [4/5] Ukladam zmeny...
git add .
git commit -m "!COMMIT_MSG!"

echo.
echo [5/5] Posielam na GitHub...
git push origin main

if !errorlevel! equ 0 (
    echo.
    echo ========================
    echo  [OK] Hotovo! Pushnute na GitHub.
    echo  Server sa aktualizuje do 60 sekund.
    echo ========================
) else (
    echo.
    echo [ERROR] Push zlyhal. Skus: git pull origin main
)

echo.
pause
endlocal
