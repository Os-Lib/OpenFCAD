import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { OsnapMode, UnitType, WorkspaceType } from '../types/cad';
import { OSNAP_LABELS } from '../engine/osnap';
import { GridStatusIcon, OrthoStatusIcon, OsnapStatusIcon, PolarStatusIcon } from './icons/CadIcons';

const POLAR_ANGLES = [5, 10, 15, 30, 45, 90];
const ANNO_SCALES = ['1:1', '1:2', '1:5', '1:10', '1:20', '1:50', '1:100', '1:200', '1:500'];

export const StatusBar: React.FC = () => {
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const settings = useCadStore((s) => s.settings);
  const cursorWorld = useCadStore((s) => s.cursorWorld);
  const workspace = useCadStore((s) => s.workspace);
  const cleanScreen = useCadStore((s) => s.cleanScreen);

  const updateSettings = useCadStore((s) => s.updateSettings);
  const toggleOsnapMode = useCadStore((s) => s.toggleOsnapMode);
  const setActiveSpace = useCadStore((s) => s.setActiveSpace);
  const addLayout = useCadStore((s) => s.addLayout);
  const setWorkspace = useCadStore((s) => s.setWorkspace);
  const toggleCleanScreen = useCadStore((s) => s.toggleCleanScreen);
  const log = useCadStore((s) => s.log);

  const [popover, setPopover] = useState<'osnap' | 'polar' | 'grid' | 'ws' | null>(null);

  const pr = settings.precision;

  return (
    <footer className="ofcad-statusbar">
      {/* LEFT: Model & Paper Space Layout Tabs */}
      <div className="sb-left">
        {doc && (
          <div className="layout-tabs">
            <button
              className={`layout-tab ${doc.activeSpace === 'model' ? 'active' : ''}`}
              onClick={() => setActiveSpace('model')}
            >
              Modello
            </button>
            {doc.layouts.map((l) => (
              <button
                key={l.id}
                className={`layout-tab ${doc.activeSpace === l.id ? 'active' : ''}`}
                onClick={() => setActiveSpace(l.id)}
              >
                {l.name}
              </button>
            ))}
            <button className="layout-tab-add" onClick={addLayout} title="Nuovo Layout">
              +
            </button>
          </div>
        )}

        <div className="sb-coords" title="Coordinate cursore correnti (X, Y, Z)">
          {cursorWorld.x.toFixed(pr)}, {cursorWorld.y.toFixed(pr)}, 0.00
        </div>
      </div>

      {/* RIGHT: OpenFCAD Drafting Toggles */}
      <div className="sb-right">
        {doc && (
          <button
            className="sb-mode-pill"
            onClick={() => {
              setActiveSpace(doc.activeSpace === 'model' ? doc.layouts[0]?.id || 'model' : 'model');
            }}
            title="Alterna Spazio Modello / Spazio Carta"
          >
            {doc.activeSpace === 'model' ? 'MODELLO' : 'CARTA'}
          </button>
        )}

        {/* GRIGLIA (F7) */}
        <div className="sb-toggle-group">
          <button
            className={`sb-btn ${settings.gridOn ? 'active' : ''}`}
            onClick={() => updateSettings({ gridOn: !settings.gridOn })}
            title="Visualizza griglia disegno (F7)"
          >
            <GridStatusIcon size={14} />
          </button>
          <button
            className="sb-arrow"
            onClick={() => setPopover(popover === 'grid' ? null : 'grid')}
            title="Impostazioni griglia e snap"
          >
            ▴
          </button>
          {popover === 'grid' && (
            <div className="sb-popover">
              <div className="sb-pop-title">Impostazioni Griglia e Snap</div>
              <label className="sb-pop-row">
                <span>Passo griglia:</span>
                <input
                  type="number"
                  value={settings.gridSpacing}
                  min={1}
                  max={500}
                  onChange={(e) => updateSettings({ gridSpacing: Math.max(1, Number(e.target.value) || 20) })}
                />
              </label>
              <label className="sb-pop-row">
                <span>Passo snap (F9):</span>
                <input
                  type="number"
                  value={settings.snapSpacing}
                  min={1}
                  max={500}
                  onChange={(e) => updateSettings({ snapSpacing: Math.max(1, Number(e.target.value) || 10) })}
                />
              </label>
              <button className="sb-pop-close" onClick={() => setPopover(null)}>Chiudi</button>
            </div>
          )}
        </div>

        {/* SNAP (F9) */}
        <button
          className={`sb-btn ${settings.snapOn ? 'active' : ''}`}
          onClick={() => updateSettings({ snapOn: !settings.snapOn })}
          title="Modalità Snap alla griglia (F9)"
        >
          SNAP
        </button>

        {/* DYN (F12) */}
        <button
          className={`sb-btn ${settings.dynInputOn ? 'active' : ''}`}
          onClick={() => updateSettings({ dynInputOn: !settings.dynInputOn })}
          title="Input dinamico vicino al cursore (F12)"
        >
          DYN
        </button>

        {/* ORTO (F8) */}
        <button
          className={`sb-btn ${settings.orthoOn ? 'active' : ''}`}
          onClick={() => updateSettings({ orthoOn: !settings.orthoOn })}
          title="Modalità Orto — vincola a 0°/90° (F8)"
        >
          <OrthoStatusIcon size={14} />
        </button>

        {/* POLARE (F10) */}
        <div className="sb-toggle-group">
          <button
            className={`sb-btn ${settings.polarOn ? 'active' : ''}`}
            onClick={() => updateSettings({ polarOn: !settings.polarOn })}
            title={`Puntamento polare ${settings.polarAngle}° (F10)`}
          >
            <PolarStatusIcon size={14} />
          </button>
          <button
            className="sb-arrow"
            onClick={() => setPopover(popover === 'polar' ? null : 'polar')}
            title="Angolo di incremento polare"
          >
            ▴
          </button>
          {popover === 'polar' && (
            <div className="sb-popover">
              <div className="sb-pop-title">Incremento Polare</div>
              {POLAR_ANGLES.map((deg) => (
                <button
                  key={deg}
                  className={`sb-pop-opt ${settings.polarAngle === deg ? 'active' : ''}`}
                  onClick={() => {
                    updateSettings({ polarAngle: deg, polarOn: true });
                    setPopover(null);
                  }}
                >
                  {settings.polarAngle === deg ? '✓ ' : ''}
                  {deg}°, {deg * 2}°, {deg * 3}°...
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OTRACK (F11) */}
        <button
          className={`sb-btn ${settings.otrackOn ? 'active' : ''}`}
          onClick={() => updateSettings({ otrackOn: !settings.otrackOn })}
          title="Puntamento snap ad oggetto OTRACK (F11) — Acquisisce punti ortogonali soffermandosi sugli OSNAP"
        >
          OTRACK
        </button>

        {/* OSNAP (F3) */}
        <div className="sb-toggle-group">
          <button
            className={`sb-btn ${settings.osnapOn ? 'active' : ''}`}
            onClick={() => updateSettings({ osnapOn: !settings.osnapOn })}
            title="Snap ad oggetto OSNAP (F3)"
          >
            <OsnapStatusIcon size={14} />
          </button>
          <button
            className="sb-arrow"
            onClick={() => setPopover(popover === 'osnap' ? null : 'osnap')}
            title="Configura modalità OSNAP"
          >
            ▴
          </button>
          {popover === 'osnap' && (
            <div className="sb-popover osnap-popover">
              <div className="sb-pop-title">Snap ad oggetto (OSNAP)</div>
              {(Object.keys(OSNAP_LABELS) as OsnapMode[]).map((m) => (
                <label key={m} className="sb-osnap-check">
                  <input
                    type="checkbox"
                    checked={settings.osnapModes[m]}
                    onChange={() => toggleOsnapMode(m)}
                  />
                  <span>{OSNAP_LABELS[m]}</span>
                </label>
              ))}
              <button className="sb-pop-close" onClick={() => setPopover(null)}>Chiudi</button>
            </div>
          )}
        </div>

        {/* LWT (Spessore linea) */}
        <button
          className={`sb-btn ${settings.showLineWeight ? 'active' : ''}`}
          onClick={() => updateSettings({ showLineWeight: !settings.showLineWeight })}
          title="Mostra/Nascondi spessore linea (LWT)"
        >
          LWT
        </button>

        {/* TPY (Trasparenza) */}
        <button
          className={`sb-btn ${settings.showTransparency ? 'active' : ''}`}
          onClick={() => updateSettings({ showTransparency: !settings.showTransparency })}
          title="Trasparenza layer"
        >
          TPY
        </button>

        {/* QP (Proprietà Rapide) */}
        <button
          className={`sb-btn ${settings.quickPropertiesOn ? 'active' : ''}`}
          onClick={() => updateSettings({ quickPropertiesOn: !settings.quickPropertiesOn })}
          title="Mostra/Nascondi Proprietà Rapide alla selezione (QP)"
        >
          QP
        </button>

        {/* Annotation Scale */}
        <select
          className="sb-select"
          value={settings.annotationScale}
          onChange={(e) => {
            const val = e.target.value;
            updateSettings({ annotationScale: val });
            log(`Scala di annotazione impostata a ${val}`, 'info');
          }}
          title="Scala di annotazione"
        >
          {ANNO_SCALES.map((sc) => (
            <option key={sc} value={sc}>{sc}</option>
          ))}
        </select>

        {/* Units quick selector */}
        <select
          className="sb-select"
          value={settings.units}
          onChange={(e) => updateSettings({ units: e.target.value as UnitType })}
          title="Unità di disegno"
        >
          <option value="mm">mm</option>
          <option value="cm">cm</option>
          <option value="m">m</option>
          <option value="in">in</option>
        </select>

        {/* Workspace Gear */}
        <div className="sb-toggle-group">
          <button
            className="sb-btn"
            onClick={() => setPopover(popover === 'ws' ? null : 'ws')}
            title="Cambio area di lavoro"
          >
            ⚙
          </button>
          {popover === 'ws' && (
            <div className="sb-popover">
              <div className="sb-pop-title">Area di lavoro</div>
              {([
                ['drafting', 'Disegno e annotazione'],
                ['3dbasics', 'Elementi 3D di base'],
                ['3dmodeling', 'Modellazione 3D'],
              ] as [WorkspaceType, string][]).map(([id, lbl]) => (
                <button
                  key={id}
                  className={`sb-pop-opt ${workspace === id ? 'active' : ''}`}
                  onClick={() => {
                    setWorkspace(id);
                    setPopover(null);
                  }}
                >
                  {workspace === id ? '✓ ' : ''}
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clean Screen (Ctrl+0) */}
        <button
          className={`sb-btn ${cleanScreen ? 'active' : ''}`}
          onClick={toggleCleanScreen}
          title="Pulisci schermo (Ctrl+0)"
        >
          ⛶
        </button>
      </div>
    </footer>
  );
};
