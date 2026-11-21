import {
  ArcEntity,
  BBox,
  BlockDefinition,
  CadEntity,
  CircleEntity,
  EllipseEntity,
  LineEntity,
  Point2D,
  PolygonEntity,
  PolylineEntity,
  RectangleEntity,
  TableEntity,
  TextEntity,
} from '../types/cad';

export const EPS = 1e-7;
export const TAU = Math.PI * 2;

let idCounter = 1;
export function genId(prefix = 'ent'): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

export function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function mid(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function add(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVec(v: Point2D, s: number): Point2D {
  return { x: v.x * s, y: v.y * s };
}

export function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x;
}

export function normalize(v: Point2D): Point2D {
  const len = Math.hypot(v.x, v.y);
  if (len < EPS) return { x: 1, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function angleBetween(a: Point2D, b: Point2D): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function normAngle(rad: number): number {
  let a = rad % TAU;
  if (a < 0) a += TAU;
  return a;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function rotatePoint(p: Point2D, origin: Point2D, angleRad: number): Point2D {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * c - dy * s,
    y: origin.y + dx * s + dy * c,
  };
}

export function mirrorPoint(p: Point2D, a: Point2D, b: Point2D): Point2D {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < EPS) return { ...p };
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return { x: 2 * projX - p.x, y: 2 * projY - p.y };
}

export function scalePoint(p: Point2D, origin: Point2D, factor: number): Point2D {
  return {
    x: origin.x + (p.x - origin.x) * factor,
    y: origin.y + (p.y - origin.y) * factor,
  };
}

export function projectPointOnLine(p: Point2D, a: Point2D, b: Point2D): { point: Point2D; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < EPS) return { point: { ...a }, t: 0 };
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  return { point: { x: a.x + t * dx, y: a.y + t * dy }, t };
}

export function distPointToSegment(p: Point2D, a: Point2D, b: Point2D): { distance: number; closest: Point2D; t: number } {
  const { t } = projectPointOnLine(p, a, b);
  const ct = Math.max(0, Math.min(1, t));
  const closest = { x: a.x + ct * (b.x - a.x), y: a.y + ct * (b.y - a.y) };
  return { distance: dist(p, closest), closest, t: ct };
}

export function isAngleInArc(angle: number, startAngle: number, endAngle: number): boolean {
  const a = normAngle(angle);
  const s = normAngle(startAngle);
  const e = normAngle(endAngle);
  if (Math.abs(s - e) < EPS) return true;
  if (s < e) return a >= s - 1e-6 && a <= e + 1e-6;
  return a >= s - 1e-6 || a <= e + 1e-6;
}

export function arcSweep(startAngle: number, endAngle: number): number {
  let diff = normAngle(endAngle) - normAngle(startAngle);
  if (diff <= 0) diff += TAU;
  return diff;
}

export function getRectangleCorners(r: Pick<RectangleEntity, 'p1' | 'p2' | 'rotation'>): Point2D[] {
  const raw: Point2D[] = [
    { x: r.p1.x, y: r.p1.y },
    { x: r.p2.x, y: r.p1.y },
    { x: r.p2.x, y: r.p2.y },
    { x: r.p1.x, y: r.p2.y },
  ];
  if (!r.rotation) return raw;
  const c = mid(r.p1, r.p2);
  return raw.map((pt) => rotatePoint(pt, c, r.rotation!));
}

export function getPolygonVertices(p: Pick<PolygonEntity, 'center' | 'radius' | 'sides' | 'rotation' | 'inscribed'>): Point2D[] {
  const n = Math.max(3, Math.round(p.sides));
  const r = p.inscribed ? p.radius : p.radius / Math.cos(Math.PI / n);
  const pts: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const a = p.rotation + (i * TAU) / n;
    pts.push({
      x: p.center.x + r * Math.cos(a),
      y: p.center.y + r * Math.sin(a),
    });
  }
  return pts;
}

export function sampleSpline(controlPoints: Point2D[], closed = false, segmentsPerSpan = 16): Point2D[] {
  if (controlPoints.length < 2) return [...controlPoints];
  if (controlPoints.length === 2) return [...controlPoints];
  const pts = closed
    ? [controlPoints[controlPoints.length - 1], ...controlPoints, controlPoints[0], controlPoints[1]]
    : [controlPoints[0], ...controlPoints, controlPoints[controlPoints.length - 1]];
  const out: Point2D[] = [];
  const count = pts.length - 3;
  for (let i = 0; i < count; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];
    for (let j = 0; j < segmentsPerSpan; j++) {
      const t = j / segmentsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(closed ? out[0] : controlPoints[controlPoints.length - 1]);
  return out;
}

export function sampleEllipse(e: Pick<EllipseEntity, 'center' | 'rx' | 'ry' | 'rotation'>, steps = 64): Point2D[] {
  const c = Math.cos(e.rotation);
  const s = Math.sin(e.rotation);
  const out: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    const lx = e.rx * Math.cos(a);
    const ly = e.ry * Math.sin(a);
    out.push({
      x: e.center.x + lx * c - ly * s,
      y: e.center.y + lx * s + ly * c,
    });
  }
  return out;
}

export function bulgeSegmentToArc(
  p1: Point2D,
  p2: Point2D,
  bulge: number
): { center: Point2D; radius: number; startAngle: number; endAngle: number; ccw: boolean } | null {
  if (Math.abs(bulge) < 1e-6) return null;
  const chord = dist(p1, p2);
  if (chord < EPS) return null;
  const theta = 4 * Math.atan(Math.abs(bulge));
  const radius = chord / (2 * Math.sin(theta / 2));
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const ux = (p2.x - p1.x) / chord;
  const uy = (p2.y - p1.y) / chord;
  const nx = -uy;
  const ny = ux;
  const ccw = bulge > 0;
  // Exact formula: signed offset = chord * (1 - bulge^2) / (4 * bulge)
  const sagittaOffset = (chord * (1 - bulge * bulge)) / (4 * bulge);
  const center = { x: mx + nx * sagittaOffset, y: my + ny * sagittaOffset };
  const startAngle = normAngle(angleBetween(center, p1));
  const endAngle = normAngle(angleBetween(center, p2));
  return { center, radius: Math.abs(radius), startAngle, endAngle, ccw };
}

export function samplePolyline(ent: Pick<PolylineEntity, 'points' | 'closed' | 'bulges'>, stepsPerArc = 16): Point2D[] {
  const pts = ent.points;
  if (pts.length < 2) return [...pts];
  const hasBulge = !!ent.bulges?.some((b) => Math.abs(b) > 1e-6);
  if (!hasBulge) {
    return ent.closed ? [...pts, pts[0]] : [...pts];
  }
  const out: Point2D[] = [pts[0]];
  const count = ent.closed ? pts.length : pts.length - 1;
  for (let i = 0; i < count; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const bulge = ent.bulges?.[i] ?? 0;
    const arc = bulgeSegmentToArc(a, b, bulge);
    if (!arc) {
      out.push(b);
    } else {
      let sweep = arc.ccw
        ? normAngle(arc.endAngle - arc.startAngle)
        : -normAngle(arc.startAngle - arc.endAngle);
      if (Math.abs(sweep) < EPS) sweep = arc.ccw ? TAU : -TAU;
      for (let k = 1; k <= stepsPerArc; k++) {
        const ang = arc.startAngle + (sweep * k) / stepsPerArc;
        out.push({
          x: arc.center.x + arc.radius * Math.cos(ang),
          y: arc.center.y + arc.radius * Math.sin(ang),
        });
      }
    }
  }
  return out;
}

export function circleFrom3Points(p1: Point2D, p2: Point2D, p3: Point2D): { center: Point2D; radius: number } | null {
  const ax = p1.x, ay = p1.y;
  const bx = p2.x, by = p2.y;
  const cx = p3.x, cy = p3.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < EPS) return null;
  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    d;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    d;
  const center = { x: ux, y: uy };
  return { center, radius: dist(center, p1) };
}

export function arcFrom3Points(p1: Point2D, p2: Point2D, p3: Point2D): { center: Point2D; radius: number; startAngle: number; endAngle: number } | null {
  const c = circleFrom3Points(p1, p2, p3);
  if (!c) return null;
  const a1 = normAngle(angleBetween(c.center, p1));
  const a2 = normAngle(angleBetween(c.center, p2));
  const a3 = normAngle(angleBetween(c.center, p3));
  // Check if a2 lies CCW between a1 and a3
  if (isAngleInArc(a2, a1, a3)) {
    return { center: c.center, radius: c.radius, startAngle: a1, endAngle: a3 };
  }
  return { center: c.center, radius: c.radius, startAngle: a3, endAngle: a1 };
}

// Analytical intersections
export function intersectInfiniteLines(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < EPS) return null;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

export function intersectSegments(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < EPS) return null;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  if (t >= -1e-5 && t <= 1 + 1e-5 && u >= -1e-5 && u <= 1 + 1e-5) {
    return { x: p1.x + t * d1x, y: p1.y + t * d1y };
  }
  return null;
}

export function intersectLineCircle(p1: Point2D, p2: Point2D, center: Point2D, radius: number, segmentOnly = false): Point2D[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;
  const a = dx * dx + dy * dy;
  if (a < EPS) return [];
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  let disc = b * b - 4 * a * c;
  if (disc < -1e-5) return [];
  if (disc < 0) disc = 0;
  const sqrtD = Math.sqrt(disc);
  const ts = [(-b - sqrtD) / (2 * a), (-b + sqrtD) / (2 * a)];
  const out: Point2D[] = [];
  for (const t of ts) {
    if (!segmentOnly || (t >= -1e-5 && t <= 1 + 1e-5)) {
      const pt = { x: p1.x + t * dx, y: p1.y + t * dy };
      if (!out.some((q) => dist(q, pt) < 1e-4)) out.push(pt);
    }
  }
  return out;
}

export function intersectCircles(c1: Point2D, r1: number, c2: Point2D, r2: number): Point2D[] {
  const d = dist(c1, c2);
  if (d < EPS || d > r1 + r2 + 1e-5 || d < Math.abs(r1 - r2) - 1e-5) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSq = Math.max(0, r1 * r1 - a * a);
  const h = Math.sqrt(hSq);
  const mx = c1.x + (a * (c2.x - c1.x)) / d;
  const my = c1.y + (a * (c2.y - c1.y)) / d;
  const rx = (-(c2.y - c1.y) * h) / d;
  const ry = ((c2.x - c1.x) * h) / d;
  const p1 = { x: mx + rx, y: my + ry };
  const p2 = { x: mx - rx, y: my - ry };
  if (dist(p1, p2) < 1e-4) return [p1];
  return [p1, p2];
}

export function tangentPointsToCircle(p: Point2D, center: Point2D, radius: number): Point2D[] {
  const d = dist(p, center);
  if (d <= radius + EPS) return [];
  const baseAngle = angleBetween(center, p);
  const offset = Math.acos(radius / d);
  return [
    { x: center.x + radius * Math.cos(baseAngle + offset), y: center.y + radius * Math.sin(baseAngle + offset) },
    { x: center.x + radius * Math.cos(baseAngle - offset), y: center.y + radius * Math.sin(baseAngle - offset) },
  ];
}

export function entityToSegments(ent: CadEntity): [Point2D, Point2D][] {
  switch (ent.type) {
    case 'line':
      return [[ent.start, ent.end]];
    case 'polyline': {
      const pts = samplePolyline(ent, 16);
      const segs: [Point2D, Point2D][] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        segs.push([pts[i], pts[i + 1]]);
      }
      return segs;
    }
    case 'table': {
      const w = ent.cols * ent.colWidth;
      const h = ent.rows * ent.rowHeight;
      const tl = ent.position;
      const tr = { x: tl.x + w, y: tl.y };
      const br = { x: tl.x + w, y: tl.y - h };
      const bl = { x: tl.x, y: tl.y - h };
      return [[tl, tr], [tr, br], [br, bl], [bl, tl]];
    }
    case 'rectangle': {
      const c = getRectangleCorners(ent);
      return [[c[0], c[1]], [c[1], c[2]], [c[2], c[3]], [c[3], c[0]]];
    }
    case 'polygon': {
      const v = getPolygonVertices(ent);
      return v.map((pt, i) => [pt, v[(i + 1) % v.length]]);
    }
    case 'hatch': {
      if (ent.boundary.length < 2) return [];
      return ent.boundary.map((pt, i) => [pt, ent.boundary[(i + 1) % ent.boundary.length]]);
    }
    case 'spline': {
      const pts = sampleSpline(ent.controlPoints, ent.closed, 10);
      const segs: [Point2D, Point2D][] = [];
      for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
      return segs;
    }
    case 'xline': {
      const far = 1e6;
      return [[
        { x: ent.origin.x - ent.direction.x * far, y: ent.origin.y - ent.direction.y * far },
        { x: ent.origin.x + ent.direction.x * far, y: ent.origin.y + ent.direction.y * far },
      ]];
    }
    case 'ray': {
      const far = 1e6;
      return [[
        ent.origin,
        { x: ent.origin.x + ent.direction.x * far, y: ent.origin.y + ent.direction.y * far },
      ]];
    }
    default:
      return [];
  }
}

export function intersectTwoEntities(a: CadEntity, b: CadEntity): Point2D[] {
  const out: Point2D[] = [];
  const pushUnique = (pt: Point2D) => {
    if (!out.some((q) => dist(q, pt) < 1e-3)) out.push(pt);
  };

  const aSegs = entityToSegments(a);
  const bSegs = entityToSegments(b);

  if (aSegs.length > 0 && bSegs.length > 0) {
    for (const s1 of aSegs) {
      for (const s2 of bSegs) {
        const hit = intersectSegments(s1[0], s1[1], s2[0], s2[1]);
        if (hit) pushUnique(hit);
      }
    }
  }

  const checkSegCircle = (segs: [Point2D, Point2D][], circle: CircleEntity | ArcEntity) => {
    for (const s of segs) {
      const pts = intersectLineCircle(s[0], s[1], circle.center, circle.radius, true);
      for (const pt of pts) {
        if (circle.type === 'circle' || isAngleInArc(angleBetween(circle.center, pt), circle.startAngle, circle.endAngle)) {
          pushUnique(pt);
        }
      }
    }
  };

  if (aSegs.length > 0 && (b.type === 'circle' || b.type === 'arc')) checkSegCircle(aSegs, b);
  if (bSegs.length > 0 && (a.type === 'circle' || a.type === 'arc')) checkSegCircle(bSegs, a);

  if ((a.type === 'circle' || a.type === 'arc') && (b.type === 'circle' || b.type === 'arc')) {
    const pts = intersectCircles(a.center, a.radius, b.center, b.radius);
    for (const pt of pts) {
      const okA = a.type === 'circle' || isAngleInArc(angleBetween(a.center, pt), a.startAngle, a.endAngle);
      const okB = b.type === 'circle' || isAngleInArc(angleBetween(b.center, pt), b.startAngle, b.endAngle);
      if (okA && okB) pushUnique(pt);
    }
  }

  return out;
}

export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) / 2;
}

export function polygonCentroid(points: Point2D[]): Point2D {
  if (points.length === 0) return { x: 0, y: 0 };
  let x = 0, y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

export function pointInPolygon(pt: Point2D, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + EPS) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getEntityLength(ent: CadEntity): number {
  switch (ent.type) {
    case 'line':
      return dist(ent.start, ent.end);
    case 'polyline': {
      const pts = samplePolyline(ent, 24);
      let len = 0;
      for (let i = 0; i < pts.length - 1; i++) len += dist(pts[i], pts[i + 1]);
      return len;
    }
    case 'circle':
      return TAU * ent.radius;
    case 'arc':
      return arcSweep(ent.startAngle, ent.endAngle) * ent.radius;
    case 'rectangle':
      return 2 * (Math.abs(ent.p2.x - ent.p1.x) + Math.abs(ent.p2.y - ent.p1.y));
    case 'polygon': {
      const v = getPolygonVertices(ent);
      return v.length * dist(v[0], v[1]);
    }
    case 'ellipse': {
      // Ramanujan approximation
      const a = ent.rx, b = ent.ry;
      const h = ((a - b) * (a - b)) / ((a + b) * (a + b) + EPS);
      return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    }
    case 'spline': {
      const pts = sampleSpline(ent.controlPoints, ent.closed);
      let len = 0;
      for (let i = 0; i < pts.length - 1; i++) len += dist(pts[i], pts[i + 1]);
      return len;
    }
    case 'table':
      return 2 * (ent.cols * ent.colWidth + ent.rows * ent.rowHeight);
    default:
      return 0;
  }
}

export function getEntityArea(ent: CadEntity): number {
  switch (ent.type) {
    case 'circle':
      return Math.PI * ent.radius * ent.radius;
    case 'rectangle':
      return Math.abs(ent.p2.x - ent.p1.x) * Math.abs(ent.p2.y - ent.p1.y);
    case 'polygon':
      return polygonArea(getPolygonVertices(ent));
    case 'ellipse':
      return Math.PI * ent.rx * ent.ry;
    case 'polyline':
      return ent.closed ? polygonArea(samplePolyline(ent, 24)) : 0;
    case 'hatch':
      return polygonArea(ent.boundary);
    case 'table':
      return ent.cols * ent.colWidth * ent.rows * ent.rowHeight;
    default:
      return 0;
  }
}

export function getEntityBBox(ent: CadEntity, blocks?: Record<string, BlockDefinition>): BBox | null {
  const fromPts = (pts: Point2D[]): BBox | null => {
    if (pts.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  };

  switch (ent.type) {
    case 'line':
      return fromPts([ent.start, ent.end]);
    case 'polyline':
      return fromPts(samplePolyline(ent, 12));
    case 'circle':
      return {
        minX: ent.center.x - ent.radius,
        minY: ent.center.y - ent.radius,
        maxX: ent.center.x + ent.radius,
        maxY: ent.center.y + ent.radius,
      };
    case 'arc': {
      const pts: Point2D[] = [
        { x: ent.center.x + ent.radius * Math.cos(ent.startAngle), y: ent.center.y + ent.radius * Math.sin(ent.startAngle) },
        { x: ent.center.x + ent.radius * Math.cos(ent.endAngle), y: ent.center.y + ent.radius * Math.sin(ent.endAngle) },
      ];
      for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        if (isAngleInArc(a, ent.startAngle, ent.endAngle)) {
          pts.push({ x: ent.center.x + ent.radius * Math.cos(a), y: ent.center.y + ent.radius * Math.sin(a) });
        }
      }
      return fromPts(pts);
    }
    case 'rectangle':
      return fromPts(getRectangleCorners(ent));
    case 'polygon':
      return fromPts(getPolygonVertices(ent));
    case 'ellipse':
      return fromPts(sampleEllipse(ent, 32));
    case 'spline':
      return fromPts(sampleSpline(ent.controlPoints, ent.closed, 8));
    case 'point':
      return { minX: ent.position.x - 1, minY: ent.position.y - 1, maxX: ent.position.x + 1, maxY: ent.position.y + 1 };
    case 'hatch':
      return fromPts(ent.boundary);
    case 'text': {
      const w = Math.max(ent.content.length * ent.height * 0.65, ent.height);
      const h = ent.height * 1.2;
      const corners = [
        ent.position,
        rotatePoint({ x: ent.position.x + w, y: ent.position.y }, ent.position, ent.rotation),
        rotatePoint({ x: ent.position.x + w, y: ent.position.y + h }, ent.position, ent.rotation),
        rotatePoint({ x: ent.position.x, y: ent.position.y + h }, ent.position, ent.rotation),
      ];
      return fromPts(corners);
    }
    case 'mtext': {
      const lines = ent.content.split('\n').length;
      const w = Math.max(ent.width, ent.height * 4);
      const h = lines * ent.height * 1.35;
      return fromPts([
        ent.position,
        { x: ent.position.x + w, y: ent.position.y - h },
      ]);
    }
    case 'dimension':
      return fromPts([ent.p1, ent.p2, ent.textPosition, ...(ent.p3 ? [ent.p3] : [])]);
    case 'leader':
      return fromPts(ent.points);
    case 'revcloud':
      return fromPts(ent.points);
    case 'block_ref': {
      const def = blocks?.[ent.blockName];
      if (!def || def.entities.length === 0) {
        return { minX: ent.position.x - 10, minY: ent.position.y - 10, maxX: ent.position.x + 10, maxY: ent.position.y + 10 };
      }
      const pts: Point2D[] = [];
      for (const subEnt of def.entities) {
        const bb = getEntityBBox(subEnt, blocks);
        if (!bb) continue;
        const corners = [
          { x: bb.minX, y: bb.minY },
          { x: bb.maxX, y: bb.minY },
          { x: bb.maxX, y: bb.maxY },
          { x: bb.minX, y: bb.maxY },
        ];
        for (const c of corners) {
          const lx = (c.x - def.basePoint.x) * ent.scaleX;
          const ly = (c.y - def.basePoint.y) * ent.scaleY;
          const rot = rotatePoint({ x: lx, y: ly }, { x: 0, y: 0 }, ent.rotation);
          pts.push({ x: ent.position.x + rot.x, y: ent.position.y + rot.y });
        }
      }
      return fromPts(pts);
    }
    case 'solid3d': {
      if (ent.primitive === 'mesh' && ent.meshPositions && ent.meshPositions.length >= 9) {
        const pts: Point2D[] = [];
        const rz = ent.rotation?.z || 0;
        const cosZ = Math.cos(rz);
        const sinZ = Math.sin(rz);
        for (let i = 0; i + 2 < ent.meshPositions.length; i += 3) {
          const lx = ent.meshPositions[i];
          const ly = ent.meshPositions[i + 1];
          pts.push({
            x: ent.position.x + lx * cosZ - ly * sinZ,
            y: ent.position.y + lx * sinZ + ly * cosZ,
          });
        }
        return fromPts(pts);
      }
      if (ent.primitive === 'extrude' && ent.profile && ent.profile.length > 0) {
        return fromPts(ent.profile.map((p) => ({ x: ent.position.x + p.x, y: ent.position.y + p.y })));
      }
      if (ent.primitive === 'box') {
        const hx = Math.max(0.5, ent.size.x) / 2;
        const hy = Math.max(0.5, ent.size.y) / 2;
        const rz = ent.rotation?.z || 0;
        const corners = [
          { x: -hx, y: -hy },
          { x: hx, y: -hy },
          { x: hx, y: hy },
          { x: -hx, y: hy },
        ].map((c) => {
          const rp = rotatePoint(c, { x: 0, y: 0 }, rz);
          return { x: ent.position.x + rp.x, y: ent.position.y + rp.y };
        });
        return fromPts(corners);
      }
      const r = Math.max(ent.size.x, ent.size.y, 10);
      return {
        minX: ent.position.x - r,
        minY: ent.position.y - r,
        maxX: ent.position.x + r,
        maxY: ent.position.y + r,
      };
    }
    case 'table':
      return {
        minX: ent.position.x,
        minY: ent.position.y - ent.rows * ent.rowHeight,
        maxX: ent.position.x + ent.cols * ent.colWidth,
        maxY: ent.position.y,
      };
    case 'xline':
    case 'ray':
      return null;
  }
}

export function getEntityCentroid(ent: CadEntity, blocks?: Record<string, BlockDefinition>): Point2D {
  const bb = getEntityBBox(ent, blocks);
  if (!bb) {
    if (ent.type === 'xline' || ent.type === 'ray') return { ...ent.origin };
    return { x: 0, y: 0 };
  }
  return { x: (bb.minX + bb.maxX) / 2, y: (bb.minY + bb.maxY) / 2 };
}

export function getDocumentBBox(entities: CadEntity[], blocks?: Record<string, BlockDefinition>): BBox | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let found = false;
  for (const e of entities) {
    const bb = getEntityBBox(e, blocks);
    if (!bb) continue;
    found = true;
    if (bb.minX < minX) minX = bb.minX;
    if (bb.minY < minY) minY = bb.minY;
    if (bb.maxX > maxX) maxX = bb.maxX;
    if (bb.maxY > maxY) maxY = bb.maxY;
  }
  return found ? { minX, minY, maxX, maxY } : null;
}

// Geometric transforms on entities
export function translateEntity<T extends CadEntity>(ent: T, dx: number, dy: number, newId = false): T {
  const move = (p: Point2D): Point2D => ({ x: p.x + dx, y: p.y + dy });
  const base = { ...ent, id: newId ? genId(ent.type) : ent.id };
  switch (ent.type) {
    case 'line':
      return { ...base, start: move(ent.start), end: move(ent.end) } as T;
    case 'polyline':
      return { ...base, points: ent.points.map(move) } as T;
    case 'circle':
    case 'arc':
    case 'polygon':
    case 'ellipse':
      return { ...base, center: move(ent.center) } as T;
    case 'rectangle':
      return { ...base, p1: move(ent.p1), p2: move(ent.p2) } as T;
    case 'spline':
      return { ...base, controlPoints: ent.controlPoints.map(move) } as T;
    case 'xline':
    case 'ray':
      return { ...base, origin: move(ent.origin) } as T;
    case 'point':
    case 'text':
    case 'mtext':
    case 'block_ref':
    case 'table':
      return { ...base, position: move(ent.position) } as T;
    case 'hatch':
      return { ...base, boundary: ent.boundary.map(move) } as T;
    case 'dimension':
      return { ...base, p1: move(ent.p1), p2: move(ent.p2), p3: ent.p3 ? move(ent.p3) : undefined, textPosition: move(ent.textPosition) } as T;
    case 'leader':
    case 'revcloud':
      return { ...base, points: ent.points.map(move) } as T;
    case 'solid3d':
      return {
        ...base,
        position: { x: ent.position.x + dx, y: ent.position.y + dy, z: ent.position.z },
        profile: ent.profile ? ent.profile.map(move) : undefined,
      } as T;
  }
}

export function rotateEntity<T extends CadEntity>(ent: T, origin: Point2D, angleRad: number, newId = false): T {
  const rot = (p: Point2D) => rotatePoint(p, origin, angleRad);
  const base = { ...ent, id: newId ? genId(ent.type) : ent.id };
  switch (ent.type) {
    case 'line':
      return { ...base, start: rot(ent.start), end: rot(ent.end) } as T;
    case 'polyline':
      return { ...base, points: ent.points.map(rot) } as T;
    case 'circle':
      return { ...base, center: rot(ent.center) } as T;
    case 'arc':
      return { ...base, center: rot(ent.center), startAngle: normAngle(ent.startAngle + angleRad), endAngle: normAngle(ent.endAngle + angleRad) } as T;
    case 'rectangle': {
      const c = mid(ent.p1, ent.p2);
      const hw = Math.abs(ent.p2.x - ent.p1.x) / 2;
      const hh = Math.abs(ent.p2.y - ent.p1.y) / 2;
      const nc = rot(c);
      return {
        ...base,
        p1: { x: nc.x - hw, y: nc.y - hh },
        p2: { x: nc.x + hw, y: nc.y + hh },
        rotation: (ent.rotation || 0) + angleRad,
      } as T;
    }
    case 'polygon':
    case 'ellipse':
      return { ...base, center: rot(ent.center), rotation: ent.rotation + angleRad } as T;
    case 'spline':
      return { ...base, controlPoints: ent.controlPoints.map(rot) } as T;
    case 'xline':
    case 'ray': {
      const dirRot = rotatePoint(ent.direction, { x: 0, y: 0 }, angleRad);
      return { ...base, origin: rot(ent.origin), direction: normalize(dirRot) } as T;
    }
    case 'point':
    case 'table':
      return { ...base, position: rot(ent.position) } as T;
    case 'text':
    case 'mtext':
    case 'block_ref':
      return { ...base, position: rot(ent.position), rotation: ent.rotation + angleRad } as T;
    case 'hatch':
      return { ...base, boundary: ent.boundary.map(rot), angle: ent.angle + radToDeg(angleRad) } as T;
    case 'dimension':
      return { ...base, p1: rot(ent.p1), p2: rot(ent.p2), p3: ent.p3 ? rot(ent.p3) : undefined, textPosition: rot(ent.textPosition) } as T;
    case 'leader':
    case 'revcloud':
      return { ...base, points: ent.points.map(rot) } as T;
    case 'solid3d': {
      const np = rot({ x: ent.position.x, y: ent.position.y });
      return {
        ...base,
        position: { x: np.x, y: np.y, z: ent.position.z },
        rotation: { ...ent.rotation, z: ent.rotation.z + angleRad },
        profile: ent.profile ? ent.profile.map(rot) : undefined,
      } as T;
    }
  }
}

export function mirrorEntity<T extends CadEntity>(ent: T, a: Point2D, b: Point2D, newId = false): T {
  const mir = (p: Point2D) => mirrorPoint(p, a, b);
  const axisAngle = angleBetween(a, b);
  const base = { ...ent, id: newId ? genId(ent.type) : ent.id };
  switch (ent.type) {
    case 'line':
      return { ...base, start: mir(ent.start), end: mir(ent.end) } as T;
    case 'polyline':
      return {
        ...base,
        points: ent.points.map(mir),
        bulges: ent.bulges ? ent.bulges.map((bg) => -bg) : undefined,
      } as T;
    case 'circle':
      return { ...base, center: mir(ent.center) } as T;
    case 'arc': {
      const sPt = { x: ent.center.x + ent.radius * Math.cos(ent.startAngle), y: ent.center.y + ent.radius * Math.sin(ent.startAngle) };
      const ePt = { x: ent.center.x + ent.radius * Math.cos(ent.endAngle), y: ent.center.y + ent.radius * Math.sin(ent.endAngle) };
      const nc = mir(ent.center);
      const ns = normAngle(angleBetween(nc, mir(ePt)));
      const ne = normAngle(angleBetween(nc, mir(sPt)));
      return { ...base, center: nc, startAngle: ns, endAngle: ne } as T;
    }
    case 'rectangle': {
      // Convert mirrored rotated rect cleanly
      const corners = getRectangleCorners(ent).map(mir);
      return {
        ...base,
        type: 'polyline',
        points: corners,
        closed: true,
      } as unknown as T;
    }
    case 'polygon':
      return { ...base, center: mir(ent.center), rotation: 2 * axisAngle - ent.rotation } as T;
    case 'ellipse':
      return { ...base, center: mir(ent.center), rotation: 2 * axisAngle - ent.rotation } as T;
    case 'spline':
      return { ...base, controlPoints: ent.controlPoints.map(mir) } as T;
    case 'xline':
    case 'ray': {
      const o = mir(ent.origin);
      const t = mir(add(ent.origin, ent.direction));
      return { ...base, origin: o, direction: normalize(sub(t, o)) } as T;
    }
    case 'point':
      return { ...base, position: mir(ent.position) } as T;
    case 'text':
    case 'mtext': {
      let nr = normAngle(2 * axisAngle - ent.rotation);
      if (nr > Math.PI / 2 && nr < (3 * Math.PI) / 2) nr = normAngle(nr + Math.PI);
      return { ...base, position: mir(ent.position), rotation: nr } as T;
    }
    case 'table':
      return { ...base, position: mir(ent.position) } as T;
    case 'block_ref':
      return { ...base, position: mir(ent.position), scaleX: -ent.scaleX, rotation: 2 * axisAngle - ent.rotation } as T;
    case 'hatch':
      return { ...base, boundary: ent.boundary.map(mir) } as T;
    case 'dimension':
      return { ...base, p1: mir(ent.p1), p2: mir(ent.p2), p3: ent.p3 ? mir(ent.p3) : undefined, textPosition: mir(ent.textPosition) } as T;
    case 'leader':
    case 'revcloud':
      return { ...base, points: ent.points.map(mir) } as T;
    case 'solid3d': {
      const np = mir({ x: ent.position.x, y: ent.position.y });
      return {
        ...base,
        position: { x: np.x, y: np.y, z: ent.position.z },
        profile: ent.profile ? ent.profile.map(mir) : undefined,
      } as T;
    }
  }
}

export function scaleEntity<T extends CadEntity>(ent: T, origin: Point2D, factor: number, newId = false): T {
  const f = Math.abs(factor) < EPS ? 1 : factor;
  const sc = (p: Point2D) => scalePoint(p, origin, f);
  const base = { ...ent, id: newId ? genId(ent.type) : ent.id };
  switch (ent.type) {
    case 'line':
      return { ...base, start: sc(ent.start), end: sc(ent.end) } as T;
    case 'polyline':
      return { ...base, points: ent.points.map(sc) } as T;
    case 'circle':
    case 'arc':
    case 'polygon':
      return { ...base, center: sc(ent.center), radius: Math.abs(ent.radius * f) } as T;
    case 'rectangle':
      return { ...base, p1: sc(ent.p1), p2: sc(ent.p2) } as T;
    case 'ellipse':
      return { ...base, center: sc(ent.center), rx: Math.abs(ent.rx * f), ry: Math.abs(ent.ry * f) } as T;
    case 'spline':
      return { ...base, controlPoints: ent.controlPoints.map(sc) } as T;
    case 'xline':
    case 'ray':
      return { ...base, origin: sc(ent.origin) } as T;
    case 'point':
      return { ...base, position: sc(ent.position) } as T;
    case 'text':
      return { ...base, position: sc(ent.position), height: ent.height * Math.abs(f) } as T;
    case 'mtext':
      return { ...base, position: sc(ent.position), height: ent.height * Math.abs(f), width: ent.width * Math.abs(f) } as T;
    case 'block_ref':
      return { ...base, position: sc(ent.position), scaleX: ent.scaleX * f, scaleY: ent.scaleY * f } as T;
    case 'hatch':
      return { ...base, boundary: ent.boundary.map(sc), scale: ent.scale * Math.abs(f) } as T;
    case 'dimension':
      return {
        ...base,
        p1: sc(ent.p1),
        p2: sc(ent.p2),
        p3: ent.p3 ? sc(ent.p3) : undefined,
        textPosition: sc(ent.textPosition),
        textHeight: ent.textHeight * Math.abs(f),
        arrowSize: ent.arrowSize * Math.abs(f),
      } as T;
    case 'table':
      return {
        ...base,
        position: sc(ent.position),
        colWidth: ent.colWidth * Math.abs(f),
        rowHeight: ent.rowHeight * Math.abs(f),
        textHeight: ent.textHeight * Math.abs(f),
      } as T;
    case 'leader':
    case 'revcloud':
      return { ...base, points: ent.points.map(sc) } as T;
    case 'solid3d': {
      const np = sc({ x: ent.position.x, y: ent.position.y });
      return {
        ...base,
        position: { x: np.x, y: np.y, z: ent.position.z * f },
        size: { x: ent.size.x * f, y: ent.size.y * f, z: ent.size.z * f },
        extrudeHeight: ent.extrudeHeight ? ent.extrudeHeight * f : undefined,
        profile: ent.profile ? ent.profile.map(sc) : undefined,
      } as T;
    }
  }
}

// Analytical OFFSET
export function offsetEntity(ent: CadEntity, distance: number, sidePoint: Point2D): CadEntity | null {
  if (distance <= EPS) return null;
  switch (ent.type) {
    case 'line': {
      const dir = normalize(sub(ent.end, ent.start));
      const normal = { x: -dir.y, y: dir.x };
      const side = dot(sub(sidePoint, ent.start), normal) >= 0 ? 1 : -1;
      const dx = normal.x * distance * side;
      const dy = normal.y * distance * side;
      return translateEntity(ent, dx, dy, true);
    }
    case 'circle': {
      const d = dist(ent.center, sidePoint);
      const newR = d >= ent.radius ? ent.radius + distance : ent.radius - distance;
      if (newR <= EPS) return null;
      return { ...ent, id: genId('circle'), radius: newR };
    }
    case 'arc': {
      const d = dist(ent.center, sidePoint);
      const newR = d >= ent.radius ? ent.radius + distance : ent.radius - distance;
      if (newR <= EPS) return null;
      return { ...ent, id: genId('arc'), radius: newR };
    }
    case 'rectangle': {
      const c = mid(ent.p1, ent.p2);
      const hw = Math.abs(ent.p2.x - ent.p1.x) / 2;
      const hh = Math.abs(ent.p2.y - ent.p1.y) / 2;
      const inside = pointInPolygon(sidePoint, getRectangleCorners(ent));
      const s = inside ? -distance : distance;
      if (hw + s <= EPS || hh + s <= EPS) return null;
      return {
        ...ent,
        id: genId('rectangle'),
        p1: { x: c.x - (hw + s), y: c.y - (hh + s) },
        p2: { x: c.x + (hw + s), y: c.y + (hh + s) },
      };
    }
    case 'polygon': {
      const d = dist(ent.center, sidePoint);
      const newR = d >= ent.radius ? ent.radius + distance : ent.radius - distance;
      if (newR <= EPS) return null;
      return { ...ent, id: genId('polygon'), radius: newR };
    }
    case 'ellipse': {
      const c = Math.cos(-ent.rotation);
      const s = Math.sin(-ent.rotation);
      const dx = sidePoint.x - ent.center.x;
      const dy = sidePoint.y - ent.center.y;
      const lx = dx * c - dy * s;
      const ly = dx * s + dy * c;
      const normEq = (lx * lx) / (ent.rx * ent.rx + EPS) + (ly * ly) / (ent.ry * ent.ry + EPS);
      const delta = normEq < 1 ? -distance : distance;
      const nrx = ent.rx + delta;
      const nry = ent.ry + delta;
      if (nrx <= EPS || nry <= EPS) return null;
      return { ...ent, id: genId('ellipse'), rx: nrx, ry: nry };
    }
    case 'spline': {
      const pts = sampleSpline(ent.controlPoints, ent.closed, 6);
      if (pts.length < 2) return null;
      let bestDist = Infinity;
      let bestSign = 1;
      for (let i = 0; i < pts.length - 1; i++) {
        const res = distPointToSegment(sidePoint, pts[i], pts[i + 1]);
        if (res.distance < bestDist) {
          bestDist = res.distance;
          const dir = normalize(sub(pts[i + 1], pts[i]));
          const n = { x: -dir.y, y: dir.x };
          bestSign = dot(sub(sidePoint, pts[i]), n) >= 0 ? 1 : -1;
        }
      }
      const newPts = pts.map((pt, i) => {
        const a = i === 0 ? pts[0] : pts[i - 1];
        const b = i === pts.length - 1 ? pts[pts.length - 1] : pts[i + 1];
        const dir = normalize(sub(b, a));
        return { x: pt.x - dir.y * distance * bestSign, y: pt.y + dir.x * distance * bestSign };
      });
      return {
        ...ent,
        id: genId('spline'),
        controlPoints: newPts.filter((_, idx) => idx % 3 === 0 || idx === newPts.length - 1),
      };
    }
    case 'polyline': {
      const pts = ent.points;
      if (pts.length < 2) return null;
      // Find closest segment to determine side sign
      let bestDist = Infinity;
      let bestSign = 1;
      const segCount = ent.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < segCount; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const res = distPointToSegment(sidePoint, a, b);
        if (res.distance < bestDist) {
          bestDist = res.distance;
          const dir = normalize(sub(b, a));
          const n = { x: -dir.y, y: dir.x };
          bestSign = dot(sub(sidePoint, a), n) >= 0 ? 1 : -1;
        }
      }
      const offsetSegs: [Point2D, Point2D][] = [];
      for (let i = 0; i < segCount; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const dir = normalize(sub(b, a));
        const n = { x: -dir.y * distance * bestSign, y: dir.x * distance * bestSign };
        offsetSegs.push([add(a, n), add(b, n)]);
      }
      const newPts: Point2D[] = [];
      if (ent.closed) {
        for (let i = 0; i < segCount; i++) {
          const prev = offsetSegs[(i - 1 + segCount) % segCount];
          const curr = offsetSegs[i];
          const inter = intersectInfiniteLines(prev[0], prev[1], curr[0], curr[1]);
          newPts.push(inter || curr[0]);
        }
      } else {
        newPts.push(offsetSegs[0][0]);
        for (let i = 0; i < offsetSegs.length - 1; i++) {
          const inter = intersectInfiniteLines(offsetSegs[i][0], offsetSegs[i][1], offsetSegs[i + 1][0], offsetSegs[i + 1][1]);
          newPts.push(inter || offsetSegs[i][1]);
        }
        newPts.push(offsetSegs[offsetSegs.length - 1][1]);
      }
      return { ...ent, id: genId('polyline'), points: newPts };
    }
    default:
      return null;
  }
}

function pickKeptEndpoint(a: Point2D, b: Point2D, inter: Point2D, pick?: Point2D): Point2D {
  if (pick && dist(pick, inter) > 1e-3) {
    const vp = sub(pick, inter);
    const da = dot(vp, sub(a, inter));
    const db = dot(vp, sub(b, inter));
    if (da > 0 && db <= 0) return a;
    if (db > 0 && da <= 0) return b;
  }
  return dist(a, inter) >= dist(b, inter) ? a : b;
}

// Analytical FILLET between two lines
export function filletTwoLines(
  l1: LineEntity,
  l2: LineEntity,
  radius: number,
  pick1?: Point2D,
  pick2?: Point2D
): { line1: LineEntity; line2: LineEntity; arc?: ArcEntity } | null {
  const inter = intersectInfiniteLines(l1.start, l1.end, l2.start, l2.end);
  if (!inter) return null;

  const far1 = pickKeptEndpoint(l1.start, l1.end, inter, pick1);
  const far2 = pickKeptEndpoint(l2.start, l2.end, inter, pick2);

  if (radius <= EPS) {
    return {
      line1: { ...l1, start: far1, end: inter },
      line2: { ...l2, start: far2, end: inter },
    };
  }

  const u1 = normalize(sub(far1, inter));
  const u2 = normalize(sub(far2, inter));
  const cosTheta = Math.max(-1, Math.min(1, dot(u1, u2)));
  const theta = Math.acos(cosTheta);
  if (theta < 1e-4 || Math.abs(theta - Math.PI) < 1e-4) return null;

  const tanDist = radius / Math.tan(theta / 2);
  const t1 = add(inter, scaleVec(u1, tanDist));
  const t2 = add(inter, scaleVec(u2, tanDist));

  const bisector = normalize(add(u1, u2));
  const centerDist = radius / Math.sin(theta / 2);
  const center = add(inter, scaleVec(bisector, centerDist));

  const a1 = normAngle(angleBetween(center, t1));
  const a2 = normAngle(angleBetween(center, t2));
  const sweep12 = arcSweep(a1, a2);
  const startAngle = sweep12 <= Math.PI ? a1 : a2;
  const endAngle = sweep12 <= Math.PI ? a2 : a1;

  const arc: ArcEntity = {
    id: genId('arc'),
    type: 'arc',
    layer: l1.layer,
    color: l1.color,
    lineType: l1.lineType,
    lineTypeScale: l1.lineTypeScale,
    lineWeight: l1.lineWeight,
    center,
    radius,
    startAngle,
    endAngle,
  };

  return {
    line1: { ...l1, start: far1, end: t1 },
    line2: { ...l2, start: far2, end: t2 },
    arc,
  };
}

// Analytical CHAMFER between two lines
export function chamferTwoLines(
  l1: LineEntity,
  l2: LineEntity,
  d1: number,
  d2: number,
  pick1?: Point2D,
  pick2?: Point2D
): { line1: LineEntity; line2: LineEntity; bevel?: LineEntity } | null {
  const inter = intersectInfiniteLines(l1.start, l1.end, l2.start, l2.end);
  if (!inter) return null;
  const far1 = pickKeptEndpoint(l1.start, l1.end, inter, pick1);
  const far2 = pickKeptEndpoint(l2.start, l2.end, inter, pick2);
  const u1 = normalize(sub(far1, inter));
  const u2 = normalize(sub(far2, inter));
  const p1 = add(inter, scaleVec(u1, d1));
  const p2 = add(inter, scaleVec(u2, d2));

  if (d1 <= EPS && d2 <= EPS) {
    return {
      line1: { ...l1, start: far1, end: inter },
      line2: { ...l2, start: far2, end: inter },
    };
  }
  const bevel: LineEntity = {
    id: genId('line'),
    type: 'line',
    layer: l1.layer,
    color: l1.color,
    lineType: l1.lineType,
    lineTypeScale: l1.lineTypeScale,
    lineWeight: l1.lineWeight,
    start: p1,
    end: p2,
  };
  return {
    line1: { ...l1, start: far1, end: p1 },
    line2: { ...l2, start: far2, end: p2 },
    bevel,
  };
}

function expandCuttingEntities(entities: CadEntity[], blocks?: Record<string, BlockDefinition>): CadEntity[] {
  const out: CadEntity[] = [];
  for (const e of entities) {
    if (e.type === 'block_ref' && blocks) {
      const sub = explodeEntity(e, blocks);
      if (sub) {
        out.push(...sub);
        continue;
      }
    }
    out.push(e);
  }
  return out;
}

// Analytical QUICK TRIM
export function trimEntityAtClick(
  target: CadEntity,
  clickPt: Point2D,
  allEntities: CadEntity[],
  blocks?: Record<string, BlockDefinition>
): { removeId: string; replacements: CadEntity[] } | null {
  const others = expandCuttingEntities(
    allEntities.filter((e) => e.id !== target.id),
    blocks
  );
  const hits: Point2D[] = [];
  for (const o of others) {
    for (const pt of intersectTwoEntities(target, o)) {
      if (!hits.some((h) => dist(h, pt) < 1e-3)) hits.push(pt);
    }
  }
  if (hits.length === 0) return null;

  if (target.type === 'line') {
    const len = dist(target.start, target.end);
    if (len < EPS) return null;
    const paramOf = (p: Point2D) => projectPointOnLine(p, target.start, target.end).t;
    const clickT = Math.max(0, Math.min(1, paramOf(clickPt)));
    const ts = [0, 1, ...hits.map(paramOf).filter((t) => t > 1e-4 && t < 1 - 1e-4)].sort((a, b) => a - b);
    let cutIdx = -1;
    for (let i = 0; i < ts.length - 1; i++) {
      if (clickT >= ts[i] - 1e-4 && clickT <= ts[i + 1] + 1e-4) {
        cutIdx = i;
        break;
      }
    }
    if (cutIdx < 0) return null;
    const ptAt = (t: number): Point2D => ({
      x: target.start.x + t * (target.end.x - target.start.x),
      y: target.start.y + t * (target.end.y - target.start.y),
    });
    const replacements: CadEntity[] = [];
    if (ts[cutIdx] > 1e-4) {
      replacements.push({ ...target, id: genId('line'), start: target.start, end: ptAt(ts[cutIdx]) });
    }
    if (ts[cutIdx + 1] < 1 - 1e-4) {
      replacements.push({ ...target, id: genId('line'), start: ptAt(ts[cutIdx + 1]), end: target.end });
    }
    return { removeId: target.id, replacements };
  }

  if (target.type === 'polyline' || target.type === 'rectangle' || target.type === 'polygon') {
    const exploded = explodeEntity(target, blocks || {});
    if (!exploded || exploded.length === 0) return null;
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < exploded.length; i++) {
      const seg = exploded[i];
      if (seg.type === 'line') {
        const d = distPointToSegment(clickPt, seg.start, seg.end).distance;
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    }
    if (bestIdx < 0) return null;
    const segTarget = exploded[bestIdx];
    const segTrim = trimEntityAtClick(segTarget, clickPt, others, blocks);
    if (!segTrim) return null;
    const replacements: CadEntity[] = [];
    exploded.forEach((part, idx) => {
      if (idx === bestIdx) replacements.push(...segTrim.replacements);
      else replacements.push(part);
    });
    return { removeId: target.id, replacements };
  }

  if (target.type === 'xline' || target.type === 'ray') {
    const dir = normalize(target.direction);
    const paramOf = (p: Point2D) => dot(sub(p, target.origin), dir);
    const clickS = paramOf(clickPt);
    const ts = hits.map(paramOf).filter((t) => (target.type === 'ray' ? t > 1e-4 : true)).sort((a, b) => a - b);
    if (target.type === 'ray') {
      const breaks = [0, ...ts];
      const ptAt = (s: number) => add(target.origin, scaleVec(dir, s));
      if (clickS >= breaks[breaks.length - 1]) {
        return {
          removeId: target.id,
          replacements: [{
            id: genId('line'),
            type: 'line',
            layer: target.layer,
            color: target.color,
            lineType: target.lineType,
            lineTypeScale: target.lineTypeScale,
            lineWeight: target.lineWeight,
            start: target.origin,
            end: ptAt(breaks[breaks.length - 1]),
          }],
        };
      }
      for (let i = 0; i < breaks.length - 1; i++) {
        if (clickS >= breaks[i] - 1e-3 && clickS <= breaks[i + 1] + 1e-3) {
          const reps: CadEntity[] = [];
          if (breaks[i] > 1e-3) {
            reps.push({
              id: genId('line'), type: 'line', layer: target.layer, color: target.color,
              lineType: target.lineType, lineTypeScale: target.lineTypeScale, lineWeight: target.lineWeight,
              start: target.origin, end: ptAt(breaks[i]),
            });
          }
          reps.push({ ...target, id: genId('ray'), origin: ptAt(breaks[i + 1]) });
          return { removeId: target.id, replacements: reps };
        }
      }
    } else if (ts.length >= 2) {
      const ptAt = (s: number) => add(target.origin, scaleVec(dir, s));
      for (let i = 0; i < ts.length - 1; i++) {
        if (clickS >= ts[i] && clickS <= ts[i + 1]) {
          return {
            removeId: target.id,
            replacements: [
              { id: genId('ray'), type: 'ray', layer: target.layer, color: target.color, lineType: target.lineType, lineTypeScale: target.lineTypeScale, lineWeight: target.lineWeight, origin: ptAt(ts[i]), direction: scaleVec(dir, -1) },
              { id: genId('ray'), type: 'ray', layer: target.layer, color: target.color, lineType: target.lineType, lineTypeScale: target.lineTypeScale, lineWeight: target.lineWeight, origin: ptAt(ts[i + 1]), direction: dir },
            ],
          };
        }
      }
    }
    return null;
  }

  if (target.type === 'circle' && hits.length >= 2) {
    const angles = hits.map((p) => normAngle(angleBetween(target.center, p))).sort((a, b) => a - b);
    const clickA = normAngle(angleBetween(target.center, clickPt));
    let cutIdx = angles.length - 1;
    for (let i = 0; i < angles.length - 1; i++) {
      if (clickA >= angles[i] && clickA <= angles[i + 1]) {
        cutIdx = i;
        break;
      }
    }
    const startAngle = angles[(cutIdx + 1) % angles.length];
    const endAngle = angles[cutIdx];
    const arc: ArcEntity = {
      id: genId('arc'),
      type: 'arc',
      layer: target.layer,
      color: target.color,
      lineType: target.lineType,
      lineTypeScale: target.lineTypeScale,
      lineWeight: target.lineWeight,
      center: target.center,
      radius: target.radius,
      startAngle,
      endAngle,
    };
    return { removeId: target.id, replacements: [arc] };
  }

  if (target.type === 'arc') {
    const s = normAngle(target.startAngle);
    const sweep = arcSweep(target.startAngle, target.endAngle);
    const relAngle = (a: number) => normAngle(a - s);
    const clickRel = relAngle(angleBetween(target.center, clickPt));
    const relHits = hits
      .map((p) => relAngle(angleBetween(target.center, p)))
      .filter((r) => r > 1e-4 && r < sweep - 1e-4);
    if (relHits.length === 0) return null;
    const breaks = [0, ...relHits, sweep].sort((a, b) => a - b);
    let cutIdx = -1;
    for (let i = 0; i < breaks.length - 1; i++) {
      if (clickRel >= breaks[i] - 1e-4 && clickRel <= breaks[i + 1] + 1e-4) {
        cutIdx = i;
        break;
      }
    }
    if (cutIdx < 0) return null;
    const replacements: CadEntity[] = [];
    if (breaks[cutIdx] > 1e-4) {
      replacements.push({
        ...target,
        id: genId('arc'),
        startAngle: target.startAngle,
        endAngle: normAngle(s + breaks[cutIdx]),
      });
    }
    if (breaks[cutIdx + 1] < sweep - 1e-4) {
      replacements.push({
        ...target,
        id: genId('arc'),
        startAngle: normAngle(s + breaks[cutIdx + 1]),
        endAngle: target.endAngle,
      });
    }
    return { removeId: target.id, replacements };
  }

  return null;
}

// Analytical EXTEND for lines, open polylines, and arcs
export function extendEntityAtClick(
  target: CadEntity,
  clickPt: Point2D,
  allEntities: CadEntity[],
  blocks?: Record<string, BlockDefinition>
): CadEntity | null {
  const others = expandCuttingEntities(
    allEntities.filter((e) => e.id !== target.id),
    blocks
  );

  if (target.type === 'line') {
    const extendEnd = dist(clickPt, target.end) <= dist(clickPt, target.start);
    const origin = extendEnd ? target.end : target.start;
    const dir = normalize(extendEnd ? sub(target.end, target.start) : sub(target.start, target.end));
    const farPt = add(origin, scaleVec(dir, 1e6));

    let bestDist = Infinity;
    let bestHit: Point2D | null = null;

    for (const o of others) {
      const segs = entityToSegments(o);
      for (const s of segs) {
        const hit = intersectSegments(origin, farPt, s[0], s[1]);
        if (hit) {
          const d = dist(origin, hit);
          if (d > 1e-3 && d < bestDist) {
            bestDist = d;
            bestHit = hit;
          }
        }
      }
      if (o.type === 'circle' || o.type === 'arc') {
        const hits = intersectLineCircle(origin, farPt, o.center, o.radius, true);
        for (const hit of hits) {
          if (o.type === 'arc' && !isAngleInArc(angleBetween(o.center, hit), o.startAngle, o.endAngle)) continue;
          const d = dist(origin, hit);
          if (d > 1e-3 && d < bestDist) {
            bestDist = d;
            bestHit = hit;
          }
        }
      }
    }
    if (!bestHit) return null;
    return extendEnd ? { ...target, end: bestHit } : { ...target, start: bestHit };
  }

  if (target.type === 'polyline' && !target.closed && target.points.length >= 2) {
    const first = target.points[0];
    const last = target.points[target.points.length - 1];
    const extendTail = dist(clickPt, last) <= dist(clickPt, first);
    const segLine: LineEntity = {
      id: target.id,
      type: 'line',
      layer: target.layer,
      color: target.color,
      lineType: target.lineType,
      lineTypeScale: target.lineTypeScale,
      lineWeight: target.lineWeight,
      start: extendTail ? target.points[target.points.length - 2] : target.points[1],
      end: extendTail ? last : first,
    };
    const ext = extendEntityAtClick(segLine, extendTail ? last : first, others, blocks) as LineEntity | null;
    if (!ext) return null;
    const pts = [...target.points];
    if (extendTail) pts[pts.length - 1] = ext.end;
    else pts[0] = ext.end;
    return { ...target, points: pts };
  }

  if (target.type === 'arc') {
    const sPt = { x: target.center.x + target.radius * Math.cos(target.startAngle), y: target.center.y + target.radius * Math.sin(target.startAngle) };
    const ePt = { x: target.center.x + target.radius * Math.cos(target.endAngle), y: target.center.y + target.radius * Math.sin(target.endAngle) };
    const extendEnd = dist(clickPt, ePt) <= dist(clickPt, sPt);
    const virtualCircle: CircleEntity = {
      id: target.id,
      type: 'circle',
      layer: target.layer,
      color: target.color,
      lineType: target.lineType,
      lineTypeScale: target.lineTypeScale,
      lineWeight: target.lineWeight,
      center: target.center,
      radius: target.radius,
    };
    const hits: Point2D[] = [];
    for (const o of others) {
      for (const h of intersectTwoEntities(virtualCircle, o)) {
        const ang = normAngle(angleBetween(target.center, h));
        if (!isAngleInArc(ang, target.startAngle, target.endAngle)) hits.push(h);
      }
    }
    if (hits.length === 0) return null;
    let bestAngle: number | null = null;
    let bestSweep = Infinity;
    for (const h of hits) {
      const ang = normAngle(angleBetween(target.center, h));
      const delta = extendEnd ? normAngle(ang - target.endAngle) : normAngle(target.startAngle - ang);
      if (delta > 1e-3 && delta < bestSweep) {
        bestSweep = delta;
        bestAngle = ang;
      }
    }
    if (bestAngle === null) return null;
    return extendEnd ? { ...target, endAngle: bestAngle } : { ...target, startAngle: bestAngle };
  }

  return null;
}

export function extendLineAtClick(target: LineEntity, clickPt: Point2D, allEntities: CadEntity[]): LineEntity | null {
  return extendEntityAtClick(target, clickPt, allEntities) as LineEntity | null;
}

// EXPLODE compound entities into primitives
export function explodeEntity(ent: CadEntity, blocks: Record<string, BlockDefinition>): CadEntity[] | null {
  const mkLine = (a: Point2D, b: Point2D): LineEntity => ({
    id: genId('line'),
    type: 'line',
    layer: ent.layer,
    color: ent.color,
    lineType: ent.lineType,
    lineTypeScale: ent.lineTypeScale,
    lineWeight: ent.lineWeight,
    start: a,
    end: b,
  });

  switch (ent.type) {
    case 'rectangle': {
      const c = getRectangleCorners(ent);
      return [mkLine(c[0], c[1]), mkLine(c[1], c[2]), mkLine(c[2], c[3]), mkLine(c[3], c[0])];
    }
    case 'polygon': {
      const v = getPolygonVertices(ent);
      return v.map((p, i) => mkLine(p, v[(i + 1) % v.length]));
    }
    case 'polyline': {
      const out: CadEntity[] = [];
      const segCount = ent.closed ? ent.points.length : ent.points.length - 1;
      for (let i = 0; i < segCount; i++) {
        const a = ent.points[i];
        const b = ent.points[(i + 1) % ent.points.length];
        const bg = ent.bulges?.[i] ?? 0;
        const arcInfo = bulgeSegmentToArc(a, b, bg);
        if (arcInfo) {
          out.push({
            id: genId('arc'),
            type: 'arc',
            layer: ent.layer,
            color: ent.color,
            lineType: ent.lineType,
            lineTypeScale: ent.lineTypeScale,
            lineWeight: ent.lineWeight,
            center: arcInfo.center,
            radius: arcInfo.radius,
            startAngle: arcInfo.ccw ? arcInfo.startAngle : arcInfo.endAngle,
            endAngle: arcInfo.ccw ? arcInfo.endAngle : arcInfo.startAngle,
          });
        } else {
          out.push(mkLine(a, b));
        }
      }
      return out;
    }
    case 'table': {
      const out: CadEntity[] = [];
      const w = ent.cols * ent.colWidth;
      const h = ent.rows * ent.rowHeight;
      for (let r = 0; r <= ent.rows; r++) {
        out.push(mkLine({ x: ent.position.x, y: ent.position.y - r * ent.rowHeight }, { x: ent.position.x + w, y: ent.position.y - r * ent.rowHeight }));
      }
      for (let c = 0; c <= ent.cols; c++) {
        out.push(mkLine({ x: ent.position.x + c * ent.colWidth, y: ent.position.y }, { x: ent.position.x + c * ent.colWidth, y: ent.position.y - h }));
      }
      for (let r = 0; r < ent.rows; r++) {
        for (let c = 0; c < ent.cols; c++) {
          const txt = ent.cells[r]?.[c];
          if (txt) {
            const t: TextEntity = {
              id: genId('text'),
              type: 'text',
              layer: ent.layer,
              color: ent.color,
              lineType: ent.lineType,
              lineTypeScale: ent.lineTypeScale,
              lineWeight: ent.lineWeight,
              position: { x: ent.position.x + c * ent.colWidth + 4, y: ent.position.y - (r + 0.72) * ent.rowHeight },
              content: txt,
              height: ent.textHeight,
              rotation: 0,
            };
            out.push(t);
          }
        }
      }
      return out;
    }
    case 'block_ref': {
      const def = blocks[ent.blockName];
      if (!def) return null;
      return def.entities.map((sub) => {
        let e = translateEntity(sub, -def.basePoint.x, -def.basePoint.y, true);
        e = scaleEntity(e, { x: 0, y: 0 }, ent.scaleX, false);
        e = rotateEntity(e, { x: 0, y: 0 }, ent.rotation, false);
        e = translateEntity(e, ent.position.x, ent.position.y, false);
        return { ...e, layer: ent.layer };
      });
    }
    default:
      return null;
  }
}

// JOIN contiguous lines / open polylines / arcs into Polylines
export function joinLinesToPolyline(lines: LineEntity[]): PolylineEntity | null {
  const res = joinEntities(lines);
  return res && res.length > 0 && res[0].type === 'polyline' ? (res[0] as PolylineEntity) : null;
}

export function joinEntities(items: CadEntity[]): CadEntity[] | null {
  interface SegPiece {
    p1: Point2D;
    p2: Point2D;
    bulge: number;
    src: CadEntity;
  }
  const pieces: SegPiece[] = [];
  for (const ent of items) {
    if (ent.type === 'line') {
      pieces.push({ p1: ent.start, p2: ent.end, bulge: 0, src: ent });
    } else if (ent.type === 'polyline' && !ent.closed && ent.points.length >= 2) {
      for (let i = 0; i < ent.points.length - 1; i++) {
        pieces.push({ p1: ent.points[i], p2: ent.points[i + 1], bulge: ent.bulges?.[i] ?? 0, src: ent });
      }
    } else if (ent.type === 'arc') {
      const sweep = arcSweep(ent.startAngle, ent.endAngle);
      const p1 = { x: ent.center.x + ent.radius * Math.cos(ent.startAngle), y: ent.center.y + ent.radius * Math.sin(ent.startAngle) };
      const p2 = { x: ent.center.x + ent.radius * Math.cos(ent.endAngle), y: ent.center.y + ent.radius * Math.sin(ent.endAngle) };
      pieces.push({ p1, p2, bulge: Math.tan(sweep / 4), src: ent });
    }
  }
  if (pieces.length < 2) return null;

  const first = pieces.shift()!;
  const chain: Point2D[] = [first.p1, first.p2];
  const bulges: number[] = [first.bulge];
  let progress = true;

  while (progress && pieces.length > 0) {
    progress = false;
    for (let i = 0; i < pieces.length; i++) {
      const seg = pieces[i];
      const head = chain[0];
      const tail = chain[chain.length - 1];
      if (dist(tail, seg.p1) < 1e-2) {
        chain.push(seg.p2);
        bulges.push(seg.bulge);
        pieces.splice(i, 1);
        progress = true;
        break;
      } else if (dist(tail, seg.p2) < 1e-2) {
        chain.push(seg.p1);
        bulges.push(-seg.bulge);
        pieces.splice(i, 1);
        progress = true;
        break;
      } else if (dist(head, seg.p2) < 1e-2) {
        chain.unshift(seg.p1);
        bulges.unshift(seg.bulge);
        pieces.splice(i, 1);
        progress = true;
        break;
      } else if (dist(head, seg.p1) < 1e-2) {
        chain.unshift(seg.p2);
        bulges.unshift(-seg.bulge);
        pieces.splice(i, 1);
        progress = true;
        break;
      }
    }
  }

  const closed = chain.length > 2 && dist(chain[0], chain[chain.length - 1]) < 1e-2;
  if (closed) chain.pop();

  const poly: PolylineEntity = {
    id: genId('polyline'),
    type: 'polyline',
    layer: first.src.layer,
    color: first.src.color,
    lineType: first.src.lineType,
    lineTypeScale: first.src.lineTypeScale,
    lineWeight: first.src.lineWeight,
    points: chain,
    closed,
    bulges: bulges.some((b) => Math.abs(b) > 1e-6) ? bulges : undefined,
  };
  return [poly];
}

// STRETCH vertices inside a selection window
export function stretchEntity<T extends CadEntity>(ent: T, box: BBox, dx: number, dy: number): T {
  if (ent.fixed) return ent;
  const inBox = (p: Point2D): boolean => p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
  const mv = (p: Point2D): Point2D => (inBox(p) ? { x: p.x + dx, y: p.y + dy } : p);

  switch (ent.type) {
    case 'line':
      return { ...ent, start: mv(ent.start), end: mv(ent.end) } as T;
    case 'polyline':
      return { ...ent, points: ent.points.map(mv) } as T;
    case 'rectangle': {
      const corners = getRectangleCorners(ent);
      const countIn = corners.filter(inBox).length;
      if (countIn === 0) return ent;
      if (countIn === 4) return translateEntity(ent, dx, dy, false);
      if (!ent.rotation) {
        const minX = Math.min(ent.p1.x, ent.p2.x);
        const maxX = Math.max(ent.p1.x, ent.p2.x);
        const minY = Math.min(ent.p1.y, ent.p2.y);
        const maxY = Math.max(ent.p1.y, ent.p2.y);
        const leftIn = corners[0].x >= box.minX && corners[0].x <= box.maxX && (inBox(corners[0]) || inBox(corners[3]));
        const rightIn = corners[1].x >= box.minX && corners[1].x <= box.maxX && (inBox(corners[1]) || inBox(corners[2]));
        const botIn = corners[0].y >= box.minY && corners[0].y <= box.maxY && (inBox(corners[0]) || inBox(corners[1]));
        const topIn = corners[2].y >= box.minY && corners[2].y <= box.maxY && (inBox(corners[2]) || inBox(corners[3]));
        return {
          ...ent,
          p1: { x: minX + (leftIn ? dx : 0), y: minY + (botIn ? dy : 0) },
          p2: { x: maxX + (rightIn ? dx : 0), y: maxY + (topIn ? dy : 0) },
        } as T;
      }
      return {
        ...ent,
        type: 'polyline',
        points: corners.map(mv),
        closed: true,
      } as unknown as T;
    }
    case 'spline':
      return { ...ent, controlPoints: ent.controlPoints.map(mv) } as T;
    case 'leader':
    case 'revcloud':
      return { ...ent, points: ent.points.map(mv) } as T;
    case 'hatch':
      return { ...ent, boundary: ent.boundary.map(mv) } as T;
    case 'dimension':
      return {
        ...ent,
        p1: mv(ent.p1),
        p2: mv(ent.p2),
        p3: ent.p3 ? mv(ent.p3) : undefined,
        textPosition: mv(ent.textPosition),
      } as T;
    case 'circle':
    case 'arc':
    case 'polygon':
    case 'ellipse':
      return inBox(ent.center) ? translateEntity(ent, dx, dy, false) : ent;
    case 'point':
    case 'text':
    case 'mtext':
    case 'block_ref':
    case 'table':
      return inBox(ent.position) ? translateEntity(ent, dx, dy, false) : ent;
    case 'solid3d':
      return inBox({ x: ent.position.x, y: ent.position.y }) ? translateEntity(ent, dx, dy, false) : ent;
    default:
      return ent;
  }
}

// BREAK an entity between two points
export function breakEntityBetweenPoints(target: CadEntity, p1: Point2D, p2: Point2D): CadEntity[] | null {
  if (target.type === 'line') {
    const t1 = Math.max(0, Math.min(1, projectPointOnLine(p1, target.start, target.end).t));
    const t2 = Math.max(0, Math.min(1, projectPointOnLine(p2, target.start, target.end).t));
    const lo = Math.min(t1, t2);
    const hi = Math.max(t1, t2);
    if (hi - lo < 1e-4) return null;
    const ptAt = (t: number): Point2D => ({
      x: target.start.x + t * (target.end.x - target.start.x),
      y: target.start.y + t * (target.end.y - target.start.y),
    });
    const out: CadEntity[] = [];
    if (lo > 1e-4) out.push({ ...target, id: genId('line'), start: target.start, end: ptAt(lo) });
    if (hi < 1 - 1e-4) out.push({ ...target, id: genId('line'), start: ptAt(hi), end: target.end });
    return out;
  }

  if (target.type === 'circle') {
    const a1 = normAngle(angleBetween(target.center, p1));
    const a2 = normAngle(angleBetween(target.center, p2));
    if (Math.abs(a1 - a2) < 1e-4) return null;
    const arc: ArcEntity = {
      id: genId('arc'),
      type: 'arc',
      layer: target.layer,
      color: target.color,
      lineType: target.lineType,
      lineTypeScale: target.lineTypeScale,
      lineWeight: target.lineWeight,
      center: target.center,
      radius: target.radius,
      startAngle: a2,
      endAngle: a1,
    };
    return [arc];
  }

  if (target.type === 'arc') {
    const s = normAngle(target.startAngle);
    const sweep = arcSweep(target.startAngle, target.endAngle);
    const r1 = normAngle(angleBetween(target.center, p1) - s);
    const r2 = normAngle(angleBetween(target.center, p2) - s);
    const lo = Math.max(0, Math.min(r1, r2));
    const hi = Math.min(sweep, Math.max(r1, r2));
    if (hi - lo < 1e-4 || lo >= sweep) return null;
    const out: CadEntity[] = [];
    if (lo > 1e-4) out.push({ ...target, id: genId('arc'), startAngle: target.startAngle, endAngle: normAngle(s + lo) });
    if (hi < sweep - 1e-4) out.push({ ...target, id: genId('arc'), startAngle: normAngle(s + hi), endAngle: target.endAngle });
    return out;
  }

  if (target.type === 'polyline' && target.points.length >= 2) {
    // Project onto polyline chain
    const pts = target.points;
    let d1 = Infinity, d2 = Infinity, idx1 = 0, idx2 = 0;
    let proj1 = p1, proj2 = p2;
    for (let i = 0; i < pts.length - 1; i++) {
      const r1 = distPointToSegment(p1, pts[i], pts[i + 1]);
      if (r1.distance < d1) { d1 = r1.distance; idx1 = i; proj1 = r1.closest; }
      const r2 = distPointToSegment(p2, pts[i], pts[i + 1]);
      if (r2.distance < d2) { d2 = r2.distance; idx2 = i; proj2 = r2.closest; }
    }
    const swapped = idx1 > idx2 || (idx1 === idx2 && dist(pts[idx1], proj1) > dist(pts[idx1], proj2));
    const loIdx = swapped ? idx2 : idx1;
    const hiIdx = swapped ? idx1 : idx2;
    const loPt = swapped ? proj2 : proj1;
    const hiPt = swapped ? proj1 : proj2;
    const out: CadEntity[] = [];
    const headPts = [...pts.slice(0, loIdx + 1), loPt];
    if (headPts.length >= 2) out.push({ ...target, id: genId('polyline'), points: headPts, closed: false, bulges: undefined });
    const tailPts = [hiPt, ...pts.slice(hiIdx + 1)];
    if (tailPts.length >= 2) out.push({ ...target, id: genId('polyline'), points: tailPts, closed: false, bulges: undefined });
    return out;
  }

  return null;
}

// DIVIDE an entity into N equal segments, returning N-1 division points
export function divideEntity(target: CadEntity, segments: number): Point2D[] {
  const n = Math.max(2, Math.round(segments));
  const out: Point2D[] = [];

  if (target.type === 'circle') {
    for (let i = 0; i < n; i++) {
      const a = (i * TAU) / n;
      out.push({ x: target.center.x + target.radius * Math.cos(a), y: target.center.y + target.radius * Math.sin(a) });
    }
    return out;
  }

  if (target.type === 'arc') {
    const sweep = arcSweep(target.startAngle, target.endAngle);
    for (let i = 1; i < n; i++) {
      const a = target.startAngle + (sweep * i) / n;
      out.push({ x: target.center.x + target.radius * Math.cos(a), y: target.center.y + target.radius * Math.sin(a) });
    }
    return out;
  }

  let sample: Point2D[] = [];
  if (target.type === 'line') sample = [target.start, target.end];
  else if (target.type === 'polyline') sample = samplePolyline(target, 20);
  else if (target.type === 'rectangle') {
    const c = getRectangleCorners(target);
    sample = [...c, c[0]];
  } else if (target.type === 'polygon') {
    const v = getPolygonVertices(target);
    sample = [...v, v[0]];
  } else if (target.type === 'ellipse') sample = sampleEllipse(target, 96);
  else if (target.type === 'spline') sample = sampleSpline(target.controlPoints, target.closed, 20);

  if (sample.length < 2) return [];
  const cum: number[] = [0];
  for (let i = 0; i < sample.length - 1; i++) {
    cum.push(cum[cum.length - 1] + dist(sample[i], sample[i + 1]));
  }
  const total = cum[cum.length - 1];
  if (total < EPS) return [];

  for (let k = 1; k < n; k++) {
    const targetLen = (total * k) / n;
    let segIdx = 0;
    while (segIdx < cum.length - 2 && cum[segIdx + 1] < targetLen) segIdx++;
    const segLen = cum[segIdx + 1] - cum[segIdx];
    const t = segLen > EPS ? (targetLen - cum[segIdx]) / segLen : 0;
    out.push({
      x: sample[segIdx].x + t * (sample[segIdx + 1].x - sample[segIdx].x),
      y: sample[segIdx].y + t * (sample[segIdx + 1].y - sample[segIdx].y),
    });
  }
  return out;
}

// ALIGN entities from 2 source points to 2 destination points (with optional uniform scale)
export function alignEntities<T extends CadEntity>(
  entities: T[],
  src1: Point2D,
  dst1: Point2D,
  src2: Point2D,
  dst2: Point2D,
  scaleToMatch: boolean
): T[] {
  const dx = dst1.x - src1.x;
  const dy = dst1.y - src1.y;
  const aSrc = angleBetween(src1, src2);
  const aDst = angleBetween(dst1, dst2);
  const rotDelta = aDst - aSrc;
  const dSrc = dist(src1, src2);
  const dDst = dist(dst1, dst2);
  const factor = scaleToMatch && dSrc > EPS ? dDst / dSrc : 1;

  return entities.map((ent) => {
    let e = translateEntity(ent, dx, dy, false);
    e = rotateEntity(e, dst1, rotDelta, false);
    if (Math.abs(factor - 1) > 1e-5) {
      e = scaleEntity(e, dst1, factor, false);
    }
    return e;
  });
}

// MEASURE an entity by placing points every fixed interval along its curve length
export function measureEntityByDistance(target: CadEntity, interval: number): Point2D[] {
  const stepDist = Math.max(0.1, interval);
  let sample: Point2D[] = [];
  if (target.type === 'line') sample = [target.start, target.end];
  else if (target.type === 'polyline') sample = samplePolyline(target, 20);
  else if (target.type === 'rectangle') {
    const c = getRectangleCorners(target);
    sample = [...c, c[0]];
  } else if (target.type === 'polygon') {
    const v = getPolygonVertices(target);
    sample = [...v, v[0]];
  } else if (target.type === 'circle') {
    sample = Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * TAU;
      return { x: target.center.x + target.radius * Math.cos(a), y: target.center.y + target.radius * Math.sin(a) };
    });
  } else if (target.type === 'arc') {
    const sweep = arcSweep(target.startAngle, target.endAngle);
    sample = Array.from({ length: 49 }, (_, i) => {
      const a = target.startAngle + (sweep * i) / 48;
      return { x: target.center.x + target.radius * Math.cos(a), y: target.center.y + target.radius * Math.sin(a) };
    });
  } else if (target.type === 'ellipse') sample = sampleEllipse(target, 96);
  else if (target.type === 'spline') sample = sampleSpline(target.controlPoints, target.closed, 20);

  if (sample.length < 2) return [];
  const cum: number[] = [0];
  for (let i = 0; i < sample.length - 1; i++) {
    cum.push(cum[cum.length - 1] + dist(sample[i], sample[i + 1]));
  }
  const total = cum[cum.length - 1];
  if (total < stepDist) return [];

  const out: Point2D[] = [];
  const maxPts = 500;
  let d = stepDist;
  while (d < total - 1e-4 && out.length < maxPts) {
    let segIdx = 0;
    while (segIdx < cum.length - 2 && cum[segIdx + 1] < d) segIdx++;
    const segLen = cum[segIdx + 1] - cum[segIdx];
    const t = segLen > EPS ? (d - cum[segIdx]) / segLen : 0;
    out.push({
      x: sample[segIdx].x + t * (sample[segIdx + 1].x - sample[segIdx].x),
      y: sample[segIdx].y + t * (sample[segIdx + 1].y - sample[segIdx].y),
    });
    d += stepDist;
  }
  return out;
}

// OVERKILL helper: compare two entities of identical type & layer for geometric duplication
export function areEntitiesDuplicate(a: CadEntity, b: CadEntity, tol = 1e-3): boolean {
  if (a.type !== b.type || a.layer !== b.layer) return false;
  const near = (p: Point2D, q: Point2D) => Math.hypot(p.x - q.x, p.y - q.y) <= tol;
  switch (a.type) {
    case 'line': {
      const lb = b as typeof a;
      return (near(a.start, lb.start) && near(a.end, lb.end)) || (near(a.start, lb.end) && near(a.end, lb.start));
    }
    case 'circle': {
      const cb = b as typeof a;
      return near(a.center, cb.center) && Math.abs(a.radius - cb.radius) <= tol;
    }
    case 'arc': {
      const ab = b as typeof a;
      return (
        near(a.center, ab.center) &&
        Math.abs(a.radius - ab.radius) <= tol &&
        Math.abs(normAngle(a.startAngle - ab.startAngle)) <= 1e-3 &&
        Math.abs(normAngle(a.endAngle - ab.endAngle)) <= 1e-3
      );
    }
    case 'rectangle': {
      const rb = b as typeof a;
      return (
        Math.abs((a.rotation || 0) - (rb.rotation || 0)) <= 1e-3 &&
        ((near(a.p1, rb.p1) && near(a.p2, rb.p2)) || (near(a.p1, rb.p2) && near(a.p2, rb.p1)))
      );
    }
    case 'point': {
      const pb = b as typeof a;
      return near(a.position, pb.position);
    }
    case 'text':
    case 'mtext': {
      const tb = b as typeof a;
      return near(a.position, tb.position) && a.content === tb.content && Math.abs(a.height - tb.height) <= tol;
    }
    case 'polyline': {
      const pb = b as typeof a;
      if (a.closed !== pb.closed || a.points.length !== pb.points.length) return false;
      const forwardMatch = a.points.every((p, idx) => near(p, pb.points[idx]));
      if (forwardMatch) return true;
      return a.points.every((p, idx) => near(p, pb.points[pb.points.length - 1 - idx]));
    }
    default:
      return false;
  }
}
