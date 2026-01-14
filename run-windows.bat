@echo off
echo Starting Claude Cowork on Windows...
echo.

REM Kill any existing Vite and Electron processes
echo Stopping any existing processes...
taskkill /F /IM electron.exe 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak > nul

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if dist-electron exists, if not transpile
if not exist "dist-electron" (
    echo Transpiling Electron code...
    call npx tsc --project src/electron/tsconfig.json
    if errorlevel 1 (
        echo Failed to transpile Electron code
        pause
        exit /b 1
    )
)

REM Rebuild native modules for Electron on first run
if not exist ".electron-rebuild-done" (
    echo Rebuilding native modules for Electron...
    call npx electron-rebuild
    if errorlevel 1 (
        echo Failed to rebuild native modules
        pause
        exit /b 1
    )
    echo. > .electron-rebuild-done
)

REM Start Vite dev server in background
echo Starting Vite dev server...
start /B cmd /c "npm run dev:react"

REM Wait a bit for Vite to start
timeout /t 3 /nobreak > nul

REM Start Electron app
echo Starting Electron app...
set NODE_ENV=development
npx electron .

REM Cleanup on exit
taskkill /F /FI "WindowTitle eq npm run dev:react*" 2>nul
