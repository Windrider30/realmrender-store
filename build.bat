@echo off
echo.
echo  ========================================
echo   REALMRENDER — Build Installer
echo   Render Your Reality.
echo  ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)

echo.
echo [2/3] Building Windows installer...
call npm run build
if errorlevel 1 (
  echo ERROR: Build failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Done!
echo.
echo  Installer is in the dist\ folder.
echo  Look for: RealmRender Setup 1.0.0.exe
echo.
pause
