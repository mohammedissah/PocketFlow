@echo off
title PocketFlow Local Server
cd /d "%~dp0"
echo Starting PocketFlow local server...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
