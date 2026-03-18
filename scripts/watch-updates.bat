@echo off
REM ============================================
REM Weather Bot — Auto-Update Watcher (Windows)
REM ============================================
REM Bezi na pozadi a kazdych 60 sekund checkne GitHub.
REM Ak su zmeny, pullne a restartne bota.
REM
REM Spusti: scripts\watch-updates.bat
REM Nechaj bezat v samostatnom CMD okne.
REM ============================================

:loop
call "%~dp0auto-update.bat"
echo.
echo [WATCH] Cakam 60 sekund...
timeout /t 60 /nobreak >nul
goto loop
