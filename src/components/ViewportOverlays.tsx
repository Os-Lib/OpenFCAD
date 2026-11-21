import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { PresetView, VisualStyle } from '../types/cad';
import { Orbit3DIcon, PanIcon, ZoomExtentsIcon } from './icons/CadIcons';

const VIEW_LABELS: Record<PresetView, string> = {
  top: 'Alto',
  bottom: 'Basso',
  front: 'Fronte',
  back: 'Retro',
  left: 'Sinistra',
  right: 'Destra',
  swIso: 'Assonometrica SO',
  seIso: 'Assonometrica SE',
  neIso: 'Assonometrica NE',
  nwIso: 'Assonometrica NO',
};

const STYLE_LABELS: Record<VisualStyle, string> = {
  '2dwireframe': 'Wireframe 2D',
  '3dwireframe': 'Wireframe 3D',
  conceptual: 'Concettuale',
  realistic: 'Realistico',
  shaded: 'Ombreggiato',
  shadedEdges: 'Ombreggiato con spigoli',
  xray: 'Raggi X',
};

export const ViewportOverlays: React.FC = () => {
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const settings = useCadStore((s) => s.settings);
  const setPresetView = useCadStore((s) => s.setPresetView);
  const setVisualStyle = useCadStore((s) => s.setVisualStyle);
  const updateSettings = useCadStore((s) => s.updateSettings);
  const zoomExtents = useCadStore((s) => s.zoomExtents);
  const startCommand = useCadStore((s) => s.startCommand);

  const [openMenu, setOpenMenu] = useState<'vp' | 'view' | 'style' | null>(null);

  if (!doc || doc.activeSpace !== 'model') return null;

  return (
    <>
      {/* TOP-LEFT OPENFCAD VIEWPORT CONTROLS: [-][Alto][Wireframe 2D] */}
      <div className="vp-controls-overlay" onMouseLeave={() => setOpenMenu(null)}>
        <div className="vp-ctrl-wrap">
          <button className="vp-ctrl-btn" onClick={() => setOpenMenu(openMenu === 'vp' ? null : 'vp')} title="Controlli finestra">
            [-]
          </button>
          {openMenu === 'vp' && (
            <div className="vp-dropdown">
              <button onClick={() => { updateSettings({ showViewCube: !settings.showViewCube }); setOpenMenu(null); }}>
                {settings.showViewCube ? '✓ ' : ''}ViewCube
              </button>
              <button onClick={() => { updateSettings({ showNavBar: !settings.showNavBar }); setOpenMenu(null); }}>
                {settings.showNavBar ? '✓ ' : ''}Barra di navigazione
              </button>
              <button onClick={() => { updateSettings({ showUcsIcon: !settings.showUcsIcon }); setOpenMenu(null); }}>
                {settings.showUcsIcon ? '✓ ' : ''}Icona UCS
              </button>
              <div className="vp-sep" />
              <button onClick={() => { zoomExtents(); setOpenMenu(null); }}>Zoom Estensioni</button>
            </div>
          )}
        </div>

        <div className="vp-ctrl-wrap">
          <button className="vp-ctrl-btn" onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')} title="Controlli vista">
            [{VIEW_LABELS[doc.camera.presetView]}]
          </button>
          {openMenu === 'view' && (
            <div className="vp-dropdown">
              {(Object.keys(VIEW_LABELS) as PresetView[]).map((v) => (
                <button
                  key={v}
                  className={doc.camera.presetView === v ? 'active' : ''}
                  onClick={() => { setPresetView(v); setOpenMenu(null); }}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="vp-ctrl-wrap">
          <button className="vp-ctrl-btn" onClick={() => setOpenMenu(openMenu === 'style' ? null : 'style')} title="Stile di visualizzazione">
            [{STYLE_LABELS[doc.camera.visualStyle]}]
          </button>
          {openMenu === 'style' && (
            <div className="vp-dropdown">
              {(Object.keys(STYLE_LABELS) as VisualStyle[]).map((st) => (
                <button
                  key={st}
                  className={doc.camera.visualStyle === st ? 'active' : ''}
                  onClick={() => { setVisualStyle(st); setOpenMenu(null); }}
                >
                  {STYLE_LABELS[st]}
                </button>
              ))}
            </div>
          )}
        </div>

        {doc.camera.is3D && (
          <button className="vp-back2d-pill" onClick={() => setPresetView('top')} title="Torna al disegno 2D dall'alto">
            ↩ Torna a 2D Alto
          </button>
        )}
      </div>

      {/* TOP-RIGHT INTERACTIVE OPENFCAD VIEWCUBE */}
      {settings.showViewCube && (
        <div className="viewcube-widget" title="ViewCube — Clicca una faccia o un angolo per cambiare vista 2D/3D">
          <button
            className="vc-home-btn"
            title="Vista Home (Assonometrica SO 3D)"
            onClick={() => setPresetView(doc.camera.is3D ? 'top' : 'swIso')}
          >
            ⌂
          </button>
          <div className="vc-compass">
            <span className="vc-dir vc-n" onClick={() => setPresetView('back')}>N</span>
            <span className="vc-dir vc-s" onClick={() => setPresetView('front')}>S</span>
            <span className="vc-dir vc-e" onClick={() => setPresetView('right')}>E</span>
            <span className="vc-dir vc-o" onClick={() => setPresetView('left')}>O</span>

            <div className={`vc-cube ${doc.camera.is3D ? 'is-3d' : ''}`}>
              <button
                className={`vc-face-main ${doc.camera.presetView === 'top' ? 'active' : ''}`}
                onClick={() => setPresetView('top')}
              >
                {doc.camera.is3D ? '3D' : 'ALTO'}
              </button>
              <button className="vc-corner vc-nw" title="Assonometria NO" onClick={() => setPresetView('nwIso')} />
              <button className="vc-corner vc-ne" title="Assonometria NE" onClick={() => setPresetView('neIso')} />
              <button className="vc-corner vc-sw" title="Assonometria SO" onClick={() => setPresetView('swIso')} />
              <button className="vc-corner vc-se" title="Assonometria SE" onClick={() => setPresetView('seIso')} />
            </div>
          </div>
          <div className="vc-ucs-label">WCS</div>
        </div>
      )}

      {/* RIGHT-EDGE VERTICAL NAVIGATION BAR */}
      {settings.showNavBar && (
        <div className="nav-bar-overlay">
          <button
            className="nav-bar-btn"
            title="Pan (P)"
            onClick={() => startCommand('PAN')}
          >
            <PanIcon size={17} />
          </button>
          <button
            className="nav-bar-btn"
            title="Zoom Estensioni (Z)"
            onClick={() => zoomExtents()}
          >
            <ZoomExtentsIcon size={17} />
          </button>
          <button
            className="nav-bar-btn"
            title="Zoom Finestra (ZW)"
            onClick={() => startCommand('ZOOM_WINDOW')}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#38ABDF' }}>[Z]</span>
          </button>
          <button
            className={`nav-bar-btn ${doc.camera.is3D ? 'active' : ''}`}
            title="Orbita 3D (3DO)"
            onClick={() => setPresetView(doc.camera.is3D ? 'top' : 'swIso')}
          >
            <Orbit3DIcon size={17} />
          </button>
        </div>
      )}
    </>
  );
};
