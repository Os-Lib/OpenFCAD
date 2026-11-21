import React, { useState } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { BBox, BlockDefinition, CadEntity, Point2D } from '../../types/cad';
import {
  getEntityBBox,
  getPolygonVertices,
  getRectangleCorners,
  sampleEllipse,
  samplePolyline,
  sampleSpline,
} from '../../engine/math';
import { BlockIcon } from '../icons/CadIcons';

const toSvgPoints = (pts: Point2D[]) => pts.map((p) => `${p.x.toFixed(2)},${(-p.y).toFixed(2)}`).join(' ');

const BlockThumbnail: React.FC<{ block: BlockDefinition }> = ({ block }) => {
  if (!block.entities || block.entities.length === 0) return <BlockIcon size={28} />;

  let bb: BBox | null = null;
  for (const e of block.entities) {
    const eb = getEntityBBox(e);
    if (!eb) continue;
    if (!bb) {
      bb = { ...eb };
    } else {
      bb.minX = Math.min(bb.minX, eb.minX);
      bb.minY = Math.min(bb.minY, eb.minY);
      bb.maxX = Math.max(bb.maxX, eb.maxX);
      bb.maxY = Math.max(bb.maxY, eb.maxY);
    }
  }
  if (!bb) return <BlockIcon size={28} />;

  const w = Math.max(4, bb.maxX - bb.minX);
  const h = Math.max(4, bb.maxY - bb.minY);
  const pad = Math.max(w, h) * 0.14;
  const sw = Math.max(0.5, Math.max(w, h) * 0.032);
  const vb = `${(bb.minX - pad).toFixed(2)} ${(-bb.maxY - pad).toFixed(2)} ${(w + pad * 2).toFixed(2)} ${(h + pad * 2).toFixed(2)}`;

  const renderEl = (ent: CadEntity, idx: number) => {
    const stroke = ent.color === 'ByLayer' ? '#93C5FD' : ent.color;
    switch (ent.type) {
      case 'line':
        return <line key={idx} x1={ent.start.x} y1={-ent.start.y} x2={ent.end.x} y2={-ent.end.y} stroke={stroke} strokeWidth={sw} />;
      case 'polyline': {
        const pts = ent.bulges?.some((b) => Math.abs(b) > 1e-6) ? samplePolyline(ent, 10) : ent.points;
        return ent.closed
          ? <polygon key={idx} points={toSvgPoints(pts)} fill="none" stroke={stroke} strokeWidth={sw} />
          : <polyline key={idx} points={toSvgPoints(pts)} fill="none" stroke={stroke} strokeWidth={sw} />;
      }
      case 'rectangle':
        return <polygon key={idx} points={toSvgPoints(getRectangleCorners(ent))} fill="none" stroke={stroke} strokeWidth={sw} />;
      case 'polygon':
        return <polygon key={idx} points={toSvgPoints(getPolygonVertices(ent))} fill="none" stroke={stroke} strokeWidth={sw} />;
      case 'circle':
        return <circle key={idx} cx={ent.center.x} cy={-ent.center.y} r={ent.radius} fill="none" stroke={stroke} strokeWidth={sw} />;
      case 'arc': {
        let sweep = (ent.endAngle - ent.startAngle) % (Math.PI * 2);
        if (sweep <= 0) sweep += Math.PI * 2;
        const pts = Array.from({ length: 16 }, (_, i) => {
          const a = ent.startAngle + (sweep * i) / 15;
          return { x: ent.center.x + ent.radius * Math.cos(a), y: ent.center.y + ent.radius * Math.sin(a) };
        });
        return <polyline key={idx} points={toSvgPoints(pts)} fill="none" stroke={stroke} strokeWidth={sw} />;
      }
      case 'ellipse':
        return <polygon key={idx} points={toSvgPoints(sampleEllipse(ent, 24))} fill="none" stroke={stroke} strokeWidth={sw} />;
      case 'spline': {
        const pts = sampleSpline(ent.controlPoints, ent.closed, 8);
        return <polyline key={idx} points={toSvgPoints(pts)} fill="none" stroke={stroke} strokeWidth={sw} />;
      }
      case 'text':
      case 'mtext':
        return (
          <text key={idx} x={ent.position.x} y={-ent.position.y} fill={stroke} fontSize={Math.max(sw * 4, ent.height)}>
            {ent.content.slice(0, 6)}
          </text>
        );
      default:
        return null;
    }
  };

  return (
    <svg className="block-svg-thumb" viewBox={vb} width={34} height={34} preserveAspectRatio="xMidYMid meet">
      {block.entities.map((ent, idx) => renderEl(ent, idx))}
    </svg>
  );
};

export const BlocksPalette: React.FC = () => {
  const show = useCadStore((s) => s.showBlocksPalette);
  const toggle = useCadStore((s) => s.toggleBlocksPalette);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const startInsertBlock = useCadStore((s) => s.startInsertBlock);
  const setModal = useCadStore((s) => s.setModal);

  const [scale, setScale] = useState(1);
  const [rotDeg, setRotDeg] = useState(0);
  const [filter, setFilter] = useState<string>('Tutti');

  if (!show || !doc) return null;

  const blockList = Object.values(doc.blocks).filter((b) => filter === 'Tutti' || b.category === filter);

  return (
    <aside className="cad-palette blocks-palette">
      <div className="palette-header">
        <span>BLOCCHI</span>
        <button className="palette-close" onClick={() => toggle(false)}>×</button>
      </div>

      <div className="palette-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="Tutti">Tutte le categorie</option>
          <option value="Architettura">Architettura</option>
          <option value="Meccanica">Meccanica</option>
          <option value="Annotazione">Annotazione</option>
          <option value="Utente">Blocchi utente</option>
        </select>
        <button className="ofcad-btn-sm" onClick={() => setModal('createBlock', true)}>
          + Crea da selezione
        </button>
      </div>

      <div className="blocks-insert-opts">
        <label>
          Scala
          <input type="number" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value) || 1)} />
        </label>
        <label>
          Rotazione°
          <input type="number" step="15" value={rotDeg} onChange={(e) => setRotDeg(parseFloat(e.target.value) || 0)} />
        </label>
      </div>

      <div className="palette-scroll blocks-grid">
        {blockList.map((blk) => (
          <button
            key={blk.name}
            className="block-card"
            onClick={() => startInsertBlock(blk.name, scale, rotDeg)}
            title={`Clicca per inserire "${blk.name}" nel disegno`}
          >
            <div className="block-thumb">
              <BlockThumbnail block={blk} />
            </div>
            <div className="block-info">
              <strong>{blk.name}</strong>
              <span>{blk.description}</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};
