@echo off

echo [WATCH] Nimbus auto-updater spusteny.
echo [WATCH] Kontrolujem GitHub kazdych 60 sekund...
echo.

:loop
call "%~dp0auto-update.bat"
echo.
timeout /t 60 /nobreak >nul
goto loop
