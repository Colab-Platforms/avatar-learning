@echo off
echo Starting Avatar AI Backend...
cd /d "%~dp0backend"
start "" "C:\Users\user\AppData\Local\Programs\Python\Python311\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000
timeout /t 3 >nul
echo Backend running at http://127.0.0.1:8000
echo.
echo Opening chatbot...
start "" "%~dp0frontend\index.html"
