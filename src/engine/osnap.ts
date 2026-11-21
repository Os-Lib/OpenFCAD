import {
  BBox,
  BlockDefinition,
  CadEntity,
  DraftingSettings,
  GripPoint,
  Layer,
  OsnapMode,
  OsnapResult,
  Point2D,
} from '../types/cad';
import {
  angleBetween,
  degToRad,
  dist,
  distPointToSegment,
  entityToSegments,
  explodeEntity,
  getEntityBBox,
  getPolygonVertices,
  getRectangleCorners,
  intersectTwoEntities,
  isAngleInArc,
  mid,
  normAngle,
  pointInPolygon,
  polygonCentroid,
  projectPointOnLine,
  rotatePoint,
  sampleEllipse,
  sampleSpline,
  tangentPointsToCircle,
} from './math';

export const OSNAP_LABELS: Record<OsnapMode, string> = {
  endpoint: 'Fine',
  midpoint: 'Medio',
  center: 'Centro',
  geometricCenter: 'Centro geom.',
  node: 'Nodo',
  quadrant: 'Quadrante',
  intersection: 'Intersezione',
  perpendicular: 'Perpendicolare',
  tangent: 'Tangente',
  nearest: 'Vicino',
};

export function isEntityVisible(ent: CadEntity, layers: Layer[]): boolean {
  if (ent.visible === false) return false;
  const layer = layers.find((l) => l.name === ent.layer);
  if (!layer) return true;
  return layer.on && !layer.frozen;
}

export function isEntityLocked(ent: CadEntity, layers: Layer[]): boolean {
  const layer = layers.find((l) => l.name === ent.layer);
  return !!layer?.locked;
}

export function resolveEntityColor(ent: CadEntity, layers: Layer[]): string {
  if (ent.color && ent.color !== 'ByLayer') return ent.color;
  const layer = layers.find((l) => l.name === ent.layer);
  return layer?.color || '#FFFFFF';
}

export function resolveEntityLineType(ent: CadEntity, layers: Layer[]): string {
  if (ent.lineType && ent.lineType !== 'ByLayer') return ent.lineType;
  const layer = layers.find((l) => l.name === ent.layer);
  return layer?.lineType || 'CONTINUOUS';
}

export function resolveEntityLineWeight(ent: CadEntity, layers: Layer[]): number {
  if (ent.lineWeight >= 0) return ent.lineWeight;
  const layer = layers.find((l) => l.name === ent.layer);
  return layer?.lineWeight ?? 0.25;
}

// Distance from world point to entity (for hit-testing & nearest OSNAP)
export function distToEntity(
  pt: Point2D,
  ent: CadEntity,
  blocks?: Record<string, BlockDefinition>
): { distance: number; closest: Point2D } {
  switch (ent.type) {
    case 'line':
    case 'polyline':
    case 'rectangle':
    case 'polygon':
    case 'spline':
    case 'xline':
    case 'ray': {
      const segs = entityToSegments(ent);
      let best = Infinity;
      let closest = pt;
      for (const [a, b] of segs) {
        const r = distPointToSegment(pt, a, b);
        if (r.distance < best) {
          best = r.distance;
          closest = r.closest;
        }
      }
      return { distance: best, closest };
    }
    case 'circle': {
      const d = dist(pt, ent.center);
      const a = angleBetween(ent.center, pt);
      const closest = { x: ent.center.x + ent.radius * Math.cos(a), y: ent.center.y + ent.radius * Math.sin(a) };
      return { distance: Math.abs(d - ent.radius), closest };
    }
    case 'arc': {
      const a = normAngle(angleBetween(ent.center, pt));
      const pStart = { x: ent.center.x + ent.radius * Math.cos(ent.startAngle), y: ent.center.y + ent.radius * Math.sin(ent.startAngle) };
      const pEnd = { x: ent.center.x + ent.radius * Math.cos(ent.endAngle), y: ent.center.y + ent.radius * Math.sin(ent.endAngle) };
      if (isAngleInArc(a, ent.startAngle, ent.endAngle)) {
        const closest = { x: ent.center.x + ent.radius * Math.cos(a), y: ent.center.y + ent.radius * Math.sin(a) };
        return { distance: Math.abs(dist(pt, ent.center) - ent.radius), closest };
      }
      const d1 = dist(pt, pStart);
      const d2 = dist(pt, pEnd);
      return d1 < d2 ? { distance: d1, closest: pStart } : { distance: d2, closest: pEnd };
    }
    case 'ellipse': {
      const pts = sampleEllipse(ent, 48);
      let best = Infinity;
      let closest = pt;
      for (let i = 0; i < pts.length - 1; i++) {
        const r = distPointToSegment(pt, pts[i], pts[i + 1]);
        if (r.distance < best) {
          best = r.distance;
          closest = r.closest;
        }
      }
      return { distance: best, closest };
    }
    case 'point':
      return { distance: dist(pt, ent.position), closest: ent.position };
    case 'hatch': {
      if (ent.boundary.length >= 3 && pointInPolygon(pt, ent.boundary)) {
        return { distance: 0, closest: pt };
      }
      const segs = entityToSegments(ent);
      let best = Infinity;
      let closest = pt;
      for (const [a, b] of segs) {
        const r = distPointToSegment(pt, a, b);
        if (r.distance < best) {
          best = r.distance;
          closest = r.closest;
        }
      }
      return { distance: best, closest };
    }
    case 'text':
    case 'mtext':
    case 'block_ref':
    case 'table':
    case 'solid3d': {
      const bb = getEntityBBox(ent, blocks);
      if (!bb) return { distance: Infinity, closest: pt };
      const cx = Math.max(bb.minX, Math.min(bb.maxX, pt.x));
      const cy = Math.max(bb.minY, Math.min(bb.maxY, pt.y));
      return { distance: dist(pt, { x: cx, y: cy }), closest: { x: cx, y: cy } };
    }
    case 'dimension': {
      const r1 = distPointToSegment(pt, ent.p1, ent.textPosition);
      const r2 = distPointToSegment(pt, ent.p2, ent.textPosition);
      const r3 = distPointToSegment(pt, ent.p1, ent.p2);
      const best = [r1, r2, r3].sort((a, b) => a.distance - b.distance)[0];
      return { distance: best.distance, closest: best.closest };
    }
    case 'leader':
    case 'revcloud': {
      let best = Infinity;
      let closest = pt;
      for (let i = 0; i < ent.points.length - 1; i++) {
        const r = distPointToSegment(pt, ent.points[i], ent.points[i + 1]);
        if (r.distance < best) {
          best = r.distance;
          closest = r.closest;
        }
      }
      return { distance: best, closest };
    }
  }
}

export function hitTestEntities(
  worldPt: Point2D,
  entities: CadEntity[],
  layers: Layer[],
  toleranceWorld: number,
  blocks?: Record<string, BlockDefinition>
): CadEntity | null {
  let bestEnt: CadEntity | null = null;
  let bestDist = toleranceWorld;
  // Prefer non-hatch entities when overlapping
  for (let i = entities.length - 1; i >= 0; i--) {
    const ent = entities[i];
    if (!isEntityVisible(ent, layers)) continue;
    const { distance } = distToEntity(worldPt, ent, blocks);
    const effectiveDist = ent.type === 'hatch' ? distance + toleranceWorld * 0.45 : distance;
    if (effectiveDist <= bestDist) {
      bestDist = effectiveDist;
      bestEnt = ent;
    }
  }
  return bestEnt;
}

export function selectEntitiesInBox(
  boxStart: Point2D,
  boxEnd: Point2D,
  crossing: boolean,
  entities: CadEntity[],
  layers: Layer[],
  blocks?: Record<string, BlockDefinition>
): string[] {
  const box: BBox = {
    minX: Math.min(boxStart.x, boxEnd.x),
    minY: Math.min(boxStart.y, boxEnd.y),
    maxX: Math.max(boxStart.x, boxEnd.x),
    maxY: Math.max(boxStart.y, boxEnd.y),
  };
  const ids: string[] = [];
  for (const ent of entities) {
    if (!isEntityVisible(ent, layers)) continue;
    const bb = getEntityBBox(ent, blocks);
    if (!bb) continue;
    if (crossing) {
      // Green crossing box: any overlap with bounding box
      const overlaps =
        bb.minX <= box.maxX &&
        bb.maxX >= box.minX &&
        bb.minY <= box.maxY &&
        bb.maxY >= box.minY;
      if (overlaps) ids.push(ent.id);
    } else {
      // Blue window box: completely inside
      const enclosed =
        bb.minX >= box.minX &&
        bb.maxX <= box.maxX &&
        bb.minY >= box.minY &&
        bb.maxY <= box.maxY;
      if (enclosed) ids.push(ent.id);
    }
  }
  return ids;
}

// Compute OSNAP point near cursor
export function findOsnap(
  cursorWorld: Point2D,
  entities: CadEntity[],
  layers: Layer[],
  settings: DraftingSettings,
  snapRadiusWorld: number,
  referencePoint?: Point2D,
  blocks?: Record<string, BlockDefinition>
): OsnapResult | null {
  if (!settings.osnapOn) return null;
  const modes = settings.osnapModes;
  let best: (OsnapResult & { score: number }) | null = null;

  const consider = (pt: Point2D, mode: OsnapMode, entityId: string | undefined, priorityBonus = 0) => {
    if (!modes[mode]) return;
    const d = dist(cursorWorld, pt);
    if (d > snapRadiusWorld) return;
    const score = d - priorityBonus;
    if (!best || score < best.score) {
      best = { point: pt, mode, entityId, label: OSNAP_LABELS[mode], score };
    }
  };

  const visible = entities.filter((e) => isEntityVisible(e, layers));

  // Filter nearby entities first for speed
  const nearby: CadEntity[] = [];
  for (const ent of visible) {
    const bb = getEntityBBox(ent, blocks);
    if (bb) {
      const margin = snapRadiusWorld * 2;
      if (
        cursorWorld.x < bb.minX - margin ||
        cursorWorld.x > bb.maxX + margin ||
        cursorWorld.y < bb.minY - margin ||
        cursorWorld.y > bb.maxY + margin
      ) {
        continue;
      }
    }
    nearby.push(ent);
  }

  for (const ent of nearby) {
    switch (ent.type) {
      case 'line': {
        consider(ent.start, 'endpoint', ent.id, snapRadiusWorld * 0.2);
        consider(ent.end, 'endpoint', ent.id, snapRadiusWorld * 0.2);
        consider(mid(ent.start, ent.end), 'midpoint', ent.id, snapRadiusWorld * 0.15);
        if (referencePoint && modes.perpendicular) {
          const proj = projectPointOnLine(referencePoint, ent.start, ent.end);
          if (proj.t >= 0 && proj.t <= 1) consider(proj.point, 'perpendicular', ent.id, snapRadiusWorld * 0.12);
        }
        break;
      }
      case 'polyline': {
        for (let i = 0; i < ent.points.length; i++) {
          consider(ent.points[i], 'endpoint', ent.id, snapRadiusWorld * 0.2);
          if (i < ent.points.length - 1) {
            consider(mid(ent.points[i], ent.points[i + 1]), 'midpoint', ent.id, snapRadiusWorld * 0.14);
            if (referencePoint && modes.perpendicular) {
              const proj = projectPointOnLine(referencePoint, ent.points[i], ent.points[i + 1]);
              if (proj.t >= 0 && proj.t <= 1) consider(proj.point, 'perpendicular', ent.id, snapRadiusWorld * 0.12);
            }
          }
        }
        if (ent.closed && ent.points.length > 2) {
          const last = ent.points[ent.points.length - 1];
          const first = ent.points[0];
          consider(mid(last, first), 'midpoint', ent.id, snapRadiusWorld * 0.14);
          if (referencePoint && modes.perpendicular) {
            const proj = projectPointOnLine(referencePoint, last, first);
            if (proj.t >= 0 && proj.t <= 1) consider(proj.point, 'perpendicular', ent.id, snapRadiusWorld * 0.12);
          }
          consider(polygonCentroid(ent.points), 'geometricCenter', ent.id, snapRadiusWorld * 0.1);
        }
        break;
      }
      case 'rectangle': {
        const c = getRectangleCorners(ent);
        for (let i = 0; i < 4; i++) {
          const a = c[i];
          const b = c[(i + 1) % 4];
          consider(a, 'endpoint', ent.id, snapRadiusWorld * 0.2);
          consider(mid(a, b), 'midpoint', ent.id, snapRadiusWorld * 0.14);
          if (referencePoint && modes.perpendicular) {
            const proj = projectPointOnLine(referencePoint, a, b);
            if (proj.t >= 0 && proj.t <= 1) consider(proj.point, 'perpendicular', ent.id, snapRadiusWorld * 0.12);
          }
        }
        consider(mid(ent.p1, ent.p2), 'geometricCenter', ent.id, snapRadiusWorld * 0.12);
        break;
      }
      case 'polygon': {
        const v = getPolygonVertices(ent);
        for (let i = 0; i < v.length; i++) {
          consider(v[i], 'endpoint', ent.id, snapRadiusWorld * 0.2);
          consider(mid(v[i], v[(i + 1) % v.length]), 'midpoint', ent.id, snapRadiusWorld * 0.14);
        }
        consider(ent.center, 'center', ent.id, snapRadiusWorld * 0.16);
        break;
      }
      case 'circle': {
        consider(ent.center, 'center', ent.id, snapRadiusWorld * 0.18);
        consider({ x: ent.center.x + ent.radius, y: ent.center.y }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        consider({ x: ent.center.x - ent.radius, y: ent.center.y }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        consider({ x: ent.center.x, y: ent.center.y + ent.radius }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        consider({ x: ent.center.x, y: ent.center.y - ent.radius }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        if (referencePoint && modes.tangent) {
          for (const tp of tangentPointsToCircle(referencePoint, ent.center, ent.radius)) {
            consider(tp, 'tangent', ent.id, snapRadiusWorld * 0.15);
          }
        }
        break;
      }
      case 'arc': {
        consider(ent.center, 'center', ent.id, snapRadiusWorld * 0.18);
        const sPt = { x: ent.center.x + ent.radius * Math.cos(ent.startAngle), y: ent.center.y + ent.radius * Math.sin(ent.startAngle) };
        const ePt = { x: ent.center.x + ent.radius * Math.cos(ent.endAngle), y: ent.center.y + ent.radius * Math.sin(ent.endAngle) };
        consider(sPt, 'endpoint', ent.id, snapRadiusWorld * 0.2);
        consider(ePt, 'endpoint', ent.id, snapRadiusWorld * 0.2);
        for (const q of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
          if (isAngleInArc(q, ent.startAngle, ent.endAngle)) {
            consider(
              { x: ent.center.x + ent.radius * Math.cos(q), y: ent.center.y + ent.radius * Math.sin(q) },
              'quadrant',
              ent.id,
              snapRadiusWorld * 0.14
            );
          }
        }
        if (referencePoint && modes.tangent) {
          for (const tp of tangentPointsToCircle(referencePoint, ent.center, ent.radius)) {
            if (isAngleInArc(angleBetween(ent.center, tp), ent.startAngle, ent.endAngle)) {
              consider(tp, 'tangent', ent.id, snapRadiusWorld * 0.15);
            }
          }
        }
        break;
      }
      case 'ellipse': {
        consider(ent.center, 'center', ent.id, snapRadiusWorld * 0.18);
        const c = Math.cos(ent.rotation), s = Math.sin(ent.rotation);
        consider({ x: ent.center.x + ent.rx * c, y: ent.center.y + ent.rx * s }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        consider({ x: ent.center.x - ent.rx * c, y: ent.center.y - ent.rx * s }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        consider({ x: ent.center.x - ent.ry * s, y: ent.center.y + ent.ry * c }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        consider({ x: ent.center.x + ent.ry * s, y: ent.center.y - ent.ry * c }, 'quadrant', ent.id, snapRadiusWorld * 0.14);
        break;
      }
      case 'spline': {
        for (const p of ent.controlPoints) consider(p, 'endpoint', ent.id, snapRadiusWorld * 0.15);
        break;
      }
      case 'point':
        consider(ent.position, 'node', ent.id, snapRadiusWorld * 0.22);
        break;
      case 'text':
      case 'mtext':
        consider(ent.position, 'endpoint', ent.id, snapRadiusWorld * 0.15);
        break;
      case 'block_ref': {
        consider(ent.position, 'endpoint', ent.id, snapRadiusWorld * 0.15);
        if (blocks) {
          const sub = explodeEntity(ent, blocks);
          if (sub) {
            for (const s of sub) {
              if (s.type === 'line') {
                consider(s.start, 'endpoint', ent.id, snapRadiusWorld * 0.16);
                consider(s.end, 'endpoint', ent.id, snapRadiusWorld * 0.16);
                consider(mid(s.start, s.end), 'midpoint', ent.id, snapRadiusWorld * 0.12);
              } else if (s.type === 'circle' || s.type === 'arc') {
                consider(s.center, 'center', ent.id, snapRadiusWorld * 0.14);
              } else if (s.type === 'rectangle') {
                for (const c of getRectangleCorners(s)) consider(c, 'endpoint', ent.id, snapRadiusWorld * 0.15);
              }
            }
          }
        }
        break;
      }
      case 'table': {
        const w = ent.cols * ent.colWidth;
        const h = ent.rows * ent.rowHeight;
        consider(ent.position, 'endpoint', ent.id, snapRadiusWorld * 0.18);
        consider({ x: ent.position.x + w, y: ent.position.y }, 'endpoint', ent.id, snapRadiusWorld * 0.18);
        consider({ x: ent.position.x + w, y: ent.position.y - h }, 'endpoint', ent.id, snapRadiusWorld * 0.18);
        consider({ x: ent.position.x, y: ent.position.y - h }, 'endpoint', ent.id, snapRadiusWorld * 0.18);
        break;
      }
      case 'dimension':
        consider(ent.p1, 'endpoint', ent.id, snapRadiusWorld * 0.12);
        consider(ent.p2, 'endpoint', ent.id, snapRadiusWorld * 0.12);
        break;
      case 'leader':
        for (const p of ent.points) consider(p, 'endpoint', ent.id, snapRadiusWorld * 0.15);
        break;
    }

    if (modes.nearest) {
      const res = distToEntity(cursorWorld, ent, blocks);
      if (res.distance <= snapRadiusWorld) {
        consider(res.closest, 'nearest', ent.id, -snapRadiusWorld * 0.1);
      }
    }
  }

  // Intersections among all nearby entities (spatially pre-filtered)
  if (modes.intersection && nearby.length >= 2) {
    for (let i = 0; i < nearby.length; i++) {
      const bbi = getEntityBBox(nearby[i], blocks);
      for (let j = i + 1; j < nearby.length; j++) {
        const bbj = getEntityBBox(nearby[j], blocks);
        if (
          bbi &&
          bbj &&
          (bbi.maxX < bbj.minX - 1e-3 ||
            bbi.minX > bbj.maxX + 1e-3 ||
            bbi.maxY < bbj.minY - 1e-3 ||
            bbi.minY > bbj.maxY + 1e-3)
        ) {
          continue;
        }
        const hits = intersectTwoEntities(nearby[i], nearby[j]);
        for (const h of hits) {
          consider(h, 'intersection', nearby[i].id, snapRadiusWorld * 0.22);
        }
      }
    }
  }

  return best ? { point: (best as OsnapResult).point, mode: (best as OsnapResult).mode, entityId: (best as OsnapResult).entityId, label: (best as OsnapResult).label } : null;
}

export interface OtrackResult {
  point: Point2D;
  guides: { from: Point2D; to: Point2D; axis: 'H' | 'V' }[];
}

export function findOtrackAlignment(
  cursorWorld: Point2D,
  trackedPoints: Point2D[],
  toleranceWorld: number
): OtrackResult | null {
  if (trackedPoints.length === 0) return null;
  let bestH: { pt: Point2D; dy: number } | null = null;
  let bestV: { pt: Point2D; dx: number } | null = null;

  for (const tp of trackedPoints) {
    const dy = Math.abs(cursorWorld.y - tp.y);
    const dx = Math.abs(cursorWorld.x - tp.x);
    if (dy <= toleranceWorld && (!bestH || dy < bestH.dy)) bestH = { pt: tp, dy };
    if (dx <= toleranceWorld && (!bestV || dx < bestV.dx)) bestV = { pt: tp, dx };
  }

  if (!bestH && !bestV) return null;
  const snapped: Point2D = {
    x: bestV ? bestV.pt.x : cursorWorld.x,
    y: bestH ? bestH.pt.y : cursorWorld.y,
  };
  const guides: OtrackResult['guides'] = [];
  if (bestH) guides.push({ from: bestH.pt, to: snapped, axis: 'H' });
  if (bestV) guides.push({ from: bestV.pt, to: snapped, axis: 'V' });
  return { point: snapped, guides };
}

// Apply Ortho, Polar Tracking, Grid Snap to cursor
export function applyDraftingConstraints(
  rawWorld: Point2D,
  settings: DraftingSettings,
  referencePoint?: Point2D,
  osnap?: OsnapResult | null
): { point: Point2D; polarGuideAngle?: number; orthoLocked?: boolean } {
  // OSNAP always wins over grid snap/polar
  if (osnap) {
    return { point: osnap.point };
  }

  let pt = { ...rawWorld };
  let polarGuideAngle: number | undefined;
  let orthoLocked = false;

  if (referencePoint) {
    const dx = pt.x - referencePoint.x;
    const dy = pt.y - referencePoint.y;
    const r = Math.hypot(dx, dy);

    if (settings.orthoOn && r > 1e-6) {
      orthoLocked = true;
      if (Math.abs(dx) >= Math.abs(dy)) {
        pt = { x: referencePoint.x + dx, y: referencePoint.y };
        polarGuideAngle = dx >= 0 ? 0 : Math.PI;
      } else {
        pt = { x: referencePoint.x, y: referencePoint.y + dy };
        polarGuideAngle = dy >= 0 ? Math.PI / 2 : -Math.PI / 2;
      }
    } else if (settings.polarOn && r > 1e-6) {
      const inc = degToRad(settings.polarAngle || 45);
      const ang = angleBetween(referencePoint, pt);
      const snapped = Math.round(ang / inc) * inc;
      const diff = Math.abs(ang - snapped);
      if (diff < degToRad(4.5)) {
        pt = {
          x: referencePoint.x + r * Math.cos(snapped),
          y: referencePoint.y + r * Math.sin(snapped),
        };
        polarGuideAngle = snapped;
      }
    }
  }

  if (settings.snapOn && !orthoLocked && polarGuideAngle === undefined) {
    const s = settings.snapSpacing || 10;
    pt = {
      x: Math.round(pt.x / s) * s,
      y: Math.round(pt.y / s) * s,
    };
  }

  return { point: pt, polarGuideAngle, orthoLocked };
}

// Extract interactive Grips for selected entity
export function getEntityGrips(ent: CadEntity): GripPoint[] {
  const grips: GripPoint[] = [];
  switch (ent.type) {
    case 'line':
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.start, kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 1, point: mid(ent.start, ent.end), kind: 'midpoint' });
      grips.push({ entityId: ent.id, gripIndex: 2, point: ent.end, kind: 'vertex' });
      break;
    case 'polyline':
      ent.points.forEach((p, idx) => {
        grips.push({ entityId: ent.id, gripIndex: idx, point: p, kind: 'vertex' });
      });
      break;
    case 'circle':
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.center, kind: 'center' });
      grips.push({ entityId: ent.id, gripIndex: 1, point: { x: ent.center.x + ent.radius, y: ent.center.y }, kind: 'quadrant' });
      grips.push({ entityId: ent.id, gripIndex: 2, point: { x: ent.center.x - ent.radius, y: ent.center.y }, kind: 'quadrant' });
      grips.push({ entityId: ent.id, gripIndex: 3, point: { x: ent.center.x, y: ent.center.y + ent.radius }, kind: 'quadrant' });
      grips.push({ entityId: ent.id, gripIndex: 4, point: { x: ent.center.x, y: ent.center.y - ent.radius }, kind: 'quadrant' });
      break;
    case 'arc': {
      const sPt = { x: ent.center.x + ent.radius * Math.cos(ent.startAngle), y: ent.center.y + ent.radius * Math.sin(ent.startAngle) };
      const ePt = { x: ent.center.x + ent.radius * Math.cos(ent.endAngle), y: ent.center.y + ent.radius * Math.sin(ent.endAngle) };
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.center, kind: 'center' });
      grips.push({ entityId: ent.id, gripIndex: 1, point: sPt, kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 2, point: ePt, kind: 'vertex' });
      break;
    }
    case 'rectangle': {
      const c = getRectangleCorners(ent);
      grips.push({ entityId: ent.id, gripIndex: 0, point: c[0], kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 1, point: c[1], kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 2, point: c[2], kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 3, point: c[3], kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 4, point: mid(ent.p1, ent.p2), kind: 'center' });
      break;
    }
    case 'polygon':
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.center, kind: 'center' });
      grips.push({ entityId: ent.id, gripIndex: 1, point: getPolygonVertices(ent)[0], kind: 'vertex' });
      break;
    case 'ellipse': {
      const c = Math.cos(ent.rotation), s = Math.sin(ent.rotation);
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.center, kind: 'center' });
      grips.push({ entityId: ent.id, gripIndex: 1, point: { x: ent.center.x + ent.rx * c, y: ent.center.y + ent.rx * s }, kind: 'quadrant' });
      grips.push({ entityId: ent.id, gripIndex: 2, point: { x: ent.center.x - ent.ry * s, y: ent.center.y + ent.ry * c }, kind: 'quadrant' });
      break;
    }
    case 'spline':
      ent.controlPoints.forEach((p, idx) => {
        grips.push({ entityId: ent.id, gripIndex: idx, point: p, kind: 'vertex' });
      });
      break;
    case 'point':
    case 'text':
    case 'mtext':
    case 'block_ref':
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.position, kind: 'vertex' });
      break;
    case 'dimension':
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.p1, kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 1, point: ent.p2, kind: 'vertex' });
      grips.push({ entityId: ent.id, gripIndex: 2, point: ent.textPosition, kind: 'stretch' });
      break;
    case 'leader':
      ent.points.forEach((p, idx) => grips.push({ entityId: ent.id, gripIndex: idx, point: p, kind: 'vertex' }));
      break;
    case 'solid3d':
      grips.push({ entityId: ent.id, gripIndex: 0, point: { x: ent.position.x, y: ent.position.y }, kind: 'center' });
      break;
    case 'table':
      grips.push({ entityId: ent.id, gripIndex: 0, point: ent.position, kind: 'vertex' });
      grips.push({
        entityId: ent.id,
        gripIndex: 1,
        point: { x: ent.position.x + ent.cols * ent.colWidth, y: ent.position.y - ent.rows * ent.rowHeight },
        kind: 'stretch',
      });
      break;
  }
  return grips;
}

// Apply grip drag mutation to entity
export function applyGripMove(ent: CadEntity, gripIndex: number, newPt: Point2D): CadEntity {
  if (ent.fixed) return ent;
  switch (ent.type) {
    case 'line':
      if (gripIndex === 0) return { ...ent, start: newPt };
      if (gripIndex === 2) return { ...ent, end: newPt };
      if (gripIndex === 1) {
        const m = mid(ent.start, ent.end);
        const dx = newPt.x - m.x, dy = newPt.y - m.y;
        return {
          ...ent,
          start: { x: ent.start.x + dx, y: ent.start.y + dy },
          end: { x: ent.end.x + dx, y: ent.end.y + dy },
        };
      }
      return ent;
    case 'polyline': {
      const pts = [...ent.points];
      if (gripIndex >= 0 && gripIndex < pts.length) pts[gripIndex] = newPt;
      return { ...ent, points: pts };
    }
    case 'circle':
      if (gripIndex === 0) return { ...ent, center: newPt };
      return { ...ent, radius: Math.max(0.1, dist(ent.center, newPt)) };
    case 'arc':
      if (gripIndex === 0) return { ...ent, center: newPt };
      if (gripIndex === 1) return { ...ent, startAngle: normAngle(angleBetween(ent.center, newPt)), radius: Math.max(0.1, dist(ent.center, newPt)) };
      if (gripIndex === 2) return { ...ent, endAngle: normAngle(angleBetween(ent.center, newPt)), radius: Math.max(0.1, dist(ent.center, newPt)) };
      return ent;
    case 'rectangle': {
      const m = mid(ent.p1, ent.p2);
      if (gripIndex === 4) {
        const dx = newPt.x - m.x, dy = newPt.y - m.y;
        return { ...ent, p1: { x: ent.p1.x + dx, y: ent.p1.y + dy }, p2: { x: ent.p2.x + dx, y: ent.p2.y + dy } };
      }
      const rot = ent.rotation || 0;
      if (Math.abs(rot) < 1e-6) {
        if (gripIndex === 0) return { ...ent, p1: newPt };
        if (gripIndex === 1) return { ...ent, p1: { x: ent.p1.x, y: newPt.y }, p2: { x: newPt.x, y: ent.p2.y } };
        if (gripIndex === 2) return { ...ent, p2: newPt };
        if (gripIndex === 3) return { ...ent, p1: { x: newPt.x, y: ent.p1.y }, p2: { x: ent.p2.x, y: newPt.y } };
        return ent;
      }
      // Keep opposite corner fixed in world coordinates while resizing along local axes
      const corners = getRectangleCorners(ent);
      const oppWorld = corners[(gripIndex + 2) % 4];
      const newCenterWorld = mid(newPt, oppWorld);
      const localNew = rotatePoint(newPt, newCenterWorld, -rot);
      const localOpp = rotatePoint(oppWorld, newCenterWorld, -rot);
      const hw = Math.max(0.5, Math.abs(localNew.x - localOpp.x) / 2);
      const hh = Math.max(0.5, Math.abs(localNew.y - localOpp.y) / 2);
      return {
        ...ent,
        p1: { x: newCenterWorld.x - hw, y: newCenterWorld.y - hh },
        p2: { x: newCenterWorld.x + hw, y: newCenterWorld.y + hh },
      };
    }
    case 'polygon':
      if (gripIndex === 0) return { ...ent, center: newPt };
      return { ...ent, radius: Math.max(0.1, dist(ent.center, newPt)), rotation: angleBetween(ent.center, newPt) };
    case 'ellipse':
      if (gripIndex === 0) return { ...ent, center: newPt };
      if (gripIndex === 1) return { ...ent, rx: Math.max(0.1, dist(ent.center, newPt)), rotation: angleBetween(ent.center, newPt) };
      if (gripIndex === 2) return { ...ent, ry: Math.max(0.1, dist(ent.center, newPt)) };
      return ent;
    case 'spline': {
      const pts = [...ent.controlPoints];
      if (gripIndex >= 0 && gripIndex < pts.length) pts[gripIndex] = newPt;
      return { ...ent, controlPoints: pts };
    }
    case 'point':
    case 'text':
    case 'mtext':
    case 'block_ref':
      return { ...ent, position: newPt };
    case 'dimension':
      if (gripIndex === 0) return { ...ent, p1: newPt };
      if (gripIndex === 1) return { ...ent, p2: newPt };
      if (gripIndex === 2) return { ...ent, textPosition: newPt };
      return ent;
    case 'leader': {
      const pts = [...ent.points];
      if (gripIndex >= 0 && gripIndex < pts.length) pts[gripIndex] = newPt;
      return { ...ent, points: pts };
    }
    case 'solid3d':
      return { ...ent, position: { ...ent.position, x: newPt.x, y: newPt.y } };
    case 'table':
      if (gripIndex === 0) return { ...ent, position: newPt };
      if (gripIndex === 1) {
        const cw = Math.max(15, (newPt.x - ent.position.x) / ent.cols);
        const rh = Math.max(8, (ent.position.y - newPt.y) / ent.rows);
        return { ...ent, colWidth: cw, rowHeight: rh };
      }
      return ent;
    default:
      return ent;
  }
}
