@echo off
:: PAL360 — Local Dev Launcher (Windows)
:: Starts FastAPI backend + Next.js frontend.
:: Usage: dev.bat  (or double-click)

setlocal enabledelayedexpansion

set ROOT=%~dp0
set FRONTEND=%ROOT%frontend
set BACKEND=%ROOT%backend
set VENV=%BACKEND%\.venv

echo.
echo   PAL360 -- Local Dev Server
echo   ============================
echo.

:: ── Find available ports ──────────────────────────────────────────────────────
call :find_port 8000 API_PORT
call :find_port 4001 UI_PORT

echo   Backend   -^> http://localhost:%API_PORT%
echo   Frontend  -^> http://localhost:%UI_PORT%
echo   API Docs  -^> http://localhost:%API_PORT%/docs
echo.

:: ── Create .env.local if missing ──────────────────────────────────────────────
if not exist "%FRONTEND%\.env.local" (
  copy "%FRONTEND%\.env.local.example" "%FRONTEND%\.env.local" >nul
  echo   Created .env.local from example.
)

:: Update NEXT_PUBLIC_API_URL
powershell -Command "(Get-Content '%FRONTEND%\.env.local') -replace 'NEXT_PUBLIC_API_URL=.*', 'NEXT_PUBLIC_API_URL=http://localhost:%API_PORT%' | Set-Content '%FRONTEND%\.env.local'"

:: ── Python venv ───────────────────────────────────────────────────────────────
if not exist "%VENV%" (
  echo   Creating Python venv...
  python -m venv "%VENV%"
)

echo   Checking backend deps...
call "%VENV%\Scripts\pip.exe" install -q -r "%BACKEND%\requirements.txt"

echo   Checking frontend deps...
cd "%FRONTEND%" && npm install --silent 2>nul
cd "%ROOT%"

:: ── Launch backend in new window ──────────────────────────────────────────────
start "PAL360 Backend ::%API_PORT%" cmd /k "cd /d "%BACKEND%" && "%VENV%\Scripts\uvicorn.exe" main:app --host 127.0.0.1 --port %API_PORT% --reload --log-level warning"

timeout /t 2 /nobreak >nul

:: ── Launch frontend in new window ────────────────────────────────────────────
start "PAL360 Frontend ::%UI_PORT%" cmd /k "cd /d "%FRONTEND%" && set PORT=%UI_PORT% && npm run dev"

echo.
echo   Both servers launching in separate windows.
echo   Close those windows (or press Ctrl+C in each) to stop.
echo.
pause
goto :eof

:: ── Subroutine: find available TCP port ───────────────────────────────────────
:find_port
set /a _port=%1
:_check
netstat -an | findstr /C:":%_port% " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  set /a _port+=1
  goto _check
)
set "%2=%_port%"
goto :eof
