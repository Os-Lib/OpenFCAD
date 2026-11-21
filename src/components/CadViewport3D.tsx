import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { CadEntity, Point2D } from '../types/cad';
import { getPolygonVertices, getRectangleCorners, rotatePoint, sampleEllipse, samplePolyline, sampleSpline } from '../engine/math';
import { isEntityVisible, resolveEntityColor } from '../engine/osnap';
import { buildLocalSolidGeometry } from '../engine/csg3d';

export const CadViewport3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const settings = useCadStore((s) => s.settings);
  const command = useCadStore((s) => s.command);
  const theme = useCadStore((s) => s.theme);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const entityGroupRef = useRef<THREE.Group | null>(null);
  const dragRef = useRef<{ mode: 'none' | 'orbit' | 'pan'; x: number; y: number; moved: boolean }>({
    mode: 'none',
    x: 0,
    y: 0,
    moved: false,
  });

  // Sync camera spherical coords from store
  const syncCamera = () => {
    const cam = cameraRef.current;
    const d = useCadStore.getState().getActiveDoc();
    if (!cam || !d) return;
    const { orbitAzimuth, orbitPolar, orbitDistance, orbitTarget } = d.camera;
    const r = Math.max(40, orbitDistance);
    const sinP = Math.sin(orbitPolar);
    // Z-up CAD convention!
    const x = orbitTarget.x + r * sinP * Math.sin(orbitAzimuth);
    const y = orbitTarget.y - r * sinP * Math.cos(orbitAzimuth);
    const z = orbitTarget.z + r * Math.cos(orbitPolar);
    cam.up.set(0, 0, 1);
    cam.position.set(x, y, z);
    cam.lookAt(orbitTarget.x, orbitTarget.y, orbitTarget.z);
    rendererRef.current?.render(sceneRef.current!, cam);
  };

  // Init WebGL Renderer & Scene once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / Math.max(1, el.clientHeight), 1, 50000);
    camera.up.set(0, 0, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.innerHTML = '';
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting (studio CAD 3-point lighting)
    const amb = new THREE.AmbientLight(0xdbeafe, 0.72);
    scene.add(amb);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.05);
    dir1.position.set(500, -450, 750);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x93c5fd, 0.45);
    dir2.position.set(-500, 450, 300);
    scene.add(dir2);

    // XY Ground Grid (rotated into XY plane since Z is up)
    const grid = new THREE.GridHelper(2000, 40, 0x3b4d63, 0x2a3442);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    // 3D XYZ World Axes (X=Red, Y=Green, Z=Blue)
    const axisLen = 250;
    const mkAxis = (to: [number, number, number], col: number) => {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(...to)]);
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color: col }));
    };
    scene.add(mkAxis([axisLen, 0, 0], 0xd04242));
    scene.add(mkAxis([0, axisLen, 0], 0x46b256));
    scene.add(mkAxis([0, 0, axisLen], 0x38abdf));

    const group = new THREE.Group();
    scene.add(group);
    entityGroupRef.current = group;

    const obs = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
      syncCamera();
    });
    obs.observe(el);

    return () => {
      obs.disconnect();
      renderer.dispose();
    };
  }, []);

  // Rebuild 3D geometry when entities, layers, visual style, or selection changes
  useEffect(() => {
    const scene = sceneRef.current;
    const group = entityGroupRef.current;
    if (!scene || !group || !doc) return;

    scene.background = new THREE.Color(theme === 'dark' ? '#1E252E' : '#EBF0F6');

    // Clear & dispose previous meshes, materials, textures
    const disposeObject = (obj: THREE.Object3D) => {
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      const mat = (obj as any).material;
      if (mat) {
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const m of mats) {
          if (m.map && typeof m.map.dispose === 'function') m.map.dispose();
          if (typeof m.dispose === 'function') m.dispose();
        }
      }
    };
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      obj.traverse(disposeObject);
    }

    const style = doc.camera.visualStyle;
    const isWire = style === '3dwireframe';
    const isXray = style === 'xray';
    const showEdges = style === 'shadedEdges' || style === 'conceptual' || isXray;
    const selectedSet = new Set(doc.selectedIds);

    const makeMaterial = (hex: string, selected: boolean) => {
      const col = new THREE.Color(selected ? '#4CC9F0' : hex);
      if (isWire) {
        return new THREE.MeshBasicMaterial({ color: col, wireframe: true });
      }
      if (isXray) {
        return new THREE.MeshPhongMaterial({
          color: col,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
      }
      if (style === 'conceptual') {
        return new THREE.MeshLambertMaterial({ color: col, flatShading: true, side: THREE.DoubleSide });
      }
      if (style === 'realistic') {
        return new THREE.MeshStandardMaterial({ color: col, roughness: 0.38, metalness: 0.18, side: THREE.DoubleSide });
      }
      return new THREE.MeshPhongMaterial({ color: col, shininess: 40, side: THREE.DoubleSide });
    };

    const addSolidMesh = (geom: THREE.BufferGeometry, ent: CadEntity, pos: [number, number, number], rot: [number, number, number]) => {
      const selected = selectedSet.has(ent.id);
      const col = resolveEntityColor(ent, doc.layers);
      const mat = makeMaterial(col, selected);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.userData.entityId = ent.id;
      group.add(mesh);

      if (showEdges && !isWire) {
        const edges = new THREE.EdgesGeometry(geom, 24);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: selected ? 0x38abdf : 0x0f172a, transparent: true, opacity: 0.85 })
        );
        mesh.add(line);
      }
    };

    const add2DLineLoop = (pts: Point2D[], z: number, colHex: string, closed: boolean, ent: CadEntity) => {
      if (pts.length < 2) return;
      const vecs = pts.map((p) => new THREE.Vector3(p.x, p.y, z));
      if (closed) vecs.push(vecs[0].clone());
      const g = new THREE.BufferGeometry().setFromPoints(vecs);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: selectedSet.has(ent.id) ? '#4CC9F0' : colHex }));
      line.userData.entityId = ent.id;
      group.add(line);

      // 2.5D Wall Thickness Auto-Extrusion in 3D view!
      if (closed && ent.thickness && ent.thickness > 0 && pts.length >= 3) {
        const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, p.y)));
        const extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: ent.thickness, bevelEnabled: false });
        addSolidMesh(extrudeGeo, ent, [0, 0, z], [0, 0, 0]);
      }
    };

    const addTextSprite = (text: string, pos: Point2D, z: number, height: number, colHex: string, entId: string) => {
      const firstLine = (text || '').split('\n')[0] || '';
      if (!firstLine.trim()) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const fontPx = 42;
      ctx.font = `600 ${fontPx}px "Segoe UI", Arial, sans-serif`;
      const tw = Math.max(32, Math.ceil(ctx.measureText(firstLine).width) + 24);
      const th = 64;
      canvas.width = tw;
      canvas.height = th;
      ctx.font = `600 ${fontPx}px "Segoe UI", Arial, sans-serif`;
      ctx.fillStyle = selectedSet.has(entId) ? '#4CC9F0' : colHex;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(firstLine, tw / 2, th / 2);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      const worldH = Math.max(8, height * 1.35);
      sprite.scale.set((tw / th) * worldH, worldH, 1);
      sprite.position.set(pos.x, pos.y, z + worldH * 0.55);
      sprite.userData.entityId = entId;
      group.add(sprite);
    };

    const renderEntity3D = (ent: CadEntity, mapPt: (p: Point2D) => Point2D = (p) => p, parentBlockColor?: string) => {
      let col = resolveEntityColor(ent, doc.layers);
      if (parentBlockColor && ent.layer === '0' && ent.color === 'ByLayer') {
        col = parentBlockColor;
      }
      const z = ent.elevation || 0;

      if (ent.type === 'solid3d') {
        const { geometry, meshPosition } = buildLocalSolidGeometry(ent, 28);
        const rot: [number, number, number] = [ent.rotation.x, ent.rotation.y, ent.rotation.z];
        addSolidMesh(geometry, ent, meshPosition, rot);
      } else if (ent.type === 'line') {
        add2DLineLoop([mapPt(ent.start), mapPt(ent.end)], z, col, false, ent);
      } else if (ent.type === 'polyline') {
        const pts = ent.bulges?.some((b) => Math.abs(b) > 1e-6) ? samplePolyline(ent, 16) : ent.points;
        add2DLineLoop(pts.map(mapPt), z, col, ent.closed, ent);
      } else if (ent.type === 'rectangle') {
        add2DLineLoop(getRectangleCorners(ent).map(mapPt), z, col, true, ent);
      } else if (ent.type === 'polygon') {
        add2DLineLoop(getPolygonVertices(ent).map(mapPt), z, col, true, ent);
      } else if (ent.type === 'circle') {
        const pts = Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          return mapPt({ x: ent.center.x + ent.radius * Math.cos(a), y: ent.center.y + ent.radius * Math.sin(a) });
        });
        add2DLineLoop(pts, z, col, true, ent);
      } else if (ent.type === 'ellipse') {
        add2DLineLoop(sampleEllipse(ent, 48).map(mapPt), z, col, true, ent);
      } else if (ent.type === 'spline') {
        add2DLineLoop(sampleSpline(ent.controlPoints, ent.closed, 10).map(mapPt), z, col, ent.closed, ent);
      } else if (ent.type === 'arc') {
        let sweep = (ent.endAngle - ent.startAngle) % (Math.PI * 2);
        if (sweep <= 0) sweep += Math.PI * 2;
        const pts = Array.from({ length: 24 }, (_, i) => {
          const a = ent.startAngle + (sweep * i) / 23;
          return mapPt({ x: ent.center.x + ent.radius * Math.cos(a), y: ent.center.y + ent.radius * Math.sin(a) });
        });
        add2DLineLoop(pts, z, col, false, ent);
      } else if (ent.type === 'hatch') {
        add2DLineLoop(ent.boundary.map(mapPt), z, col, true, ent);
      } else if (ent.type === 'point') {
        const p = mapPt(ent.position);
        const s = 6;
        add2DLineLoop([{ x: p.x - s, y: p.y }, { x: p.x + s, y: p.y }], z, col, false, ent);
        add2DLineLoop([{ x: p.x, y: p.y - s }, { x: p.x, y: p.y + s }], z, col, false, ent);
      } else if (ent.type === 'dimension') {
        if (ent.kind === 'linear') {
          const horizontal = Math.abs(ent.p2.x - ent.p1.x) >= Math.abs(ent.p2.y - ent.p1.y);
          const d1 = horizontal ? { x: ent.p1.x, y: ent.textPosition.y } : { x: ent.textPosition.x, y: ent.p1.y };
          const d2 = horizontal ? { x: ent.p2.x, y: ent.textPosition.y } : { x: ent.textPosition.x, y: ent.p2.y };
          add2DLineLoop([mapPt(ent.p1), mapPt(d1), mapPt(d2), mapPt(ent.p2)], z, col, false, ent);
        } else {
          add2DLineLoop([mapPt(ent.p1), mapPt(ent.p2)], z, col, false, ent);
        }
      } else if (ent.type === 'leader') {
        add2DLineLoop(ent.points.map(mapPt), z, col, false, ent);
        const last = ent.points[ent.points.length - 1];
        if (last) addTextSprite(ent.text, mapPt(last), z, ent.textHeight, col, ent.id);
      } else if (ent.type === 'table') {
        const w = ent.cols * ent.colWidth;
        const h = ent.rows * ent.rowHeight;
        for (let r = 0; r <= ent.rows; r++) {
          const y = ent.position.y - r * ent.rowHeight;
          add2DLineLoop([mapPt({ x: ent.position.x, y }), mapPt({ x: ent.position.x + w, y })], z, col, false, ent);
        }
        for (let c = 0; c <= ent.cols; c++) {
          const x = ent.position.x + c * ent.colWidth;
          add2DLineLoop([mapPt({ x, y: ent.position.y }), mapPt({ x, y: ent.position.y - h })], z, col, false, ent);
        }
      } else if (ent.type === 'text' || ent.type === 'mtext') {
        addTextSprite(ent.content, mapPt(ent.position), z, ent.height, col, ent.id);
      } else if (ent.type === 'block_ref') {
        const def = doc.blocks[ent.blockName];
        if (!def) return;
        const nextMap = (p: Point2D): Point2D => {
          const lx = (p.x - def.basePoint.x) * ent.scaleX;
          const ly = (p.y - def.basePoint.y) * ent.scaleY;
          const rp = rotatePoint({ x: lx, y: ly }, { x: 0, y: 0 }, ent.rotation);
          return mapPt({ x: ent.position.x + rp.x, y: ent.position.y + rp.y });
        };
        for (const sub of def.entities) {
          renderEntity3D(sub, nextMap, col);
        }
      }
    };

    for (const ent of doc.entities) {
      if (!isEntityVisible(ent, doc.layers)) continue;
      renderEntity3D(ent);
    }

    syncCamera();
  }, [doc?.entities, doc?.layers, doc?.blocks, doc?.selectedIds, doc?.camera.visualStyle, theme, settings.modelBgColor]);

  // Re-render when camera changes
  useEffect(() => {
    syncCamera();
  }, [
    doc?.camera.orbitAzimuth,
    doc?.camera.orbitPolar,
    doc?.camera.orbitDistance,
    doc?.camera.orbitTarget.x,
    doc?.camera.orbitTarget.y,
    doc?.camera.orbitTarget.z,
  ]);

  const raycastXY = (e: React.MouseEvent<HTMLDivElement>): Point2D | null => {
    if (!mountRef.current || !cameraRef.current) return null;
    const rect = mountRef.current.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, cameraRef.current);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, hit)) {
      return { x: hit.x, y: hit.y };
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      dragRef.current = { mode: 'orbit', x: e.clientX, y: e.clientY, moved: false };
    } else if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      dragRef.current = { mode: 'pan', x: e.clientX, y: e.clientY, moved: false };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!doc) return;
    if (dragRef.current.mode === 'none') {
      if (command) {
        const pt = raycastXY(e);
        if (pt) useCadStore.getState().setCursorWorld(pt);
      }
      return;
    }
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;

    if (dragRef.current.mode === 'orbit') {
      const nextAz = doc.camera.orbitAzimuth - dx * 0.008;
      const nextPol = Math.max(0.06, Math.min(Math.PI - 0.06, doc.camera.orbitPolar - dy * 0.008));
      useCadStore.getState().updateCamera({ orbitAzimuth: nextAz, orbitPolar: nextPol });
    } else if (dragRef.current.mode === 'pan') {
      const panScale = doc.camera.orbitDistance * 0.0014;
      const az = doc.camera.orbitAzimuth;
      const rightX = Math.cos(az), rightY = Math.sin(az);
      useCadStore.getState().updateCamera({
        orbitTarget: {
          x: doc.camera.orbitTarget.x - dx * rightX * panScale,
          y: doc.camera.orbitTarget.y - dx * rightY * panScale,
          z: doc.camera.orbitTarget.z + dy * panScale,
        },
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const wasClick = dragRef.current.mode === 'orbit' && !dragRef.current.moved;
    dragRef.current.mode = 'none';
    if (wasClick && doc) {
      if (command) {
        const pt = raycastXY(e);
        if (pt) {
          useCadStore.getState().submitCanvasClick(pt, Math.max(5, doc.camera.orbitDistance * 0.015), e.shiftKey);
        }
        return;
      }
      if (mountRef.current && cameraRef.current && entityGroupRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, cameraRef.current);
        const hits = raycaster.intersectObjects(entityGroupRef.current.children, true);
        const picked = hits.find((h) => h.object.userData?.entityId || h.object.parent?.userData?.entityId);
        if (picked) {
          const id = picked.object.userData?.entityId || picked.object.parent?.userData?.entityId;
          useCadStore.getState().setSelection([id], e.shiftKey ? 'toggle' : 'replace');
        } else {
          useCadStore.getState().clearSelection();
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!doc) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    useCadStore.getState().updateCamera({
      orbitDistance: Math.max(40, Math.min(20000, doc.camera.orbitDistance * factor)),
    });
  };

  return (
    <div
      ref={mountRef}
      className="cad-canvas-container cad-3d-viewport"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { dragRef.current.mode = 'none'; }}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
