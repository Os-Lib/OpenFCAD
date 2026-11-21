import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { searchCommands } from '../engine/commands';
import { openCadFileDialog, saveCadFileDialog } from '../engine/fileIO';
import { WorkspaceType } from '../types/cad';
import { BUILTIN_LANGUAGES, getLanguageOption } from '../i18n/translations';
import {
  NewFileIcon,
  OpenFcadLogoIcon,
  OpenFolderIcon,
  PrintIcon,
  RedoIcon,
  SaveIcon,
  UndoIcon,
} from './icons/CadIcons';

export const TitleBar: React.FC = () => {
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const workspace = useCadStore((s) => s.workspace);
  const theme = useCadStore((s) => s.theme);
  const language = useCadStore((s) => s.language);
  const setLanguage = useCadStore((s) => s.setLanguage);
  const setWorkspace = useCadStore((s) => s.setWorkspace);
  const setTheme = useCadStore((s) => s.setTheme);
  const newDocument = useCadStore((s) => s.newDocument);
  const importDocumentContent = useCadStore((s) => s.importDocumentContent);
  const markDocumentSaved = useCadStore((s) => s.markDocumentSaved);
  const undo = useCadStore((s) => s.undo);
  const redo = useCadStore((s) => s.redo);
  const setModal = useCadStore((s) => s.setModal);
  const startCommand = useCadStore((s) => s.startCommand);
  const openSample = useCadStore((s) => s.openSample);

  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = searchQuery.trim() ? searchCommands(searchQuery, 8) : [];

  const handleOpen = async () => {
    setAppMenuOpen(false);
    const res = await openCadFileDialog();
    if (res) importDocumentContent(res.name, res.content, res.filePath);
  };

  const handleSave = async (format: 'dxf' | 'json' | 'svg' | 'stl' = 'dxf') => {
    setAppMenuOpen(false);
    if (!doc) return;
    const res = await saveCadFileDialog(doc, format);
    if (res && (format === 'dxf' || format === 'json')) {
      markDocumentSaved(res.name, res.filePath);
    }
  };

  return (
    <header className="ofcad-titlebar">
      {/* LEFT: OpenFCAD Application Menu + QAT */}
      <div className="tb-left">
        <div className="app-menu-wrap">
          <button
            className={`app-menu-btn ${appMenuOpen ? 'open' : ''}`}
            onClick={() => setAppMenuOpen(!appMenuOpen)}
            title="Menu applicazione OpenFCAD"
          >
            <OpenFcadLogoIcon size={22} />
            <span className="caret">▾</span>
          </button>

          {appMenuOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setAppMenuOpen(false)} />
              <div className="app-menu-panel">
                <div className="app-menu-sidebar">
                  <button onClick={() => { setAppMenuOpen(false); newDocument('iso2d'); }}>
                    <NewFileIcon size={18} /> <span>Nuovo disegno (2D)</span>
                  </button>
                  <button onClick={() => { setAppMenuOpen(false); newDocument('iso3d'); }}>
                    <NewFileIcon size={18} /> <span>Nuovo disegno 3D</span>
                  </button>
                  <button onClick={handleOpen}>
                    <OpenFolderIcon size={18} /> <span>Apri (DXF / JSON)...</span>
                  </button>
                  <div className="menu-sep" />
                  <button onClick={() => handleSave('dxf')} disabled={!doc}>
                    <SaveIcon size={18} /> <span>Salva come DXF Standard</span>
                  </button>
                  <button onClick={() => handleSave('json')} disabled={!doc}>
                    <SaveIcon size={18} /> <span>Salva progetto (.ofcad.json)</span>
                  </button>
                  <button onClick={() => handleSave('svg')} disabled={!doc}>
                    <SaveIcon size={18} /> <span>Esporta vettoriale SVG</span>
                  </button>
                  <button onClick={() => handleSave('stl')} disabled={!doc}>
                    <SaveIcon size={18} /> <span>Esporta modello 3D STL</span>
                  </button>
                  <div className="menu-sep" />
                  <button onClick={() => { setAppMenuOpen(false); setModal('plot', true); }} disabled={!doc}>
                    <PrintIcon size={18} /> <span>Stampa / Plot / PDF...</span>
                  </button>
                  <div className="menu-sep" />
                  <button onClick={() => { setAppMenuOpen(false); setModal('units', true); }}>
                    <span>⚙</span> <span>Utilità disegno → Unità</span>
                  </button>
                  <button onClick={() => { setAppMenuOpen(false); startCommand('PURGE'); }}>
                    <span>🧹</span> <span>Elimina inutilizzati (PURGE)</span>
                  </button>
                  <button onClick={() => { setAppMenuOpen(false); setModal('script', true); }}>
                    <span>⌨</span> <span>Console Script OpenFCAD</span>
                  </button>
                  <button onClick={() => { setAppMenuOpen(false); setModal('options', true); }}>
                    <span>🔧</span> <span>Opzioni...</span>
                  </button>
                </div>
                <div className="app-menu-right">
                  <div className="app-menu-right-title">Esempi pronti all'uso</div>
                  <button className="sample-item" onClick={() => { setAppMenuOpen(false); openSample('apartment'); }}>
                    <strong>Planimetria_Appartamento.dwg</strong>
                    <span>Pianta architettonica multi-layer con blocchi, tratteggi e quote</span>
                  </button>
                  <button className="sample-item" onClick={() => { setAppMenuOpen(false); openSample('mechanical'); }}>
                    <strong>Flangia_Meccanica_DN150.dwg</strong>
                    <span>Disegno meccanico con sezione A-A, foratura polare e quote Ø/R</span>
                  </button>
                  <button className="sample-item" onClick={() => { setAppMenuOpen(false); openSample('pavilion3d'); }}>
                    <strong>Padiglione_3D.dwg</strong>
                    <span>Modello solido 3D con colonne, copertura e scultura orbitabile</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Access Toolbar (QAT) */}
        <div className="qat-bar">
          <button className="qat-btn" onClick={() => newDocument()} title="Nuovo (Ctrl+N)">
            <NewFileIcon size={15} />
          </button>
          <button className="qat-btn" onClick={handleOpen} title="Apri DXF / Progetto (Ctrl+O)">
            <OpenFolderIcon size={15} />
          </button>
          <button className="qat-btn" onClick={() => handleSave('dxf')} title="Salva DXF (Ctrl+S)" disabled={!doc}>
            <SaveIcon size={15} />
          </button>
          <button className="qat-btn" onClick={() => setModal('plot', true)} title="Stampa / Plot (Ctrl+P)" disabled={!doc}>
            <PrintIcon size={15} />
          </button>
          <div className="qat-sep" />
          <button
            className="qat-btn"
            onClick={undo}
            disabled={!doc || doc.undoStack.length === 0}
            title={`Annulla (Ctrl+Z)${doc?.undoStack.length ? ` — ${doc.undoStack[doc.undoStack.length - 1].description}` : ''}`}
          >
            <UndoIcon size={15} />
          </button>
          <button
            className="qat-btn"
            onClick={redo}
            disabled={!doc || doc.redoStack.length === 0}
            title="Ripeti (Ctrl+Y)"
          >
            <RedoIcon size={15} />
          </button>
          <div className="qat-sep" />
          <select
            className="qat-workspace-select"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value as WorkspaceType)}
            title="Cambia area di lavoro"
          >
            <option value="drafting">Disegno e annotazione</option>
            <option value="3dbasics">Elementi 3D di base</option>
            <option value="3dmodeling">Modellazione 3D</option>
          </select>
        </div>
      </div>

      {/* CENTER: OpenFCAD Document Title */}
      <div className="tb-center">
        <span className="tb-brand">OpenFCAD</span>
        <span className="tb-doc-name">
          {doc ? `  ${doc.name}${doc.modified ? ' *' : ''}` : '  Inizio'}
        </span>
      </div>

      {/* RIGHT: InfoCenter Command Search + Theme Toggle + Window Controls */}
      <div className="tb-right">
        <div className="infocenter-search">
          <input
            type="text"
            placeholder="Digita una parola chiave o comando..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                startCommand(searchResults[0].id);
                setSearchQuery('');
              }
            }}
          />
          {searchFocused && searchResults.length > 0 && (
            <div className="infocenter-results">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => {
                    startCommand(c.id);
                    setSearchQuery('');
                  }}
                >
                  <span className="ic-cmd">{c.italian}</span>
                  <span className="ic-alias">{c.aliases[0] || c.english}</span>
                  <span className="ic-desc">{c.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          className="tb-lang-select"
          value={language}
          onChange={(e) => {
            if (e.target.value === '__more__') {
              setModal('options', true);
            } else {
              setLanguage(e.target.value);
            }
          }}
          title="Lingua interfaccia (Qualunque lingua)"
        >
          {BUILTIN_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.code.toUpperCase()} — {l.nativeName}
            </option>
          ))}
          {!BUILTIN_LANGUAGES.some((l) => l.code === language) && (
            <option value={language}>
              {getLanguageOption(language).flag} {language.toUpperCase()} — {getLanguageOption(language).nativeName}
            </option>
          )}
          <option value="__more__">🌐 Altre lingue / Importa (.lang.json)...</option>
        </select>

        <button
          className="tb-theme-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Passa a Tema Chiaro' : 'Passa a Tema Scuro'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        {window.electronAPI?.isElectron && (
          <div className="win-controls">
            <button onClick={() => window.electronAPI?.minimize()} title="Riduci a icona">─</button>
            <button onClick={() => window.electronAPI?.maximize()} title="Ingrandisci">□</button>
            <button className="win-close" onClick={() => window.electronAPI?.close()} title="Chiudi">✕</button>
          </div>
        )}
      </div>
    </header>
  );
};
