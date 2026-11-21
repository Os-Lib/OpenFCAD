import React, { useEffect, useRef, useState } from 'react';
import {
  CAD_ACI_COLORS,
  CadDocument,
  CadEntity,
  GripPoint,
  LINE_TYPES,
  LineTypeName,
  OsnapResult,
  Point2D,
} from '../types/cad';
import { useCadStore } from '../store/useCadStore';
import {
  angleBetween,
  arcFrom3Points,
  circleFrom3Points,
  degToRad,
  dist,
  getDocumentBBox,
  getEntityBBox,
  getPolygonVertices,
  getRectangleCorners,
  mid,
  mirrorEntity,
  normAngle,
  normalize,
  radToDeg,
  rotateEntity,
  rotatePoint,
  sampleEllipse,
  samplePolyline,
  sampleSpline,
  scaleEntity,
  stretchEntity,
  sub,
  translateEntity,
} from '../engine/math';
import {
  applyDraftingConstraints,
  findOsnap,
  findOtrackAlignment,
  getEntityGrips,
  hitTestEntities,
  isEntityVisible,
  resolveEntityColor,
  resolveEntityLineType,
  resolveEntityLineWeight,
  selectEntitiesInBox,
} from '../engine/osnap';

interface DragBoxState {
  startWorld: Point2D;
  currentWorld: Point2D;
  startScreen: Point2D;
  currentScreen: Point2D;
}

interface ContextMenuState {
  x: number;
  y: number;
}

interface OtrackGuide {
  from: Point2D;
  to: Point2D;
  axis: 'H' | 'V';
}

function getAnnotationScaleMultiplier(scale: string): number {
  const table: Record<string, number> = {
    '1:1': 1,
    '1:2': 1.25,
    '1:5': 1.5,
    '1:10': 2,
    '1:20': 2.5,
    '1:50': 3,
    '1:100': 4,
    '1:200': 5,
    '1:500': 6,
  };
  return table[scale] ?? 1;
}

export const CadCanvas2D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const settings = useCadStore((s) => s.settings);
  const command = useCadStore((s) => s.command);
  const theme = useCadStore((s) => s.theme);

  const [cursorScreen, setCursorScreen] = useState<Point2D | null>(null);
  const [cursorWorldConstrained, setCursorWorldConstrained] = useState<Point2D>({ x: 0, y: 0 });
  const [activeOsnap, setActiveOsnap] = useState<OsnapResult | null>(null);
  const [polarGuideAngle, setPolarGuideAngle] = useState<number | undefined>(undefined);
  const [otrackGuides, setOtrackGuides] = useState<OtrackGuide[]>([]);
  const [dragBox, setDragBox] = useState<DragBoxState | null>(null);
  const [activeGrip, setActiveGrip] = useState<GripPoint | null>(null);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [paperCam, setPaperCam] = useState<{ panX: number; panY: number; zoom: number }>({ panX: 0, panY: 0, zoom: 1 });
  const [viewportActive, setViewportActive] = useState(false);

  const panRef = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 });
  const paperVpRectRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    scaleSheet: number;
    vpCenterX: number;
    vpCenterY: number;
    vpScale: number;
  } | null>(null);
  const lastMiddleDownRef = useRef<number>(0);
  const trackedPointsRef = useRef<Point2D[]>([]);
  const otrackHoverRef = useRef<{ pt: Point2D; since: number } | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 1000, h: 650 });
  const gripUndoRecordedRef = useRef(false);

  useEffect(() => {
    if (!command || !settings.otrackOn) {
      trackedPointsRef.current = [];
      otrackHoverRef.current = null;
      setOtrackGuides([]);
    }
  }, [command?.name, settings.otrackOn]);

  const worldToScreen = (pt: Point2D, cam = doc?.camera): Point2D => {
    if (!cam) return { x: 0, y: 0 };
    return {
      x: cam.panX + pt.x * cam.zoom,
      y: cam.panY - pt.y * cam.zoom,
    };
  };

  const screenToWorld = (sx: number, sy: number, cam = doc?.camera): Point2D => {
    if (!cam) return { x: 0, y: 0 };
    return {
      x: (sx - cam.panX) / cam.zoom,
      y: (cam.panY - sy) / cam.zoom,
    };
  };

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        sizeRef.current = { w: rect.width, h: rect.height };
        renderFrame();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  });

  // Helper to draw a single CAD entity on any 2D CanvasContext with a custom worldToScreen mapper
  const drawEntity = (
    ctx: CanvasRenderingContext2D,
    ent: CadEntity,
    d: CadDocument,
    w2s: (p: Point2D) => Point2D,
    scalePxPerUnit: number,
    options: { selected?: boolean; hovered?: boolean; ghost?: boolean; forceBlack?: boolean; parentBlockColor?: string } = {}
  ) => {
    const { selected = false, hovered = false, ghost = false, forceBlack = false, parentBlockColor } = options;
    let color = resolveEntityColor(ent, d.layers);
    if (parentBlockColor && ent.layer === '0' && ent.color === 'ByLayer') {
      color = parentBlockColor;
    }
    const baseResolvedColor = color;
    const annoMult = forceBlack ? 1 : getAnnotationScaleMultiplier(settings.annotationScale);
    if (forceBlack) {
      // High-contrast architectural pen mapping on white Paper Space sheet
      const up = color.toUpperCase();
      if (up === '#FFFFFF' || up === '#E8EEF5' || up === '#E6ECF2' || up === '#D9E4F0') color = '#111827';
      else if (up === '#FFFF00' || up === '#FFD166') color = '#92400E';
      else if (up === '#00FFFF' || up === '#4CC9F0') color = '#0369A1';
      else if (up === '#FFBF00') color = '#B45309';
      else if (up === '#66CC66' || up === '#00FF00') color = '#15803D';
      else if (up === '#808080') color = '#4B5563';
    }
    if (theme === 'light' && color.toUpperCase() === '#FFFFFF') color = '#18202A';
    if (ghost) color = '#38ABDF';
    else if (selected) color = '#4CC9F0';

    const lt = resolveEntityLineType(ent, d.layers);
    const lwMm = resolveEntityLineWeight(ent, d.layers);
    const baseWidth = settings.showLineWeight ? Math.max(1, lwMm * 3.8) : 1.35;
    const strokeWidth = selected ? baseWidth + 0.9 : hovered ? baseWidth + 0.7 : baseWidth;

    const layer = d.layers.find((l) => l.name === ent.layer);
    const alpha = ghost
      ? 0.65
      : settings.showTransparency && layer?.transparency
        ? Math.max(0.15, 1 - layer.transparency / 100)
        : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const ltDef = LINE_TYPES.find((t) => t.id === lt);
    if (selected) {
      ctx.setLineDash([7, 4]);
    } else if (ltDef && ltDef.dash.length > 0) {
      ctx.setLineDash(ltDef.dash.map((v) => Math.max(2, v * (ent.lineTypeScale || 1))));
    } else {
      ctx.setLineDash([]);
    }

    const strokePoly = (pts: Point2D[], closed: boolean) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      const s0 = w2s(pts[0]);
      ctx.moveTo(s0.x, s0.y);
      for (let i = 1; i < pts.length; i++) {
        const si = w2s(pts[i]);
        ctx.lineTo(si.x, si.y);
      }
      if (closed) ctx.closePath();
      ctx.stroke();
    };

    switch (ent.type) {
      case 'line': {
        const a = w2s(ent.start);
        const b = w2s(ent.end);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        break;
      }
      case 'polyline': {
        const pts = ent.bulges?.some((b) => Math.abs(b) > 1e-6) ? samplePolyline(ent, 16) : ent.points;
        strokePoly(pts, ent.closed);
        break;
      }
      case 'rectangle':
        strokePoly(getRectangleCorners(ent), true);
        break;
      case 'polygon':
        strokePoly(getPolygonVertices(ent), true);
        break;
      case 'circle': {
        const c = w2s(ent.center);
        const r = Math.max(0.5, ent.radius * scalePxPerUnit);
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'arc': {
        const c = w2s(ent.center);
        const r = Math.max(0.5, ent.radius * scalePxPerUnit);
        // Canvas Y is inverted -> angles negate & draw CCW (anticlockwise=true)
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, -ent.startAngle, -ent.endAngle, true);
        ctx.stroke();
        break;
      }
      case 'ellipse':
        strokePoly(sampleEllipse(ent, 64), true);
        break;
      case 'spline':
        strokePoly(sampleSpline(ent.controlPoints, ent.closed, 14), ent.closed);
        break;
      case 'xline': {
        const far = 50000;
        const a = w2s({ x: ent.origin.x - ent.direction.x * far, y: ent.origin.y - ent.direction.y * far });
        const b = w2s({ x: ent.origin.x + ent.direction.x * far, y: ent.origin.y + ent.direction.y * far });
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        break;
      }
      case 'ray': {
        const far = 50000;
        const a = w2s(ent.origin);
        const b = w2s({ x: ent.origin.x + ent.direction.x * far, y: ent.origin.y + ent.direction.y * far });
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        break;
      }
      case 'point': {
        const p = w2s(ent.position);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.moveTo(p.x - 6, p.y);
        ctx.lineTo(p.x + 6, p.y);
        ctx.moveTo(p.x, p.y - 6);
        ctx.lineTo(p.x, p.y + 6);
        ctx.stroke();
        break;
      }
      case 'hatch': {
        if (ent.boundary.length < 3) break;
        const sPts = ent.boundary.map(w2s);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sPts[0].x, sPts[0].y);
        for (let i = 1; i < sPts.length; i++) ctx.lineTo(sPts[i].x, sPts[i].y);
        ctx.closePath();
        if (ent.pattern === 'SOLID') {
          ctx.globalAlpha = ent.opacity * 0.55;
          ctx.fill();
        } else {
          ctx.clip();
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const p of sPts) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          }
          const step = Math.max(5, ent.scale * scalePxPerUnit);
          ctx.lineWidth = 0.85;
          ctx.setLineDash([]);
          ctx.globalAlpha = Math.max(0.25, ent.opacity);
          const diag = Math.hypot(maxX - minX, maxY - minY);
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;

          const drawParallelLines = (angDeg: number, spacing: number, phaseShift = 0, dashed = false) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-degToRad(angDeg));
            if (dashed) ctx.setLineDash([Math.max(4, spacing * 0.45), Math.max(3, spacing * 0.3)]);
            ctx.beginPath();
            for (let x = -diag + phaseShift; x <= diag; x += spacing) {
              ctx.moveTo(x, -diag);
              ctx.lineTo(x, diag);
            }
            ctx.stroke();
            ctx.restore();
          };

          const drawAnchoredDots = (worldSpacing: number, radiusPx: number) => {
            const bb = getEntityBBox({ ...ent });
            if (!bb) return;
            const bw = Math.max(1, bb.maxX - bb.minX);
            const bh = Math.max(1, bb.maxY - bb.minY);
            const safeStep = Math.max(worldSpacing, Math.max(bw, bh) / 26);
            const ix0 = Math.floor(bb.minX / safeStep);
            const ix1 = Math.ceil(bb.maxX / safeStep);
            const iy0 = Math.floor(bb.minY / safeStep);
            const iy1 = Math.ceil(bb.maxY / safeStep);
            for (let ix = ix0; ix <= ix1; ix++) {
              for (let iy = iy0; iy <= iy1; iy++) {
                const h1 = Math.abs(Math.sin(ix * 12.9898 + iy * 78.233) * 43758.5453) % 1;
                const h2 = Math.abs(Math.sin(ix * 39.346 + iy * 11.135) * 24634.6345) % 1;
                const sp = w2s({ x: (ix + h1 * 0.75) * safeStep, y: (iy + h2 * 0.75) * safeStep });
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, radiusPx, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          };

          switch (ent.pattern) {
            case 'ANSI31':
              drawParallelLines(ent.angle || 45, step);
              break;
            case 'ANSI32':
              drawParallelLines(ent.angle || 45, step);
              drawParallelLines(ent.angle || 45, step, step * 0.25);
              break;
            case 'ANSI33':
              drawParallelLines(ent.angle || 45, step);
              drawParallelLines(ent.angle || 45, step, step * 0.5, true);
              break;
            case 'ANSI37':
            case 'CROSS': {
              const ang = ent.angle ?? 45;
              drawParallelLines(ang, step);
              drawParallelLines(ang + 90, step);
              break;
            }
            case 'NET': {
              const ang = ent.angle ?? 0;
              drawParallelLines(ang, step);
              drawParallelLines(ang + 90, step);
              break;
            }
            case 'BRICK': {
              const ang = ent.angle ?? 0;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(-degToRad(ang));
              ctx.beginPath();
              let row = 0;
              for (let y = -diag; y <= diag; y += step) {
                ctx.moveTo(-diag, y);
                ctx.lineTo(diag, y);
                const offset = (row % 2) * step;
                for (let x = -diag + offset; x <= diag; x += step * 2) {
                  ctx.moveTo(x, y);
                  ctx.lineTo(x, y + step);
                }
                row++;
              }
              ctx.stroke();
              ctx.restore();
              break;
            }
            case 'DOTS': {
              for (let y = minY; y <= maxY; y += step) {
                for (let x = minX; x <= maxX; x += step) {
                  ctx.fillRect(x, y, 1.8, 1.8);
                }
              }
              break;
            }
            case 'AR-SAND':
              drawAnchoredDots(Math.max(2, ent.scale * 0.7), 1.15);
              break;
            case 'AR-CONC': {
              drawAnchoredDots(Math.max(4, ent.scale * 1.1), 1.35);
              const bb = getEntityBBox({ ...ent });
              if (bb) {
                const bw = Math.max(1, bb.maxX - bb.minX);
                const bh = Math.max(1, bb.maxY - bb.minY);
                const safeStep = Math.max(ent.scale * 1.6, Math.max(bw, bh) / 18);
                const ix0 = Math.floor(bb.minX / safeStep);
                const ix1 = Math.ceil(bb.maxX / safeStep);
                const iy0 = Math.floor(bb.minY / safeStep);
                const iy1 = Math.ceil(bb.maxY / safeStep);
                ctx.beginPath();
                for (let ix = ix0; ix <= ix1; ix++) {
                  for (let iy = iy0; iy <= iy1; iy++) {
                    const hash = (Math.abs(ix * 73856093 ^ iy * 19349663) % 100) / 100;
                    if (hash > 0.55) continue;
                    const px = (ix + 0.5) * safeStep;
                    const py = (iy + 0.5) * safeStep;
                    const sz = safeStep * (0.18 + hash * 0.14);
                    const p1 = w2s({ x: px - sz, y: py - sz * 0.5 });
                    const p2 = w2s({ x: px + sz * 0.9, y: py - sz * 0.3 });
                    const p3 = w2s({ x: px + sz * 0.1, y: py + sz });
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                  }
                }
                ctx.stroke();
              }
              break;
            }
            case 'HONEY': {
              const ang = ent.angle ?? 0;
              drawParallelLines(ang, step);
              drawParallelLines(ang + 60, step);
              drawParallelLines(ang - 60, step);
              break;
            }
            case 'AR-HBONE': {
              const ang = ent.angle ?? 45;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(-degToRad(ang));
              ctx.beginPath();
              const cell = Math.max(6, step * 1.4);
              for (let y = -diag; y <= diag; y += cell) {
                for (let x = -diag; x <= diag; x += cell) {
                  ctx.moveTo(x, y + cell * 0.5);
                  ctx.lineTo(x + cell * 0.5, y);
                  ctx.lineTo(x + cell, y + cell * 0.5);
                }
              }
              ctx.stroke();
              ctx.restore();
              break;
            }
            case 'EARTH': {
              const ang = ent.angle ?? 45;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(-degToRad(ang));
              ctx.beginPath();
              const blk = Math.max(10, step * 2);
              let row = 0;
              for (let y = -diag; y <= diag; y += blk) {
                let col = row % 2;
                for (let x = -diag; x <= diag; x += blk) {
                  const sub = blk * 0.25;
                  if (col % 2 === 0) {
                    for (let k = 0; k < 3; k++) {
                      ctx.moveTo(x + blk * 0.12, y + sub * (k + 0.8));
                      ctx.lineTo(x + blk * 0.88, y + sub * (k + 0.8));
                    }
                  } else {
                    for (let k = 0; k < 3; k++) {
                      ctx.moveTo(x + sub * (k + 0.8), y + blk * 0.12);
                      ctx.lineTo(x + sub * (k + 0.8), y + blk * 0.88);
                    }
                  }
                  col++;
                }
                row++;
              }
              ctx.stroke();
              ctx.restore();
              break;
            }
            case 'GRATE': {
              const gStep = Math.max(4, step * 0.7);
              const ang = ent.angle ?? 0;
              drawParallelLines(ang, gStep);
              drawParallelLines(ang + 90, gStep);
              drawParallelLines(ang + 45, gStep * 1.414);
              break;
            }
          }
        }
        ctx.restore();
        // subtle outline if selected
        if (selected) strokePoly(ent.boundary, true);
        break;
      }
      case 'text':
      case 'mtext': {
        const pos = w2s(ent.position);
        const fontSize = Math.max(6, ent.height * scalePxPerUnit * annoMult);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(-ent.rotation);
        ctx.font = `${fontSize}px "Segoe UI", Consolas, Arial, sans-serif`;
        ctx.textBaseline = 'bottom';
        ctx.setLineDash([]);
        const rawLines = ent.content.split('\n');
        const renderLines: string[] = [];
        if (ent.type === 'mtext' && ent.width > 0) {
          const maxPx = Math.max(24, ent.width * scalePxPerUnit);
          for (const para of rawLines) {
            const words = para.split(/\s+/).filter((w) => w.length > 0);
            if (words.length === 0) {
              renderLines.push('');
              continue;
            }
            let curLine = words[0];
            for (let i = 1; i < words.length; i++) {
              const test = `${curLine} ${words[i]}`;
              if (ctx.measureText(test).width <= maxPx) {
                curLine = test;
              } else {
                renderLines.push(curLine);
                curLine = words[i];
              }
            }
            renderLines.push(curLine);
          }
        } else {
          renderLines.push(...rawLines);
        }
        renderLines.forEach((line, idx) => {
          ctx.fillText(line, 0, idx * fontSize * 1.25);
        });
        ctx.restore();
        break;
      }
      case 'table': {
        const wWorld = ent.cols * ent.colWidth;
        const hWorld = ent.rows * ent.rowHeight;
        const tl = w2s(ent.position);
        const br = w2s({ x: ent.position.x + wWorld, y: ent.position.y - hWorld });
        const tw = Math.max(1, br.x - tl.x);
        const th = Math.max(1, br.y - tl.y);
        const cw = tw / ent.cols;
        const rh = th / ent.rows;

        ctx.save();
        ctx.setLineDash([]);
        // Header row tint
        if (ent.rows > 0) {
          ctx.fillStyle = forceBlack ? 'rgba(0,0,0,0.06)' : 'rgba(56,171,223,0.16)';
          ctx.fillRect(tl.x, tl.y, tw, rh);
        }
        // Grid
        ctx.strokeRect(tl.x, tl.y, tw, th);
        ctx.beginPath();
        for (let r = 1; r < ent.rows; r++) {
          ctx.moveTo(tl.x, tl.y + r * rh);
          ctx.lineTo(tl.x + tw, tl.y + r * rh);
        }
        for (let c = 1; c < ent.cols; c++) {
          ctx.moveTo(tl.x + c * cw, tl.y);
          ctx.lineTo(tl.x + c * cw, tl.y + th);
        }
        ctx.stroke();

        // Cell text
        const cellFontPx = Math.max(6, Math.min(rh * 0.72, ent.textHeight * scalePxPerUnit * annoMult));
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let r = 0; r < ent.rows; r++) {
          ctx.font = `${r === 0 ? 'bold ' : ''}${cellFontPx}px "Segoe UI", Arial, sans-serif`;
          for (let c = 0; c < ent.cols; c++) {
            const val = ent.cells[r]?.[c] || '';
            if (!val) continue;
            const cx = tl.x + (c + 0.5) * cw;
            const cy = tl.y + (r + 0.5) * rh;
            ctx.fillText(val, cx, cy, Math.max(4, cw - 6));
          }
        }
        ctx.restore();
        break;
      }
      case 'dimension': {
        ctx.setLineDash([]);
        ctx.lineWidth = Math.max(1, strokeWidth * 0.85);
        const arrowPx = Math.max(5, ent.arrowSize * scalePxPerUnit * annoMult);
        const fontPx = Math.max(9, ent.textHeight * scalePxPerUnit * annoMult);

        const drawArrow = (tip: Point2D, from: Point2D) => {
          const ang = Math.atan2(tip.y - from.y, tip.x - from.x);
          const a1 = ang + Math.PI - 0.3;
          const a2 = ang + Math.PI + 0.3;
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(tip.x + arrowPx * Math.cos(a1), tip.y + arrowPx * Math.sin(a1));
          ctx.lineTo(tip.x + arrowPx * Math.cos(a2), tip.y + arrowPx * Math.sin(a2));
          ctx.closePath();
          ctx.fill();
        };

        if (ent.kind === 'linear') {
          const dx = Math.abs(ent.p2.x - ent.p1.x);
          const dy = Math.abs(ent.p2.y - ent.p1.y);
          const horizontal = dx >= dy;
          const d1 = horizontal ? { x: ent.p1.x, y: ent.textPosition.y } : { x: ent.textPosition.x, y: ent.p1.y };
          const d2 = horizontal ? { x: ent.p2.x, y: ent.textPosition.y } : { x: ent.textPosition.x, y: ent.p2.y };
          const sp1 = w2s(ent.p1), sp2 = w2s(ent.p2), sd1 = w2s(d1), sd2 = w2s(d2);
          ctx.beginPath();
          ctx.moveTo(sp1.x, sp1.y);
          ctx.lineTo(sd1.x, sd1.y);
          ctx.moveTo(sp2.x, sp2.y);
          ctx.lineTo(sd2.x, sd2.y);
          ctx.moveTo(sd1.x, sd1.y);
          ctx.lineTo(sd2.x, sd2.y);
          ctx.stroke();
          drawArrow(sd1, sd2);
          drawArrow(sd2, sd1);
          const val = (horizontal ? dx : dy).toFixed(settings.precision);
          const label = ent.textOverride || val;
          const m = mid(sd1, sd2);
          ctx.save();
          ctx.translate(m.x, m.y);
          if (!horizontal) ctx.rotate(-Math.PI / 2);
          ctx.font = `600 ${fontPx}px "Segoe UI", Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(label, 0, -4);
          ctx.restore();
        } else if (ent.kind === 'aligned') {
          const sp1 = w2s(ent.p1), sp2 = w2s(ent.p2), st = w2s(ent.textPosition);
          const ang = Math.atan2(sp2.y - sp1.y, sp2.x - sp1.x);
          const nx = -Math.sin(ang), ny = Math.cos(ang);
          const off = (st.x - sp1.x) * nx + (st.y - sp1.y) * ny;
          const sd1 = { x: sp1.x + nx * off, y: sp1.y + ny * off };
          const sd2 = { x: sp2.x + nx * off, y: sp2.y + ny * off };
          ctx.beginPath();
          ctx.moveTo(sp1.x, sp1.y);
          ctx.lineTo(sd1.x, sd1.y);
          ctx.moveTo(sp2.x, sp2.y);
          ctx.lineTo(sd2.x, sd2.y);
          ctx.moveTo(sd1.x, sd1.y);
          ctx.lineTo(sd2.x, sd2.y);
          ctx.stroke();
          drawArrow(sd1, sd2);
          drawArrow(sd2, sd1);
          const label = ent.textOverride || dist(ent.p1, ent.p2).toFixed(settings.precision);
          const m = mid(sd1, sd2);
          ctx.save();
          ctx.translate(m.x, m.y);
          let rot = ang;
          if (rot > Math.PI / 2 || rot < -Math.PI / 2) rot += Math.PI;
          ctx.rotate(rot);
          ctx.font = `600 ${fontPx}px "Segoe UI", Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(label, 0, -4);
          ctx.restore();
        } else if (ent.kind === 'radius' || ent.kind === 'diameter') {
          const sp1 = w2s(ent.p1), sp2 = w2s(ent.p2), st = w2s(ent.textPosition);
          ctx.beginPath();
          ctx.moveTo(sp1.x, sp1.y);
          ctx.lineTo(sp2.x, sp2.y);
          ctx.lineTo(st.x, st.y);
          ctx.stroke();
          drawArrow(sp2, sp1);
          if (ent.kind === 'diameter') drawArrow(sp1, sp2);
          const dVal = dist(ent.p1, ent.p2);
          const prefix = ent.kind === 'radius' ? 'R' : 'Ø';
          const label = ent.textOverride || `${prefix}${dVal.toFixed(settings.precision)}`;
          ctx.font = `600 ${fontPx}px "Segoe UI", Arial`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(label, st.x + 4, st.y - 2);
        } else if (ent.kind === 'angular' && ent.p3) {
          const sv = w2s(ent.p3), sp1 = w2s(ent.p1), sp2 = w2s(ent.p2);
          const r = Math.min(dist(sv, sp1), dist(sv, sp2)) * 0.65;
          const a1 = angleBetween(ent.p3, ent.p1);
          const a2 = angleBetween(ent.p3, ent.p2);
          const dRaw = normAngle(a2 - a1);
          const drawFromA2 = dRaw > Math.PI;
          const deg = radToDeg(drawFromA2 ? Math.PI * 2 - dRaw : dRaw);
          ctx.beginPath();
          ctx.moveTo(sv.x, sv.y);
          ctx.lineTo(sp1.x, sp1.y);
          ctx.moveTo(sv.x, sv.y);
          ctx.lineTo(sp2.x, sp2.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sv.x, sv.y, r, -(drawFromA2 ? a2 : a1), -(drawFromA2 ? a1 : a2), true);
          ctx.stroke();
          const st = w2s(ent.textPosition);
          ctx.font = `600 ${fontPx}px "Segoe UI", Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(ent.textOverride || `${deg.toFixed(1)}°`, st.x, st.y);
        }
        break;
      }
      case 'leader': {
        if (ent.points.length < 2) break;
        ctx.setLineDash([]);
        strokePoly(ent.points, false);
        const s0 = w2s(ent.points[0]);
        const s1 = w2s(ent.points[1]);
        const ang = Math.atan2(s0.y - s1.y, s0.x - s1.x);
        const arr = 9 * annoMult;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s0.x - arr * Math.cos(ang - 0.32), s0.y - arr * Math.sin(ang - 0.32));
        ctx.lineTo(s0.x - arr * Math.cos(ang + 0.32), s0.y - arr * Math.sin(ang + 0.32));
        ctx.closePath();
        ctx.fill();
        const last = w2s(ent.points[ent.points.length - 1]);
        const fontPx = Math.max(9, ent.textHeight * scalePxPerUnit * annoMult);
        ctx.font = `600 ${fontPx}px "Segoe UI", Arial`;
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.text, last.x + 5, last.y);
        break;
      }
      case 'revcloud': {
        if (ent.points.length < 2) break;
        ctx.beginPath();
        const count = ent.closed ? ent.points.length : ent.points.length - 1;
        for (let i = 0; i < count; i++) {
          const a = w2s(ent.points[i]);
          const b = w2s(ent.points[(i + 1) % ent.points.length]);
          const segLen = dist(a, b);
          const steps = Math.max(1, Math.round(segLen / 18));
          for (let j = 0; j < steps; j++) {
            const p1 = { x: a.x + ((b.x - a.x) * j) / steps, y: a.y + ((b.y - a.y) * j) / steps };
            const p2 = { x: a.x + ((b.x - a.x) * (j + 1)) / steps, y: a.y + ((b.y - a.y) * (j + 1)) / steps };
            const m = mid(p1, p2);
            const r = dist(p1, p2) / 2;
            const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            ctx.arc(m.x, m.y, r, ang + Math.PI, ang, false);
          }
        }
        ctx.stroke();
        break;
      }
      case 'block_ref': {
        const def = d.blocks[ent.blockName];
        if (!def) break;
        const transformPt = (p: Point2D): Point2D => {
          const lx = (p.x - def.basePoint.x) * ent.scaleX;
          const ly = (p.y - def.basePoint.y) * ent.scaleY;
          const rot = rotatePoint({ x: lx, y: ly }, { x: 0, y: 0 }, ent.rotation);
          return { x: ent.position.x + rot.x, y: ent.position.y + rot.y };
        };
        const subW2s = (p: Point2D) => w2s(transformPt(p));
        for (const sub of def.entities) {
          drawEntity(ctx, sub, d, subW2s, scalePxPerUnit * Math.abs(ent.scaleX), {
            selected,
            hovered,
            ghost,
            forceBlack,
            parentBlockColor: baseResolvedColor,
          });
        }
        break;
      }
      case 'solid3d': {
        // 2D plan footprint of 3D solid (honors Z rotation, extrude offset, and CSG mesh projection)
        ctx.save();
        ctx.fillStyle = `${color}22`;
        if (ent.primitive === 'box') {
          const hw = ent.size.x / 2, hh = ent.size.y / 2;
          const rz = ent.rotation?.z || 0;
          const cR = Math.cos(rz), sR = Math.sin(rz);
          const localPts = [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh },
          ];
          const pts = localPts.map((p) => ({
            x: ent.position.x + p.x * cR - p.y * sR,
            y: ent.position.y + p.x * sR + p.y * cR,
          }));
          const sPts = pts.map(w2s);
          ctx.beginPath();
          ctx.moveTo(sPts[0].x, sPts[0].y);
          sPts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (ent.primitive === 'extrude' && ent.profile && ent.profile.length >= 3) {
          const ox = ent.position.x || 0, oy = ent.position.y || 0;
          const offPts = ent.profile.map((p) => ({ x: p.x + ox, y: p.y + oy }));
          const sPts = offPts.map(w2s);
          ctx.beginPath();
          ctx.moveTo(sPts[0].x, sPts[0].y);
          sPts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (ent.primitive === 'mesh' && ent.meshPositions && ent.meshPositions.length >= 9) {
          const ox = ent.position.x || 0, oy = ent.position.y || 0;
          const rz = ent.rotation?.z || 0;
          const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
          const toWorldXY = (lx: number, ly: number): Point2D => ({
            x: ox + lx * cosZ - ly * sinZ,
            y: oy + lx * sinZ + ly * cosZ,
          });
          const mv = ent.meshPositions;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (let i = 0; i + 2 < mv.length; i += 3) {
            const wp = toWorldXY(mv[i], mv[i + 1]);
            if (wp.x < minX) minX = wp.x;
            if (wp.y < minY) minY = wp.y;
            if (wp.x > maxX) maxX = wp.x;
            if (wp.y > maxY) maxY = wp.y;
          }
          const sMin = w2s({ x: minX, y: maxY });
          const sMax = w2s({ x: maxX, y: minY });
          ctx.fillRect(sMin.x, sMin.y, sMax.x - sMin.x, sMax.y - sMin.y);
          const triCount = Math.floor(mv.length / 9);
          const step = Math.max(1, Math.ceil(triCount / 200));
          ctx.beginPath();
          for (let t = 0; t < triCount; t += step) {
            const b = t * 9;
            const p0 = w2s(toWorldXY(mv[b], mv[b + 1]));
            const p1 = w2s(toWorldXY(mv[b + 3], mv[b + 4]));
            const p2 = w2s(toWorldXY(mv[b + 6], mv[b + 7]));
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.closePath();
          }
          ctx.stroke();
        } else {
          const c = w2s({ x: ent.position.x, y: ent.position.y });
          const r = Math.max(2, ent.size.x * scalePxPerUnit);
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
    }

    ctx.restore();
  };

  // Main render pass
  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !doc) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = sizeRef.current;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // PAPER SPACE (LAYOUT) RENDERING
    if (doc.activeSpace !== 'model') {
      const layout = doc.layouts.find((l) => l.id === doc.activeSpace) || doc.layouts[0];
      ctx.fillStyle = theme === 'dark' ? '#6D7682' : '#9AA3AE';
      ctx.fillRect(0, 0, w, h);

      // Reserve bottom 116px for floating Command Line so entire sheet & title block float cleanly above it
      const availH = Math.max(240, h - 122);
      const availW = Math.max(320, w - 80);
      const baseScaleSheet = Math.min(availW / layout.paperWidth, availH / layout.paperHeight);
      const scaleSheet = baseScaleSheet * paperCam.zoom;
      const sw = layout.paperWidth * scaleSheet;
      const sh = layout.paperHeight * scaleSheet;
      const baseSh = layout.paperHeight * baseScaleSheet;
      const sx = (w - sw) / 2 + paperCam.panX;
      const sy = Math.max(10, (availH - baseSh) / 2 + 4) + (baseSh - sh) / 2 + paperCam.panY;

      // Sheet shadow & paper
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.restore();

      // Printable margin dashed border
      const m = layout.margin * scaleSheet;
      ctx.save();
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(sx + m, sy + m, sw - m * 2, sh - m * 2);
      ctx.restore();

      // Outer drawing frame & Title Block (Cartiglio)
      const frameM = m * 0.65;
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(sx + frameM, sy + frameM, sw - frameM * 2, sh - frameM * 2);

      // Live Viewport inside paper space
      const vpX = sx + m + 8;
      const vpY = sy + m + 8;
      const vpW = sw - m * 2 - 16;
      const vpH = sh - m * 2 - 74;

      ctx.save();
      ctx.beginPath();
      ctx.rect(vpX, vpY, vpW, vpH);
      ctx.clip();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(vpX, vpY, vpW, vpH);

      const bb = getDocumentBBox(doc.entities, doc.blocks);
      let vpCenterX = layout.viewportCenter.x;
      let vpCenterY = layout.viewportCenter.y;
      let vpScale = layout.viewportScale * scaleSheet;
      if (layout.autoFit !== false && bb) {
        const bw = Math.max(20, bb.maxX - bb.minX);
        const bh = Math.max(20, bb.maxY - bb.minY);
        vpCenterX = (bb.minX + bb.maxX) / 2;
        vpCenterY = (bb.minY + bb.maxY) / 2;
        vpScale = Math.min((vpW * 0.84) / bw, (vpH * 0.82) / bh);
      }
      paperVpRectRef.current = { x: vpX, y: vpY, w: vpW, h: vpH, scaleSheet, vpCenterX, vpCenterY, vpScale };

      const vpW2s = (p: Point2D): Point2D => ({
        x: vpX + vpW / 2 + (p.x - vpCenterX) * vpScale,
        y: vpY + vpH / 2 - (p.y - vpCenterY) * vpScale,
      });

      for (const ent of doc.entities) {
        if (!isEntityVisible(ent, doc.layers)) continue;
        drawEntity(ctx, ent, doc, vpW2s, vpScale, { forceBlack: true });
      }
      ctx.restore();

      // Viewport frame (active Model-in-Paper mode highlighted in bright green)
      ctx.save();
      ctx.strokeStyle = viewportActive ? '#39FF14' : '#38ABDF';
      ctx.lineWidth = viewportActive ? 2 : 1;
      if (viewportActive) ctx.setLineDash([6, 3]);
      ctx.strokeRect(vpX, vpY, vpW, vpH);
      ctx.restore();

      // Engineering Title Block (bottom-right)
      const tbW = Math.min(260, sw * 0.45);
      const tbH = 54;
      const tbX = sx + sw - frameM - tbW;
      const tbY = sy + sh - frameM - tbH;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(tbX, tbY, tbW, tbH);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(tbX, tbY, tbW, tbH);
      ctx.beginPath();
      ctx.moveTo(tbX, tbY + 26);
      ctx.lineTo(tbX + tbW, tbY + 26);
      ctx.moveTo(tbX + tbW * 0.62, tbY + 26);
      ctx.lineTo(tbX + tbW * 0.62, tbY + tbH);
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 10.5px "Segoe UI", Arial';
      ctx.fillText(layout.titleBlockTitle, tbX + 8, tbY + 17, tbW - 14);
      ctx.font = '10px "Segoe UI", Arial';
      ctx.fillStyle = '#374151';
      ctx.fillText(doc.name, tbX + 8, tbY + 43, tbW * 0.62 - 14);
      ctx.font = 'bold 10px "Segoe UI", Arial';
      ctx.fillStyle = '#111827';
      ctx.fillText(layout.titleBlockScaleText, tbX + tbW * 0.62 + 8, tbY + 43, tbW * 0.38 - 12);

      // Paper Space Triangle Icon (bottom-left)
      ctx.save();
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(24, h - 22);
      ctx.lineTo(54, h - 22);
      ctx.lineTo(24, h - 52);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      return;
    }

    // MODEL SPACE BACKGROUND
    paperVpRectRef.current = null;
    ctx.fillStyle = settings.modelBgColor;
    ctx.fillRect(0, 0, w, h);

    const cam = doc.camera;
    const w2s = (p: Point2D) => worldToScreen(p, cam);

    // ADAPTIVE INFINITE CAD GRID
    if (settings.gridOn) {
      let spacing = settings.gridSpacing || 20;
      while (spacing * cam.zoom < 12) spacing *= settings.gridMajorEvery || 5;
      while (spacing * cam.zoom > 120) spacing /= settings.gridMajorEvery || 5;
      const majorEvery = settings.gridMajorEvery || 5;

      const topLeft = screenToWorld(0, 0, cam);
      const botRight = screenToWorld(w, h, cam);
      const startX = Math.floor(topLeft.x / spacing) * spacing;
      const endX = Math.ceil(botRight.x / spacing) * spacing;
      const startY = Math.floor(botRight.y / spacing) * spacing;
      const endY = Math.ceil(topLeft.y / spacing) * spacing;

      const minorColor = theme === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)';
      const majorColor = theme === 'dark' ? 'rgba(255,255,255,0.105)' : 'rgba(0,0,0,0.14)';

      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x += spacing) {
        const idx = Math.round(x / spacing);
        const sx = cam.panX + x * cam.zoom;
        ctx.strokeStyle = idx % majorEvery === 0 ? majorColor : minorColor;
        ctx.beginPath();
        ctx.moveTo(Math.round(sx) + 0.5, 0);
        ctx.lineTo(Math.round(sx) + 0.5, h);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += spacing) {
        const idx = Math.round(y / spacing);
        const sy = cam.panY - y * cam.zoom;
        ctx.strokeStyle = idx % majorEvery === 0 ? majorColor : minorColor;
        ctx.beginPath();
        ctx.moveTo(0, Math.round(sy) + 0.5);
        ctx.lineTo(w, Math.round(sy) + 0.5);
        ctx.stroke();
      }

      // World X (Red) and Y (Green) origin axes
      const originS = w2s({ x: 0, y: 0 });
      ctx.lineWidth = 1.25;
      if (originS.y >= 0 && originS.y <= h) {
        ctx.strokeStyle = 'rgba(208, 66, 66, 0.72)';
        ctx.beginPath();
        ctx.moveTo(0, Math.round(originS.y) + 0.5);
        ctx.lineTo(w, Math.round(originS.y) + 0.5);
        ctx.stroke();
      }
      if (originS.x >= 0 && originS.x <= w) {
        ctx.strokeStyle = 'rgba(70, 178, 86, 0.72)';
        ctx.beginPath();
        ctx.moveTo(Math.round(originS.x) + 0.5, 0);
        ctx.lineTo(Math.round(originS.x) + 0.5, h);
        ctx.stroke();
      }
    }

    // DRAW ALL VISIBLE ENTITIES
    const selectedSet = new Set(doc.selectedIds);
    const hoverActive =
      !command ||
      ['TRIM', 'EXTEND', 'FILLET', 'CHAMFER', 'OFFSET', 'BREAK', 'DIVIDE', 'MEASURE_SEG', 'ERASE', 'MATCHPROP'].includes(command.name);
    for (const ent of doc.entities) {
      if (!isEntityVisible(ent, doc.layers)) continue;
      const isHovered = hoveredEntityId === ent.id && hoverActive;
      drawEntity(ctx, ent, doc, w2s, cam.zoom, {
        selected: selectedSet.has(ent.id),
        hovered: isHovered,
      });
      if (isHovered && command) {
        drawEntity(ctx, ent, doc, w2s, cam.zoom, { ghost: true, hovered: true });
      }
    }

    // DRAW LIVE INTERACTIVE COMMAND RUBBERBAND / GHOST PREVIEWS
    if (command && cursorScreen) {
      const cur = cursorWorldConstrained;
      ctx.save();
      ctx.strokeStyle = '#38ABDF';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 4]);

      const drawSeg = (a: Point2D, b: Point2D) => {
        const sa = w2s(a), sb = w2s(b);
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.stroke();
      };

      const drawDimBadge = (pScreen: Point2D, txt: string) => {
        ctx.save();
        ctx.setLineDash([]);
        ctx.font = 'bold 11px Consolas, "Segoe UI", monospace';
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = 'rgba(22, 30, 42, 0.9)';
        ctx.strokeStyle = '#4CC9F0';
        ctx.lineWidth = 1;
        ctx.fillRect(pScreen.x - tw / 2 - 5, pScreen.y - 22, tw + 10, 17);
        ctx.strokeRect(pScreen.x - tw / 2 - 5, pScreen.y - 22, tw + 10, 17);
        ctx.fillStyle = '#E0F2FE';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, pScreen.x, pScreen.y - 13);
        ctx.restore();
      };

      if (command.name === 'LINE' && command.points.length > 0) {
        drawSeg(command.points[command.points.length - 1], cur);
      } else if (command.name === 'POLYLINE' && command.points.length > 0) {
        ctx.setLineDash([]);
        ctx.strokeStyle = '#4CC9F0';
        const prevBulges: number[] = Array.isArray(command.params.bulges) ? command.params.bulges : [];
        const pts = samplePolyline(
          {
            points: [...command.points, cur],
            closed: false,
            bulges: [...prevBulges, command.params.arcMode ? 0.41421356 : 0],
          },
          14
        );
        ctx.beginPath();
        const s0 = w2s(pts[0]);
        ctx.moveTo(s0.x, s0.y);
        for (let i = 1; i < pts.length; i++) {
          const si = w2s(pts[i]);
          ctx.lineTo(si.x, si.y);
        }
        ctx.stroke();
      } else if ((command.name === 'SPLINE' || command.name === 'REVCLOUD' || command.name === 'AREA') && command.points.length > 0) {
        ctx.setLineDash([]);
        ctx.strokeStyle = '#4CC9F0';
        const pts = [...command.points, cur];
        ctx.beginPath();
        const s0 = w2s(pts[0]);
        ctx.moveTo(s0.x, s0.y);
        for (let i = 1; i < pts.length; i++) {
          const si = w2s(pts[i]);
          ctx.lineTo(si.x, si.y);
        }
        ctx.stroke();
        if (command.name === 'AREA' && pts.length >= 3) {
          ctx.fillStyle = 'rgba(56, 171, 223, 0.16)';
          ctx.closePath();
          ctx.fill();
        }
      } else if ((command.name === 'CIRCLE' || command.name === 'SPHERE' || command.name === 'TORUS') && command.points.length === 1) {
        const c = w2s(command.points[0]);
        const dWorld = dist(command.points[0], cur);
        const r = (command.params.useDiameter ? dWorld / 2 : dWorld) * cam.zoom;
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.stroke();
        drawSeg(command.points[0], cur);
        if (command.name === 'CIRCLE') {
          drawDimBadge(w2s(cur), `${command.params.useDiameter ? 'Ø ' : 'R '}${dWorld.toFixed(settings.precision)}`);
        }
      } else if (command.name === 'CIRCLE_2P' && command.points.length === 1) {
        const m = mid(command.points[0], cur);
        const cm = w2s(m);
        const r = (dist(command.points[0], cur) / 2) * cam.zoom;
        ctx.beginPath();
        ctx.arc(cm.x, cm.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.stroke();
      } else if (command.name === 'CIRCLE_3P' && command.points.length === 2) {
        const res = circleFrom3Points(command.points[0], command.points[1], cur);
        if (res) {
          const c = w2s(res.center);
          ctx.beginPath();
          ctx.arc(c.x, c.y, res.radius * cam.zoom, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (command.name === 'ARC') {
        if (command.params.arcMode === 'center') {
          if (command.points.length === 1) {
            drawSeg(command.points[0], cur);
          } else if (command.points.length === 2) {
            const center = command.points[0];
            const radius = dist(center, command.points[1]);
            const c = w2s(center);
            const a1 = angleBetween(center, command.points[1]);
            const a2 = angleBetween(center, cur);
            ctx.beginPath();
            ctx.arc(c.x, c.y, Math.max(1, radius * cam.zoom), -a1, -a2, true);
            ctx.stroke();
            drawSeg(center, cur);
          }
        } else if (command.points.length === 1) {
          drawSeg(command.points[0], cur);
        } else if (command.points.length === 2) {
          const arc = arcFrom3Points(command.points[0], command.points[1], cur);
          if (arc) {
            const c = w2s(arc.center);
            ctx.beginPath();
            ctx.arc(c.x, c.y, arc.radius * cam.zoom, -arc.startAngle, -arc.endAngle, true);
            ctx.stroke();
          }
        }
      } else if (command.name === 'XLINE') {
        const dir = command.params.fixedDir || (command.points.length === 1 ? normalize(sub(cur, command.points[0])) : null);
        const origin = command.points.length === 1 ? command.points[0] : cur;
        if (dir && (Math.abs(dir.x) > 1e-6 || Math.abs(dir.y) > 1e-6)) {
          const far = 50000;
          drawSeg({ x: origin.x - dir.x * far, y: origin.y - dir.y * far }, { x: origin.x + dir.x * far, y: origin.y + dir.y * far });
        }
      } else if (command.name === 'RAY' && command.points.length === 1) {
        const dir = normalize(sub(cur, command.points[0]));
        if (Math.abs(dir.x) > 1e-6 || Math.abs(dir.y) > 1e-6) {
          const far = 50000;
          drawSeg(command.points[0], { x: command.points[0].x + dir.x * far, y: command.points[0].y + dir.y * far });
        }
      } else if ((command.name === 'RECTANGLE' || command.name === 'BOX' || command.name === 'ZOOM_WINDOW') && command.points.length === 1) {
        const a = w2s(command.points[0]);
        const b = w2s(cur);
        ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      } else if (command.name === 'POLYGON' && command.points.length === 1) {
        const r = dist(command.points[0], cur);
        const rot = angleBetween(command.points[0], cur);
        const verts = getPolygonVertices({
          center: command.points[0],
          radius: r,
          sides: command.params.sides || 6,
          rotation: rot,
          inscribed: command.params.inscribed ?? true,
        });
        ctx.beginPath();
        const s0 = w2s(verts[0]);
        ctx.moveTo(s0.x, s0.y);
        verts.slice(1).forEach((v) => {
          const sv = w2s(v);
          ctx.lineTo(sv.x, sv.y);
        });
        ctx.closePath();
        ctx.stroke();
      } else if (command.name === 'ELLIPSE' && command.points.length >= 1) {
        if (command.points.length === 1) {
          drawSeg(command.points[0], cur);
        } else {
          const rx = Math.max(0.5, dist(command.points[0], command.points[1]));
          const ry = Math.max(0.5, dist(command.points[0], cur));
          const rot = angleBetween(command.points[0], command.points[1]);
          const pts = sampleEllipse({ center: command.points[0], rx, ry, rotation: rot }, 48);
          ctx.beginPath();
          const s0 = w2s(pts[0]);
          ctx.moveTo(s0.x, s0.y);
          pts.slice(1).forEach((p) => {
            const sp = w2s(p);
            ctx.lineTo(sp.x, sp.y);
          });
          ctx.stroke();
        }
      } else if ((command.name === 'CYLINDER' || command.name === 'CONE' || command.name === 'PYRAMID') && command.points.length === 1) {
        const c = w2s(command.points[0]);
        const r = dist(command.points[0], cur) * cam.zoom;
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.stroke();
      } else if (command.name === 'TABLE') {
        const sc = w2s(cur);
        const pw = 4 * 80 * cam.zoom;
        const ph = 3 * 24 * cam.zoom;
        ctx.strokeRect(sc.x, sc.y, Math.max(24, pw), Math.max(18, ph));
      } else if (command.name === 'DONUT' && command.params.stage === 'center') {
        const c = w2s(cur);
        const rOut = ((command.params.outerD ?? 40) / 2) * cam.zoom;
        const rIn = ((command.params.innerD ?? 20) / 2) * cam.zoom;
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(1, rOut), 0, Math.PI * 2);
        ctx.stroke();
        if (rIn > 0.5) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, rIn, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (command.name === 'DIMLINEAR' && command.points.length >= 1) {
        if (command.points.length === 1) {
          drawSeg(command.points[0], cur);
        } else {
          const p1 = command.points[0], p2 = command.points[1];
          const dx = Math.abs(p2.x - p1.x);
          const dy = Math.abs(p2.y - p1.y);
          const horizontal = dx >= dy;
          const d1 = horizontal ? { x: p1.x, y: cur.y } : { x: cur.x, y: p1.y };
          const d2 = horizontal ? { x: p2.x, y: cur.y } : { x: cur.x, y: p2.y };
          drawSeg(p1, d1);
          drawSeg(p2, d2);
          drawSeg(d1, d2);
          drawDimBadge(w2s(mid(d1, d2)), (horizontal ? dx : dy).toFixed(settings.precision));
        }
      } else if (command.name === 'DIMALIGNED' && command.points.length >= 1) {
        if (command.points.length === 1) {
          drawSeg(command.points[0], cur);
        } else {
          const sp1 = w2s(command.points[0]), sp2 = w2s(command.points[1]), st = w2s(cur);
          const ang = Math.atan2(sp2.y - sp1.y, sp2.x - sp1.x);
          const nx = -Math.sin(ang), ny = Math.cos(ang);
          const off = (st.x - sp1.x) * nx + (st.y - sp1.y) * ny;
          const sd1 = { x: sp1.x + nx * off, y: sp1.y + ny * off };
          const sd2 = { x: sp2.x + nx * off, y: sp2.y + ny * off };
          ctx.beginPath();
          ctx.moveTo(sp1.x, sp1.y);
          ctx.lineTo(sd1.x, sd1.y);
          ctx.moveTo(sp2.x, sp2.y);
          ctx.lineTo(sd2.x, sd2.y);
          ctx.moveTo(sd1.x, sd1.y);
          ctx.lineTo(sd2.x, sd2.y);
          ctx.stroke();
          drawDimBadge(mid(sd1, sd2), dist(command.points[0], command.points[1]).toFixed(settings.precision));
        }
      } else if (command.name === 'DIMANGULAR' && command.points.length >= 1) {
        drawSeg(command.points[0], cur);
        if (command.points.length >= 2) {
          drawSeg(command.points[0], command.points[1]);
          const a1 = angleBetween(command.points[0], command.points[1]);
          const a2 = angleBetween(command.points[0], cur);
          const dRaw = normAngle(a2 - a1);
          const deg = radToDeg(dRaw > Math.PI ? Math.PI * 2 - dRaw : dRaw);
          drawDimBadge(w2s(cur), `${deg.toFixed(1)}°`);
        }
      } else if ((command.name === 'DIST' || command.name === 'LEADER' || command.name === 'BREAK') && command.points.length >= 1) {
        drawSeg(command.points[command.points.length - 1], cur);
      } else if (command.name === 'STRETCH') {
        const stage = command.params.stage;
        if (stage === 'box2' && command.points.length === 1) {
          const a = w2s(command.points[0]);
          const b = w2s(cur);
          ctx.save();
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          ctx.strokeStyle = '#4ADE80';
          ctx.setLineDash([5, 4]);
          const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
          const bw = Math.abs(b.x - a.x), bh = Math.abs(b.y - a.y);
          ctx.fillRect(x, y, bw, bh);
          ctx.strokeRect(x, y, bw, bh);
          ctx.restore();
        } else if (stage === 'target' && command.params.basePt && command.params.box) {
          const basePt = command.params.basePt as Point2D;
          const dx = cur.x - basePt.x;
          const dy = cur.y - basePt.y;
          drawSeg(basePt, cur);
          const sIds = new Set<string>(command.params.stretchIds || []);
          for (const ent of doc.entities.filter((e) => sIds.has(e.id))) {
            drawEntity(ctx, stretchEntity(ent, command.params.box, dx, dy), doc, w2s, cam.zoom, { ghost: true });
          }
        }
      } else if (command.name === 'ALIGN') {
        ctx.strokeStyle = '#F5A623';
        if (command.points.length === 1) drawSeg(command.points[0], cur);
        else if (command.points.length >= 2) drawSeg(command.points[0], command.points[1]);
        if (command.points.length === 3) drawSeg(command.points[2], cur);
        else if (command.points.length >= 4) drawSeg(command.points[2], command.points[3]);
      } else if ((command.name === 'MOVE' || command.name === 'COPY') && command.points.length === 1) {
        const dx = cur.x - command.points[0].x;
        const dy = cur.y - command.points[0].y;
        drawSeg(command.points[0], cur);
        for (const ent of doc.entities.filter((e) => selectedSet.has(e.id))) {
          drawEntity(ctx, translateEntity(ent, dx, dy), doc, w2s, cam.zoom, { ghost: true });
        }
      } else if (command.name === 'ROTATE' && command.points.length === 1) {
        const rad = angleBetween(command.points[0], cur);
        drawSeg(command.points[0], cur);
        for (const ent of doc.entities.filter((e) => selectedSet.has(e.id))) {
          drawEntity(ctx, rotateEntity(ent, command.points[0], rad), doc, w2s, cam.zoom, { ghost: true });
        }
      } else if (command.name === 'MIRROR' && command.points.length === 1) {
        ctx.strokeStyle = '#F5A623';
        drawSeg(command.points[0], cur);
        for (const ent of doc.entities.filter((e) => selectedSet.has(e.id))) {
          drawEntity(ctx, mirrorEntity(ent, command.points[0], cur), doc, w2s, cam.zoom, { ghost: true });
        }
      } else if (command.name === 'SCALE' && command.points.length === 1) {
        const factor = Math.max(0.05, dist(command.points[0], cur) / 100);
        drawSeg(command.points[0], cur);
        for (const ent of doc.entities.filter((e) => selectedSet.has(e.id))) {
          drawEntity(ctx, scaleEntity(ent, command.points[0], factor), doc, w2s, cam.zoom, { ghost: true });
        }
      } else if (command.name === 'INSERT_BLOCK') {
        const bName = command.params.blockName || 'PORTA_80';
        const ghostBlock: CadEntity = {
          id: 'ghost_blk',
          type: 'block_ref',
          layer: doc.activeLayer,
          color: '#38ABDF',
          lineType: 'CONTINUOUS',
          lineTypeScale: 1,
          lineWeight: -1,
          blockName: bName,
          position: cur,
          scaleX: command.params.scale ?? 1,
          scaleY: command.params.scale ?? 1,
          rotation: degToRad(command.params.rotationDeg ?? 0),
        };
        drawEntity(ctx, ghostBlock, doc, w2s, cam.zoom, { ghost: true });
      }
      ctx.restore();
    }

    // DRAW BLUE GRIPS FOR SELECTED ENTITIES (when idle)
    if (!command && doc.selectedIds.length > 0 && doc.selectedIds.length <= 25) {
      ctx.save();
      for (const ent of doc.entities) {
        if (!selectedSet.has(ent.id)) continue;
        const grips = getEntityGrips(ent);
        for (const g of grips) {
          const sp = w2s(g.point);
          const isHot = activeGrip?.entityId === g.entityId && activeGrip?.gripIndex === g.gripIndex;
          ctx.fillStyle = isHot ? '#EF4444' : '#2563EB';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.fillRect(sp.x - 4, sp.y - 4, 8, 8);
          ctx.strokeRect(sp.x - 4, sp.y - 4, 8, 8);
        }
      }
      ctx.restore();
    }

    // DRAW WINDOW (BLUE) / CROSSING (GREEN) SELECTION BOX
    if (dragBox) {
      const crossing = dragBox.currentScreen.x < dragBox.startScreen.x;
      const x = Math.min(dragBox.startScreen.x, dragBox.currentScreen.x);
      const y = Math.min(dragBox.startScreen.y, dragBox.currentScreen.y);
      const bw = Math.abs(dragBox.currentScreen.x - dragBox.startScreen.x);
      const bh = Math.abs(dragBox.currentScreen.y - dragBox.startScreen.y);
      ctx.save();
      ctx.fillStyle = crossing ? 'rgba(34, 197, 94, 0.22)' : 'rgba(30, 120, 230, 0.24)';
      ctx.strokeStyle = crossing ? '#4ADE80' : '#38ABDF';
      ctx.lineWidth = 1.2;
      if (crossing) ctx.setLineDash([5, 4]);
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeRect(x, y, bw, bh);
      ctx.restore();
    }

    // POLAR / ORTHO TRACKING GREEN DOTTED GUIDE LINE
    if (polarGuideAngle !== undefined && command && command.points.length > 0) {
      const refS = w2s(command.points[command.points.length - 1]);
      ctx.save();
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const far = 3000;
      ctx.beginPath();
      ctx.moveTo(refS.x, refS.y);
      ctx.lineTo(refS.x + Math.cos(polarGuideAngle) * far, refS.y - Math.sin(polarGuideAngle) * far);
      ctx.stroke();
      ctx.restore();
    }

    // OTRACK ALIGNMENT GUIDES & ACQUISITION MARKERS
    if (settings.otrackOn && trackedPointsRef.current.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 1.1;
      for (const ap of trackedPointsRef.current) {
        const sp = w2s(ap);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(sp.x - 5, sp.y);
        ctx.lineTo(sp.x + 5, sp.y);
        ctx.moveTo(sp.x, sp.y - 5);
        ctx.lineTo(sp.x, sp.y + 5);
        ctx.stroke();
      }
      ctx.setLineDash([5, 5]);
      for (const g of otrackGuides) {
        const sf = w2s(g.from);
        const st = w2s(g.to);
        ctx.beginPath();
        ctx.moveTo(sf.x, sf.y);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // NEON GREEN OSNAP MARKER + TOOLTIP
    if (activeOsnap) {
      const sp = w2s(activeOsnap.point);
      ctx.save();
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([]);
      const r = 6;
      ctx.beginPath();
      if (activeOsnap.mode === 'endpoint') {
        ctx.strokeRect(sp.x - r, sp.y - r, r * 2, r * 2);
      } else if (activeOsnap.mode === 'midpoint') {
        ctx.moveTo(sp.x, sp.y - r - 1);
        ctx.lineTo(sp.x + r + 1, sp.y + r);
        ctx.lineTo(sp.x - r - 1, sp.y + r);
        ctx.closePath();
        ctx.stroke();
      } else if (activeOsnap.mode === 'center' || activeOsnap.mode === 'geometricCenter' || activeOsnap.mode === 'node') {
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeOsnap.mode === 'quadrant') {
        ctx.moveTo(sp.x, sp.y - r - 1);
        ctx.lineTo(sp.x + r + 1, sp.y);
        ctx.lineTo(sp.x, sp.y + r + 1);
        ctx.lineTo(sp.x - r - 1, sp.y);
        ctx.closePath();
        ctx.stroke();
      } else if (activeOsnap.mode === 'intersection') {
        ctx.moveTo(sp.x - r, sp.y - r);
        ctx.lineTo(sp.x + r, sp.y + r);
        ctx.moveTo(sp.x + r, sp.y - r);
        ctx.lineTo(sp.x - r, sp.y + r);
        ctx.stroke();
      } else if (activeOsnap.mode === 'perpendicular') {
        ctx.moveTo(sp.x - r, sp.y + r);
        ctx.lineTo(sp.x + r, sp.y + r);
        ctx.moveTo(sp.x - r, sp.y - r);
        ctx.lineTo(sp.x - r, sp.y + r);
        ctx.strokeRect(sp.x - r, sp.y, r, r);
        ctx.stroke();
      } else {
        ctx.arc(sp.x, sp.y, r - 1, 0, Math.PI * 2);
        ctx.stroke();
      }

      // OSNAP badge label
      ctx.font = '11px "Segoe UI", sans-serif';
      const tw = ctx.measureText(activeOsnap.label).width;
      ctx.fillStyle = 'rgba(28, 34, 44, 0.92)';
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 1;
      ctx.fillRect(sp.x + 10, sp.y - 22, tw + 10, 17);
      ctx.strokeRect(sp.x + 10, sp.y - 22, tw + 10, 17);
      ctx.fillStyle = '#E6F5E9';
      ctx.fillText(activeOsnap.label, sp.x + 15, sp.y - 10);
      ctx.restore();
    }

    // UCS ICON (bottom-left)
    if (settings.showUcsIcon) {
      const ox = 42, oy = h - 42;
      ctx.save();
      ctx.lineWidth = 1.6;
      // Y green
      ctx.strokeStyle = '#46B256';
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy - 38);
      ctx.stroke();
      // X red
      ctx.strokeStyle = '#D04242';
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 38, oy);
      ctx.stroke();
      // Origin square
      ctx.strokeStyle = theme === 'dark' ? '#CBD5E1' : '#334155';
      ctx.strokeRect(ox - 4, oy - 4, 8, 8);
      ctx.font = 'bold 11px "Segoe UI", Arial';
      ctx.fillStyle = '#46B256';
      ctx.fillText('Y', ox - 4, oy - 42);
      ctx.fillStyle = '#D04242';
      ctx.fillText('X', ox + 43, oy + 4);
      ctx.restore();
    }

    // CROSSHAIR + PICKBOX + DYNAMIC INPUT HUD
    if (cursorScreen && !panRef.current.active) {
      const snapS = activeOsnap ? w2s(activeOsnap.point) : cursorScreen;
      const cx = Math.round(snapS.x) + 0.5;
      const cy = Math.round(snapS.y) + 0.5;
      const halfSpan = settings.crosshairSize >= 99 ? Math.max(w, h) : (settings.crosshairSize / 100) * 140;
      const pb = settings.pickboxSize / 2;

      ctx.save();
      ctx.strokeStyle = theme === 'dark' ? 'rgba(235, 242, 250, 0.78)' : 'rgba(20, 28, 38, 0.78)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - halfSpan, cy);
      ctx.lineTo(cx + halfSpan, cy);
      ctx.moveTo(cx, cy - halfSpan);
      ctx.lineTo(cx, cy + halfSpan);
      ctx.stroke();

      // Pickbox square when idle or selecting
      if (!command || command.params.pickingSelection || ['TRIM', 'EXTEND', 'OFFSET', 'FILLET', 'CHAMFER', 'ERASE', 'MATCHPROP'].includes(command.name)) {
        ctx.strokeStyle = theme === 'dark' ? '#FFFFFF' : '#111111';
        ctx.strokeRect(cx - pb, cy - pb, pb * 2, pb * 2);
      }

      // Dynamic Input HUD (DYN)
      if (settings.dynInputOn) {
        const refPt = command && command.points.length > 0 ? command.points[command.points.length - 1] : null;
        const pr = settings.precision;
        let hudText = `X: ${cursorWorldConstrained.x.toFixed(pr)}  Y: ${cursorWorldConstrained.y.toFixed(pr)}`;
        if (refPt) {
          const d = dist(refPt, cursorWorldConstrained);
          const ang = radToDeg(angleBetween(refPt, cursorWorldConstrained));
          hudText = `${d.toFixed(pr)} ${settings.units}  ∠ ${ang.toFixed(1)}°`;
        }
        ctx.font = '11px Consolas, "Segoe UI", monospace';
        const tw = ctx.measureText(hudText).width;
        const hx = Math.min(w - tw - 22, cx + 18);
        const hy = Math.max(24, cy + 20);
        ctx.fillStyle = 'rgba(34, 41, 51, 0.9)';
        ctx.strokeStyle = '#38ABDF';
        ctx.lineWidth = 1;
        ctx.fillRect(hx, hy, tw + 12, 20);
        ctx.strokeRect(hx, hy, tw + 12, 20);
        ctx.fillStyle = '#F1F5F9';
        ctx.fillText(hudText, hx + 6, hy + 14);
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    renderFrame();
  });

  // Mouse handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!doc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    setCursorScreen({ x: sx, y: sy });

    if (panRef.current.active) {
      const dx = sx - panRef.current.lastX;
      const dy = sy - panRef.current.lastY;
      panRef.current.lastX = sx;
      panRef.current.lastY = sy;
      if (doc.activeSpace !== 'model') {
        const layout = doc.layouts.find((l) => l.id === doc.activeSpace) || doc.layouts[0];
        const vpRect = paperVpRectRef.current;
        if (viewportActive && layout && vpRect && vpRect.vpScale > 0) {
          useCadStore.getState().updateLayout(layout.id, {
            autoFit: false,
            viewportCenter: {
              x: vpRect.vpCenterX - dx / vpRect.vpScale,
              y: vpRect.vpCenterY + dy / vpRect.vpScale,
            },
            viewportScale: vpRect.vpScale / Math.max(0.001, vpRect.scaleSheet),
          });
        } else {
          setPaperCam((prev) => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }));
        }
      } else {
        useCadStore.getState().updateCamera({
          panX: doc.camera.panX + dx,
          panY: doc.camera.panY + dy,
        });
      }
      return;
    }

    if (doc.activeSpace !== 'model') return;

    const rawWorld = screenToWorld(sx, sy);
    const refPt = command && command.points.length > 0 ? command.points[command.points.length - 1] : activeGrip?.point;
    const snapRadiusWorld = 14 / doc.camera.zoom;
    const osnap = findOsnap(rawWorld, doc.entities, doc.layers, settings, snapRadiusWorld, refPt, doc.blocks);
    const constrained = applyDraftingConstraints(rawWorld, settings, refPt, osnap);

    let finalPoint = constrained.point;
    let nextOtrackGuides: OtrackGuide[] = [];
    if (settings.otrackOn && command) {
      const now = performance.now();
      if (osnap) {
        const hover = otrackHoverRef.current;
        if (!hover || dist(hover.pt, osnap.point) > snapRadiusWorld * 0.4) {
          otrackHoverRef.current = { pt: osnap.point, since: now };
        } else if (now - hover.since >= 280) {
          const already = trackedPointsRef.current.some((tp) => dist(tp, osnap.point) < snapRadiusWorld * 0.35);
          if (!already) {
            trackedPointsRef.current = [...trackedPointsRef.current.slice(-3), osnap.point];
          }
        }
      } else {
        otrackHoverRef.current = null;
        if (trackedPointsRef.current.length > 0) {
          const ot = findOtrackAlignment(constrained.point, trackedPointsRef.current, snapRadiusWorld);
          if (ot) {
            finalPoint = ot.point;
            nextOtrackGuides = ot.guides;
          }
        }
      }
    }

    setOtrackGuides(nextOtrackGuides);
    setActiveOsnap(osnap);
    setPolarGuideAngle(constrained.polarGuideAngle);
    setCursorWorldConstrained(finalPoint);
    useCadStore.getState().setCursorWorld(finalPoint);

    if (activeGrip) {
      const recUndo = !gripUndoRecordedRef.current;
      gripUndoRecordedRef.current = true;
      useCadStore.getState().moveGrip(activeGrip.entityId, activeGrip.gripIndex, finalPoint, recUndo);
      return;
    }

    if (dragBox) {
      setDragBox({ ...dragBox, currentScreen: { x: sx, y: sy }, currentWorld: rawWorld });
      return;
    }

    if (!command || ['TRIM', 'EXTEND', 'FILLET', 'CHAMFER', 'OFFSET', 'BREAK', 'DIVIDE', 'MEASURE_SEG', 'ERASE', 'MATCHPROP'].includes(command.name)) {
      const hit = hitTestEntities(rawWorld, doc.entities, doc.layers, 8 / doc.camera.zoom, doc.blocks);
      setHoveredEntityId(hit ? hit.id : null);
    } else if (hoveredEntityId) {
      setHoveredEntityId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setContextMenu(null);
    if (!doc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Middle mouse double-click -> Zoom Extents (or reset Paper camera)
    if (e.button === 1) {
      e.preventDefault();
      const now = performance.now();
      if (now - lastMiddleDownRef.current < 350) {
        lastMiddleDownRef.current = 0;
        panRef.current.active = false;
        if (doc.activeSpace === 'model') {
          useCadStore.getState().zoomExtents(sizeRef.current.w, sizeRef.current.h);
        } else {
          setPaperCam({ panX: 0, panY: 0, zoom: 1 });
        }
        return;
      }
      lastMiddleDownRef.current = now;
      panRef.current = { active: true, lastX: sx, lastY: sy };
      return;
    }

    if (e.button === 0 && command?.name === 'PAN') {
      e.preventDefault();
      panRef.current = { active: true, lastX: sx, lastY: sy };
      return;
    }

    if (e.button === 2) {
      // Right-click: if in multi-step command, finish/Enter! Else context menu
      e.preventDefault();
      if (command && ['LINE', 'POLYLINE', 'SPLINE', 'REVCLOUD', 'AREA', 'COPY', 'TRIM', 'EXTEND', 'OFFSET'].includes(command.name)) {
        useCadStore.getState().finishMultiStepCommand();
      } else if (command?.params.pickingSelection) {
        useCadStore.getState().finishMultiStepCommand();
      } else {
        setContextMenu({ x: e.clientX, y: e.clientY });
      }
      return;
    }

    if (e.button !== 0 || doc.activeSpace !== 'model') return;

    const rawWorld = screenToWorld(sx, sy);
    const clickPt = activeOsnap ? activeOsnap.point : cursorWorldConstrained;
    const hitTol = 8 / doc.camera.zoom;

    // Check grip hit if idle & entities selected
    if (!command && doc.selectedIds.length > 0 && doc.selectedIds.length <= 25) {
      for (const ent of doc.entities.filter((en) => doc.selectedIds.includes(en.id))) {
        for (const g of getEntityGrips(ent)) {
          const sp = worldToScreen(g.point);
          if (Math.hypot(sp.x - sx, sp.y - sy) <= 7) {
            gripUndoRecordedRef.current = false;
            setActiveGrip(g);
            return;
          }
        }
      }
    }

    // If idle and clicking empty space -> start window/crossing selection drag box
    if (!command) {
      const hit = hitTestEntities(rawWorld, doc.entities, doc.layers, hitTol, doc.blocks);
      if (!hit) {
        setDragBox({
          startScreen: { x: sx, y: sy },
          currentScreen: { x: sx, y: sy },
          startWorld: rawWorld,
          currentWorld: rawWorld,
        });
        return;
      }
    }

    useCadStore.getState().submitCanvasClick(clickPt, hitTol, e.shiftKey);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (panRef.current.active) {
      panRef.current.active = false;
      return;
    }
    if (activeGrip) {
      setActiveGrip(null);
      return;
    }
    if (dragBox && doc) {
      const dx = Math.abs(dragBox.currentScreen.x - dragBox.startScreen.x);
      const dy = Math.abs(dragBox.currentScreen.y - dragBox.startScreen.y);
      if (dx > 5 || dy > 5) {
        const crossing = dragBox.currentScreen.x < dragBox.startScreen.x;
        const ids = selectEntitiesInBox(dragBox.startWorld, dragBox.currentWorld, crossing, doc.entities, doc.layers, doc.blocks);
        useCadStore.getState().setSelection(ids, e.shiftKey ? 'remove' : 'add');
      } else if (!e.shiftKey) {
        useCadStore.getState().clearSelection();
      }
      setDragBox(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!doc) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    if (doc.activeSpace !== 'model') {
      const layout = doc.layouts.find((l) => l.id === doc.activeSpace) || doc.layouts[0];
      const vpRect = paperVpRectRef.current;
      if (viewportActive && layout && vpRect) {
        const curModelScale = vpRect.vpScale / Math.max(0.001, vpRect.scaleSheet);
        useCadStore.getState().updateLayout(layout.id, {
          autoFit: false,
          viewportCenter: { x: vpRect.vpCenterX, y: vpRect.vpCenterY },
          viewportScale: Math.max(0.01, Math.min(20, curModelScale * factor)),
        });
      } else {
        setPaperCam((prev) => ({ ...prev, zoom: Math.max(0.35, Math.min(6, prev.zoom * factor)) }));
      }
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const before = screenToWorld(sx, sy);
    const newZoom = Math.max(0.005, Math.min(200, doc.camera.zoom * factor));
    const newPanX = sx - before.x * newZoom;
    const newPanY = sy + before.y * newZoom;
    useCadStore.getState().updateCamera({ zoom: newZoom, panX: newPanX, panY: newPanY });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!doc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (doc.activeSpace !== 'model') {
      const vp = paperVpRectRef.current;
      if (vp) {
        const inside = sx >= vp.x && sx <= vp.x + vp.w && sy >= vp.y && sy <= vp.y + vp.h;
        setViewportActive(inside);
      }
      return;
    }

    if (e.button === 1) {
      useCadStore.getState().zoomExtents(sizeRef.current.w, sizeRef.current.h);
      return;
    }

    if (e.button === 0 && !command) {
      const pt = screenToWorld(sx, sy);
      const hitTol = 10 / doc.camera.zoom;
      const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol, doc.blocks);
      if (!hit) return;
      const store = useCadStore.getState();
      if (hit.type === 'text' || hit.type === 'mtext') {
        store.setModal('mtextEditor', {
          entityId: hit.id,
          position: hit.position,
          initialText: hit.content,
          height: hit.height,
          isMText: hit.type === 'mtext',
        });
      } else if (hit.type === 'table') {
        store.setModal('tableEditor', { entityId: hit.id });
      } else if (hit.type === 'leader') {
        store.setModal('mtextEditor', {
          entityId: hit.id,
          position: hit.points[hit.points.length - 1] || hit.points[0],
          initialText: hit.text,
          height: hit.textHeight,
          isMText: false,
        });
      } else if (hit.type === 'dimension') {
        store.setModal('mtextEditor', {
          entityId: hit.id,
          position: hit.textPosition,
          initialText: hit.textOverride || '',
          height: hit.textHeight,
          isMText: false,
        });
      }
    }
  };

  const activeLayout = doc && doc.activeSpace !== 'model' ? doc.layouts.find((l) => l.id === doc.activeSpace) || doc.layouts[0] : null;
  const qpVisible = Boolean(settings.quickPropertiesOn && doc && doc.activeSpace === 'model' && !command && doc.selectedIds.length > 0);
  const qpEntities = qpVisible && doc ? doc.entities.filter((e) => doc.selectedIds.includes(e.id)) : [];
  const qpFirst = qpEntities[0] || null;
  const qpBox = qpFirst && doc ? getEntityBBox(qpFirst, doc.blocks) : null;
  const qpScreen = qpBox && doc ? worldToScreen({ x: qpBox.maxX, y: qpBox.maxY }, doc.camera) : { x: 260, y: 120 };
  const qpLeft = Math.max(12, Math.min(sizeRef.current.w - 235, qpScreen.x + 14));
  const qpTop = Math.max(12, Math.min(sizeRef.current.h - 210, qpScreen.y - 12));

  return (
    <div ref={containerRef} className="cad-canvas-container">
      <canvas
        ref={canvasRef}
        className="cad-canvas"
        style={{ cursor: panRef.current.active || command?.name === 'PAN' ? 'grab' : doc?.activeSpace === 'model' ? 'none' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setCursorScreen(null);
          panRef.current.active = false;
        }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Interactive Paper Space Floating Toolbar */}
      {activeLayout && (
        <div className="paper-space-toolbar">
          <button
            className={`pst-btn ${viewportActive ? 'active' : ''}`}
            onClick={() => setViewportActive((v) => !v)}
            title="Doppio click nella finestra per alternare Spazio Carta / Modello"
          >
            MODALITÀ: {viewportActive ? 'FINESTRA MODELLO' : 'CARTA'}
          </button>
          <button
            className="pst-btn"
            onClick={() => {
              useCadStore.getState().updateLayout(activeLayout.id, { autoFit: true });
              setPaperCam({ panX: 0, panY: 0, zoom: 1 });
            }}
          >
            Adatta Finestra (Auto)
          </button>
          <button className="pst-btn" onClick={() => useCadStore.getState().setModal('layoutSetup', true)}>
            Imposta Pagina...
          </button>
          <button className="pst-btn" onClick={() => useCadStore.getState().setModal('plot', true)}>
            Stampa PDF/SVG
          </button>
        </div>
      )}

      {/* Quick Properties Floating Card (QP) */}
      {qpVisible && qpFirst && doc && (
        <div className="quick-props-popup" style={{ left: qpLeft, top: qpTop }} onMouseDown={(e) => e.stopPropagation()}>
          <div className="qp-header">
            <span>{qpEntities.length > 1 ? `Proprietà Rapide (${qpEntities.length})` : `QP — ${qpFirst.type.toUpperCase()}`}</span>
            <button onClick={() => useCadStore.getState().updateSettings({ quickPropertiesOn: false })}>✕</button>
          </div>
          <div className="qp-body">
            <label>
              Layer
              <select
                value={qpEntities.every((e) => e.layer === qpFirst.layer) ? qpFirst.layer : ''}
                onChange={(e) => e.target.value && useCadStore.getState().updateSelectedEntities({ layer: e.target.value })}
              >
                {!qpEntities.every((e) => e.layer === qpFirst.layer) && <option value="">*VARIA*</option>}
                {doc.layers.map((l) => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
            </label>
            <label>
              Colore
              <select
                value={qpEntities.every((e) => e.color === qpFirst.color) ? qpFirst.color : ''}
                onChange={(e) => e.target.value && useCadStore.getState().updateSelectedEntities({ color: e.target.value })}
              >
                {!qpEntities.every((e) => e.color === qpFirst.color) && <option value="">*VARIA*</option>}
                <option value="ByLayer">DaLayer (ByLayer)</option>
                {CAD_ACI_COLORS.map((c) => (
                  <option key={c.aci} value={c.hex}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Tipo Linea
              <select
                value={qpEntities.every((e) => e.lineType === qpFirst.lineType) ? qpFirst.lineType : ''}
                onChange={(e) => e.target.value && useCadStore.getState().updateSelectedEntities({ lineType: e.target.value as LineTypeName })}
              >
                {!qpEntities.every((e) => e.lineType === qpFirst.lineType) && <option value="">*VARIA*</option>}
                {LINE_TYPES.map((lt) => (
                  <option key={lt.id} value={lt.id}>{lt.label}</option>
                ))}
              </select>
            </label>
            {qpEntities.length === 1 && (qpFirst.type === 'circle' || qpFirst.type === 'arc') && (
              <label>
                Raggio
                <input
                  type="number"
                  step="0.5"
                  value={Number(qpFirst.radius.toFixed(2))}
                  onChange={(e) => {
                    const r = Math.max(0.1, Number(e.target.value));
                    if (Number.isFinite(r)) useCadStore.getState().updateEntity(qpFirst.id, { radius: r });
                  }}
                />
              </label>
            )}
            {qpEntities.length === 1 && (qpFirst.type === 'text' || qpFirst.type === 'mtext') && (
              <label>
                Testo
                <input
                  type="text"
                  value={qpFirst.content}
                  onChange={(e) => useCadStore.getState().updateEntity(qpFirst.id, { content: e.target.value })}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="cad-context-menu"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 210), top: Math.min(contextMenu.y, window.innerHeight - 280) }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button onClick={() => { setContextMenu(null); useCadStore.getState().repeatLastCommand(); }}>
            Ripeti {useCadStore.getState().lastCommandId}
          </button>
          <div className="ctx-sep" />
          <button onClick={() => { setContextMenu(null); useCadStore.getState().startCommand('MOVE'); }}>Sposta (S)</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().startCommand('COPY'); }}>Copia (CP)</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().startCommand('ROTATE'); }}>Ruota (RU)</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().startCommand('SCALE'); }}>Scala (SS)</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().startCommand('MIRROR'); }}>Specchio (SP)</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().deleteSelected(); }}>Cancella (DEL)</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().startCommand('SELECTSIMILAR'); }}>Seleziona simili</button>
          <div className="ctx-sep" />
          <button onClick={() => { setContextMenu(null); useCadStore.getState().zoomExtents(sizeRef.current.w, sizeRef.current.h); }}>Zoom Estensioni</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().setPresetView('swIso'); }}>Passa a Vista 3D</button>
          <button onClick={() => { setContextMenu(null); useCadStore.getState().togglePropertiesPalette(true); }}>Proprietà (Ctrl+1)</button>
        </div>
      )}
    </div>
  );
};
