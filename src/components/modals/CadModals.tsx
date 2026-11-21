import React, { useEffect, useState } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { TableEntity, UnitType } from '../../types/cad';
import { genId, getEntityCentroid } from '../../engine/math';
import { downloadTextFile } from '../../engine/fileIO';
import {
  BUILTIN_LANGUAGES,
  exportLanguagePackTemplate,
  WORLD_LANGUAGES,
} from '../../i18n/translations';

export const CadModals: React.FC = () => {
  const modals = useCadStore((s) => s.modals);
  const setModal = useCadStore((s) => s.setModal);
  const settings = useCadStore((s) => s.settings);
  const updateSettings = useCadStore((s) => s.updateSettings);
  const theme = useCadStore((s) => s.theme);
  const setTheme = useCadStore((s) => s.setTheme);
  const language = useCadStore((s) => s.language);
  const setLanguage = useCadStore((s) => s.setLanguage);
  const customLanguagePacks = useCadStore((s) => s.customLanguagePacks);
  const importLanguagePack = useCadStore((s) => s.importLanguagePack);
  const commandLog = useCadStore((s) => s.commandLog);
  const runScript = useCadStore((s) => s.runScript);
  const createBlockFromSelection = useCadStore((s) => s.createBlockFromSelection);
  const createRectangularArray = useCadStore((s) => s.createRectangularArray);
  const createPolarArray = useCadStore((s) => s.createPolarArray);
  const addEntity = useCadStore((s) => s.addEntity);
  const updateEntity = useCadStore((s) => s.updateEntity);
  const updateLayout = useCadStore((s) => s.updateLayout);
  const setParametricVar = useCadStore((s) => s.setParametricVar);
  const deleteParametricVar = useCadStore((s) => s.deleteParametricVar);
  const resetWorkspaceStorage = useCadStore((s) => s.resetWorkspaceStorage);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);

  const [scriptText, setScriptText] = useState(
    '; Esempio Script OpenFCAD — Disegna un telaio meccanico con fori\nRETTANGOLO\n0,0\n200,120\nCERCHIO\n30,30\n10\nCERCHIO\n170,30\n10\nCERCHIO\n170,90\n10\nCERCHIO\n30,90\n10\nCERCHIO\n100,60\n28\nZOOM\n'
  );

  // Create block fields
  const [blkName, setBlkName] = useState('MIO_BLOCCO');
  const [blkDesc, setBlkDesc] = useState('Blocco personalizzato');
  const [blkBaseX, setBlkBaseX] = useState(0);
  const [blkBaseY, setBlkBaseY] = useState(0);

  // Array dialog fields
  const [arrRows, setArrRows] = useState(3);
  const [arrCols, setArrCols] = useState(4);
  const [arrDx, setArrDx] = useState(60);
  const [arrDy, setArrDy] = useState(60);
  const [polarCount, setPolarCount] = useState(6);
  const [polarAngle, setPolarAngle] = useState(360);
  const [polarCx, setPolarCx] = useState(0);
  const [polarCy, setPolarCy] = useState(0);
  const [polarRotate, setPolarRotate] = useState(true);

  // Parameters modal state
  const [newParamName, setNewParamName] = useState('');
  const [newParamVal, setNewParamVal] = useState('100');

  // MText / Text Editor modal state
  const [mtextVal, setMtextVal] = useState('');
  const [mtextHeight, setMtextHeight] = useState(14);

  // Table Editor modal state
  const [tblRows, setTblRows] = useState(3);
  const [tblCols, setTblCols] = useState(4);
  const [tblColW, setTblColW] = useState(80);
  const [tblRowH, setTblRowH] = useState(24);
  const [tblCells, setTblCells] = useState<string[][]>([
    ['CODICE', 'DESCRIZIONE', 'Q.TÀ', 'NOTE'],
    ['A01', 'Elemento 1', '1', '-'],
    ['A02', 'Elemento 2', '2', '-'],
  ]);

  // Layout setup modal state
  const activeLayout = doc ? doc.layouts.find((l) => l.id === doc.activeSpace) || doc.layouts[0] : null;
  const [layName, setLayName] = useState('Layout1');
  const [layW, setLayW] = useState(420);
  const [layH, setLayH] = useState(297);
  const [layMargin, setLayMargin] = useState(12);
  const [layScale, setLayScale] = useState(0.4);
  const [layAutoFit, setLayAutoFit] = useState(true);
  const [layTitle, setLayTitle] = useState('TAVOLA 01');
  const [layAuthor, setLayAuthor] = useState('Studio Tecnico CAD');
  const [layScaleText, setLayScaleText] = useState('SCALA 1:50');

  useEffect(() => {
    if (modals.mtextEditor) {
      setMtextVal(modals.mtextEditor.initialText || '');
      setMtextHeight(modals.mtextEditor.height || 14);
    }
  }, [modals.mtextEditor]);

  useEffect(() => {
    if (!modals.tableEditor || !doc) return;
    if (modals.tableEditor.entityId) {
      const existing = doc.entities.find((e) => e.id === modals.tableEditor?.entityId && e.type === 'table') as TableEntity | undefined;
      if (existing) {
        setTblRows(existing.rows);
        setTblCols(existing.cols);
        setTblColW(existing.colWidth);
        setTblRowH(existing.rowHeight);
        setTblCells(existing.cells.map((r) => [...r]));
        return;
      }
    }
    setTblRows(3);
    setTblCols(4);
    setTblColW(80);
    setTblRowH(24);
    setTblCells([
      ['VOCE', 'DESCRIZIONE', 'VALORE', 'UNITÀ'],
      ['01', 'Quota A', '120', 'mm'],
      ['02', 'Quota B', '80', 'mm'],
    ]);
  }, [modals.tableEditor]);

  useEffect(() => {
    if (modals.layoutSetup && activeLayout) {
      setLayName(activeLayout.name);
      setLayW(activeLayout.paperWidth);
      setLayH(activeLayout.paperHeight);
      setLayMargin(activeLayout.margin);
      setLayScale(activeLayout.viewportScale);
      setLayAutoFit(activeLayout.autoFit !== false);
      setLayTitle(activeLayout.titleBlockTitle);
      setLayAuthor(activeLayout.titleBlockAuthor);
      setLayScaleText(activeLayout.titleBlockScaleText);
    }
  }, [modals.layoutSetup, activeLayout?.id]);

  return (
    <>
      {/* ==================== UNITA DISEGNO ==================== */}
      {modals.units && (
        <div className="cad-modal-backdrop" onClick={() => setModal('units', false)}>
          <div className="cad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>UNITÀ DISEGNO</span>
              <button onClick={() => setModal('units', false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Scala di inserimento (Unità di misura)</label>
                <select value={settings.units} onChange={(e) => updateSettings({ units: e.target.value as UnitType })}>
                  <option value="mm">Millimetri (mm)</option>
                  <option value="cm">Centimetri (cm)</option>
                  <option value="m">Metri (m)</option>
                  <option value="in">Pollici (in)</option>
                  <option value="ft">Piedi (ft)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Precisione decimale</label>
                <select value={settings.precision} onChange={(e) => updateSettings({ precision: Number(e.target.value) })}>
                  <option value={0}>0</option>
                  <option value={1}>0.0</option>
                  <option value={2}>0.00</option>
                  <option value={3}>0.000</option>
                  <option value={4}>0.0000</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="ofcad-btn primary" onClick={() => setModal('units', false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== OPZIONI OPENFCAD ==================== */}
      {modals.options && (
        <div className="cad-modal-backdrop" onClick={() => setModal('options', false)}>
          <div className="cad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>OPZIONI — OPENFCAD</span>
              <button onClick={() => setModal('options', false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Lingua interfaccia (Qualunque lingua)</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <optgroup label="Lingue Complete Integrate (14)">
                    {BUILTIN_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.nativeName} ({l.name} — {l.code.toUpperCase()})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tutte le Lingue del Mondo ISO (100+)">
                    {WORLD_LANGUAGES.filter((l) => !l.builtIn).map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.nativeName} ({l.name} — {l.code})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <button
                    className="ofcad-btn-sm"
                    onClick={() => {
                      const json = exportLanguagePackTemplate(language, customLanguagePacks);
                      downloadTextFile(`openfcad-${language}.lang.json`, json, 'application/json');
                    }}
                  >
                    Esporta Pacchetto (.lang.json)
                  </button>
                  <button
                    className="ofcad-btn-sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json,.lang.json';
                      input.onchange = () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          try {
                            const parsed = JSON.parse(String(reader.result || '{}'));
                            const code =
                              typeof parsed.languageCode === 'string' && parsed.languageCode.trim()
                                ? parsed.languageCode.trim()
                                : file.name.replace(/^openfcad-|\.(lang\.)?json$/gi, '') || language;
                            const dict =
                              parsed.translations && typeof parsed.translations === 'object'
                                ? parsed.translations
                                : parsed;
                            importLanguagePack(code, dict);
                          } catch {
                            useCadStore.getState().log('File pacchetto lingua JSON non valido.', 'error');
                          }
                        };
                        reader.readAsText(file);
                      };
                      input.click();
                    }}
                  >
                    Importa Lingua (.lang.json)
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Tema colore interfaccia</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}>
                  <option value="dark">Scuro (OpenFCAD Dark)</option>
                  <option value="light">Chiaro (LightTheme)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Colore sfondo Spazio Modello 2D</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={settings.modelBgColor}
                    onChange={(e) => updateSettings({ modelBgColor: e.target.value })}
                  />
                  <button className="ofcad-btn-sm" onClick={() => updateSettings({ modelBgColor: '#212830' })}>OpenFCAD (#212830)</button>
                  <button className="ofcad-btn-sm" onClick={() => updateSettings({ modelBgColor: '#000000' })}>Nero classico</button>
                  <button className="ofcad-btn-sm" onClick={() => updateSettings({ modelBgColor: '#FFFFFF' })}>Bianco</button>
                </div>
              </div>
              <div className="form-group">
                <label>Dimensione puntatore a croce (Mirino): {settings.crosshairSize}%</label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={settings.crosshairSize}
                  onChange={(e) => updateSettings({ crosshairSize: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Dimensione mirino selezione (Pickbox): {settings.pickboxSize}px</label>
                <input
                  type="range"
                  min={4}
                  max={22}
                  value={settings.pickboxSize}
                  onChange={(e) => updateSettings({ pickboxSize: Number(e.target.value) })}
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Raggio raccordo predefinito</label>
                  <input type="number" value={settings.filletRadius} onChange={(e) => updateSettings({ filletRadius: Number(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label>Distanza offset predefinita</label>
                  <input type="number" value={settings.offsetDistance} onChange={(e) => updateSettings({ offsetDistance: Number(e.target.value) || 10 })} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 10 }}>
                <button
                  className="ofcad-btn"
                  onClick={() => {
                    resetWorkspaceStorage();
                    setModal('options', false);
                  }}
                >
                  Ripristina sessione predefinita
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="ofcad-btn primary" onClick={() => setModal('options', false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONSOLE SCRIPT ==================== */}
      {modals.script && (
        <div className="cad-modal-backdrop" onClick={() => setModal('script', false)}>
          <div className="cad-modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>CONSOLE SCRIPT OPENFCAD (.SCR)</span>
              <button onClick={() => setModal('script', false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">
                Inserisci comandi OpenFCAD riga per riga (Italiano o Inglese). Usa <code>;</code> per commenti e <code>.</code> per inviare Invio/termina.
              </p>
              <textarea
                className="script-textarea"
                rows={12}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="modal-footer">
              <button
                className="ofcad-btn primary"
                onClick={() => {
                  runScript(scriptText);
                  setModal('script', false);
                }}
              >
                ▶ Esegui Script
              </button>
              <button className="ofcad-btn" onClick={() => setModal('script', false)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FINESTRA DI TESTO F2 ==================== */}
      {modals.textWindowF2 && (
        <div className="cad-modal-backdrop" onClick={() => setModal('textWindowF2', false)}>
          <div className="cad-modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>FINESTRA DI TESTO OPENFCAD (F2)</span>
              <button onClick={() => setModal('textWindowF2', false)}>✕</button>
            </div>
            <div className="f2-log-box">
              {commandLog.map((l) => (
                <div key={l.id} className={`cmd-log-line kind-${l.kind}`}>
                  <span className="cmd-ts">[{l.timestamp}]</span> {l.text}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="ofcad-btn primary" onClick={() => setModal('textWindowF2', false)}>Chiudi (F2)</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREA BLOCCO ==================== */}
      {modals.createBlock && (
        <div className="cad-modal-backdrop" onClick={() => setModal('createBlock', false)}>
          <div className="cad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>DEFINIZIONE BLOCCO (BLOCCO)</span>
              <button onClick={() => setModal('createBlock', false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">
                Oggetti selezionati: <strong>{doc?.selectedIds.length || 0}</strong>
              </p>
              <div className="form-group">
                <label>Nome blocco</label>
                <input type="text" value={blkName} onChange={(e) => setBlkName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Descrizione</label>
                <input type="text" value={blkDesc} onChange={(e) => setBlkDesc(e.target.value)} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Punto base X</label>
                  <input type="number" value={blkBaseX} onChange={(e) => setBlkBaseX(Number(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label>Punto base Y</label>
                  <input type="number" value={blkBaseY} onChange={(e) => setBlkBaseY(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="form-group">
                <button
                  className="ofcad-btn-sm"
                  disabled={!doc || doc.selectedIds.length === 0}
                  onClick={() => {
                    if (!doc || doc.selectedIds.length === 0) return;
                    const sel = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
                    if (sel.length === 0) return;
                    const cx = sel.reduce((a, e) => a + getEntityCentroid(e, doc.blocks).x, 0) / sel.length;
                    const cy = sel.reduce((a, e) => a + getEntityCentroid(e, doc.blocks).y, 0) / sel.length;
                    setBlkBaseX(Number(cx.toFixed(2)));
                    setBlkBaseY(Number(cy.toFixed(2)));
                  }}
                >
                  Usa centro selezione
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="ofcad-btn primary"
                disabled={!doc || doc.selectedIds.length === 0}
                onClick={() => {
                  createBlockFromSelection(blkName, blkDesc, { x: blkBaseX, y: blkBaseY });
                  setModal('createBlock', false);
                }}
              >
                Crea Blocco
              </button>
              <button className="ofcad-btn" onClick={() => setModal('createBlock', false)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SERIE RETTANGOLARE / POLARE ==================== */}
      {modals.arrayDialog && (
        <div className="cad-modal-backdrop" onClick={() => setModal('arrayDialog', null)}>
          <div className="cad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{modals.arrayDialog === 'rect' ? 'SERIE RETTANGOLARE' : 'SERIE POLARE'}</span>
              <button onClick={() => setModal('arrayDialog', null)}>✕</button>
            </div>
            <div className="modal-body">
              {modals.arrayDialog === 'rect' ? (
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Righe</label>
                    <input type="number" min={1} max={30} value={arrRows} onChange={(e) => setArrRows(Number(e.target.value) || 1)} />
                  </div>
                  <div className="form-group">
                    <label>Colonne</label>
                    <input type="number" min={1} max={30} value={arrCols} onChange={(e) => setArrCols(Number(e.target.value) || 1)} />
                  </div>
                  <div className="form-group">
                    <label>Distanza tra colonne (ΔX)</label>
                    <input type="number" value={arrDx} onChange={(e) => setArrDx(Number(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label>Distanza tra righe (ΔY)</label>
                    <input type="number" value={arrDy} onChange={(e) => setArrDy(Number(e.target.value) || 0)} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Numero elementi</label>
                      <input type="number" min={2} max={60} value={polarCount} onChange={(e) => setPolarCount(Number(e.target.value) || 6)} />
                    </div>
                    <div className="form-group">
                      <label>Angolo totale (°)</label>
                      <input type="number" value={polarAngle} onChange={(e) => setPolarAngle(Number(e.target.value) || 360)} />
                    </div>
                    <div className="form-group">
                      <label>Centro X</label>
                      <input type="number" value={polarCx} onChange={(e) => setPolarCx(Number(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label>Centro Y</label>
                      <input type="number" value={polarCy} onChange={(e) => setPolarCy(Number(e.target.value) || 0)} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12 }}>
                    <input type="checkbox" checked={polarRotate} onChange={(e) => setPolarRotate(e.target.checked)} />
                    Ruota elementi durante la copia
                  </label>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="ofcad-btn primary"
                onClick={() => {
                  if (modals.arrayDialog === 'rect') createRectangularArray(arrRows, arrCols, arrDx, arrDy);
                  else createPolarArray({ x: polarCx, y: polarCy }, polarCount, polarAngle, polarRotate);
                  setModal('arrayDialog', null);
                }}
              >
                Applica Serie
              </button>
              <button className="ofcad-btn" onClick={() => setModal('arrayDialog', null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GESTIONE PARAMETRI (PARAMETRI) ==================== */}
      {modals.parameters && doc && (
        <div className="cad-modal-backdrop" onClick={() => setModal('parameters', false)}>
          <div className="cad-modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>GESTORE PARAMETRI UTENTE</span>
              <button onClick={() => setModal('parameters', false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">
                Usa i nomi variabili nella riga di comando (es. <code>LARGHEZZA/2</code>).
              </p>
              <table className="param-table">
                <thead>
                  <tr>
                    <th>Nome Variabile</th>
                    <th>Valore Numerico</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(doc.parametricVars || {}).map(([k, v]) => (
                    <tr key={k}>
                      <td><code>{k}</code></td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          value={v}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (Number.isFinite(n)) setParametricVar(k, n);
                          }}
                        />
                      </td>
                      <td>
                        <button className="ofcad-btn-sm" onClick={() => deleteParametricVar(k)}>Elimina</button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <input
                        type="text"
                        placeholder="es. LARGHEZZA"
                        value={newParamName}
                        onChange={(e) => setNewParamName(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        value={newParamVal}
                        onChange={(e) => setNewParamVal(e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="ofcad-btn-sm"
                        onClick={() => {
                          const n = parseFloat(newParamVal);
                          if (newParamName.trim() && Number.isFinite(n)) {
                            setParametricVar(newParamName.trim(), n);
                            setNewParamName('');
                          }
                        }}
                      >
                        + Aggiungi
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="ofcad-btn primary" onClick={() => setModal('parameters', false)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDITOR TESTO MULTILINEA / QUOTA / DIRETTRICE ==================== */}
      {modals.mtextEditor && doc && (
        <div className="cad-modal-backdrop" onClick={() => setModal('mtextEditor', null)}>
          <div className="cad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{modals.mtextEditor.entityId ? 'MODIFICA TESTO' : 'NUOVO TESTO MULTILINEA (TM)'}</span>
              <button onClick={() => setModal('mtextEditor', null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Contenuto testo</label>
                <textarea
                  rows={5}
                  value={mtextVal}
                  onChange={(e) => setMtextVal(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Altezza testo</label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={mtextHeight}
                  onChange={(e) => setMtextHeight(Math.max(1, parseFloat(e.target.value) || 12))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="ofcad-btn primary"
                onClick={() => {
                  const ed = modals.mtextEditor!;
                  if (ed.entityId) {
                    const target = doc.entities.find((e) => e.id === ed.entityId);
                    if (target?.type === 'dimension') {
                      updateEntity(target.id, { textOverride: mtextVal.trim() || undefined, textHeight: mtextHeight });
                    } else if (target?.type === 'leader') {
                      updateEntity(target.id, { text: mtextVal, textHeight: mtextHeight });
                    } else {
                      updateEntity(ed.entityId, { content: mtextVal, height: mtextHeight });
                    }
                  } else if (mtextVal.trim()) {
                    const common = {
                      layer: doc.activeLayer,
                      color: doc.activeColor,
                      lineType: doc.activeLineType,
                      lineTypeScale: 1,
                      lineWeight: doc.activeLineWeight,
                    };
                    if (ed.isMText) {
                      addEntity(
                        {
                          ...common,
                          id: genId('mtext'),
                          type: 'mtext',
                          position: ed.position,
                          content: mtextVal,
                          height: mtextHeight,
                          width: 260,
                          rotation: 0,
                        },
                        'Testo Multilinea'
                      );
                    } else {
                      addEntity(
                        {
                          ...common,
                          id: genId('text'),
                          type: 'text',
                          position: ed.position,
                          content: mtextVal,
                          height: mtextHeight,
                          rotation: 0,
                        },
                        'Testo'
                      );
                    }
                  }
                  setModal('mtextEditor', null);
                }}
              >
                OK
              </button>
              <button className="ofcad-btn" onClick={() => setModal('mtextEditor', null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDITOR TABELLA (TABELLA) ==================== */}
      {modals.tableEditor && doc && (
        <div className="cad-modal-backdrop" onClick={() => setModal('tableEditor', null)}>
          <div className="cad-modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{modals.tableEditor.entityId ? 'MODIFICA TABELLA' : 'INSERISCI TABELLA (TABELLA)'}</span>
              <button onClick={() => setModal('tableEditor', null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Righe</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={tblRows}
                    onChange={(e) => {
                      const nextR = Math.max(1, Math.min(15, parseInt(e.target.value, 10) || 1));
                      setTblRows(nextR);
                      setTblCells((prev) =>
                        Array.from({ length: nextR }, (_, r) =>
                          Array.from({ length: tblCols }, (_, c) => prev[r]?.[c] ?? '')
                        )
                      );
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Colonne</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tblCols}
                    onChange={(e) => {
                      const nextC = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
                      setTblCols(nextC);
                      setTblCells((prev) =>
                        Array.from({ length: tblRows }, (_, r) =>
                          Array.from({ length: nextC }, (_, c) => prev[r]?.[c] ?? '')
                        )
                      );
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Largh. Colonna</label>
                  <input type="number" min={10} value={tblColW} onChange={(e) => setTblColW(Math.max(10, Number(e.target.value) || 80))} />
                </div>
                <div className="form-group">
                  <label>Alt. Riga</label>
                  <input type="number" min={8} value={tblRowH} onChange={(e) => setTblRowH(Math.max(8, Number(e.target.value) || 24))} />
                </div>
              </div>
              <div className="table-editor-grid" style={{ gridTemplateColumns: `repeat(${tblCols}, minmax(70px, 1fr))` }}>
                {Array.from({ length: tblRows }).map((_, r) =>
                  Array.from({ length: tblCols }).map((__, c) => (
                    <input
                      key={`${r}-${c}`}
                      className={`table-cell-input ${r === 0 ? 'header-row' : ''}`}
                      value={tblCells[r]?.[c] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTblCells((prev) =>
                          Array.from({ length: tblRows }, (_, rr) =>
                            Array.from({ length: tblCols }, (_, cc) =>
                              rr === r && cc === c ? val : (prev[rr]?.[cc] ?? '')
                            )
                          )
                        );
                      }}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="ofcad-btn primary"
                onClick={() => {
                  const ed = modals.tableEditor!;
                  const normalized = Array.from({ length: tblRows }, (_, r) =>
                    Array.from({ length: tblCols }, (_, c) => tblCells[r]?.[c] ?? '')
                  );
                  if (ed.entityId) {
                    updateEntity(ed.entityId, {
                      rows: tblRows,
                      cols: tblCols,
                      colWidth: tblColW,
                      rowHeight: tblRowH,
                      cells: normalized,
                    });
                  } else {
                    addEntity(
                      {
                        id: genId('table'),
                        type: 'table',
                        layer: doc.activeLayer,
                        color: doc.activeColor,
                        lineType: doc.activeLineType,
                        lineTypeScale: 1,
                        lineWeight: doc.activeLineWeight,
                        position: ed.position || { x: 0, y: 0 },
                        rows: tblRows,
                        cols: tblCols,
                        colWidth: tblColW,
                        rowHeight: tblRowH,
                        cells: normalized,
                        textHeight: Math.max(6, settings.textHeight * 0.8),
                      },
                      'Tabella'
                    );
                  }
                  setModal('tableEditor', null);
                }}
              >
                {modals.tableEditor.entityId ? 'Salva Tabella' : 'Inserisci Tabella'}
              </button>
              <button className="ofcad-btn" onClick={() => setModal('tableEditor', null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== IMPOSTA PAGINA LAYOUT ==================== */}
      {modals.layoutSetup && activeLayout && (
        <div className="cad-modal-backdrop" onClick={() => setModal('layoutSetup', false)}>
          <div className="cad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>IMPOSTA PAGINA — {activeLayout.name}</span>
              <button onClick={() => setModal('layoutSetup', false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome Layout</label>
                <input type="text" value={layName} onChange={(e) => setLayName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Formati rapidi ISO</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    ['A4', 297, 210],
                    ['A3', 420, 297],
                    ['A2', 594, 420],
                    ['A1', 841, 594],
                  ].map(([lbl, pw, ph]) => (
                    <button
                      key={String(lbl)}
                      className="ofcad-btn-sm"
                      onClick={() => {
                        setLayW(Number(pw));
                        setLayH(Number(ph));
                      }}
                    >
                      {lbl} ({pw}×{ph})
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Larghezza foglio (mm)</label>
                  <input type="number" min={50} value={layW} onChange={(e) => setLayW(Math.max(50, Number(e.target.value) || 420))} />
                </div>
                <div className="form-group">
                  <label>Altezza foglio (mm)</label>
                  <input type="number" min={50} value={layH} onChange={(e) => setLayH(Math.max(50, Number(e.target.value) || 297))} />
                </div>
                <div className="form-group">
                  <label>Margine stampabile (mm)</label>
                  <input type="number" min={0} value={layMargin} onChange={(e) => setLayMargin(Math.max(0, Number(e.target.value) || 12))} />
                </div>
                <div className="form-group">
                  <label>Scala finestra manuale</label>
                  <input type="number" step="0.05" min={0.01} value={layScale} onChange={(e) => setLayScale(Math.max(0.01, Number(e.target.value) || 0.4))} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0', fontSize: 12 }}>
                <input type="checkbox" checked={layAutoFit} onChange={(e) => setLayAutoFit(e.target.checked)} />
                Adatta automaticamente il modello nella finestra
              </label>
              <div className="form-group">
                <label>Titolo Cartiglio</label>
                <input type="text" value={layTitle} onChange={(e) => setLayTitle(e.target.value)} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Autore / Studio</label>
                  <input type="text" value={layAuthor} onChange={(e) => setLayAuthor(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Testo Scala Cartiglio</label>
                  <input type="text" value={layScaleText} onChange={(e) => setLayScaleText(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="ofcad-btn primary"
                onClick={() => {
                  updateLayout(activeLayout.id, {
                    name: layName.trim() || activeLayout.name,
                    paperWidth: layW,
                    paperHeight: layH,
                    margin: layMargin,
                    viewportScale: layScale,
                    autoFit: layAutoFit,
                    titleBlockTitle: layTitle,
                    titleBlockAuthor: layAuthor,
                    titleBlockScaleText: layScaleText,
                  });
                  setModal('layoutSetup', false);
                }}
              >
                Salva Impostazioni
              </button>
              <button className="ofcad-btn" onClick={() => setModal('layoutSetup', false)}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
