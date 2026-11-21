@echo off
title OpenFCAD - Pubblicazione Sicura su GitHub + Compilazione Installer (.exe e .dmg)
cd /d "%~dp0"

echo ============================================================================
echo   OPENFCAD - PUBBLICAZIONE SU GITHUB E GENERAZIONE INSTALLER (.EXE / .DMG)
echo ============================================================================
echo.
echo Prima di continuare, assicurati di aver creato un nuovo repository VUOTO su:
echo   https://github.com/new
echo (Non spuntare "Add a README file", ".gitignore" o "Choose a license")
echo.

set /p REPO_URL="Incolla qui l'URL del tuo repository GitHub (es. https://github.com/TuoUsername/OpenFCAD.git): "

if "%REPO_URL%"=="" (
  echo [ERRORE] Nessun URL inserito. Operazione annullata.
  pause
  exit /b 1
)

echo.
echo [PRIVACY] Imposta il nome autore e l'email per i commit Git di questo progetto.
echo Per NON esporre la tua email personale, premi semplicemente INVIO per usare
echo l'alias "OpenFCAD" e l'email anonima "openfcad@users.noreply.github.com".
echo.
set "GIT_NAME=OpenFCAD"
set "GIT_EMAIL=openfcad@users.noreply.github.com"
set /p GIT_NAME="Nome autore commit [Invio = OpenFCAD]: "
set /p GIT_EMAIL="Email commit noreply [Invio = openfcad@users.noreply.github.com]: "

echo.
echo [1/5] Inizializzazione repository Git locale e configurazione autore anonimo...
if not exist ".git" (
  git init
  git branch -M main
)
git config user.name "%GIT_NAME%"
git config user.email "%GIT_EMAIL%"

echo [2/5] Aggiunta dei file del progetto OpenFCAD (esclusi node_modules, dist, release)...
git add .
git commit -m "Release OpenFCAD v2026.1.0 - CAD 2D/3D Multi-Language + Windows/macOS Installers"

echo [3/5] Collegamento al repository remoto GitHub...
git remote remove origin >nul 2>&1
git remote add origin "%REPO_URL%"

echo [4/5] Invio del codice su GitHub (branch main)...
git push -u origin main

echo [5/5] Creazione e invio del tag v2026.1.0 per generare la GitHub Release automatica...
git tag -f v2026.1.0
git push -f origin v2026.1.0

echo.
echo ============================================================================
echo   COMPLETATO!
echo   Vai sul tuo repository GitHub nella scheda "Actions" e nella sezione "Releases":
echo   GitHub sta compilando automaticamente su server puliti:
echo     - OpenFCAD-Setup-2026.1.0.exe (Windows)
echo     - OpenFCAD-2026.1.0-mac-arm64.dmg (Mac Apple Silicon M1/M2/M3/M4)
echo     - OpenFCAD-2026.1.0-mac-x64.dmg (Mac Intel)
echo ============================================================================
pause
