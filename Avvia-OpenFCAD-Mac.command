#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
  echo "Installazione dipendenze OpenFCAD..."
  npm install
fi
echo "Avvio OpenFCAD su macOS..."
npm run desktop
