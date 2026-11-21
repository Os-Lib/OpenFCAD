import {
  BlockDefinition,
  CAD_ACI_COLORS,
  CadDocument,
  CadEntity,
  HatchPatternName,
  Layer,
  LINE_TYPES,
  Point2D,
} from '../types/cad';
import {
  degToRad,
  genId,
  getDocumentBBox,
  getPolygonVertices,
  getRectangleCorners,
  mid,
  radToDeg,
  sampleEllipse,
  samplePolyline,
  sampleSpline,
} from './math';
import { isEntityVisible, resolveEntityColor, resolveEntityLineType, resolveEntityLineWeight } from './osnap';
import { buildThreeGeometryForSolid } from './csg3d';

function hexToNearestAci(hex: string): number {
  const clean = hex.replace('#', '').toUpperCase();
  if (clean.length !== 6) return 7;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  let bestAci = 7;
  let bestD = Infinity;
  for (const c of CAD_ACI_COLORS) {
    const ch = c.hex.replace('#', '');
    const cr = parseInt(ch.slice(0, 2), 16);
    const cg = parseInt(ch.slice(2, 4), 16);
    const cb = parseInt(ch.slice(4, 6), 16);
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestD) {
      bestD = d;
      bestAci = c.aci;
    }
  }
  return bestAci;
}

function aciToHex(aci: number): string {
  const exact = CAD_ACI_COLORS.find((c) => c.aci === Math.abs(aci));
  if (exact) return exact.hex;
  if (aci === 0 || aci === 256) return 'ByLayer';
  return '#FFFFFF';
}

const VALID_LINETYPES = new Set(LINE_TYPES.filter((l) => l.id !== 'ByLayer').map((l) => l.id));

// Export CadDocument to standard ASCII DXF (with BLOCKS, INSERT, ELLIPSE, BULGE, etc.)
export function exportToDXF(doc: CadDocument): string {
  const lines: string[] = [];
  const pair = (code: number, value: string | number) => {
    lines.push(String(code));
    lines.push(typeof value === 'number' ? Number(value.toFixed(6)).toString() : String(value));
  };

  // HEADER
  pair(0, 'SECTION');
  pair(2, 'HEADER');
  pair(9, '$ACADVER');
  pair(1, 'AC1009');
  pair(9, '$INSUNITS');
  pair(70, 4);
  pair(0, 'ENDSEC');

  // TABLES (LTYPE + LAYER)
  pair(0, 'SECTION');
  pair(2, 'TABLES');

  const ltypes = [
    { name: 'CONTINUOUS', desc: 'Solid line', elems: [] as number[] },
    { name: 'DASHED', desc: 'Dashed __ __ __', elems: [10, -5] },
    { name: 'DASHED2', desc: 'Dashed (.5x) _ _ _', elems: [5, -2.5] },
    { name: 'CENTER', desc: 'Center ____ _ ____', elems: [18, -4, 4, -4] },
    { name: 'CENTER2', desc: 'Center (.5x) __ _ __', elems: [10, -2.5, 2.5, -2.5] },
    { name: 'HIDDEN', desc: 'Hidden _ _ _', elems: [5, -3] },
    { name: 'HIDDEN2', desc: 'Hidden (.5x) _ _ _', elems: [3, -2] },
    { name: 'DASHDOT', desc: 'Dash dot __ . __', elems: [12, -4, 0, -4] },
    { name: 'PHANTOM', desc: 'Phantom _____ _ _', elems: [20, -4, 4, -4, 4, -4] },
    { name: 'BORDER', desc: 'Border __ __ . __', elems: [18, -4, 18, -4, 0, -4] },
    { name: 'DIVIDE', desc: 'Divide ____ . . ____', elems: [16, -4, 0, -4, 0, -4] },
    { name: 'DOT', desc: 'Dot . . . . .', elems: [0, -4] },
  ];

  pair(0, 'TABLE');
  pair(2, 'LTYPE');
  pair(70, ltypes.length);
  for (const lt of ltypes) {
    pair(0, 'LTYPE');
    pair(2, lt.name);
    pair(70, 0);
    pair(3, lt.desc);
    pair(72, 65);
    pair(73, lt.elems.length);
    pair(40, lt.elems.reduce((s, v) => s + Math.abs(v), 0));
    for (const e of lt.elems) pair(49, e);
  }
  pair(0, 'ENDTAB');

  pair(0, 'TABLE');
  pair(2, 'LAYER');
  pair(70, doc.layers.length);
  for (const l of doc.layers) {
    pair(0, 'LAYER');
    pair(2, l.name);
    pair(70, (l.frozen ? 1 : 0) | (l.locked ? 4 : 0));
    const aci = hexToNearestAci(l.color);
    pair(62, l.on ? aci : -aci);
    pair(6, l.lineType || 'CONTINUOUS');
  }
  pair(0, 'ENDTAB');
  pair(0, 'ENDSEC');

  const emitCommon = (ent: CadEntity) => {
    pair(8, ent.layer || '0');
    if (ent.color && ent.color !== 'ByLayer') {
      pair(62, hexToNearestAci(ent.color));
    }
    if (ent.lineType && ent.lineType !== 'ByLayer') {
      pair(6, ent.lineType);
    }
  };

  const emitPoly = (ent: CadEntity, pts: Point2D[], closed: boolean, bulges?: number[]) => {
    if (pts.length < 2) return;
    pair(0, 'POLYLINE');
    emitCommon(ent);
    pair(66, 1);
    pair(10, 0);
    pair(20, 0);
    pair(30, ent.elevation || 0);
    pair(70, closed ? 1 : 0);
    pts.forEach((p, idx) => {
      pair(0, 'VERTEX');
      pair(8, ent.layer || '0');
      pair(10, p.x);
      pair(20, p.y);
      pair(30, ent.elevation || 0);
      const b = bulges?.[idx];
      if (b && Math.abs(b) > 1e-6) {
        pair(42, b);
      }
    });
    pair(0, 'SEQEND');
    pair(8, ent.layer || '0');
  };

  const emitEntity = (ent: CadEntity) => {
    switch (ent.type) {
      case 'line':
        pair(0, 'LINE');
        emitCommon(ent);
        pair(10, ent.start.x);
        pair(20, ent.start.y);
        pair(30, ent.elevation || 0);
        pair(11, ent.end.x);
        pair(21, ent.end.y);
        pair(31, ent.elevation || 0);
        break;
      case 'polyline':
        emitPoly(ent, ent.points, ent.closed, ent.bulges);
        break;
      case 'rectangle':
        emitPoly(ent, getRectangleCorners(ent), true);
        break;
      case 'polygon':
        emitPoly(ent, getPolygonVertices(ent), true);
        break;
      case 'spline':
        emitPoly(ent, sampleSpline(ent.controlPoints, ent.closed, 12), ent.closed);
        break;
      case 'ellipse': {
        pair(0, 'ELLIPSE');
        emitCommon(ent);
        pair(10, ent.center.x);
        pair(20, ent.center.y);
        pair(30, ent.elevation || 0);
        pair(11, ent.rx * Math.cos(ent.rotation));
        pair(21, ent.rx * Math.sin(ent.rotation));
        pair(31, 0);
        pair(40, Math.max(0.01, ent.ry / Math.max(0.01, ent.rx)));
        pair(41, 0);
        pair(42, Math.PI * 2);
        break;
      }
      case 'circle':
        pair(0, 'CIRCLE');
        emitCommon(ent);
        pair(10, ent.center.x);
        pair(20, ent.center.y);
        pair(30, ent.elevation || 0);
        pair(40, ent.radius);
        break;
      case 'arc':
        pair(0, 'ARC');
        emitCommon(ent);
        pair(10, ent.center.x);
        pair(20, ent.center.y);
        pair(30, ent.elevation || 0);
        pair(40, ent.radius);
        pair(50, radToDeg(ent.startAngle));
        pair(51, radToDeg(ent.endAngle));
        break;
      case 'point':
        pair(0, 'POINT');
        emitCommon(ent);
        pair(10, ent.position.x);
        pair(20, ent.position.y);
        pair(30, ent.elevation || 0);
        break;
      case 'xline':
      case 'ray': {
        const span = 5000;
        const p1 = ent.type === 'xline'
          ? { x: ent.origin.x - ent.direction.x * span, y: ent.origin.y - ent.direction.y * span }
          : ent.origin;
        const p2 = { x: ent.origin.x + ent.direction.x * span, y: ent.origin.y + ent.direction.y * span };
        pair(0, 'LINE');
        emitCommon(ent);
        pair(10, p1.x);
        pair(20, p1.y);
        pair(11, p2.x);
        pair(21, p2.y);
        break;
      }
      case 'text':
      case 'mtext':
        pair(0, 'TEXT');
        emitCommon(ent);
        pair(10, ent.position.x);
        pair(20, ent.position.y);
        pair(30, ent.elevation || 0);
        pair(40, ent.height);
        pair(1, ent.content.replace(/\n/g, '\\P'));
        pair(50, radToDeg(ent.rotation));
        break;
      case 'hatch':
        emitPoly(ent, ent.boundary, true);
        break;
      case 'revcloud':
        emitPoly(ent, ent.points, ent.closed);
        break;
      case 'block_ref':
        pair(0, 'INSERT');
        emitCommon(ent);
        pair(2, ent.blockName);
        pair(10, ent.position.x);
        pair(20, ent.position.y);
        pair(30, ent.elevation || 0);
        pair(41, ent.scaleX);
        pair(42, ent.scaleY);
        pair(43, 1);
        pair(50, radToDeg(ent.rotation));
        break;
      case 'table': {
        const w = ent.cols * ent.colWidth;
        const h = ent.rows * ent.rowHeight;
        for (let r = 0; r <= ent.rows; r++) {
          pair(0, 'LINE');
          emitCommon(ent);
          pair(10, ent.position.x);
          pair(20, ent.position.y - r * ent.rowHeight);
          pair(11, ent.position.x + w);
          pair(21, ent.position.y - r * ent.rowHeight);
        }
        for (let c = 0; c <= ent.cols; c++) {
          pair(0, 'LINE');
          emitCommon(ent);
          pair(10, ent.position.x + c * ent.colWidth);
          pair(20, ent.position.y);
          pair(11, ent.position.x + c * ent.colWidth);
          pair(21, ent.position.y - h);
        }
        for (let r = 0; r < ent.rows; r++) {
          for (let c = 0; c < ent.cols; c++) {
            const txt = ent.cells[r]?.[c];
            if (txt) {
              pair(0, 'TEXT');
              emitCommon(ent);
              pair(10, ent.position.x + c * ent.colWidth + 3);
              pair(20, ent.position.y - (r + 0.72) * ent.rowHeight);
              pair(40, ent.textHeight);
              pair(1, txt);
            }
          }
        }
        break;
      }
      case 'dimension': {
        pair(0, 'LINE');
        emitCommon(ent);
        pair(10, ent.p1.x);
        pair(20, ent.p1.y);
        pair(11, ent.p2.x);
        pair(21, ent.p2.y);
        pair(0, 'TEXT');
        emitCommon(ent);
        pair(10, ent.textPosition.x);
        pair(20, ent.textPosition.y);
        pair(40, ent.textHeight);
        const val = Math.hypot(ent.p2.x - ent.p1.x, ent.p2.y - ent.p1.y).toFixed(2);
        pair(1, ent.textOverride || val);
        break;
      }
      case 'leader':
        emitPoly(ent, ent.points, false);
        if (ent.text && ent.points.length > 0) {
          const last = ent.points[ent.points.length - 1];
          pair(0, 'TEXT');
          emitCommon(ent);
          pair(10, last.x + 2);
          pair(20, last.y);
          pair(40, ent.textHeight);
          pair(1, ent.text);
        }
        break;
      default:
        break;
    }
  };

  // BLOCKS SECTION
  pair(0, 'SECTION');
  pair(2, 'BLOCKS');
  for (const blk of Object.values(doc.blocks)) {
    pair(0, 'BLOCK');
    pair(8, '0');
    pair(2, blk.name);
    pair(70, 0);
    pair(10, blk.basePoint.x);
    pair(20, blk.basePoint.y);
    pair(30, 0);
    pair(3, blk.name);
    for (const sub of blk.entities) {
      emitEntity(sub);
    }
    pair(0, 'ENDBLK');
    pair(8, '0');
  }
  pair(0, 'ENDSEC');

  // ENTITIES SECTION
  pair(0, 'SECTION');
  pair(2, 'ENTITIES');
  for (const ent of doc.entities) {
    emitEntity(ent);
  }
  pair(0, 'ENDSEC');
  pair(0, 'EOF');
  return lines.join('\r\n');
}

// Parse one DXF entity starting at pairs[startIdx] where pairs[startIdx].code === 0
function parseDxfEntityAt(
  pairs: { code: number; val: string }[],
  startIdx: number
): { entity: CadEntity | null; nextIdx: number } {
  const etype = pairs[startIdx].val.toUpperCase();
  let i = startIdx + 1;
  const fields: { code: number; val: string }[] = [];
  while (i < pairs.length && pairs[i].code !== 0) {
    fields.push(pairs[i]);
    i++;
  }
  const getStr = (c: number, def = '') => fields.find((f) => f.code === c)?.val ?? def;
  const getNum = (c: number, def = 0) => {
    const s = fields.find((f) => f.code === c)?.val;
    const n = s !== undefined ? parseFloat(s) : NaN;
    return Number.isNaN(n) ? def : n;
  };

  const layer = getStr(8, '0');
  const aci = getNum(62, 256);
  const color = aci === 256 ? 'ByLayer' : aciToHex(aci);
  const ltRaw = getStr(6, '').toUpperCase();
  const lineType = (VALID_LINETYPES.has(ltRaw as any) ? ltRaw : 'ByLayer') as CadEntity['lineType'];
  const base = { layer, color, lineType, lineTypeScale: 1, lineWeight: -1 };

  if (etype === 'LINE') {
    return {
      entity: { ...base, id: genId('line'), type: 'line', start: { x: getNum(10), y: getNum(20) }, end: { x: getNum(11), y: getNum(21) } },
      nextIdx: i,
    };
  }
  if (etype === 'CIRCLE') {
    return {
      entity: { ...base, id: genId('circle'), type: 'circle', center: { x: getNum(10), y: getNum(20) }, radius: Math.max(0.01, getNum(40, 10)) },
      nextIdx: i,
    };
  }
  if (etype === 'ARC') {
    return {
      entity: {
        ...base, id: genId('arc'), type: 'arc',
        center: { x: getNum(10), y: getNum(20) },
        radius: Math.max(0.01, getNum(40, 10)),
        startAngle: degToRad(getNum(50, 0)),
        endAngle: degToRad(getNum(51, 90)),
      },
      nextIdx: i,
    };
  }
  if (etype === 'LWPOLYLINE') {
    const pts: Point2D[] = [];
    const bulges: number[] = [];
    let curX: number | null = null;
    for (const f of fields) {
      if (f.code === 10) {
        curX = parseFloat(f.val);
      } else if (f.code === 20 && curX !== null) {
        pts.push({ x: curX, y: parseFloat(f.val) || 0 });
        bulges.push(0);
        curX = null;
      } else if (f.code === 42 && bulges.length > 0) {
        bulges[bulges.length - 1] = parseFloat(f.val) || 0;
      }
    }
    const closed = (getNum(70, 0) & 1) !== 0;
    const hasBulge = bulges.some((b) => Math.abs(b) > 1e-6);
    return {
      entity: pts.length >= 2
        ? { ...base, id: genId('polyline'), type: 'polyline', points: pts, closed, bulges: hasBulge ? bulges : undefined }
        : null,
      nextIdx: i,
    };
  }
  if (etype === 'POLYLINE') {
    const closed = (getNum(70, 0) & 1) !== 0;
    const pts: Point2D[] = [];
    const bulges: number[] = [];
    while (i < pairs.length) {
      if (pairs[i].code === 0 && pairs[i].val.toUpperCase() === 'VERTEX') {
        i++;
        let vx = 0, vy = 0, vb = 0;
        while (i < pairs.length && pairs[i].code !== 0) {
          if (pairs[i].code === 10) vx = parseFloat(pairs[i].val) || 0;
          else if (pairs[i].code === 20) vy = parseFloat(pairs[i].val) || 0;
          else if (pairs[i].code === 42) vb = parseFloat(pairs[i].val) || 0;
          i++;
        }
        pts.push({ x: vx, y: vy });
        bulges.push(vb);
      } else if (pairs[i].code === 0 && pairs[i].val.toUpperCase() === 'SEQEND') {
        i++;
        while (i < pairs.length && pairs[i].code !== 0) i++;
        break;
      } else {
        break;
      }
    }
    const hasBulge = bulges.some((b) => Math.abs(b) > 1e-6);
    return {
      entity: pts.length >= 2
        ? { ...base, id: genId('polyline'), type: 'polyline', points: pts, closed, bulges: hasBulge ? bulges : undefined }
        : null,
      nextIdx: i,
    };
  }
  if (etype === 'TEXT' || etype === 'MTEXT') {
    const rawText = getStr(1, '').replace(/\\P/g, '\n');
    return {
      entity: {
        ...base,
        id: genId('text'),
        type: etype === 'MTEXT' ? 'mtext' : 'text',
        position: { x: getNum(10), y: getNum(20) },
        content: rawText,
        height: Math.max(1, getNum(40, 10)),
        width: Math.max(80, rawText.length * 10),
        rotation: degToRad(getNum(50, 0)),
      } as CadEntity,
      nextIdx: i,
    };
  }
  if (etype === 'POINT') {
    return { entity: { ...base, id: genId('point'), type: 'point', position: { x: getNum(10), y: getNum(20) } }, nextIdx: i };
  }
  if (etype === 'ELLIPSE') {
    const cx = getNum(10), cy = getNum(20);
    const mx = getNum(11, 10), my = getNum(21, 0);
    const ratio = getNum(40, 0.5);
    const rx = Math.hypot(mx, my);
    return {
      entity: {
        ...base, id: genId('ellipse'), type: 'ellipse',
        center: { x: cx, y: cy }, rx: Math.max(0.1, rx), ry: Math.max(0.1, rx * ratio), rotation: Math.atan2(my, mx),
      },
      nextIdx: i,
    };
  }
  if (etype === 'INSERT') {
    return {
      entity: {
        ...base,
        id: genId('blk'),
        type: 'block_ref',
        blockName: getStr(2, 'BLOCCO'),
        position: { x: getNum(10), y: getNum(20) },
        scaleX: getNum(41, 1) || 1,
        scaleY: getNum(42, 1) || 1,
        rotation: degToRad(getNum(50, 0)),
      },
      nextIdx: i,
    };
  }
  if (etype === 'SPLINE') {
    const pts: Point2D[] = [];
    let cx: number | null = null;
    for (const f of fields) {
      if (f.code === 10 || f.code === 11) cx = parseFloat(f.val);
      else if ((f.code === 20 || f.code === 21) && cx !== null) {
        pts.push({ x: cx, y: parseFloat(f.val) || 0 });
        cx = null;
      }
    }
    const closed = (getNum(70, 0) & 1) !== 0;
    return {
      entity: pts.length >= 2 ? { ...base, id: genId('spline'), type: 'spline', controlPoints: pts, closed } : null,
      nextIdx: i,
    };
  }
  if (etype === 'SOLID' || etype === '3DFACE') {
    const pts: Point2D[] = [
      { x: getNum(10), y: getNum(20) },
      { x: getNum(11), y: getNum(21) },
      { x: getNum(12), y: getNum(22) },
    ];
    const p4x = fields.find((f) => f.code === 13);
    const p4y = fields.find((f) => f.code === 23);
    if (p4x && p4y) {
      const p4 = { x: parseFloat(p4x.val) || 0, y: parseFloat(p4y.val) || 0 };
      if (Math.hypot(p4.x - pts[2].x, p4.y - pts[2].y) > 1e-4) pts.push(p4);
    }
    return { entity: { ...base, id: genId('poly'), type: 'polyline', points: pts, closed: true }, nextIdx: i };
  }
  if (etype === 'HATCH') {
    const patName = getStr(2, 'ANSI31').toUpperCase();
    const validPatterns: HatchPatternName[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI33', 'ANSI37', 'NET', 'BRICK', 'DOTS', 'HONEY', 'CROSS', 'AR-CONC', 'AR-SAND', 'AR-HBONE', 'EARTH', 'GRATE'];
    const pattern: HatchPatternName = validPatterns.includes(patName as HatchPatternName) ? (patName as HatchPatternName) : 'ANSI31';
    const boundary: Point2D[] = [];
    let hx: number | null = null;
    for (const f of fields) {
      if (f.code === 10) hx = parseFloat(f.val);
      else if (f.code === 20 && hx !== null) {
        boundary.push({ x: hx, y: parseFloat(f.val) || 0 });
        hx = null;
      }
    }
    return {
      entity: boundary.length >= 3
        ? { ...base, id: genId('hatch'), type: 'hatch', boundary, pattern, scale: Math.max(1, getNum(41, 10)), angle: getNum(52, 45), opacity: 0.65 }
        : null,
      nextIdx: i,
    };
  }
  if (etype === 'DIMENSION') {
    const p1 = { x: getNum(13, getNum(10)), y: getNum(23, getNum(20)) };
    const p2 = { x: getNum(14, getNum(10) + 50), y: getNum(24, getNum(20)) };
    const tp = { x: getNum(11, (p1.x + p2.x) / 2), y: getNum(21, (p1.y + p2.y) / 2 + 20) };
    const ovr = getStr(1, '');
    return {
      entity: {
        ...base,
        id: genId('dim'),
        type: 'dimension',
        kind: 'linear',
        p1,
        p2,
        textPosition: tp,
        textOverride: ovr || undefined,
        textHeight: 12,
        arrowSize: 8,
      },
      nextIdx: i,
    };
  }

  return { entity: null, nextIdx: i };
}

// Import ASCII DXF file into entities + layers + blocks
export function importFromDXF(dxfText: string): {
  entities: CadEntity[];
  layers: Layer[];
  blocks: Record<string, BlockDefinition>;
} {
  const rawLines = dxfText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const pairs: { code: number; val: string }[] = [];
  for (let i = 0; i + 1 < rawLines.length; i += 2) {
    const code = parseInt(rawLines[i].trim(), 10);
    if (!Number.isNaN(code)) {
      pairs.push({ code, val: rawLines[i + 1].trim() });
    }
  }

  const layers: Layer[] = [];
  const entities: CadEntity[] = [];
  const blocks: Record<string, BlockDefinition> = {};

  let section = '';
  let i = 0;
  while (i < pairs.length) {
    const p = pairs[i];
    if (p.code === 0 && p.val.toUpperCase() === 'SECTION') {
      if (i + 1 < pairs.length && pairs[i + 1].code === 2) {
        section = pairs[i + 1].val.toUpperCase();
        i += 2;
        continue;
      }
    }
    if (p.code === 0 && p.val.toUpperCase() === 'ENDSEC') {
      section = '';
      i++;
      continue;
    }

    if (section === 'TABLES' && p.code === 0 && p.val.toUpperCase() === 'LAYER') {
      let name = '0';
      let aci = 7;
      let flags = 0;
      let ltype = 'CONTINUOUS';
      i++;
      while (i < pairs.length && pairs[i].code !== 0) {
        const { code, val } = pairs[i];
        if (code === 2) name = val;
        else if (code === 62) aci = parseInt(val, 10) || 7;
        else if (code === 70) flags = parseInt(val, 10) || 0;
        else if (code === 6) ltype = val.toUpperCase();
        i++;
      }
      if (name && !layers.some((l) => l.name === name)) {
        layers.push({
          id: genId('layer'),
          name,
          color: aciToHex(Math.abs(aci)) === 'ByLayer' ? '#FFFFFF' : aciToHex(Math.abs(aci)),
          aciColor: Math.abs(aci),
          on: aci >= 0,
          frozen: (flags & 1) !== 0,
          locked: (flags & 4) !== 0,
          lineType: (VALID_LINETYPES.has(ltype as any) ? ltype : 'CONTINUOUS') as Layer['lineType'],
          lineWeight: 0.25,
          transparency: 0,
          plot: true,
        });
      }
      continue;
    }

    if (section === 'BLOCKS' && p.code === 0 && p.val.toUpperCase() === 'BLOCK') {
      i++;
      let bName = '';
      let bx = 0, by = 0;
      while (i < pairs.length && pairs[i].code !== 0) {
        if (pairs[i].code === 2) bName = pairs[i].val;
        else if (pairs[i].code === 10) bx = parseFloat(pairs[i].val) || 0;
        else if (pairs[i].code === 20) by = parseFloat(pairs[i].val) || 0;
        i++;
      }
      const blkEntities: CadEntity[] = [];
      while (i < pairs.length) {
        if (pairs[i].code === 0 && pairs[i].val.toUpperCase() === 'ENDBLK') {
          i++;
          while (i < pairs.length && pairs[i].code !== 0) i++;
          break;
        }
        if (pairs[i].code === 0 && pairs[i].val.toUpperCase() === 'ENDSEC') break;
        if (pairs[i].code === 0) {
          const parsed = parseDxfEntityAt(pairs, i);
          if (parsed.entity) blkEntities.push(parsed.entity);
          i = Math.max(i + 1, parsed.nextIdx);
        } else {
          i++;
        }
      }
      if (bName && !bName.startsWith('*') && blkEntities.length > 0) {
        blocks[bName] = {
          name: bName,
          description: `Blocco DXF importato (${blkEntities.length} entità)`,
          category: 'Utente',
          basePoint: { x: bx, y: by },
          entities: blkEntities,
        };
      }
      continue;
    }

    if (section === 'ENTITIES' && p.code === 0) {
      const parsed = parseDxfEntityAt(pairs, i);
      if (parsed.entity) entities.push(parsed.entity);
      i = Math.max(i + 1, parsed.nextIdx);
      continue;
    }

    i++;
  }

  if (!layers.some((l) => l.name === '0')) {
    layers.unshift({
      id: 'layer_0',
      name: '0',
      color: '#FFFFFF',
      aciColor: 7,
      on: true,
      frozen: false,
      locked: false,
      lineType: 'CONTINUOUS',
      lineWeight: 0.25,
      transparency: 0,
      plot: true,
    });
  }
  for (const e of entities) {
    if (!layers.some((l) => l.name === e.layer)) {
      layers.push({
        id: genId('layer'),
        name: e.layer,
        color: '#FFFFFF',
        aciColor: 7,
        on: true,
        frozen: false,
        locked: false,
        lineType: 'CONTINUOUS',
        lineWeight: 0.25,
        transparency: 0,
        plot: true,
      });
    }
  }

  return { entities, layers, blocks };
}

export interface SvgExportOptions {
  monochrome?: boolean;
  grayscale?: boolean;
  background?: string;
  padding?: number;
  paperWidthMm?: number;
  paperHeightMm?: number;
  fixedScale?: number;
  respectPlotFlag?: boolean;
}

function toGrayscaleHex(hex: string, darkContrast: boolean): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#333333';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  let lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  if (darkContrast && lum > 205) lum = 45;
  const hx = lum.toString(16).padStart(2, '0');
  return `#${hx}${hx}${hx}`;
}

// Export CadDocument to clean vector SVG (supports CTB, paper dimensions, scale, blocks, tables, hatch patterns)
export function exportToSVG(doc: CadDocument, options: SvgExportOptions = {}): string {
  const {
    monochrome = false,
    grayscale = false,
    background = '#FFFFFF',
    padding = 20,
    paperWidthMm,
    paperHeightMm,
    fixedScale,
    respectPlotFlag = true,
  } = options;

  const bb = getDocumentBBox(doc.entities, doc.blocks) || { minX: 0, minY: 0, maxX: 500, maxY: 300 };
  const cx = (bb.minX + bb.maxX) / 2;
  const cy = (bb.minY + bb.maxY) / 2;
  const rawW = Math.max(10, bb.maxX - bb.minX);
  const rawH = Math.max(10, bb.maxY - bb.minY);
  const pad = Math.max(rawW, rawH) * 0.06 + padding;

  let viewW = rawW + pad * 2;
  let viewH = rawH + pad * 2;

  if (paperWidthMm && paperHeightMm) {
    if (fixedScale && fixedScale > 0) {
      viewW = paperWidthMm / fixedScale;
      viewH = paperHeightMm / fixedScale;
    } else {
      const targetAspect = paperWidthMm / paperHeightMm;
      if (viewW / viewH > targetAspect) {
        viewH = viewW / targetAspect;
      } else {
        viewW = viewH * targetAspect;
      }
    }
  }

  const minX = cx - viewW / 2;
  const maxY = cy + viewH / 2;
  const flipY = (y: number) => maxY - (y - (cy - viewH / 2));
  const strokeBase = Math.max(viewW, viewH) * 0.0016;

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const dashFor = (lt: string) => {
    const s = strokeBase * 4;
    if (lt === 'DASHED') return `${s * 3},${s * 1.5}`;
    if (lt === 'DASHED2') return `${s * 1.6},${s * 0.9}`;
    if (lt === 'CENTER') return `${s * 5},${s * 1.2},${s * 1.2},${s * 1.2}`;
    if (lt === 'CENTER2') return `${s * 3},${s * 0.8},${s * 0.8},${s * 0.8}`;
    if (lt === 'HIDDEN') return `${s * 1.8},${s}`;
    if (lt === 'HIDDEN2') return `${s * 1.1},${s * 0.7}`;
    if (lt === 'DASHDOT') return `${s * 3.5},${s},${s * 0.7},${s}`;
    if (lt === 'PHANTOM') return `${s * 5},${s},${s},${s},${s},${s}`;
    if (lt === 'BORDER') return `${s * 4.5},${s},${s * 4.5},${s},${s * 0.6},${s}`;
    if (lt === 'DIVIDE') return `${s * 4},${s},${s * 0.6},${s},${s * 0.6},${s}`;
    if (lt === 'DOT') return `${s * 0.7},${s * 1.4}`;
    return '';
  };

  const defs: string[] = [];
  const elems: string[] = [];
  elems.push(`<rect x="${minX}" y="${flipY(maxY)}" width="${viewW}" height="${viewH}" fill="${background}" />`);

  let clipCounter = 0;

  const emitEntSvg = (ent: CadEntity, colorOverride?: string) => {
    const layer = doc.layers.find((l) => l.name === ent.layer);
    if (respectPlotFlag && layer && !layer.plot) return;

    let col = colorOverride || resolveEntityColor(ent, doc.layers);
    if (monochrome) col = '#111111';
    else if (grayscale) col = toGrayscaleHex(col, background === '#FFFFFF');
    else if (background === '#FFFFFF' && col.toUpperCase() === '#FFFFFF') col = '#111111';

    const lt = resolveEntityLineType(ent, doc.layers);
    const lw = Math.max(0.5, resolveEntityLineWeight(ent, doc.layers) * 2.5) * strokeBase;
    const dash = dashFor(lt);
    const dashAttr = dash ? ` stroke-dasharray="${dash}"` : '';

    switch (ent.type) {
      case 'line':
        elems.push(
          `<line x1="${ent.start.x}" y1="${flipY(ent.start.y)}" x2="${ent.end.x}" y2="${flipY(ent.end.y)}" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`
        );
        break;
      case 'polyline': {
        const pts = samplePolyline(ent, 16);
        const ptsStr = pts.map((p) => `${p.x},${flipY(p.y)}`).join(' ');
        const tag = ent.closed && !ent.bulges ? 'polygon' : 'polyline';
        elems.push(`<${tag} points="${ptsStr}" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`);
        break;
      }
      case 'rectangle': {
        const ptsStr = getRectangleCorners(ent).map((p) => `${p.x},${flipY(p.y)}`).join(' ');
        elems.push(`<polygon points="${ptsStr}" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`);
        break;
      }
      case 'polygon': {
        const ptsStr = getPolygonVertices(ent).map((p) => `${p.x},${flipY(p.y)}`).join(' ');
        elems.push(`<polygon points="${ptsStr}" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`);
        break;
      }
      case 'circle':
        elems.push(`<circle cx="${ent.center.x}" cy="${flipY(ent.center.y)}" r="${ent.radius}" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`);
        break;
      case 'arc': {
        const x1 = ent.center.x + ent.radius * Math.cos(ent.startAngle);
        const y1 = flipY(ent.center.y + ent.radius * Math.sin(ent.startAngle));
        const x2 = ent.center.x + ent.radius * Math.cos(ent.endAngle);
        const y2 = flipY(ent.center.y + ent.radius * Math.sin(ent.endAngle));
        let sweep = (ent.endAngle - ent.startAngle) % (Math.PI * 2);
        if (sweep <= 0) sweep += Math.PI * 2;
        const large = sweep > Math.PI ? 1 : 0;
        elems.push(`<path d="M ${x1} ${y1} A ${ent.radius} ${ent.radius} 0 ${large} 0 ${x2} ${y2}" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`);
        break;
      }
      case 'ellipse':
        elems.push(
          `<ellipse cx="${ent.center.x}" cy="${flipY(ent.center.y)}" rx="${ent.rx}" ry="${ent.ry}" transform="rotate(${-radToDeg(ent.rotation)} ${ent.center.x} ${flipY(ent.center.y)})" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`
        );
        break;
      case 'spline': {
        const ptsStr = sampleSpline(ent.controlPoints, ent.closed).map((p) => `${p.x},${flipY(p.y)}`).join(' ');
        elems.push(`<polyline points="${ptsStr}" stroke="${col}" stroke-width="${lw}"${dashAttr} fill="none" />`);
        break;
      }
      case 'point': {
        const r = strokeBase * 2.5;
        const px = ent.position.x, py = flipY(ent.position.y);
        elems.push(`<circle cx="${px}" cy="${py}" r="${r}" stroke="${col}" stroke-width="${lw}" fill="none" />`);
        elems.push(`<line x1="${px - r * 1.6}" y1="${py}" x2="${px + r * 1.6}" y2="${py}" stroke="${col}" stroke-width="${lw}" />`);
        elems.push(`<line x1="${px}" y1="${py - r * 1.6}" x2="${px}" y2="${py + r * 1.6}" stroke="${col}" stroke-width="${lw}" />`);
        break;
      }
      case 'hatch': {
        if (ent.boundary.length < 3) break;
        const ptsStr = ent.boundary.map((p) => `${p.x},${flipY(p.y)}`).join(' ');
        if (ent.pattern === 'SOLID') {
          elems.push(`<polygon points="${ptsStr}" fill="${col}" fill-opacity="${ent.opacity * 0.6}" stroke="${col}" stroke-width="${lw * 0.5}" />`);
        } else {
          const cid = `hc_${clipCounter++}`;
          const pid = `hp_${clipCounter}`;
          const step = Math.max(4, ent.scale);
          const sw = lw * 0.65;
          defs.push(`<clipPath id="${cid}"><polygon points="${ptsStr}" /></clipPath>`);
          let patW = step;
          let patH = step;
          let patBody = `<line x1="0" y1="0" x2="0" y2="${step}" stroke="${col}" stroke-width="${sw}" />`;
          let rotDeg = ent.angle || 45;

          switch (ent.pattern) {
            case 'ANSI32':
              patBody = `<line x1="0" y1="0" x2="0" y2="${step}" stroke="${col}" stroke-width="${sw}" /><line x1="${step * 0.28}" y1="0" x2="${step * 0.28}" y2="${step}" stroke="${col}" stroke-width="${sw}" />`;
              break;
            case 'ANSI33':
              patBody = `<line x1="0" y1="0" x2="0" y2="${step}" stroke="${col}" stroke-width="${sw}" /><line x1="${step * 0.5}" y1="${step * 0.15}" x2="${step * 0.5}" y2="${step * 0.75}" stroke="${col}" stroke-width="${sw}" />`;
              break;
            case 'ANSI37':
            case 'CROSS':
              patBody = `<line x1="0" y1="0" x2="0" y2="${step}" stroke="${col}" stroke-width="${sw}" /><line x1="0" y1="0" x2="${step}" y2="0" stroke="${col}" stroke-width="${sw}" />`;
              break;
            case 'NET':
              patBody = `<line x1="0" y1="0" x2="0" y2="${step}" stroke="${col}" stroke-width="${sw}" /><line x1="0" y1="0" x2="${step}" y2="0" stroke="${col}" stroke-width="${sw}" />`;
              rotDeg = ent.angle || 0;
              break;
            case 'BRICK':
              patW = step * 2;
              patH = step * 2;
              patBody = `<line x1="0" y1="0" x2="${patW}" y2="0" stroke="${col}" stroke-width="${sw}" /><line x1="0" y1="${step}" x2="${patW}" y2="${step}" stroke="${col}" stroke-width="${sw}" /><line x1="0" y1="0" x2="0" y2="${step}" stroke="${col}" stroke-width="${sw}" /><line x1="${step}" y1="${step}" x2="${step}" y2="${patH}" stroke="${col}" stroke-width="${sw}" />`;
              rotDeg = ent.angle || 0;
              break;
            case 'DOTS':
              patBody = `<circle cx="${step * 0.5}" cy="${step * 0.5}" r="${Math.max(0.6, sw * 1.15)}" fill="${col}" />`;
              break;
            case 'AR-SAND':
              patW = step * 1.5;
              patH = step * 1.5;
              patBody = `<circle cx="${step * 0.3}" cy="${step * 0.35}" r="${Math.max(0.5, sw * 0.9)}" fill="${col}" /><circle cx="${step * 1.1}" cy="${step * 0.65}" r="${Math.max(0.5, sw * 0.9)}" fill="${col}" /><circle cx="${step * 0.6}" cy="${step * 1.2}" r="${Math.max(0.5, sw * 0.9)}" fill="${col}" />`;
              break;
            case 'AR-CONC':
              patW = step * 2.4;
              patH = step * 2.4;
              patBody = `<polygon points="${step * 0.4},${step * 0.5} ${step * 1.2},${step * 0.35} ${step * 0.85},${step * 1.15}" fill="none" stroke="${col}" stroke-width="${sw * 0.9}" /><circle cx="${step * 1.8}" cy="${step * 1.6}" r="${Math.max(0.6, sw)}" fill="${col}" /><circle cx="${step * 0.5}" cy="${step * 1.9}" r="${Math.max(0.5, sw * 0.85)}" fill="${col}" />`;
              break;
            case 'HONEY':
              patW = step * 1.732;
              patH = step * 2;
              patBody = `<polyline points="0,${step * 0.5} ${patW * 0.5},0 ${patW},${step * 0.5} ${patW},${step * 1.5} ${patW * 0.5},${patH} 0,${step * 1.5}" fill="none" stroke="${col}" stroke-width="${sw}" />`;
              rotDeg = ent.angle || 0;
              break;
            case 'AR-HBONE':
              patW = step * 2;
              patH = step * 2;
              patBody = `<polyline points="0,${step} ${step},0 ${patW},${step}" fill="none" stroke="${col}" stroke-width="${sw}" /><polyline points="0,${patH} ${step},${step} ${patW},${patH}" fill="none" stroke="${col}" stroke-width="${sw}" />`;
              break;
            case 'EARTH':
              patW = step * 2.4;
              patH = step * 2.4;
              patBody = `<line x1="${step * 0.2}" y1="${step * 0.4}" x2="${step * 1.0}" y2="${step * 0.4}" stroke="${col}" stroke-width="${sw}" /><line x1="${step * 0.2}" y1="${step * 0.75}" x2="${step * 1.0}" y2="${step * 0.75}" stroke="${col}" stroke-width="${sw}" /><line x1="${step * 1.5}" y1="${step * 0.2}" x2="${step * 1.5}" y2="${step * 1.0}" stroke="${col}" stroke-width="${sw}" /><line x1="${step * 1.85}" y1="${step * 0.2}" x2="${step * 1.85}" y2="${step * 1.0}" stroke="${col}" stroke-width="${sw}" /><line x1="${step * 1.3}" y1="${step * 1.6}" x2="${step * 2.1}" y2="${step * 1.6}" stroke="${col}" stroke-width="${sw}" /><line x1="${step * 0.5}" y1="${step * 1.3}" x2="${step * 0.5}" y2="${step * 2.1}" stroke="${col}" stroke-width="${sw}" />`;
              break;
            case 'GRATE':
              patW = step * 0.85;
              patH = step * 0.85;
              patBody = `<line x1="0" y1="0" x2="${patW}" y2="0" stroke="${col}" stroke-width="${sw}" /><line x1="0" y1="0" x2="0" y2="${patH}" stroke="${col}" stroke-width="${sw}" /><line x1="0" y1="0" x2="${patW}" y2="${patH}" stroke="${col}" stroke-width="${sw * 0.7}" />`;
              rotDeg = ent.angle || 0;
              break;
          }
          defs.push(`<pattern id="${pid}" width="${patW}" height="${patH}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotDeg})">${patBody}</pattern>`);
          elems.push(`<polygon points="${ptsStr}" fill="url(#${pid})" fill-opacity="${ent.opacity}" clip-path="url(#${cid})" stroke="${col}" stroke-width="${lw * 0.45}" />`);
        }
        break;
      }
      case 'text':
      case 'mtext': {
        const rows = ent.content.split('\n');
        const sy = flipY(ent.position.y);
        rows.forEach((rTxt, idx) => {
          elems.push(
            `<text x="${ent.position.x}" y="${sy + idx * ent.height * 1.25}" fill="${col}" font-family="Segoe UI, Arial, sans-serif" font-size="${ent.height * 1.15}" transform="rotate(${-radToDeg(ent.rotation)} ${ent.position.x} ${sy})">${esc(rTxt)}</text>`
          );
        });
        break;
      }
      case 'dimension': {
        const dVal = Math.hypot(ent.p2.x - ent.p1.x, ent.p2.y - ent.p1.y).toFixed(2);
        elems.push(`<line x1="${ent.p1.x}" y1="${flipY(ent.p1.y)}" x2="${ent.p2.x}" y2="${flipY(ent.p2.y)}" stroke="${col}" stroke-width="${lw * 0.8}" />`);
        elems.push(`<text x="${ent.textPosition.x}" y="${flipY(ent.textPosition.y)}" fill="${col}" text-anchor="middle" font-family="Segoe UI, Arial" font-size="${ent.textHeight * 1.1}">${esc(ent.textOverride || dVal)}</text>`);
        break;
      }
      case 'leader': {
        if (ent.points.length < 2) break;
        const ptsStr = ent.points.map((p) => `${p.x},${flipY(p.y)}`).join(' ');
        elems.push(`<polyline points="${ptsStr}" stroke="${col}" stroke-width="${lw * 0.85}" fill="none" />`);
        const last = ent.points[ent.points.length - 1];
        elems.push(`<text x="${last.x + 4}" y="${flipY(last.y)}" fill="${col}" font-family="Segoe UI, Arial" font-size="${ent.textHeight * 1.1}">${esc(ent.text)}</text>`);
        break;
      }
      case 'revcloud': {
        if (ent.points.length < 2) break;
        const ptsStr = ent.points.map((p) => `${p.x},${flipY(p.y)}`).join(' ');
        elems.push(`<polygon points="${ptsStr}" stroke="${col}" stroke-width="${lw}" stroke-dasharray="${strokeBase * 5},${strokeBase * 2}" fill="none" />`);
        break;
      }
      case 'table': {
        const w = ent.cols * ent.colWidth;
        const h = ent.rows * ent.rowHeight;
        const tx = ent.position.x;
        const ty = flipY(ent.position.y);
        elems.push(`<rect x="${tx}" y="${ty}" width="${w}" height="${h}" stroke="${col}" stroke-width="${lw}" fill="none" />`);
        for (let r = 1; r < ent.rows; r++) {
          elems.push(`<line x1="${tx}" y1="${ty + r * ent.rowHeight}" x2="${tx + w}" y2="${ty + r * ent.rowHeight}" stroke="${col}" stroke-width="${lw * 0.7}" />`);
        }
        for (let c = 1; c < ent.cols; c++) {
          elems.push(`<line x1="${tx + c * ent.colWidth}" y1="${ty}" x2="${tx + c * ent.colWidth}" y2="${ty + h}" stroke="${col}" stroke-width="${lw * 0.7}" />`);
        }
        for (let r = 0; r < ent.rows; r++) {
          for (let c = 0; c < ent.cols; c++) {
            const val = ent.cells[r]?.[c] || '';
            if (val) {
              elems.push(
                `<text x="${tx + (c + 0.5) * ent.colWidth}" y="${ty + (r + 0.65) * ent.rowHeight}" fill="${col}" text-anchor="middle" font-family="Segoe UI, Arial" font-size="${ent.textHeight}">${esc(val)}</text>`
              );
            }
          }
        }
        break;
      }
      case 'block_ref': {
        const def = doc.blocks[ent.blockName];
        if (!def) break;
        for (const sub of def.entities) {
          // Simple inline transform via math helper on sub-entity
          const scX = ent.scaleX, scY = ent.scaleY;
          const cosR = Math.cos(ent.rotation), sinR = Math.sin(ent.rotation);
          const xf = (p: Point2D): Point2D => {
            const lx = (p.x - def.basePoint.x) * scX;
            const ly = (p.y - def.basePoint.y) * scY;
            return { x: ent.position.x + lx * cosR - ly * sinR, y: ent.position.y + lx * sinR + ly * cosR };
          };
          const subColor = sub.color === 'ByLayer' && sub.layer === '0' && ent.color !== 'ByLayer' ? ent.color : undefined;
          if (sub.type === 'line') emitEntSvg({ ...sub, start: xf(sub.start), end: xf(sub.end) }, subColor);
          else if (sub.type === 'rectangle') {
            const pts = getRectangleCorners(sub).map(xf);
            emitEntSvg({ ...sub, type: 'polyline', points: pts, closed: true } as any, subColor);
          } else if (sub.type === 'circle') {
            emitEntSvg({ ...sub, center: xf(sub.center), radius: sub.radius * Math.abs(scX) }, subColor);
          } else if (sub.type === 'arc') {
            emitEntSvg(
              {
                ...sub,
                center: xf(sub.center),
                radius: sub.radius * Math.abs(scX),
                startAngle: sub.startAngle + ent.rotation,
                endAngle: sub.endAngle + ent.rotation,
              },
              subColor
            );
          } else if (sub.type === 'polyline') {
            emitEntSvg({ ...sub, points: sub.points.map(xf) }, subColor);
          } else if (sub.type === 'polygon') {
            emitEntSvg({ ...sub, center: xf(sub.center), radius: sub.radius * Math.abs(scX), rotation: sub.rotation + ent.rotation }, subColor);
          } else if (sub.type === 'text') {
            emitEntSvg({ ...sub, position: xf(sub.position), rotation: sub.rotation + ent.rotation }, subColor);
          }
        }
        break;
      }
      case 'solid3d': {
        if (ent.primitive === 'box') {
          const hw = ent.size.x / 2, hh = ent.size.y / 2;
          elems.push(`<rect x="${ent.position.x - hw}" y="${flipY(ent.position.y + hh)}" width="${ent.size.x}" height="${ent.size.y}" stroke="${col}" stroke-width="${lw}" fill="${col}" fill-opacity="0.12" />`);
        } else {
          elems.push(`<circle cx="${ent.position.x}" cy="${flipY(ent.position.y)}" r="${Math.max(2, ent.size.x)}" stroke="${col}" stroke-width="${lw}" fill="${col}" fill-opacity="0.12" />`);
        }
        break;
      }
      default:
        break;
    }
  };

  for (const ent of doc.entities) {
    if (!isEntityVisible(ent, doc.layers)) continue;
    emitEntSvg(ent);
  }

  const defsBlock = defs.length > 0 ? `<defs>\n${defs.join('\n')}\n</defs>\n` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${flipY(maxY)} ${viewW} ${viewH}" width="1200" height="${Math.round((1200 * viewH) / viewW)}">\n${defsBlock}${elems.join('\n')}\n</svg>`;
}

// Export ALL 3D solids (box, cylinder, sphere, cone, pyramid, torus, extrude, CSG mesh) to ASCII STL
export function exportToSTL(doc: CadDocument): string {
  const facets: string[] = ['solid openfcad_export'];
  const emitTri = (a: [number, number, number], b: [number, number, number], c: [number, number, number]) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    facets.push(`  facet normal ${(nx / len).toFixed(5)} ${(ny / len).toFixed(5)} ${(nz / len).toFixed(5)}`);
    facets.push('    outer loop');
    facets.push(`      vertex ${a[0].toFixed(4)} ${a[1].toFixed(4)} ${a[2].toFixed(4)}`);
    facets.push(`      vertex ${b[0].toFixed(4)} ${b[1].toFixed(4)} ${b[2].toFixed(4)}`);
    facets.push(`      vertex ${c[0].toFixed(4)} ${c[1].toFixed(4)} ${c[2].toFixed(4)}`);
    facets.push('    endloop');
    facets.push('  endfacet');
  };

  for (const ent of doc.entities) {
    if (ent.type !== 'solid3d') continue;
    const geo = buildThreeGeometryForSolid(ent, 32);
    const pos = geo.getAttribute('position');
    for (let i = 0; i + 2 < pos.count; i += 3) {
      emitTri(
        [pos.getX(i), pos.getY(i), pos.getZ(i)],
        [pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)],
        [pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2)]
      );
    }
    geo.dispose();
  }

  facets.push('endsolid openfcad_export');
  return facets.join('\n');
}
