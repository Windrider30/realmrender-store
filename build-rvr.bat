@echo off
echo.
echo  ========================================
echo   RED VELVET REVOLVER — Build Installer
echo   Editorial-Grade AI Design Framework
echo  ========================================
echo.
cd /d "%~dp0"
echo [0/4] Cleaning old build...
if exist dist rmdir /s /q dist
echo.
echo [1/4] Setting config...
copy /Y config-rvr.json config.json
echo.
echo [2/4] Checking dependencies...
call npm install
if errorlevel 1 ( echo ERROR: npm install failed. & pause & exit /b 1 )
echo.
echo [3/4] Building Red Velvet Revolver installer...
call npx electron-builder --win --config electron-builder-rvr.json
if errorlevel 1 ( echo ERROR: Build failed. & pause & exit /b 1 )
echo.
echo [4/4] Done! Installer in dist\ folder.
echo  Look for: Red Velvet Revolver Setup 1.0.0.exe
echo.
pause
