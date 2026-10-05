@echo off
cd /d "%USERPROFILE%\Desktop\site web"
start "" "C:\Program Files\nodejs\node.exe" serve.mjs
timeout /t 2 /nobreak >nul
start "" "http://localhost:4384"