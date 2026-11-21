import React from 'react';
import { useCadStore } from '../store/useCadStore';
import { openCadFileDialog } from '../engine/fileIO';
import { Box3DIcon, LayersIcon, NewFileIcon, OpenFcadLogoIcon, OpenFolderIcon } from './icons/CadIcons';

export const StartTab: React.FC = () => {
  const newDocument = useCadStore((s) => s.newDocument);
  const openSample = useCadStore((s) => s.openSample);
  const importDocumentContent = useCadStore((s) => s.importDocumentContent);
  const recentFiles = useCadStore((s) => s.recentFiles);

  const handleOpen = async () => {
    const res = await openCadFileDialog();
    if (res) importDocumentContent(res.name, res.content, res.filePath);
  };

  return (
    <div className="start-tab-page">
      <aside className="start-sidebar">
        <div className="start-brand">
          <OpenFcadLogoIcon size={32} />
          <div>
            <div className="start-brand-title">OpenFCAD</div>
            <div className="start-brand-sub">Italiano • CAD 2D / 3D</div>
          </div>
        </div>

        <button className="start-primary-btn" onClick={handleOpen}>
          <OpenFolderIcon size={18} />
          <span>Apri file (DXF / JSON)...</span>
        </button>

        <button className="start-secondary-btn" onClick={() => newDocument('iso2d')}>
          <NewFileIcon size={18} />
          <span>Nuovo (openfcad-iso.dwt)</span>
        </button>

        <button className="start-secondary-btn" onClick={() => newDocument('iso3d')}>
          <Box3DIcon size={18} />
          <span>Nuovo 3D (openfcad-3d.dwt)</span>
        </button>

        <div className="start-nav-section">
          <div className="start-nav-label">Scorciatoie principali</div>
          <div className="start-shortcuts-list">
            <div><kbd>L</kbd> Linea • <kbd>PL</kbd> Polilinea</div>
            <div><kbd>C</kbd> Cerchio • <kbd>RT</kbd> Rettangolo</div>
            <div><kbd>S</kbd> Sposta • <kbd>CP</kbd> Copia</div>
            <div><kbd>TA</kbd> Taglia • <kbd>RA</kbd> Raccordo</div>
            <div><kbd>OF</kbd> Offset • <kbd>EU</kbd> Estrudi 3D</div>
            <div><kbd>F3</kbd> OSNAP • <kbd>F8</kbd> ORTO • <kbd>F7</kbd> Griglia</div>
            <div><kbd>Ctrl+1</kbd> Proprietà • <kbd>F2</kbd> Cronologia</div>
          </div>
        </div>
      </aside>

      <main className="start-main">
        <section className="start-section">
          <h2>Disegni di esempio pronti</h2>
          <p className="start-subtitle">
            Apri un progetto dimostrativo completo per esplorare layer, blocchi, tratteggi, quote, Layout e vista 3D interattiva.
          </p>

          <div className="start-cards-grid">
            <button className="start-card" onClick={() => openSample('apartment')}>
              <div className="start-card-preview preview-arch">
                <svg viewBox="0 0 220 130" className="preview-svg">
                  <rect x="20" y="15" width="180" height="100" fill="none" stroke="#E2EAF4" strokeWidth="4" />
                  <line x1="115" y1="15" x2="115" y2="55" stroke="#E2EAF4" strokeWidth="3" />
                  <line x1="115" y1="78" x2="115" y2="115" stroke="#E2EAF4" strokeWidth="3" />
                  <line x1="115" y1="65" x2="200" y2="65" stroke="#E2EAF4" strokeWidth="3" />
                  <path d="M115 55 A 22 22 0 0 1 137 77" fill="none" stroke="#FFBF00" strokeWidth="1.5" />
                  <rect x="40" y="42" width="44" height="28" fill="none" stroke="#66CC66" strokeWidth="1.5" />
                  <line x1="20" y1="6" x2="200" y2="6" stroke="#00FFFF" strokeWidth="1" />
                </svg>
              </div>
              <div className="start-card-body">
                <strong>Planimetria_Appartamento.dwg</strong>
                <span>Architettura 2D • Muri estrudibili, porte, arredi, tratteggi ANSI31, quote</span>
              </div>
            </button>

            <button className="start-card" onClick={() => openSample('mechanical')}>
              <div className="start-card-preview preview-mech">
                <svg viewBox="0 0 220 130" className="preview-svg">
                  <circle cx="80" cy="65" r="46" fill="none" stroke="#E2EAF4" strokeWidth="2" />
                  <circle cx="80" cy="65" r="35" fill="none" stroke="#FF4444" strokeWidth="1" strokeDasharray="6 3" />
                  <circle cx="80" cy="65" r="18" fill="none" stroke="#E2EAF4" strokeWidth="2" />
                  {[0, 60, 120, 180, 240, 300].map((a) => (
                    <circle
                      key={a}
                      cx={80 + 35 * Math.cos((a * Math.PI) / 180)}
                      cy={65 + 35 * Math.sin((a * Math.PI) / 180)}
                      r="4"
                      fill="none"
                      stroke="#38ABDF"
                      strokeWidth="1.5"
                    />
                  ))}
                  <rect x="155" y="20" width="24" height="90" fill="#38ABDF25" stroke="#E2EAF4" strokeWidth="1.5" />
                  <line x1="25" y1="65" x2="195" y2="65" stroke="#FF4444" strokeWidth="0.9" strokeDasharray="8 3 2 3" />
                </svg>
              </div>
              <div className="start-card-body">
                <strong>Flangia_Meccanica_DN150.dwg</strong>
                <span>Meccanica 2D • Foratura polare, assi CENTER, sezione tratteggiata, quote Ø/R</span>
              </div>
            </button>

            <button className="start-card" onClick={() => openSample('pavilion3d')}>
              <div className="start-card-preview preview-3d">
                <svg viewBox="0 0 220 130" className="preview-svg">
                  <polygon points="110,16 185,48 110,80 35,48" fill="#38ABDF33" stroke="#38ABDF" strokeWidth="1.8" />
                  <polygon points="35,48 110,80 110,112 35,80" fill="#38ABDF1A" stroke="#E2EAF4" strokeWidth="1.4" />
                  <polygon points="185,48 110,80 110,112 185,80" fill="#38ABDF44" stroke="#E2EAF4" strokeWidth="1.4" />
                  <circle cx="110" cy="64" r="10" fill="#FF6B6B88" stroke="#FFD166" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="start-card-body">
                <strong>Padiglione_3D.dwg</strong>
                <span>Modellazione 3D WebGL • Solidi, colonne, piramide, toro, stili visivi e orbita 3D</span>
              </div>
            </button>
          </div>
        </section>

        <section className="start-section">
          <h3>Recenti</h3>
          <div className="recent-list">
            {recentFiles.map((rf, i) => (
              <button
                key={i}
                className="recent-row"
                onClick={() => {
                  if (rf.sampleId) openSample(rf.sampleId as any);
                  else handleOpen();
                }}
              >
                <LayersIcon size={16} />
                <span className="recent-name">{rf.name}</span>
                <span className="recent-date">{rf.date}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
