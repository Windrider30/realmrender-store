@echo off
echo.
echo  ========================================
echo   REALMRENDER — Build Installer
echo   Render Your Reality.
echo  ========================================
echo.
cd /d "%~dp0"
echo [0/4] Cleaning old build...
if exist dist rmdir /s /q dist
echo.
echo [1/4] Setting config...
copy /Y config-rr.json config.json
echo.
echo [2/4] Checking dependencies...
call npm install
if errorlevel 1 ( echo ERROR: npm install failed. & pause & exit /b 1 )
echo.
echo [3/4] Building RealmRender installer...
call npx electron-builder --win --config electron-builder-rr.json
if errorlevel 1 ( echo ERROR: Build failed. & pause & exit /b 1 )
echo.
echo [4/4] Done! Installer in dist\ folder.
echo  Look for: RealmRender Setup 1.0.0.exe
echo.
pause
