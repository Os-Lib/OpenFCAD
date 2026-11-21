# OpenFCAD — CAD 2D/3D Desktop & Web (Multi-Language)

**OpenFCAD** è una stazione CAD 2D/3D completa con motore geometrico di precisione, modellazione solida 3D CSG, gestione Layer/Blocchi/Quote/Tabelle, Spazio Carta interattivo, import/export standard `.dxf` / `.ofcad.json` / `.svg` / `.stl`, supporto **multilingua universale** (14 lingue integrate + oltre 100 lingue ISO + import/export pacchetti `.lang.json`) e installer nativo Windows `.exe`.

---

## Caratteristiche Principali / Key Features

- **Motore di Disegno e Modifica 2D (97 Comandi)**: `LINEA`, `PLINEA` (con archi/bulge), `CERCHIO` (CR, Diametro, 2P, 3P), `ARCO` (3P, Centro), `RETTANGOLO`, `POLIGONO`, `ELLISSE`, `SPLINE`, `XLINEA`, `RAGGIO`, `PUNTO`, `ANELLO`, `DIVIDI`, `MISURADIV`, `TRATTEGGIO` (15 motivi tecnici), `NUVOLAR`, `SPOSTA`, `COPIA`, `RUOTA`, `SPECCHIO`, `SCALA`, `TAGLIA`, `ESTENDI`, `OFFSET`, `RACCORDO`, `CIMA`, `STIRA` (crossing), `SPEZZA`, `UNISCI`, `ESPLODI`, `ALLINEA`, `ELIMINADUP`, `SELEZIONASIMILI`, `SERIE` (rettangolare e polare), `CORRISPROP`.
- **Precisione CAD**: 10 modalità **OSNAP**, **OTRACK** (`F11`), **ORTO** (`F8`), **POLARE** (`F10`), **Input Dinamico** (`F12`), Grip Editing interattivo.
- **Modellazione Solida 3D & CSG**: 6 primitive 3D (`BOX`, `CYLINDER`, `SPHERE`, `CONE`, `PYRAMID`, `TORUS`), `ESTRUDI`, `RIVOLUZIONE`, operazioni booleane CSG (`UNIONE`, `SOTTRAI`, `INTERSECA`), viewport WebGL con ViewCube e 4 stili visuali.
- **Annotazioni, Layer, Blocchi e Parametrico**: Gestore Proprietà Layer completo, Tavolozza Blocchi + creazione blocchi utente, Testo/MText, 5 tipi di Quote, Direttrici, Tabelle, Vincoli Geometrici e Variabili Parametriche con espressioni matematiche.
- **Spazio Carta & Output**: Layout multipli ISO (A4, A3, A2, A1) con cartiglio e finestre di layout scalabili, Stampa PDF/SVG/PNG con stili `.ctb`, import/export `.dxf`, `.ofcad.json`, `.svg` e `.stl`.
- **Qualunque Lingua (Universal i18n)**:
  - **14 lingue complete integrate** selezionabili dalla barra del titolo (`🌐`): Italiano, English, Español, Français, Deutsch, Português, Русский, 中文 (简体), 日本語, 한국어, العربية (con supporto RTL), Polski, Nederlands, Türkçe.
  - **Catalogo di 100+ lingue mondiali ISO** in `OPZIONI` (`LINGUA` / `LANGUAGE`) con esportazione e importazione di pacchetti `.lang.json` per tradurre o personalizzare OpenFCAD in qualsiasi lingua o dialetto.

---

## Installazione su Windows (`.exe` Installer)

1. Scarica ed esegui **`OpenFCAD-Setup-2026.1.0.exe`** dalla cartella `release/` (o dalla pagina **GitHub Releases**).
2. All'avvio del wizard di installazione scegli la lingua preferita (24 lingue supportate dall'installer NSIS).
3. Accetta la licenza MIT, scegli la cartella di installazione e completa il setup: verranno creati i collegamenti sul Desktop e nel Menu Start, il disinstallatore di sistema e le associazioni file per `.dxf` e `.ofcad.json`.

---

## Sviluppo e Compilazione dell'Installer `.exe`

### Prerequisiti
- **Node.js** 20+ e **npm**

### Comandi
```bash
# Installa le dipendenze
npm install

# Avvia in modalità sviluppo web (http://localhost:5173)
npm run dev

# Avvia in modalità desktop Electron
npm run desktop

# Compila il bundle web di produzione
npm run build

# Genera le icone/grafiche e compila l'installer Windows .exe (in release/OpenFCAD-Setup-2026.1.0.exe)
npm run dist:win

# Compila l'installer macOS .dmg + .zip per Apple Silicon (arm64) e Intel (x64) (da eseguire su macOS o tramite GitHub Actions)
npm run dist:mac
```

---

## Licenza

Distribuito sotto licenza **MIT** — vedi [LICENSE](./LICENSE).
