@echo off
title LegalAidIndia Template Compiler
echo ==========================================
echo    LegalAidIndia Template Compiler
echo ==========================================
echo.

:: Run python using the identified executable path
E:\Python311\python.exe extract_drafts.py
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to run compiler using E:\Python311\python.exe
    echo Attempting default python fallback...
    python extract_drafts.py
)

echo.
echo ==========================================
echo Process complete. If successful, document_templates.json
echo is now populated inside legalaidindia/js/ folder.
echo ==========================================
echo.
pause
