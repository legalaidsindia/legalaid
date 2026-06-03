@echo off
title LegalAidIndia Case Database Extractor
echo ==========================================
echo    LegalAidIndia Case Database Extractor
echo ==========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found on your system PATH.
    echo Please install Python (3.9+) and check the box "Add Python to PATH"
    echo during installation to run this database compilation script.
    echo.
    pause
    exit /b 1
)

echo [INFO] Running case extraction script...
echo.
python extract_cases.py
echo.
echo ==========================================
echo Process complete. If successful, cases_data.json
echo is now populated inside legalaidindia/js/ folder.
echo ==========================================
echo.
pause
