@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 24 LTS from https://nodejs.org/ & pause & exit /b 1)
call npm ci
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
call npm run setup
if errorlevel 1 goto failed
echo Install the bot using the printed link, then run register.cmd.
pause
exit /b 0
:failed
echo Setup failed. Read the message above. / Kurulum basarisiz.
pause
exit /b 1
