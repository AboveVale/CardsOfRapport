@echo off
cd /d "C:\Users\brody\Documents\1C. Coding\Websites\CardsOfRapport"
echo Starting server...
start powershell -NoExit -Command "node server.js"
timeout /t 2 >nul
echo Opening browser...
start http://localhost:3000/
exit
