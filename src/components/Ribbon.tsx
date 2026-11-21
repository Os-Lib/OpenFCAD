import React, { useState } from 'react';
import { RibbonTabId, useCadStore } from '../store/useCadStore';
import {
  CAD_ACI_COLORS,
  HatchPatternName,
  LINE_TYPES,
  LINE_WEIGHTS,
  LineTypeName,
  PresetView,
  VisualStyle,
  WorkspaceType,
} from '../types/cad';
import { openCadFileDialog, saveCadFileDialog } from '../engine/fileIO';
import {
  ArcIcon,
  ArrayIcon,
  BlockIcon,
  Box3DIcon,
  ChamferIcon,
  CircleIcon,
  Cone3DIcon,
  CopyIcon,
  Cylinder3DIcon,
  DimensionIcon,
  EllipseIcon,
  EraseIcon,
  ExplodeIcon,
  ExtendIcon,
  Extrude3DIcon,
  FilletIcon,
  HatchIcon,
  JoinIcon,
  LayersIcon,
  LeaderIcon,
  LineIcon,
  MatchPropIcon,
  MeasureIcon,
  MirrorIcon,
  MoveIcon,
  OffsetIcon,
  Orbit3DIcon,
  PanIcon,
  PointIcon,
  PolygonIcon,
  PolylineIcon,
  PrintIcon,
  PropertiesIcon,
  RectIcon,
  RevCloudIcon,
  RotateIcon,
  SaveIcon,
  ScaleIcon,
  Sphere3DIcon,
  SplineIcon,
  StretchIcon,
  TextIcon,
  TrimIcon,
  XLineIcon,
  ZoomExtentsIcon,
} from './icons/CadIcons';

const WORKSPACE_TABS: Record<WorkspaceType, { id: RibbonTabId; label: string }[]> = {
  drafting: [
    { id: 'home', label: 'Inizio' },
    { id: 'insert', label: 'Inserisci' },
    { id: 'annotate', label: 'Annota' },
    { id: 'parametric', label: 'Parametrico' },
    { id: '3dtools', label: 'Strumenti 3D' },
    { id: 'view', label: 'Vista' },
    { id: 'manage', label: 'Gestisci' },
    { id: 'output', label: 'Output' },
  ],
  '3dbasics': [
    { id: 'home3d', label: 'Inizio 3D' },
    { id: 'insert', label: 'Inserisci' },
    { id: 'annotate', label: 'Annota' },
    { id: 'view', label: 'Vista' },
    { id: 'manage', label: 'Gestisci' },
    { id: 'output', label: 'Output' },
  ],
  '3dmodeling': [
    { id: 'solids', label: 'Solidi' },
    { id: 'home', label: 'Inizio' },
    { id: 'insert', label: 'Inserisci' },
    { id: 'annotate', label: 'Annota' },
    { id: 'view', label: 'Vista' },
    { id: 'manage', label: 'Gestisci' },
    { id: 'output', label: 'Output' },
  ],
};

const ALL_HATCH_PATTERNS: HatchPatternName[] = [
  'ANSI31', 'ANSI32', 'ANSI33', 'ANSI37', 'SOLID', 'NET', 'BRICK',
  'DOTS', 'HONEY', 'CROSS', 'AR-CONC', 'AR-SAND', 'AR-HBONE', 'EARTH', 'GRATE',
];

export const Ribbon: React.FC = () => {
  const workspace = useCadStore((s) => s.workspace);
  const activeTab = useCadStore((s) => s.activeRibbonTab);
  const ribbonCollapsed = useCadStore((s) => s.ribbonCollapsed);
  const setActiveRibbonTab = useCadStore((s) => s.setActiveRibbonTab);
  const toggleRibbonCollapsed = useCadStore((s) => s.toggleRibbonCollapsed);
  const command = useCadStore((s) => s.command);
  const startCommand = useCadStore((s) => s.startCommand);
  const submitCommandOption = useCadStore((s) => s.submitCommandOption);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const settings = useCadStore((s) => s.settings);
  const updateSettings = useCadStore((s) => s.updateSettings);
  const setModal = useCadStore((s) => s.setModal);
  const togglePropertiesPalette = useCadStore((s) => s.togglePropertiesPalette);
  const toggleBlocksPalette = useCadStore((s) => s.toggleBlocksPalette);
  const toggleQuickCalc = useCadStore((s) => s.toggleQuickCalc);
  const showPropertiesPalette = useCadStore((s) => s.showPropertiesPalette);
  const showBlocksPalette = useCadStore((s) => s.showBlocksPalette);
  const showQuickCalc = useCadStore((s) => s.showQuickCalc);

  const setActiveLayer = useCadStore((s) => s.setActiveLayer);
  const setActiveColor = useCadStore((s) => s.setActiveColor);
  const setActiveLineType = useCadStore((s) => s.setActiveLineType);
  const setActiveLineWeight = useCadStore((s) => s.setActiveLineWeight);
  const updateLayer = useCadStore((s) => s.updateLayer);
  const isolateLayer = useCadStore((s) => s.isolateLayer);
  const unisolateLayers = useCadStore((s) => s.unisolateLayers);
  const copyToClipboard = useCadStore((s) => s.copyToClipboard);
  const cutToClipboard = useCadStore((s) => s.cutToClipboard);
  const pasteFromClipboard = useCadStore((s) => s.pasteFromClipboard);
  const setPresetView = useCadStore((s) => s.setPresetView);
  const setVisualStyle = useCadStore((s) => s.setVisualStyle);
  const zoomExtents = useCadStore((s) => s.zoomExtents);
  const applyGeometricConstraint = useCadStore((s) => s.applyGeometricConstraint);
  const importDocumentContent = useCadStore((s) => s.importDocumentContent);

  const [layerDropOpen, setLayerDropOpen] = useState(false);
  const [openDrop, setOpenDrop] = useState<string | null>(null);

  const visibleTabs = WORKSPACE_TABS[workspace] || WORKSPACE_TABS.drafting;
  const isActive = (cmdId: string) => command?.name === cmdId;

  const BigBtn: React.FC<{
    icon: React.ReactNode;
    label: string;
    cmd?: string;
    active?: boolean;
    title?: string;
    onClick?: () => void;
  }> = ({ icon, label, cmd, active, title, onClick }) => (
    <button
      className={`rb-big-btn ${active || (cmd && isActive(cmd)) ? 'active' : ''}`}
      onClick={onClick || (cmd ? () => startCommand(cmd) : undefined)}
      title={title || label}
    >
      <div className="rb-big-icon">{icon}</div>
      <span className="rb-big-label">{label}</span>
    </button>
  );

  const SmallBtn: React.FC<{
    icon?: React.ReactNode;
    label: string;
    cmd?: string;
    active?: boolean;
    title?: string;
    onClick?: () => void;
  }> = ({ icon, label, cmd, active, title, onClick }) => (
    <button
      className={`rb-small-btn ${active || (cmd && isActive(cmd)) ? 'active' : ''}`}
      onClick={onClick || (cmd ? () => startCommand(cmd) : undefined)}
      title={title || label}
    >
      {icon && <span className="rb-small-icon">{icon}</span>}
      <span>{label}</span>
    </button>
  );

  const SplitDropdown: React.FC<{
    id: string;
    trigger: React.ReactNode;
    items: { label: string; onClick: () => void }[];
  }> = ({ id, trigger, items }) => (
    <div className="rb-split-wrap">
      {trigger}
      {openDrop === id && (
        <>
          <div className="menu-backdrop" onClick={() => setOpenDrop(null)} />
          <div className="rb-split-menu">
            {items.map((it) => (
              <button
                key={it.label}
                className="rb-split-item"
                onClick={() => {
                  setOpenDrop(null);
                  it.onClick();
                }}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const currentLayerObj = doc?.layers.find((l) => l.name === doc.activeLayer) || doc?.layers[0];

  const render3DPanels = () => (
    <>
      <div className="rb-panel">
        <div className="rb-panel-body">
          <BigBtn icon={<Box3DIcon size={25} />} label="Parallelepip." cmd="BOX" title="PARALLELEPIPEDO (BOX)" />
          <BigBtn icon={<Cylinder3DIcon size={25} />} label="Cilindro" cmd="CYLINDER" title="CILINDRO (CIL)" />
          <BigBtn icon={<Sphere3DIcon size={25} />} label="Sfera" cmd="SPHERE" title="SFERA" />
          <BigBtn icon={<Cone3DIcon size={25} />} label="Cono" cmd="CONE" title="CONO" />
          <div className="rb-col">
            <SmallBtn icon={<Box3DIcon size={14} />} label="Piramide" cmd="PYRAMID" />
            <SmallBtn icon={<CircleIcon size={14} />} label="Toro" cmd="TORUS" />
          </div>
        </div>
        <div className="rb-panel-title">Solidi Primitivi</div>
      </div>

      <div className="rb-panel">
        <div className="rb-panel-body">
          <BigBtn icon={<Extrude3DIcon size={26} />} label="Estrudi 2D→3D" cmd="EXTRUDE" title="ESTRUDI (EU)" />
          <BigBtn icon={<ArcIcon size={24} />} label="Rivoluzione" cmd="REVOLVE" title="RIVOLUZIONE (RIV)" />
          <div className="rb-col">
            <SmallBtn icon={<JoinIcon size={13} />} label="Unione" cmd="UNION" title="UNIONE booleana 3D" />
            <SmallBtn icon={<TrimIcon size={13} />} label="Sottrai" cmd="SUBTRACT" title="SOTTRAI booleano 3D" />
            <SmallBtn icon={<StretchIcon size={13} />} label="Interseca" cmd="INTERSECT" title="INTERSECA booleano 3D" />
          </div>
          <div className="rb-col">
            <SmallBtn icon={<MoveIcon size={13} />} label="Sposta 3D" cmd="MOVE3D" />
            <SmallBtn icon={<RotateIcon size={13} />} label="Ruota 3D" cmd="ROTATE3D" />
            <SmallBtn
              icon={<Orbit3DIcon size={13} />}
              label={doc?.camera.is3D ? 'Torna a 2D' : 'Orbita 3D'}
              active={doc?.camera.is3D}
              onClick={() => setPresetView(doc?.camera.is3D ? 'top' : 'swIso')}
            />
          </div>
        </div>
        <div className="rb-panel-title">Modellazione & Booleane</div>
      </div>

      <div className="rb-panel">
        <div className="rb-panel-body">
          <div className="rb-col">
            {([
              ['2dwireframe', 'Wireframe 2D'],
              ['3dwireframe', 'Wireframe 3D'],
              ['conceptual', 'Concettuale'],
            ] as [VisualStyle, string][]).map(([id, lbl]) => (
              <SmallBtn key={id} label={lbl} active={doc?.camera.visualStyle === id} onClick={() => setVisualStyle(id)} />
            ))}
          </div>
          <div className="rb-col">
            {([
              ['shadedEdges', 'Ombregg. + spigoli'],
              ['realistic', 'Realistico'],
              ['xray', 'Raggi X'],
            ] as [VisualStyle, string][]).map(([id, lbl]) => (
              <SmallBtn key={id} label={lbl} active={doc?.camera.visualStyle === id} onClick={() => setVisualStyle(id)} />
            ))}
          </div>
        </div>
        <div className="rb-panel-title">Stili di visualizzazione</div>
      </div>

      <div className="rb-panel">
        <div className="rb-panel-body">
          <div className="rb-col">
            {([['top', 'Alto (2D)'], ['front', 'Fronte'], ['right', 'Destra']] as [PresetView, string][]).map(([v, l]) => (
              <SmallBtn key={v} label={l} active={doc?.camera.presetView === v} onClick={() => setPresetView(v)} />
            ))}
          </div>
          <div className="rb-col">
            {([['swIso', 'Asson. SO'], ['seIso', 'Asson. SE'], ['neIso', 'Asson. NE']] as [PresetView, string][]).map(([v, l]) => (
              <SmallBtn key={v} label={l} active={doc?.camera.presetView === v} onClick={() => setPresetView(v)} />
            ))}
          </div>
        </div>
        <div className="rb-panel-title">Viste 3D</div>
      </div>
    </>
  );

  return (
    <div className="ofcad-ribbon">
      {/* Ribbon Tabs Strip */}
      <div className="ribbon-tabs-strip">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            className={`ribbon-tab-btn ${activeTab === t.id && !ribbonCollapsed ? 'active' : ''}`}
            onClick={() => setActiveRibbonTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button
          className="ribbon-collapse-btn"
          onClick={toggleRibbonCollapsed}
          title={ribbonCollapsed ? 'Espandi barra multifunzione' : 'Riduci barra multifunzione'}
        >
          {ribbonCollapsed ? '▾' : '▴'}
        </button>
      </div>

      {/* Contextual Hatch Pattern Strip */}
      {!ribbonCollapsed && command?.name === 'HATCH' && (
        <div className="rb-hatch-context">
          <span className="rb-hatch-title">CREAZIONE TRATTEGGIO</span>
          <label className="rb-hatch-field">
            Motivo:
            <select
              value={settings.hatchPattern}
              onChange={(e) => submitCommandOption(e.target.value)}
            >
              {ALL_HATCH_PATTERNS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="rb-hatch-field">
            Scala:
            <input
              type="number"
              min={1}
              max={200}
              value={settings.hatchScale}
              onChange={(e) => updateSettings({ hatchScale: Math.max(1, Number(e.target.value) || 10) })}
            />
          </label>
          <label className="rb-hatch-field">
            Angolo°:
            <input
              type="number"
              value={settings.hatchAngle}
              onChange={(e) => updateSettings({ hatchAngle: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
      )}

      {/* Ribbon Panel Deck */}
      {!ribbonCollapsed && (
        <div className="ribbon-deck">
          {/* ==================== TAB: INIZIO ==================== */}
          {activeTab === 'home' && (
            <>
              {/* Panel: DISEGNA */}
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<LineIcon size={22} />} label="Linea" cmd="LINE" title="LINEA (L)" />
                  <BigBtn icon={<PolylineIcon size={22} />} label="Polilinea" cmd="POLYLINE" title="PLINEA (PL)" />
                  <SplitDropdown
                    id="circle"
                    trigger={
                      <BigBtn
                        icon={<CircleIcon size={22} />}
                        label="Cerchio ▾"
                        active={isActive('CIRCLE') || isActive('CIRCLE_2P') || isActive('CIRCLE_3P')}
                        onClick={() => setOpenDrop(openDrop === 'circle' ? null : 'circle')}
                        title="CERCHIO (C) — Modalità"
                      />
                    }
                    items={[
                      { label: 'Centro, Raggio (C)', onClick: () => startCommand('CIRCLE') },
                      { label: '2 Punti', onClick: () => startCommand('CIRCLE_2P') },
                      { label: '3 Punti', onClick: () => startCommand('CIRCLE_3P') },
                    ]}
                  />
                  <SplitDropdown
                    id="arc"
                    trigger={
                      <BigBtn
                        icon={<ArcIcon size={22} />}
                        label="Arco ▾"
                        active={isActive('ARC')}
                        onClick={() => setOpenDrop(openDrop === 'arc' ? null : 'arc')}
                        title="ARCO (AR)"
                      />
                    }
                    items={[
                      { label: '3 Punti (AR)', onClick: () => startCommand('ARC') },
                      {
                        label: 'Centro, Inizio, Fine',
                        onClick: () => {
                          startCommand('ARC');
                          submitCommandOption('CENTER_MODE');
                        },
                      },
                    ]}
                  />
                  <div className="rb-col">
                    <SmallBtn icon={<RectIcon size={14} />} label="Rettangolo" cmd="RECTANGLE" title="RETTANGOLO (RT)" />
                    <SmallBtn icon={<PolygonIcon size={14} />} label="Poligono" cmd="POLYGON" title="POLIGONO (PG)" />
                    <SmallBtn icon={<EllipseIcon size={14} />} label="Ellisse" cmd="ELLIPSE" title="ELLISSE (EL)" />
                  </div>
                  <div className="rb-col">
                    <SmallBtn icon={<HatchIcon size={14} />} label="Tratteggio" cmd="HATCH" title="TRATTEGGIO (RE)" />
                    <SmallBtn icon={<SplineIcon size={14} />} label="Spline" cmd="SPLINE" title="SPLINE (SPL)" />
                    <SplitDropdown
                      id="drawMore"
                      trigger={
                        <SmallBtn
                          icon={<XLineIcon size={14} />}
                          label="Altro ▾"
                          onClick={() => setOpenDrop(openDrop === 'drawMore' ? null : 'drawMore')}
                          title="Altri comandi di disegno"
                        />
                      }
                      items={[
                        { label: 'Anello (DO)', onClick: () => startCommand('DONUT') },
                        { label: 'Dividi (DIV)', onClick: () => startCommand('DIVIDE') },
                        { label: 'Misura segmenti (MES)', onClick: () => startCommand('MEASURE_SEG') },
                        { label: 'XLinea (XL)', onClick: () => startCommand('XLINE') },
                        { label: 'Semiretta (RAGGIO)', onClick: () => startCommand('RAY') },
                        { label: 'Punto (PO)', onClick: () => startCommand('POINT') },
                        { label: 'Nuvola rev.', onClick: () => startCommand('REVCLOUD') },
                      ]}
                    />
                  </div>
                </div>
                <div className="rb-panel-title">Disegna</div>
              </div>

              {/* Panel: EDITA */}
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <div className="rb-col">
                    <SmallBtn icon={<MoveIcon size={14} />} label="Sposta" cmd="MOVE" title="SPOSTA (S)" />
                    <SmallBtn icon={<RotateIcon size={14} />} label="Ruota" cmd="ROTATE" title="RUOTA (RU)" />
                    <SmallBtn icon={<TrimIcon size={14} />} label="Taglia" cmd="TRIM" title="TAGLIA (TA)" />
                  </div>
                  <div className="rb-col">
                    <SmallBtn icon={<CopyIcon size={14} />} label="Copia" cmd="COPY" title="COPIA (CP)" />
                    <SmallBtn icon={<MirrorIcon size={14} />} label="Specchio" cmd="MIRROR" title="SPECCHIO (SP)" />
                    <SmallBtn icon={<ExtendIcon size={14} />} label="Estendi" cmd="EXTEND" title="ESTENDI (ES)" />
                  </div>
                  <div className="rb-col">
                    <SmallBtn icon={<ScaleIcon size={14} />} label="Scala" cmd="SCALE" title="SCALA (SS)" />
                    <SmallBtn icon={<FilletIcon size={14} />} label="Raccordo" cmd="FILLET" title="RACCORDO (RA)" />
                    <SmallBtn icon={<ChamferIcon size={14} />} label="Cima" cmd="CHAMFER" title="CIMA (CM)" />
                  </div>
                  <div className="rb-col">
                    <SmallBtn icon={<OffsetIcon size={14} />} label="Offset" cmd="OFFSET" title="OFFSET (OF)" />
                    <SplitDropdown
                      id="array"
                      trigger={
                        <SmallBtn
                          icon={<ArrayIcon size={14} />}
                          label="Serie ▾"
                          onClick={() => setOpenDrop(openDrop === 'array' ? null : 'array')}
                          title="SERIE Rettangolare / Polare"
                        />
                      }
                      items={[
                        { label: 'Serie Rettangolare (SR)', onClick: () => startCommand('ARRAY_RECT') },
                        { label: 'Serie Polare (SRP)', onClick: () => startCommand('ARRAY_POLAR') },
                      ]}
                    />
                    <SmallBtn icon={<ExplodeIcon size={14} />} label="Esplodi" cmd="EXPLODE" title="ESPLODI (E)" />
                  </div>
                  <div className="rb-col">
                    <SmallBtn icon={<EraseIcon size={14} />} label="Cancella" cmd="ERASE" title="CANCELLA (CA / DEL)" />
                    <SmallBtn icon={<JoinIcon size={14} />} label="Unisci" cmd="JOIN" title="UNISCI (U)" />
                    <SplitDropdown
                      id="modifyMore"
                      trigger={
                        <SmallBtn
                          icon={<StretchIcon size={14} />}
                          label="Stira ▾"
                          onClick={() => setOpenDrop(openDrop === 'modifyMore' ? null : 'modifyMore')}
                          title="Stira / Spezza / Allinea / Ordine"
                        />
                      }
                      items={[
                        { label: 'Stira (STI)', onClick: () => startCommand('STRETCH') },
                        { label: 'Spezza (SZ)', onClick: () => startCommand('BREAK') },
                        { label: 'Allinea (AL)', onClick: () => startCommand('ALIGN') },
                        { label: 'Elimina duplicati (ELIMINADUP)', onClick: () => startCommand('OVERKILL') },
                        { label: 'Porta davanti', onClick: () => startCommand('DRAWORDER_FRONT') },
                        { label: 'Porta dietro', onClick: () => startCommand('DRAWORDER_BACK') },
                      ]}
                    />
                  </div>
                </div>
                <div className="rb-panel-title">Edita</div>
              </div>

              {/* Panel: ANNOTAZIONE */}
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<TextIcon size={22} />} label="Testo" cmd="MTEXT" title="TESTO MULTILINEA (MT)" />
                  <BigBtn icon={<DimensionIcon size={22} />} label="Quota" cmd="DIMLINEAR" title="DIMLINEARE (DLI)" />
                  <div className="rb-col">
                    <SmallBtn icon={<DimensionIcon size={13} />} label="Allineata" cmd="DIMALIGNED" />
                    <SmallBtn icon={<DimensionIcon size={13} />} label="Ø / R" cmd="DIMDIAMETER" />
                    <SmallBtn icon={<LeaderIcon size={13} />} label="Tabella" cmd="TABLE" title="TABELLA (TB)" />
                  </div>
                </div>
                <div className="rb-panel-title">Annotazione</div>
              </div>

              {/* Panel: LAYER */}
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn
                    icon={<LayersIcon size={22} />}
                    label="Prop. layer"
                    onClick={() => setModal('layerManager', true)}
                    title="Gestore Proprietà Layer (LA)"
                  />
                  <div className="rb-layer-controls">
                    <div className="rb-layer-dropdown-wrap">
                      <button
                        className="rb-layer-select-btn"
                        onClick={() => setLayerDropOpen(!layerDropOpen)}
                        disabled={!doc}
                      >
                        <span
                          className="color-chip"
                          style={{ background: currentLayerObj?.color || '#FFFFFF' }}
                        />
                        <span className="rb-layer-name">{currentLayerObj?.name || '0'}</span>
                        <span className="caret">▾</span>
                      </button>

                      {layerDropOpen && doc && (
                        <>
                          <div className="menu-backdrop" onClick={() => setLayerDropOpen(false)} />
                          <div className="rb-layer-popover">
                            {doc.layers.map((l) => (
                              <div
                                key={l.id}
                                className={`rb-layer-row ${l.name === doc.activeLayer ? 'active' : ''}`}
                              >
                                <button
                                  className="layer-mini-icon"
                                  title={l.on ? 'Spegni layer' : 'Accendi layer'}
                                  onClick={() => updateLayer(l.id, { on: !l.on })}
                                >
                                  {l.on ? '💡' : '○'}
                                </button>
                                <button
                                  className="layer-mini-icon"
                                  title={l.frozen ? 'Scongela' : 'Congela'}
                                  onClick={() => updateLayer(l.id, { frozen: !l.frozen })}
                                >
                                  {l.frozen ? '❄' : '☀'}
                                </button>
                                <button
                                  className="layer-mini-icon"
                                  title={l.locked ? 'Sblocca' : 'Blocca'}
                                  onClick={() => updateLayer(l.id, { locked: !l.locked })}
                                >
                                  {l.locked ? '🔒' : '🔓'}
                                </button>
                                <span className="color-chip" style={{ background: l.color }} />
                                <button
                                  className="layer-pick-name"
                                  onClick={() => {
                                    setActiveLayer(l.name);
                                    setLayerDropOpen(false);
                                  }}
                                >
                                  {l.name}
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="rb-layer-quick-btns">
                      <button
                        className="rb-mini-chip"
                        title="Isola layer corrente"
                        onClick={() => doc && isolateLayer(doc.activeLayer)}
                      >
                        Isola
                      </button>
                      <button
                        className="rb-mini-chip"
                        title="Accendi tutti i layer"
                        onClick={() => unisolateLayers()}
                      >
                        Mostra
                      </button>
                    </div>
                  </div>
                </div>
                <div className="rb-panel-title">Layer</div>
              </div>

              {/* Panel: BLOCCO */}
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn
                    icon={<BlockIcon size={22} />}
                    label="Blocchi"
                    active={showBlocksPalette}
                    onClick={() => toggleBlocksPalette()}
                    title="Tavolozza Blocchi (INSER)"
                  />
                  <div className="rb-col">
                    <SmallBtn icon={<BlockIcon size={13} />} label="Crea" cmd="BLOCK" />
                    <SmallBtn icon={<PropertiesIcon size={13} />} label="Gruppo" cmd="GROUP" />
                    <SmallBtn icon={<ExplodeIcon size={13} />} label="Separa" cmd="UNGROUP" />
                  </div>
                </div>
                <div className="rb-panel-title">Blocco</div>
              </div>

              {/* Panel: PROPRIETA */}
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <div className="rb-props-stack">
                    <select
                      className="rb-prop-select"
                      value={doc?.activeColor || 'ByLayer'}
                      onChange={(e) => setActiveColor(e.target.value)}
                      title="Colore oggetto"
                    >
                      <option value="ByLayer">■ DaLayer</option>
                      {CAD_ACI_COLORS.map((c) => (
                        <option key={c.aci} value={c.hex}>
                          ■ {c.name} ({c.aci})
                        </option>
                      ))}
                    </select>
                    <select
                      className="rb-prop-select"
                      value={doc?.activeLineWeight ?? -1}
                      onChange={(e) => setActiveLineWeight(parseFloat(e.target.value))}
                      title="Spessore linea"
                    >
                      {LINE_WEIGHTS.map((lw) => (
                        <option key={lw} value={lw}>
                          {lw < 0 ? '— DaLayer' : `— ${lw.toFixed(2)} mm`}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rb-prop-select"
                      value={doc?.activeLineType || 'ByLayer'}
                      onChange={(e) => setActiveLineType(e.target.value as LineTypeName)}
                      title="Tipo di linea"
                    >
                      {LINE_TYPES.map((lt) => (
                        <option key={lt.id} value={lt.id}>
                          {lt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <BigBtn icon={<MatchPropIcon size={21} />} label="Corrisp." cmd="MATCHPROP" title="CORRISPROP (CRP)" />
                </div>
                <div className="rb-panel-title">Proprietà</div>
              </div>

              {/* Panel: UTILITA & APPUNTI */}
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<MeasureIcon size={21} />} label="Misura" cmd="DIST" title="Misura Distanza (DI)" />
                  <div className="rb-col">
                    <SmallBtn label="Area" cmd="AREA" />
                    <SmallBtn label="Calc" active={showQuickCalc} onClick={() => toggleQuickCalc()} />
                    <SplitDropdown
                      id="clipboard"
                      trigger={
                        <SmallBtn
                          label="Appunti ▾"
                          onClick={() => setOpenDrop(openDrop === 'clipboard' ? null : 'clipboard')}
                          title="Copia / Incolla / Taglia / ID Punto"
                        />
                      }
                      items={[
                        { label: 'Incolla (Ctrl+V)', onClick: pasteFromClipboard },
                        { label: 'Copia (Ctrl+C)', onClick: copyToClipboard },
                        { label: 'Taglia (Ctrl+X)', onClick: cutToClipboard },
                        { label: 'Coordinate ID (ID)', onClick: () => startCommand('ID') },
                      ]}
                    />
                  </div>
                </div>
                <div className="rb-panel-title">Utilità</div>
              </div>
            </>
          )}

          {/* ==================== TAB: INSERISCI ==================== */}
          {activeTab === 'insert' && (
            <>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<BlockIcon size={26} />} label="Inserisci blocco" onClick={() => toggleBlocksPalette(true)} />
                  <BigBtn icon={<BlockIcon size={26} />} label="Crea blocco" cmd="BLOCK" />
                </div>
                <div className="rb-panel-title">Blocco</div>
              </div>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn
                    icon={<SaveIcon size={26} />}
                    label="Importa DXF"
                    onClick={async () => {
                      const res = await openCadFileDialog();
                      if (res) importDocumentContent(res.name, res.content, res.filePath);
                    }}
                  />
                  <BigBtn icon={<HatchIcon size={26} />} label="Tratteggio" cmd="HATCH" />
                </div>
                <div className="rb-panel-title">Importa / Riferimenti</div>
              </div>
            </>
          )}

          {/* ==================== TAB: ANNOTA ==================== */}
          {activeTab === 'annotate' && (
            <>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<TextIcon size={26} />} label="Testo M" cmd="MTEXT" />
                  <BigBtn icon={<TextIcon size={24} />} label="Testo riga" cmd="TEXT" />
                  <BigBtn icon={<PointIcon size={24} />} label="Tabella" cmd="TABLE" title="TABELLA (TB)" />
                  <div className="rb-col">
                    <div className="rb-inline-field">
                      <span>Altezza testo:</span>
                      <input
                        type="number"
                        value={settings.textHeight}
                        min={1}
                        max={200}
                        onChange={(e) => updateSettings({ textHeight: Math.max(1, parseFloat(e.target.value) || 12) })}
                      />
                    </div>
                  </div>
                </div>
                <div className="rb-panel-title">Testo & Tabelle</div>
              </div>

              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<DimensionIcon size={26} />} label="Lineare" cmd="DIMLINEAR" />
                  <BigBtn icon={<DimensionIcon size={26} />} label="Allineata" cmd="DIMALIGNED" />
                  <div className="rb-col">
                    <SmallBtn icon={<DimensionIcon size={14} />} label="Raggio" cmd="DIMRADIUS" />
                    <SmallBtn icon={<DimensionIcon size={14} />} label="Diametro" cmd="DIMDIAMETER" />
                    <SmallBtn icon={<DimensionIcon size={14} />} label="Angolare" cmd="DIMANGULAR" />
                  </div>
                  <div className="rb-col">
                    <div className="rb-inline-field">
                      <span>Alt. quota:</span>
                      <input
                        type="number"
                        value={settings.dimTextHeight}
                        min={2}
                        max={100}
                        onChange={(e) => updateSettings({ dimTextHeight: Math.max(2, parseFloat(e.target.value) || 10) })}
                      />
                    </div>
                  </div>
                </div>
                <div className="rb-panel-title">Quote</div>
              </div>

              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<LeaderIcon size={26} />} label="Direttrice" cmd="LEADER" />
                  <BigBtn icon={<RevCloudIcon size={26} />} label="Nuvola rev." cmd="REVCLOUD" />
                </div>
                <div className="rb-panel-title">Direttrici / Revisione</div>
              </div>
            </>
          )}

          {/* ==================== TAB: PARAMETRICO ==================== */}
          {activeTab === 'parametric' && (
            <>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<LineIcon size={24} />} label="Orizzontale" onClick={() => applyGeometricConstraint('horizontal')} />
                  <BigBtn icon={<LineIcon size={24} />} label="Verticale" onClick={() => applyGeometricConstraint('vertical')} />
                  <div className="rb-col">
                    <SmallBtn icon={<LineIcon size={13} />} label="Parallelo" onClick={() => applyGeometricConstraint('parallel')} />
                    <SmallBtn icon={<LineIcon size={13} />} label="Perpendic." onClick={() => applyGeometricConstraint('perpendicular')} />
                    <SmallBtn icon={<CircleIcon size={13} />} label="Concentrico" onClick={() => applyGeometricConstraint('concentric')} />
                  </div>
                  <div className="rb-col">
                    <SmallBtn icon={<StretchIcon size={13} />} label="Uguale" onClick={() => applyGeometricConstraint('equal')} />
                    <SmallBtn icon={<PointIcon size={13} />} label="Fisso" onClick={() => applyGeometricConstraint('fix')} />
                  </div>
                </div>
                <div className="rb-panel-title">Vincoli Geometrici</div>
              </div>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn
                    icon={<PropertiesIcon size={24} />}
                    label="Parametri"
                    cmd="PARAMETERS"
                    title="Gestione Variabili Parametriche (PARAMETRI)"
                  />
                  <div className="rb-col" style={{ padding: '0 8px', fontSize: 11, color: 'var(--text-muted)' }}>
                    <div>Usa le variabili definite nei campi numerici della riga di comando (es. <code>LARGHEZZA/2</code>).</div>
                  </div>
                </div>
                <div className="rb-panel-title">Gestione Espressioni</div>
              </div>
            </>
          )}

          {/* ==================== TAB: STRUMENTI 3D ==================== */}
          {activeTab === '3dtools' && render3DPanels()}

          {/* ==================== TAB: INIZIO 3D (Workspace Elementi 3D di base) ==================== */}
          {activeTab === 'home3d' && (
            <>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<LineIcon size={22} />} label="Linea" cmd="LINE" />
                  <BigBtn icon={<PolylineIcon size={22} />} label="Polilinea" cmd="POLYLINE" />
                  <div className="rb-col">
                    <SmallBtn icon={<CircleIcon size={14} />} label="Cerchio" cmd="CIRCLE" />
                    <SmallBtn icon={<RectIcon size={14} />} label="Rettangolo" cmd="RECTANGLE" />
                    <SmallBtn icon={<EraseIcon size={14} />} label="Cancella" cmd="ERASE" />
                  </div>
                </div>
                <div className="rb-panel-title">Disegno 2D Rapido</div>
              </div>
              {render3DPanels()}
            </>
          )}

          {/* ==================== TAB: SOLIDI (Workspace Modellazione 3D) ==================== */}
          {activeTab === 'solids' && render3DPanels()}

          {/* ==================== TAB: VISTA ==================== */}
          {activeTab === 'view' && (
            <>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<ZoomExtentsIcon size={25} />} label="Zoom Estens." onClick={() => zoomExtents()} />
                  <BigBtn icon={<PanIcon size={25} />} label="Pan" cmd="PAN" />
                  <BigBtn icon={<Orbit3DIcon size={25} />} label="Vista 3D" active={doc?.camera.is3D} onClick={() => setPresetView(doc?.camera.is3D ? 'top' : 'swIso')} />
                </div>
                <div className="rb-panel-title">Navigazione</div>
              </div>

              <div className="rb-panel">
                <div className="rb-panel-body">
                  <div className="rb-col">
                    <SmallBtn
                      label={settings.showViewCube ? '✓ ViewCube' : 'ViewCube'}
                      active={settings.showViewCube}
                      onClick={() => updateSettings({ showViewCube: !settings.showViewCube })}
                    />
                    <SmallBtn
                      label={settings.showNavBar ? '✓ Barra navigaz.' : 'Barra navigaz.'}
                      active={settings.showNavBar}
                      onClick={() => updateSettings({ showNavBar: !settings.showNavBar })}
                    />
                    <SmallBtn
                      label={settings.showUcsIcon ? '✓ Icona UCS' : 'Icona UCS'}
                      active={settings.showUcsIcon}
                      onClick={() => updateSettings({ showUcsIcon: !settings.showUcsIcon })}
                    />
                  </div>
                </div>
                <div className="rb-panel-title">Strumenti finestra</div>
              </div>

              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn
                    icon={<PropertiesIcon size={25} />}
                    label="Proprietà"
                    active={showPropertiesPalette}
                    onClick={() => togglePropertiesPalette()}
                  />
                  <BigBtn
                    icon={<LayersIcon size={25} />}
                    label="Gestore Layer"
                    onClick={() => setModal('layerManager', true)}
                  />
                  <BigBtn
                    icon={<BlockIcon size={25} />}
                    label="Blocchi"
                    active={showBlocksPalette}
                    onClick={() => toggleBlocksPalette()}
                  />
                  <BigBtn
                    icon={<MeasureIcon size={25} />}
                    label="Calcolatrice"
                    active={showQuickCalc}
                    onClick={() => toggleQuickCalc()}
                  />
                </div>
                <div className="rb-panel-title">Tavolozze</div>
              </div>
            </>
          )}

          {/* ==================== TAB: GESTISCI ==================== */}
          {activeTab === 'manage' && (
            <>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<MeasureIcon size={25} />} label="Unità" onClick={() => setModal('units', true)} />
                  <BigBtn icon={<PropertiesIcon size={25} />} label="Opzioni" onClick={() => setModal('options', true)} />
                  <BigBtn icon={<EraseIcon size={25} />} label="Elimina (Purge)" cmd="PURGE" />
                </div>
                <div className="rb-panel-title">Standard CAD</div>
              </div>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<TextIcon size={25} />} label="Console Script" onClick={() => setModal('script', true)} />
                  <BigBtn icon={<PropertiesIcon size={25} />} label="Finestra F2" onClick={() => setModal('textWindowF2', true)} />
                </div>
                <div className="rb-panel-title">Automazione & Log</div>
              </div>
            </>
          )}

          {/* ==================== TAB: OUTPUT ==================== */}
          {activeTab === 'output' && (
            <>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn icon={<PrintIcon size={26} />} label="Stampa / Plot" onClick={() => setModal('plot', true)} />
                </div>
                <div className="rb-panel-title">Stampa</div>
              </div>
              <div className="rb-panel">
                <div className="rb-panel-body">
                  <BigBtn
                    icon={<SaveIcon size={26} />}
                    label="Esporta DXF"
                    onClick={() => doc && saveCadFileDialog(doc, 'dxf')}
                  />
                  <BigBtn
                    icon={<SaveIcon size={26} />}
                    label="Esporta SVG"
                    onClick={() => doc && saveCadFileDialog(doc, 'svg')}
                  />
                  <BigBtn
                    icon={<Box3DIcon size={26} />}
                    label="Esporta STL 3D"
                    onClick={() => doc && saveCadFileDialog(doc, 'stl')}
                  />
                </div>
                <div className="rb-panel-title">Esporta</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
