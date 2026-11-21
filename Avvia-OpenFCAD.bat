@echo off
cd /d "%~dp0"
echo Avvio di OpenFCAD (Italiano)...
if not exist "dist\index.html" (
    echo Build iniziale in corso...
    call npm run build
)
npx electron .
