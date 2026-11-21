import React from 'react';
import { useCadStore } from '../../store/useCadStore';
import { CAD_ACI_COLORS, HatchPatternName, LINE_TYPES, LINE_WEIGHTS, LineTypeName } from '../../types/cad';
import { getEntityArea, getEntityLength, radToDeg, degToRad } from '../../engine/math';

const ENTITY_TYPE_IT: Record<string, string> = {
  line: 'Linea',
  polyline: 'Polilinea',
  circle: 'Cerchio',
  arc: 'Arco',
  rectangle: 'Rettangolo',
  polygon: 'Poligono',
  ellipse: 'Ellisse',
  spline: 'Spline',
  xline: 'Linea di costruzione',
  ray: 'Semiretta',
  point: 'Punto',
  hatch: 'Tratteggio',
  text: 'Testo',
  mtext: 'Testo multilinea',
  dimension: 'Quota',
  leader: 'Direttrice',
  block_ref: 'Riferimento blocco',
  revcloud: 'Nuvola di revisione',
  table: 'Tabella',
  solid3d: 'Solido 3D',
};

const ALL_HATCH_PATTERNS: HatchPatternName[] = [
  'ANSI31', 'ANSI32', 'ANSI33', 'ANSI37', 'SOLID', 'NET', 'BRICK',
  'DOTS', 'HONEY', 'CROSS', 'AR-CONC', 'AR-SAND', 'AR-HBONE', 'EARTH', 'GRATE',
];

export const PropertiesPalette: React.FC = () => {
  const show = useCadStore((s) => s.showPropertiesPalette);
  const toggle = useCadStore((s) => s.togglePropertiesPalette);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const settings = useCadStore((s) => s.settings);
  const updateEntity = useCadStore((s) => s.updateEntity);
  const updateSelectedEntities = useCadStore((s) => s.updateSelectedEntities);
  const setModal = useCadStore((s) => s.setModal);

  if (!show || !doc) return null;

  const selected = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
  const single = selected.length === 1 ? selected[0] : null;
  const pr = settings.precision;

  const getCommon = <T,>(getter: (e: typeof selected[number]) => T): T | 'VARIES' => {
    if (selected.length === 0) return 'VARIES';
    const first = getter(selected[0]);
    for (let i = 1; i < selected.length; i++) {
      if (getter(selected[i]) !== first) return 'VARIES';
    }
    return first;
  };

  const commonColor = getCommon((e) => e.color);
  const commonLayer = getCommon((e) => e.layer);
  const commonLineType = getCommon((e) => e.lineType);
  const commonLineWeight = getCommon((e) => e.lineWeight);
  const commonElevation = getCommon((e) => e.elevation || 0);
  const commonThickness = getCommon((e) => e.thickness || 0);
  const commonFixed = getCommon((e) => Boolean(e.fixed));

  const numInput = (val: number | 'VARIES', onChange: (v: number) => void) => (
    <input
      type={val === 'VARIES' ? 'text' : 'number'}
      step="any"
      placeholder={val === 'VARIES' ? '*VARIA*' : undefined}
      value={val === 'VARIES' ? '' : Number.isFinite(val) ? Number(val.toFixed(pr)) : 0}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        if (!Number.isNaN(n)) onChange(n);
      }}
    />
  );

  return (
    <aside className="cad-palette properties-palette">
      <div className="palette-header">
        <span>PROPRIETÀ</span>
        <button className="palette-close" onClick={() => toggle(false)} title="Chiudi (Ctrl+1)">×</button>
      </div>

      <div className="palette-sel-bar">
        {selected.length === 0
          ? 'Nessuna selezione'
          : single
            ? `${ENTITY_TYPE_IT[single.type] || single.type} (1)`
            : `Tutti (${selected.length} oggetti)`}
      </div>

      <div className="palette-scroll">
        {selected.length === 0 ? (
          <div className="prop-group">
            <div className="prop-group-title">Disegno corrente</div>
            <div className="prop-row"><span>Oggetti totali</span><strong>{doc.entities.length}</strong></div>
            <div className="prop-row"><span>Layer attivi</span><strong>{doc.layers.length}</strong></div>
            <div className="prop-row"><span>Layer corrente</span><strong>{doc.activeLayer}</strong></div>
            <div className="prop-row"><span>Unità</span><strong>{settings.units}</strong></div>
            <div className="prop-row"><span>Zoom</span><strong>{(doc.camera.zoom * 100).toFixed(0)}%</strong></div>
            <div className="prop-row"><span>Vista</span><strong>{doc.camera.presetView}</strong></div>
            <div className="prop-row"><span>Stile</span><strong>{doc.camera.visualStyle}</strong></div>
          </div>
        ) : (
          <>
            {/* GENERALE */}
            <div className="prop-group">
              <div className="prop-group-title">Generale</div>
              <div className="prop-row">
                <span>Colore</span>
                <select
                  value={commonColor === 'VARIES' ? '__VARIES__' : commonColor}
                  onChange={(e) => e.target.value !== '__VARIES__' && updateSelectedEntities({ color: e.target.value })}
                >
                  {commonColor === 'VARIES' && <option value="__VARIES__">*VARIA*</option>}
                  <option value="ByLayer">DaLayer</option>
                  {CAD_ACI_COLORS.map((c) => (
                    <option key={c.aci} value={c.hex}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="prop-row">
                <span>Layer</span>
                <select
                  value={commonLayer === 'VARIES' ? '__VARIES__' : commonLayer}
                  onChange={(e) => e.target.value !== '__VARIES__' && updateSelectedEntities({ layer: e.target.value })}
                >
                  {commonLayer === 'VARIES' && <option value="__VARIES__">*VARIA*</option>}
                  {doc.layers.map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="prop-row">
                <span>Tipo linea</span>
                <select
                  value={commonLineType === 'VARIES' ? '__VARIES__' : commonLineType}
                  onChange={(e) => e.target.value !== '__VARIES__' && updateSelectedEntities({ lineType: e.target.value as LineTypeName })}
                >
                  {commonLineType === 'VARIES' && <option value="__VARIES__">*VARIA*</option>}
                  {LINE_TYPES.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.label}</option>
                  ))}
                </select>
              </div>
              <div className="prop-row">
                <span>Spessore</span>
                <select
                  value={commonLineWeight === 'VARIES' ? '__VARIES__' : String(commonLineWeight)}
                  onChange={(e) => e.target.value !== '__VARIES__' && updateSelectedEntities({ lineWeight: parseFloat(e.target.value) })}
                >
                  {commonLineWeight === 'VARIES' && <option value="__VARIES__">*VARIA*</option>}
                  {LINE_WEIGHTS.map((lw) => (
                    <option key={lw} value={String(lw)}>{lw < 0 ? 'DaLayer' : `${lw.toFixed(2)} mm`}</option>
                  ))}
                </select>
              </div>
              <div className="prop-row">
                <span>Elevazione Z</span>
                {numInput(commonElevation, (v) => updateSelectedEntities({ elevation: v }))}
              </div>
              <div className="prop-row">
                <span>Altezza 3D (Spess.)</span>
                {numInput(commonThickness, (v) => updateSelectedEntities({ thickness: Math.max(0, v) }))}
              </div>
              <div className="prop-row">
                <span>Fisso (Vincolo)</span>
                <input
                  type="checkbox"
                  checked={commonFixed === true}
                  ref={(el) => { if (el) el.indeterminate = commonFixed === 'VARIES'; }}
                  onChange={(e) => updateSelectedEntities({ fixed: e.target.checked })}
                />
              </div>
            </div>

            {/* GEOMETRIA SPECIFICA PER TIPO */}
            {single && (
              <div className="prop-group">
                <div className="prop-group-title">Geometria</div>

                {single.type === 'line' && (
                  <>
                    <div className="prop-row"><span>Inizio X</span>{numInput(single.start.x, (v) => updateEntity(single.id, { start: { ...single.start, x: v } }))}</div>
                    <div className="prop-row"><span>Inizio Y</span>{numInput(single.start.y, (v) => updateEntity(single.id, { start: { ...single.start, y: v } }))}</div>
                    <div className="prop-row"><span>Fine X</span>{numInput(single.end.x, (v) => updateEntity(single.id, { end: { ...single.end, x: v } }))}</div>
                    <div className="prop-row"><span>Fine Y</span>{numInput(single.end.y, (v) => updateEntity(single.id, { end: { ...single.end, y: v } }))}</div>
                    <div className="prop-row"><span>Lunghezza</span><strong>{getEntityLength(single).toFixed(pr)} {settings.units}</strong></div>
                  </>
                )}

                {single.type === 'circle' && (
                  <>
                    <div className="prop-row"><span>Centro X</span>{numInput(single.center.x, (v) => updateEntity(single.id, { center: { ...single.center, x: v } }))}</div>
                    <div className="prop-row"><span>Centro Y</span>{numInput(single.center.y, (v) => updateEntity(single.id, { center: { ...single.center, y: v } }))}</div>
                    <div className="prop-row"><span>Raggio</span>{numInput(single.radius, (v) => updateEntity(single.id, { radius: Math.max(0.1, v) }))}</div>
                    <div className="prop-row"><span>Diametro</span><strong>{(single.radius * 2).toFixed(pr)}</strong></div>
                    <div className="prop-row"><span>Circonferenza</span><strong>{getEntityLength(single).toFixed(pr)}</strong></div>
                    <div className="prop-row"><span>Area</span><strong>{getEntityArea(single).toFixed(pr)}</strong></div>
                  </>
                )}

                {single.type === 'arc' && (
                  <>
                    <div className="prop-row"><span>Centro X</span>{numInput(single.center.x, (v) => updateEntity(single.id, { center: { ...single.center, x: v } }))}</div>
                    <div className="prop-row"><span>Centro Y</span>{numInput(single.center.y, (v) => updateEntity(single.id, { center: { ...single.center, y: v } }))}</div>
                    <div className="prop-row"><span>Raggio</span>{numInput(single.radius, (v) => updateEntity(single.id, { radius: Math.max(0.1, v) }))}</div>
                    <div className="prop-row"><span>Angolo iniz.°</span>{numInput(radToDeg(single.startAngle), (v) => updateEntity(single.id, { startAngle: degToRad(v) }))}</div>
                    <div className="prop-row"><span>Angolo fine°</span>{numInput(radToDeg(single.endAngle), (v) => updateEntity(single.id, { endAngle: degToRad(v) }))}</div>
                    <div className="prop-row"><span>Lunghezza</span><strong>{getEntityLength(single).toFixed(pr)}</strong></div>
                  </>
                )}

                {single.type === 'rectangle' && (() => {
                  const cx = (single.p1.x + single.p2.x) / 2;
                  const cy = (single.p1.y + single.p2.y) / 2;
                  const rw = Math.abs(single.p2.x - single.p1.x);
                  const rh = Math.abs(single.p2.y - single.p1.y);
                  const rotDeg = radToDeg(single.rotation || 0);
                  return (
                    <>
                      <div className="prop-row"><span>Centro X</span>{numInput(cx, (v) => updateEntity(single.id, { p1: { x: v - rw / 2, y: single.p1.y }, p2: { x: v + rw / 2, y: single.p2.y } }))}</div>
                      <div className="prop-row"><span>Centro Y</span>{numInput(cy, (v) => updateEntity(single.id, { p1: { x: single.p1.x, y: v - rh / 2 }, p2: { x: single.p2.x, y: v + rh / 2 } }))}</div>
                      <div className="prop-row"><span>Larghezza</span>{numInput(rw, (v) => { const nw = Math.max(0.1, v); updateEntity(single.id, { p1: { x: cx - nw / 2, y: single.p1.y }, p2: { x: cx + nw / 2, y: single.p2.y } }); })}</div>
                      <div className="prop-row"><span>Altezza</span>{numInput(rh, (v) => { const nh = Math.max(0.1, v); updateEntity(single.id, { p1: { x: single.p1.x, y: cy - nh / 2 }, p2: { x: single.p2.x, y: cy + nh / 2 } }); })}</div>
                      <div className="prop-row"><span>Rotazione°</span>{numInput(rotDeg, (v) => updateEntity(single.id, { rotation: degToRad(v) }))}</div>
                      <div className="prop-row"><span>Perimetro</span><strong>{getEntityLength(single).toFixed(pr)}</strong></div>
                      <div className="prop-row"><span>Area</span><strong>{getEntityArea(single).toFixed(pr)}</strong></div>
                    </>
                  );
                })()}

                {single.type === 'polyline' && (
                  <>
                    <div className="prop-row">
                      <span>Chiusa</span>
                      <input type="checkbox" checked={single.closed} onChange={(e) => updateEntity(single.id, { closed: e.target.checked })} />
                    </div>
                    <div className="prop-row"><span>Vertici</span><strong>{single.points.length}</strong></div>
                    <div className="prop-row"><span>Lunghezza</span><strong>{getEntityLength(single).toFixed(pr)}</strong></div>
                    {single.closed && <div className="prop-row"><span>Area</span><strong>{getEntityArea(single).toFixed(pr)}</strong></div>}
                  </>
                )}

                {single.type === 'ellipse' && (
                  <>
                    <div className="prop-row"><span>Centro X</span>{numInput(single.center.x, (v) => updateEntity(single.id, { center: { ...single.center, x: v } }))}</div>
                    <div className="prop-row"><span>Centro Y</span>{numInput(single.center.y, (v) => updateEntity(single.id, { center: { ...single.center, y: v } }))}</div>
                    <div className="prop-row"><span>Raggio X</span>{numInput(single.rx, (v) => updateEntity(single.id, { rx: Math.max(0.1, v) }))}</div>
                    <div className="prop-row"><span>Raggio Y</span>{numInput(single.ry, (v) => updateEntity(single.id, { ry: Math.max(0.1, v) }))}</div>
                    <div className="prop-row"><span>Rotazione°</span>{numInput(radToDeg(single.rotation), (v) => updateEntity(single.id, { rotation: degToRad(v) }))}</div>
                    <div className="prop-row"><span>Area</span><strong>{getEntityArea(single).toFixed(pr)}</strong></div>
                  </>
                )}

                {single.type === 'spline' && (
                  <>
                    <div className="prop-row">
                      <span>Chiusa</span>
                      <input type="checkbox" checked={single.closed} onChange={(e) => updateEntity(single.id, { closed: e.target.checked })} />
                    </div>
                    <div className="prop-row"><span>Punti controllo</span><strong>{single.controlPoints.length}</strong></div>
                    <div className="prop-row"><span>Lunghezza</span><strong>{getEntityLength(single).toFixed(pr)}</strong></div>
                  </>
                )}

                {(single.type === 'xline' || single.type === 'ray') && (
                  <>
                    <div className="prop-row"><span>Origine X</span>{numInput(single.origin.x, (v) => updateEntity(single.id, { origin: { ...single.origin, x: v } }))}</div>
                    <div className="prop-row"><span>Origine Y</span>{numInput(single.origin.y, (v) => updateEntity(single.id, { origin: { ...single.origin, y: v } }))}</div>
                    <div className="prop-row"><span>Dir. X</span>{numInput(single.direction.x, (v) => updateEntity(single.id, { direction: { ...single.direction, x: v } }))}</div>
                    <div className="prop-row"><span>Dir. Y</span>{numInput(single.direction.y, (v) => updateEntity(single.id, { direction: { ...single.direction, y: v } }))}</div>
                  </>
                )}

                {single.type === 'point' && (
                  <>
                    <div className="prop-row"><span>Posizione X</span>{numInput(single.position.x, (v) => updateEntity(single.id, { position: { ...single.position, x: v } }))}</div>
                    <div className="prop-row"><span>Posizione Y</span>{numInput(single.position.y, (v) => updateEntity(single.id, { position: { ...single.position, y: v } }))}</div>
                  </>
                )}

                {single.type === 'leader' && (
                  <>
                    <div className="prop-row">
                      <span>Testo</span>
                      <input type="text" value={single.text} onChange={(e) => updateEntity(single.id, { text: e.target.value })} />
                    </div>
                    <div className="prop-row"><span>Alt. testo</span>{numInput(single.textHeight, (v) => updateEntity(single.id, { textHeight: Math.max(1, v) }))}</div>
                  </>
                )}

                {single.type === 'revcloud' && (
                  <>
                    <div className="prop-row"><span>Lunghezza arco</span>{numInput(single.arcLength, (v) => updateEntity(single.id, { arcLength: Math.max(2, v) }))}</div>
                    <div className="prop-row">
                      <span>Chiusa</span>
                      <input type="checkbox" checked={single.closed} onChange={(e) => updateEntity(single.id, { closed: e.target.checked })} />
                    </div>
                  </>
                )}

                {single.type === 'table' && (
                  <>
                    <div className="prop-row"><span>Dimensione</span><strong>{single.rows} × {single.cols}</strong></div>
                    <div className="prop-row"><span>Largh. col.</span>{numInput(single.colWidth, (v) => updateEntity(single.id, { colWidth: Math.max(10, v) }))}</div>
                    <div className="prop-row"><span>Alt. riga</span>{numInput(single.rowHeight, (v) => updateEntity(single.id, { rowHeight: Math.max(8, v) }))}</div>
                    <div className="prop-row">
                      <span>Celle</span>
                      <button className="ofcad-btn-sm" onClick={() => setModal('tableEditor', { entityId: single.id })}>
                        Modifica celle...
                      </button>
                    </div>
                  </>
                )}

                {single.type === 'polygon' && (
                  <>
                    <div className="prop-row"><span>Lati</span>{numInput(single.sides, (v) => updateEntity(single.id, { sides: Math.max(3, Math.round(v)) }))}</div>
                    <div className="prop-row"><span>Raggio</span>{numInput(single.radius, (v) => updateEntity(single.id, { radius: Math.max(0.1, v) }))}</div>
                    <div className="prop-row"><span>Area</span><strong>{getEntityArea(single).toFixed(pr)}</strong></div>
                  </>
                )}

                {(single.type === 'text' || single.type === 'mtext') && (
                  <>
                    <div className="prop-row">
                      <span>Contenuto</span>
                      <input
                        type="text"
                        value={single.content}
                        onChange={(e) => updateEntity(single.id, { content: e.target.value })}
                      />
                    </div>
                    <div className="prop-row"><span>Altezza</span>{numInput(single.height, (v) => updateEntity(single.id, { height: Math.max(1, v) }))}</div>
                    <div className="prop-row"><span>Rotazione°</span>{numInput(radToDeg(single.rotation), (v) => updateEntity(single.id, { rotation: degToRad(v) }))}</div>
                  </>
                )}

                {single.type === 'hatch' && (
                  <>
                    <div className="prop-row">
                      <span>Motivo</span>
                      <select
                        value={single.pattern}
                        onChange={(e) => updateEntity(single.id, { pattern: e.target.value as HatchPatternName })}
                      >
                        {ALL_HATCH_PATTERNS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="prop-row"><span>Scala</span>{numInput(single.scale, (v) => updateEntity(single.id, { scale: Math.max(1, v) }))}</div>
                    <div className="prop-row"><span>Angolo°</span>{numInput(single.angle, (v) => updateEntity(single.id, { angle: v }))}</div>
                    <div className="prop-row"><span>Area</span><strong>{getEntityArea(single).toFixed(pr)}</strong></div>
                  </>
                )}

                {single.type === 'dimension' && (
                  <>
                    <div className="prop-row">
                      <span>Testo custom</span>
                      <input
                        type="text"
                        placeholder="(Automatico)"
                        value={single.textOverride || ''}
                        onChange={(e) => updateEntity(single.id, { textOverride: e.target.value || undefined })}
                      />
                    </div>
                    <div className="prop-row"><span>Alt. testo</span>{numInput(single.textHeight, (v) => updateEntity(single.id, { textHeight: Math.max(2, v) }))}</div>
                  </>
                )}

                {single.type === 'block_ref' && (
                  <>
                    <div className="prop-row"><span>Blocco</span><strong>{single.blockName}</strong></div>
                    <div className="prop-row"><span>Scala X</span>{numInput(single.scaleX, (v) => updateEntity(single.id, { scaleX: v || 1 }))}</div>
                    <div className="prop-row"><span>Scala Y</span>{numInput(single.scaleY, (v) => updateEntity(single.id, { scaleY: v || 1 }))}</div>
                    <div className="prop-row"><span>Rotazione°</span>{numInput(radToDeg(single.rotation), (v) => updateEntity(single.id, { rotation: degToRad(v) }))}</div>
                  </>
                )}

                {single.type === 'solid3d' && (
                  <>
                    <div className="prop-row"><span>Primitiva</span><strong>{single.primitive === 'mesh' ? `MESH CSG (${Math.round((single.meshPositions?.length || 0) / 9)} tri)` : single.primitive.toUpperCase()}</strong></div>
                    <div className="prop-row"><span>Pos. X</span>{numInput(single.position.x, (v) => updateEntity(single.id, { position: { ...single.position, x: v } }))}</div>
                    <div className="prop-row"><span>Pos. Y</span>{numInput(single.position.y, (v) => updateEntity(single.id, { position: { ...single.position, y: v } }))}</div>
                    <div className="prop-row"><span>Pos. Z</span>{numInput(single.position.z, (v) => updateEntity(single.id, { position: { ...single.position, z: v } }))}</div>
                    <div className="prop-row"><span>Dim. X / R</span>{numInput(single.size.x, (v) => updateEntity(single.id, { size: { ...single.size, x: Math.max(1, v) } }))}</div>
                    <div className="prop-row"><span>Dim. Y</span>{numInput(single.size.y, (v) => updateEntity(single.id, { size: { ...single.size, y: Math.max(1, v) } }))}</div>
                    <div className="prop-row"><span>Altezza Z</span>{numInput(single.size.z, (v) => updateEntity(single.id, { size: { ...single.size, z: Math.max(1, v) } }))}</div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
