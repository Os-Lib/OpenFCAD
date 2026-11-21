import * as THREE from 'three';
import { Point2D, Solid3DEntity } from '../types/cad';
import { genId } from './math';

export interface LocalSolidGeometryResult {
  geometry: THREE.BufferGeometry;
  meshPosition: [number, number, number];
}

export function buildLocalSolidGeometry(ent: Solid3DEntity, radialSegments = 28): LocalSolidGeometryResult {
  const { x, y, z: pz } = ent.position;

  if (ent.primitive === 'box') {
    const geo = new THREE.BoxGeometry(Math.max(0.5, ent.size.x), Math.max(0.5, ent.size.y), Math.max(0.5, ent.size.z));
    return { geometry: geo, meshPosition: [x, y, pz + ent.size.z / 2] };
  }
  if (ent.primitive === 'cylinder') {
    const geo = new THREE.CylinderGeometry(
      Math.max(0.5, ent.size.y || ent.size.x),
      Math.max(0.5, ent.size.x),
      Math.max(0.5, ent.size.z),
      radialSegments
    );
    geo.rotateX(Math.PI / 2);
    return { geometry: geo, meshPosition: [x, y, pz + ent.size.z / 2] };
  }
  if (ent.primitive === 'sphere') {
    const geo = new THREE.SphereGeometry(Math.max(0.5, ent.size.x), radialSegments, Math.max(10, Math.round(radialSegments * 0.75)));
    return { geometry: geo, meshPosition: [x, y, pz] };
  }
  if (ent.primitive === 'cone') {
    const geo = new THREE.ConeGeometry(Math.max(0.5, ent.size.x), Math.max(0.5, ent.size.z), radialSegments);
    geo.rotateX(Math.PI / 2);
    return { geometry: geo, meshPosition: [x, y, pz + ent.size.z / 2] };
  }
  if (ent.primitive === 'pyramid') {
    const geo = new THREE.ConeGeometry(Math.max(0.5, ent.size.x * 0.72), Math.max(0.5, ent.size.z), 4);
    geo.rotateX(Math.PI / 2);
    return { geometry: geo, meshPosition: [x, y, pz + ent.size.z / 2] };
  }
  if (ent.primitive === 'torus') {
    const geo = new THREE.TorusGeometry(Math.max(1, ent.size.x), Math.max(1, ent.size.y), Math.max(10, Math.round(radialSegments * 0.65)), radialSegments);
    return { geometry: geo, meshPosition: [x, y, pz] };
  }
  if (ent.primitive === 'extrude' && ent.profile && ent.profile.length >= 3) {
    const shape = new THREE.Shape(ent.profile.map((p) => new THREE.Vector2(p.x, p.y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: ent.extrudeHeight || 80, bevelEnabled: false });
    return { geometry: geo, meshPosition: [x, y, pz] };
  }
  if (ent.primitive === 'mesh' && ent.meshPositions && ent.meshPositions.length >= 9) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(ent.meshPositions, 3));
    if (ent.meshNormals && ent.meshNormals.length === ent.meshPositions.length) {
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(ent.meshNormals, 3));
    } else {
      geo.computeVertexNormals();
    }
    return { geometry: geo, meshPosition: [x, y, pz] };
  }
  const fallback = new THREE.BoxGeometry(Math.max(1, ent.size.x), Math.max(1, ent.size.y), Math.max(1, ent.size.z));
  return { geometry: fallback, meshPosition: [x, y, pz] };
}

export function buildThreeGeometryForSolid(ent: Solid3DEntity, radialSegments = 24): THREE.BufferGeometry {
  const { geometry, meshPosition } = buildLocalSolidGeometry(ent, radialSegments);
  const nonIdx = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  if (geometry !== nonIdx) geometry.dispose();

  const euler = new THREE.Euler(ent.rotation.x, ent.rotation.y, ent.rotation.z, 'XYZ');
  const quat = new THREE.Quaternion().setFromEuler(euler);
  const mat = new THREE.Matrix4().compose(
    new THREE.Vector3(meshPosition[0], meshPosition[1], meshPosition[2]),
    quat,
    new THREE.Vector3(1, 1, 1)
  );
  nonIdx.applyMatrix4(mat);
  nonIdx.computeVertexNormals();
  return nonIdx;
}

// ============================================================================
// Pure TypeScript BSP CSG Engine (Union, Subtract, Intersect)
// ============================================================================
const CSG_EPS = 1e-4;
const MAX_BSP_DEPTH = 64;

class CSGVec {
  constructor(public x: number, public y: number, public z: number) {}
  clone() { return new CSGVec(this.x, this.y, this.z); }
  negated() { return new CSGVec(-this.x, -this.y, -this.z); }
  plus(a: CSGVec) { return new CSGVec(this.x + a.x, this.y + a.y, this.z + a.z); }
  minus(a: CSGVec) { return new CSGVec(this.x - a.x, this.y - a.y, this.z - a.z); }
  times(s: number) { return new CSGVec(this.x * s, this.y * s, this.z * s); }
  dot(a: CSGVec) { return this.x * a.x + this.y * a.y + this.z * a.z; }
  cross(a: CSGVec) {
    return new CSGVec(
      this.y * a.z - this.z * a.y,
      this.z * a.x - this.x * a.z,
      this.x * a.y - this.y * a.x
    );
  }
  len() { return Math.hypot(this.x, this.y, this.z); }
  unit() {
    const l = this.len();
    return l > 1e-9 ? this.times(1 / l) : new CSGVec(0, 0, 1);
  }
  lerp(a: CSGVec, t: number) { return this.plus(a.minus(this).times(t)); }
}

class CSGPlane {
  constructor(public normal: CSGVec, public w: number) {}
  static fromPoints(a: CSGVec, b: CSGVec, c: CSGVec): CSGPlane | null {
    const cr = b.minus(a).cross(c.minus(a));
    const len = cr.len();
    if (len < 1e-8) return null;
    const n = cr.times(1 / len);
    return new CSGPlane(n, n.dot(a));
  }
  clone() { return new CSGPlane(this.normal.clone(), this.w); }
  flip() {
    this.normal = this.normal.negated();
    this.w = -this.w;
  }
  splitPolygon(
    polygon: CSGPolygon,
    coplanarFront: CSGPolygon[],
    coplanarBack: CSGPolygon[],
    front: CSGPolygon[],
    back: CSGPolygon[]
  ) {
    const COPLANAR = 0;
    const FRONT = 1;
    const BACK = 2;
    const SPANNING = 3;

    let polygonType = 0;
    const types: number[] = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      const t = this.normal.dot(polygon.vertices[i]) - this.w;
      const type = t < -CSG_EPS ? BACK : t > CSG_EPS ? FRONT : COPLANAR;
      polygonType |= type;
      types.push(type);
    }

    switch (polygonType) {
      case COPLANAR:
        (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
        break;
      case FRONT:
        front.push(polygon);
        break;
      case BACK:
        back.push(polygon);
        break;
      case SPANNING: {
        const f: CSGVec[] = [];
        const b: CSGVec[] = [];
        for (let i = 0; i < polygon.vertices.length; i++) {
          const j = (i + 1) % polygon.vertices.length;
          const ti = types[i], tj = types[j];
          const vi = polygon.vertices[i], vj = polygon.vertices[j];
          if (ti !== BACK) f.push(vi);
          if (ti !== FRONT) b.push(ti !== BACK ? vi.clone() : vi);
          if ((ti | tj) === SPANNING) {
            const denom = this.normal.dot(vj.minus(vi));
            const t = Math.abs(denom) > 1e-9 ? (this.w - this.normal.dot(vi)) / denom : 0.5;
            const v = vi.lerp(vj, Math.max(0, Math.min(1, t)));
            f.push(v);
            b.push(v.clone());
          }
        }
        if (f.length >= 3) {
          const pf = CSGPolygon.tryCreate(f);
          if (pf) front.push(pf);
        }
        if (b.length >= 3) {
          const pb = CSGPolygon.tryCreate(b);
          if (pb) back.push(pb);
        }
        break;
      }
    }
  }
}

class CSGPolygon {
  constructor(public vertices: CSGVec[], public plane: CSGPlane) {}
  static tryCreate(vertices: CSGVec[]): CSGPolygon | null {
    if (vertices.length < 3) return null;
    for (let i = 2; i < vertices.length; i++) {
      const p = CSGPlane.fromPoints(vertices[0], vertices[i - 1], vertices[i]);
      if (p) return new CSGPolygon(vertices, p);
    }
    return null;
  }
  clone() { return new CSGPolygon(this.vertices.map((v) => v.clone()), this.plane.clone()); }
  flip() {
    this.vertices.reverse();
    this.plane.flip();
  }
}

class BSPNode {
  plane: CSGPlane | null = null;
  front: BSPNode | null = null;
  back: BSPNode | null = null;
  polygons: CSGPolygon[] = [];

  constructor(polygons?: CSGPolygon[], depth = 0) {
    if (polygons && polygons.length > 0) this.build(polygons, depth);
  }

  clone(): BSPNode {
    const n = new BSPNode();
    n.plane = this.plane ? this.plane.clone() : null;
    n.front = this.front ? this.front.clone() : null;
    n.back = this.back ? this.back.clone() : null;
    n.polygons = this.polygons.map((p) => p.clone());
    return n;
  }

  invert() {
    for (const p of this.polygons) p.flip();
    if (this.plane) this.plane.flip();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    const tmp = this.front;
    this.front = this.back;
    this.back = tmp;
  }

  clipPolygons(polygons: CSGPolygon[], depth = 0): CSGPolygon[] {
    if (!this.plane || depth > MAX_BSP_DEPTH) return polygons.slice();
    let front: CSGPolygon[] = [];
    let back: CSGPolygon[] = [];
    for (const p of polygons) {
      this.plane.splitPolygon(p, front, back, front, back);
    }
    if (this.front) front = this.front.clipPolygons(front, depth + 1);
    if (this.back) back = this.back.clipPolygons(back, depth + 1);
    else back = [];
    return front.concat(back);
  }

  clipTo(bsp: BSPNode) {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(bsp);
    if (this.back) this.back.clipTo(bsp);
  }

  allPolygons(): CSGPolygon[] {
    let list = this.polygons.slice();
    if (this.front) list = list.concat(this.front.allPolygons());
    if (this.back) list = list.concat(this.back.allPolygons());
    return list;
  }

  build(polygons: CSGPolygon[], depth = 0) {
    if (polygons.length === 0) return;
    if (!this.plane) {
      // Pick middle polygon to keep BSP relatively balanced
      this.plane = polygons[Math.floor(polygons.length / 2)].plane.clone();
    }
    if (depth >= MAX_BSP_DEPTH) {
      this.polygons = this.polygons.concat(polygons);
      return;
    }
    const front: CSGPolygon[] = [];
    const back: CSGPolygon[] = [];
    for (const p of polygons) {
      this.plane.splitPolygon(p, this.polygons, this.polygons, front, back);
    }
    if (front.length > 0) {
      if (!this.front) this.front = new BSPNode();
      this.front.build(front, depth + 1);
    }
    if (back.length > 0) {
      if (!this.back) this.back = new BSPNode();
      this.back.build(back, depth + 1);
    }
  }
}

function geometryToCSGPolygons(geo: THREE.BufferGeometry): CSGPolygon[] {
  const nonIdx = geo.index ? geo.toNonIndexed() : geo;
  const pos = nonIdx.getAttribute('position');
  const polys: CSGPolygon[] = [];
  for (let i = 0; i + 2 < pos.count; i += 3) {
    const a = new CSGVec(pos.getX(i), pos.getY(i), pos.getZ(i));
    const b = new CSGVec(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
    const c = new CSGVec(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
    const poly = CSGPolygon.tryCreate([a, b, c]);
    if (poly) polys.push(poly);
  }
  if (nonIdx !== geo) nonIdx.dispose();
  return polys;
}

function polygonsToCenteredSolid(polygons: CSGPolygon[], template: Solid3DEntity): Solid3DEntity | null {
  if (polygons.length === 0) return null;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  const worldTris: number[] = [];
  for (const poly of polygons) {
    const verts = poly.vertices;
    if (verts.length < 3) continue;
    for (let i = 2; i < verts.length; i++) {
      const tri = [verts[0], verts[i - 1], verts[i]];
      for (const v of tri) {
        if (v.x < minX) minX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.z < minZ) minZ = v.z;
        if (v.x > maxX) maxX = v.x;
        if (v.y > maxY) maxY = v.y;
        if (v.z > maxZ) maxZ = v.z;
        worldTris.push(v.x, v.y, v.z);
      }
    }
  }
  if (worldTris.length < 9 || !Number.isFinite(minX)) return null;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = minZ;
  const localTris: number[] = [];
  for (let i = 0; i < worldTris.length; i += 3) {
    localTris.push(worldTris[i] - cx, worldTris[i + 1] - cy, worldTris[i + 2] - cz);
  }

  return {
    id: genId('solid3d'),
    type: 'solid3d',
    layer: template.layer,
    color: template.color,
    lineType: template.lineType,
    lineTypeScale: template.lineTypeScale,
    lineWeight: template.lineWeight,
    primitive: 'mesh',
    position: { x: cx, y: cy, z: cz },
    size: {
      x: Math.max(1, maxX - minX),
      y: Math.max(1, maxY - minY),
      z: Math.max(1, maxZ - minZ),
    },
    rotation: { x: 0, y: 0, z: 0 },
    meshPositions: localTris,
  };
}

export function performBoolean3D(
  aEnt: Solid3DEntity,
  bEnt: Solid3DEntity,
  op: 'union' | 'subtract' | 'intersect'
): Solid3DEntity | null {
  const geoA = buildThreeGeometryForSolid(aEnt, 14);
  const geoB = buildThreeGeometryForSolid(bEnt, 14);
  const polysA = geometryToCSGPolygons(geoA);
  const polysB = geometryToCSGPolygons(geoB);
  geoA.dispose();
  geoB.dispose();

  if (polysA.length === 0 || polysB.length === 0) return null;

  const a = new BSPNode(polysA);
  const b = new BSPNode(polysB);

  if (op === 'union') {
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
  } else if (op === 'subtract') {
    a.invert();
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    a.invert();
  } else {
    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();
  }

  return polygonsToCenteredSolid(a.allPolygons(), aEnt);
}

export function revolve2DToSolid3D(
  profile: Point2D[],
  axisX: number,
  segments: number,
  baseProps: Pick<Solid3DEntity, 'layer' | 'color' | 'lineType' | 'lineTypeScale' | 'lineWeight'>
): Solid3DEntity | null {
  if (profile.length < 2) return null;
  // LatheGeometry revolves Vector2(radius, y_height) around +Y; rotate X +90° to align axis to +Z
  const lathePts = profile.map((p) => new THREE.Vector2(Math.max(0.2, Math.abs(p.x - axisX)), p.y));
  const geo = new THREE.LatheGeometry(lathePts, Math.max(8, segments));
  geo.rotateX(Math.PI / 2);
  const nonIdx = geo.index ? geo.toNonIndexed() : geo;
  const pos = nonIdx.getAttribute('position');

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  const raw: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i) + axisX;
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    if (vx < minX) minX = vx;
    if (vy < minY) minY = vy;
    if (vz < minZ) minZ = vz;
    if (vx > maxX) maxX = vx;
    if (vy > maxY) maxY = vy;
    if (vz > maxZ) maxZ = vz;
    raw.push(vx, vy, vz);
  }
  geo.dispose();
  if (nonIdx !== geo) nonIdx.dispose();

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = minZ;
  const localTris: number[] = [];
  for (let i = 0; i < raw.length; i += 3) {
    localTris.push(raw[i] - cx, raw[i + 1] - cy, raw[i + 2] - cz);
  }

  return {
    ...baseProps,
    id: genId('solid3d'),
    type: 'solid3d',
    primitive: 'mesh',
    position: { x: cx, y: cy, z: cz },
    size: {
      x: Math.max(1, maxX - minX),
      y: Math.max(1, maxY - minY),
      z: Math.max(1, maxZ - minZ),
    },
    rotation: { x: 0, y: 0, z: 0 },
    meshPositions: localTris,
  };
}
