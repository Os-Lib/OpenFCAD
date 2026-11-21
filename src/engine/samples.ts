import {
  BlockDefinition,
  CadDocument,
  CadEntity,
  Layer,
  LayoutSheet,
  ViewportCamera,
} from '../types/cad';
import { genId } from './math';

export function createDefaultLayers(): Layer[] {
  return [
    { id: 'layer_0', name: '0', color: '#FFFFFF', aciColor: 7, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.25, transparency: 0, plot: true },
    { id: 'layer_muri', name: 'A-MURI', color: '#E8EEF5', aciColor: 7, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.4, transparency: 0, plot: true },
    { id: 'layer_porte', name: 'A-PORTE', color: '#FFBF00', aciColor: 40, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.2, transparency: 0, plot: true },
    { id: 'layer_arredi', name: 'A-ARREDI', color: '#66CC66', aciColor: 94, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.18, transparency: 0, plot: true },
    { id: 'layer_quote', name: 'QUOTE', color: '#00FFFF', aciColor: 4, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.15, transparency: 0, plot: true },
    { id: 'layer_assi', name: 'ASSI', color: '#FF4444', aciColor: 1, on: true, frozen: false, locked: false, lineType: 'CENTER', lineWeight: 0.13, transparency: 0, plot: true },
    { id: 'layer_tratteggi', name: 'TRATTEGGI', color: '#808080', aciColor: 8, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.13, transparency: 25, plot: true },
    { id: 'layer_testi', name: 'TESTI', color: '#FFFF00', aciColor: 2, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.18, transparency: 0, plot: true },
    { id: 'layer_3d', name: 'SOLIDI-3D', color: '#38ABDF', aciColor: 140, on: true, frozen: false, locked: false, lineType: 'CONTINUOUS', lineWeight: 0.3, transparency: 0, plot: true },
  ];
}

export function createDefaultBlocks(): Record<string, BlockDefinition> {
  const b = (layer = '0') => ({ layer, color: 'ByLayer', lineType: 'ByLayer' as const, lineTypeScale: 1, lineWeight: -1 });
  return {
    PORTA_80: {
      name: 'PORTA_80',
      description: 'Porta battente singola 80 cm con arco apertura',
      category: 'Architettura',
      basePoint: { x: 0, y: 0 },
      entities: [
        { ...b('A-PORTE'), id: 'b_d1', type: 'rectangle', p1: { x: 0, y: 0 }, p2: { x: 5, y: 80 } },
        { ...b('A-PORTE'), id: 'b_d2', type: 'arc', center: { x: 0, y: 0 }, radius: 80, startAngle: 0, endAngle: Math.PI / 2 },
      ],
    },
    FINESTRA_120: {
      name: 'FINESTRA_120',
      description: 'Finestra doppia anta 120 cm',
      category: 'Architettura',
      basePoint: { x: 0, y: 0 },
      entities: [
        { ...b('A-PORTE'), id: 'b_f1', type: 'rectangle', p1: { x: 0, y: -12 }, p2: { x: 120, y: 12 } },
        { ...b('A-PORTE'), id: 'b_f2', type: 'line', start: { x: 0, y: 0 }, end: { x: 120, y: 0 } },
        { ...b('A-PORTE'), id: 'b_f3', type: 'line', start: { x: 60, y: -12 }, end: { x: 60, y: 12 } },
      ],
    },
    TAVOLO_PRANZO: {
      name: 'TAVOLO_PRANZO',
      description: 'Tavolo rettangolare 160x90 cm con 4 sedie',
      category: 'Architettura',
      basePoint: { x: 80, y: 45 },
      entities: [
        { ...b('A-ARREDI'), id: 'b_t1', type: 'rectangle', p1: { x: 0, y: 0 }, p2: { x: 160, y: 90 } },
        { ...b('A-ARREDI'), id: 'b_t2', type: 'rectangle', p1: { x: 25, y: -32 }, p2: { x: 65, y: -4 } },
        { ...b('A-ARREDI'), id: 'b_t3', type: 'rectangle', p1: { x: 95, y: -32 }, p2: { x: 135, y: -4 } },
        { ...b('A-ARREDI'), id: 'b_t4', type: 'rectangle', p1: { x: 25, y: 94 }, p2: { x: 65, y: 122 } },
        { ...b('A-ARREDI'), id: 'b_t5', type: 'rectangle', p1: { x: 95, y: 94 }, p2: { x: 135, y: 122 } },
      ],
    },
    ALBERO: {
      name: 'ALBERO',
      description: 'Simbolo albero planimetrico Ø140',
      category: 'Architettura',
      basePoint: { x: 0, y: 0 },
      entities: [
        { ...b('A-ARREDI'), id: 'b_a1', type: 'circle', center: { x: 0, y: 0 }, radius: 70 },
        { ...b('A-ARREDI'), id: 'b_a2', type: 'circle', center: { x: 0, y: 0 }, radius: 10 },
        { ...b('A-ARREDI'), id: 'b_a3', type: 'line', start: { x: -50, y: 0 }, end: { x: 50, y: 0 } },
        { ...b('A-ARREDI'), id: 'b_a4', type: 'line', start: { x: 0, y: -50 }, end: { x: 0, y: 50 } },
      ],
    },
    BULLONE_M16: {
      name: 'BULLONE_M16',
      description: 'Testa esagonale bullone M16 con foro',
      category: 'Meccanica',
      basePoint: { x: 0, y: 0 },
      entities: [
        { ...b('0'), id: 'b_m1', type: 'polygon', center: { x: 0, y: 0 }, radius: 14, sides: 6, rotation: 0, inscribed: false },
        { ...b('0'), id: 'b_m2', type: 'circle', center: { x: 0, y: 0 }, radius: 8 },
        { ...b('ASSI'), id: 'b_m3', type: 'line', start: { x: -18, y: 0 }, end: { x: 18, y: 0 } },
        { ...b('ASSI'), id: 'b_m4', type: 'line', start: { x: 0, y: -18 }, end: { x: 0, y: 18 } },
      ],
    },
    SIMBOLO_NORD: {
      name: 'SIMBOLO_NORD',
      description: 'Indicatore direzione Nord geografico',
      category: 'Annotazione',
      basePoint: { x: 0, y: 0 },
      entities: [
        { ...b('TESTI'), id: 'b_n1', type: 'circle', center: { x: 0, y: 0 }, radius: 35 },
        { ...b('TESTI'), id: 'b_n2', type: 'polyline', points: [{ x: 0, y: 35 }, { x: -12, y: -10 }, { x: 0, y: 0 }, { x: 12, y: -10 }], closed: true },
        { ...b('TESTI'), id: 'b_n3', type: 'text', position: { x: -8, y: 42 }, content: 'N', height: 22, rotation: 0 },
      ],
    },
  };
}

export function createDefaultLayouts(): LayoutSheet[] {
  return [
    {
      id: 'layout_1',
      name: 'Layout1',
      paperWidth: 420,
      paperHeight: 297,
      margin: 12,
      viewportCenter: { x: 350, y: 250 },
      viewportScale: 0.35,
      titleBlockTitle: 'TAVOLA 01 - PROGETTO ESECUTIVO',
      titleBlockAuthor: 'Studio Tecnico CAD',
      titleBlockScaleText: 'SCALA 1:50',
    },
    {
      id: 'layout_2',
      name: 'Layout2',
      paperWidth: 297,
      paperHeight: 210,
      margin: 10,
      viewportCenter: { x: 0, y: 0 },
      viewportScale: 0.5,
      titleBlockTitle: 'TAVOLA 02 - DETTAGLIO COSTRUTTIVO',
      titleBlockAuthor: 'Studio Tecnico CAD',
      titleBlockScaleText: 'SCALA 1:20',
    },
  ];
}

export function createDefaultCamera(): ViewportCamera {
  return {
    panX: 320,
    panY: 420,
    zoom: 1.0,
    presetView: 'top',
    visualStyle: '2dwireframe',
    is3D: false,
    orbitAzimuth: Math.PI / 4,
    orbitPolar: Math.PI / 3,
    orbitTarget: { x: 200, y: 150, z: 0 },
    orbitDistance: 800,
  };
}

export function createEmptyDocument(name = 'Disegno1.dwg'): CadDocument {
  return {
    id: genId('doc'),
    name,
    modified: false,
    entities: [],
    layers: createDefaultLayers(),
    activeLayer: '0',
    activeColor: 'ByLayer',
    activeLineType: 'ByLayer',
    activeLineWeight: -1,
    blocks: createDefaultBlocks(),
    selectedIds: [],
    camera: createDefaultCamera(),
    activeSpace: 'model',
    layouts: createDefaultLayouts(),
    undoStack: [],
    redoStack: [],
    parametricVars: { spessoreMuro: 30, lucePorta: 80, raggioRaccordo: 15 },
    constraints: [],
  };
}

// SAMPLE 1: Architectural Apartment Floor Plan (cm units)
export function createApartmentSample(): CadDocument {
  const doc = createEmptyDocument('Planimetria_Appartamento.dwg');
  const e = (layer: string) => ({
    layer,
    color: 'ByLayer',
    lineType: 'ByLayer' as const,
    lineTypeScale: 1,
    lineWeight: -1,
  });

  const entities: CadEntity[] = [
    // Outer perimeter walls (800 x 560)
    { ...e('A-MURI'), id: genId('rect'), type: 'rectangle', p1: { x: 0, y: 0 }, p2: { x: 800, y: 560 }, thickness: 280 },
    { ...e('A-MURI'), id: genId('rect'), type: 'rectangle', p1: { x: 30, y: 30 }, p2: { x: 770, y: 530 }, thickness: 280 },

    // Wall perimeter hatch strips
    { ...e('TRATTEGGI'), id: genId('hatch'), type: 'hatch', boundary: [{ x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 30 }, { x: 0, y: 30 }], pattern: 'ANSI31', scale: 12, angle: 45, opacity: 0.6 },
    { ...e('TRATTEGGI'), id: genId('hatch'), type: 'hatch', boundary: [{ x: 0, y: 530 }, { x: 800, y: 530 }, { x: 800, y: 560 }, { x: 0, y: 560 }], pattern: 'ANSI31', scale: 12, angle: 45, opacity: 0.6 },
    { ...e('TRATTEGGI'), id: genId('hatch'), type: 'hatch', boundary: [{ x: 0, y: 30 }, { x: 30, y: 30 }, { x: 30, y: 530 }, { x: 0, y: 530 }], pattern: 'ANSI31', scale: 12, angle: 45, opacity: 0.6 },
    { ...e('TRATTEGGI'), id: genId('hatch'), type: 'hatch', boundary: [{ x: 770, y: 30 }, { x: 800, y: 30 }, { x: 800, y: 530 }, { x: 770, y: 530 }], pattern: 'ANSI31', scale: 12, angle: 45, opacity: 0.6 },

    // Internal partition walls
    // Vertical wall separating Living/Kitchen from Bedroom/Bath at x=440
    { ...e('A-MURI'), id: genId('rect'), type: 'rectangle', p1: { x: 435, y: 30 }, p2: { x: 450, y: 200 }, thickness: 280 },
    { ...e('A-MURI'), id: genId('rect'), type: 'rectangle', p1: { x: 435, y: 290 }, p2: { x: 450, y: 530 }, thickness: 280 },
    // Horizontal wall separating Bedroom (top right) and Bathroom (bottom right) at y=280
    { ...e('A-MURI'), id: genId('rect'), type: 'rectangle', p1: { x: 450, y: 270 }, p2: { x: 770, y: 285 }, thickness: 280 },
    // Kitchen peninsula wall
    { ...e('A-MURI'), id: genId('rect'), type: 'rectangle', p1: { x: 30, y: 340 }, p2: { x: 250, y: 355 }, thickness: 110 },

    // Bathroom floor tile hatch
    { ...e('TRATTEGGI'), id: genId('hatch'), type: 'hatch', boundary: [{ x: 450, y: 30 }, { x: 770, y: 30 }, { x: 770, y: 270 }, { x: 450, y: 270 }], pattern: 'NET', scale: 25, angle: 0, opacity: 0.4 },

    // Doors (block refs)
    { ...e('A-PORTE'), id: genId('blk'), type: 'block_ref', blockName: 'PORTA_80', position: { x: 440, y: 205 }, scaleX: 1, scaleY: 1, rotation: 0 },
    { ...e('A-PORTE'), id: genId('blk'), type: 'block_ref', blockName: 'PORTA_80', position: { x: 180, y: 30 }, scaleX: 1, scaleY: 1, rotation: 0 },
    // Windows
    { ...e('A-PORTE'), id: genId('blk'), type: 'block_ref', blockName: 'FINESTRA_120', position: { x: 160, y: 545 }, scaleX: 1.4, scaleY: 1, rotation: 0 },
    { ...e('A-PORTE'), id: genId('blk'), type: 'block_ref', blockName: 'FINESTRA_120', position: { x: 540, y: 545 }, scaleX: 1.2, scaleY: 1, rotation: 0 },
    { ...e('A-PORTE'), id: genId('blk'), type: 'block_ref', blockName: 'FINESTRA_120', position: { x: 785, y: 95 }, scaleX: 0.8, scaleY: 1, rotation: Math.PI / 2 },

    // Furniture
    { ...e('A-ARREDI'), id: genId('blk'), type: 'block_ref', blockName: 'TAVOLO_PRANZO', position: { x: 230, y: 195 }, scaleX: 1, scaleY: 1, rotation: 0 },
    // Double Bed in Bedroom
    { ...e('A-ARREDI'), id: genId('rect'), type: 'rectangle', p1: { x: 540, y: 330 }, p2: { x: 740, y: 500 } },
    { ...e('A-ARREDI'), id: genId('rect'), type: 'rectangle', p1: { x: 700, y: 345 }, p2: { x: 735, y: 405 } },
    { ...e('A-ARREDI'), id: genId('rect'), type: 'rectangle', p1: { x: 700, y: 425 }, p2: { x: 735, y: 485 } },
    // Kitchen counter & stove
    { ...e('A-ARREDI'), id: genId('rect'), type: 'rectangle', p1: { x: 30, y: 470 }, p2: { x: 380, y: 530 } },
    { ...e('A-ARREDI'), id: genId('circle'), type: 'circle', center: { x: 100, y: 500 }, radius: 14 },
    { ...e('A-ARREDI'), id: genId('circle'), type: 'circle', center: { x: 140, y: 500 }, radius: 10 },
    // Shower tray in bathroom
    { ...e('A-ARREDI'), id: genId('rect'), type: 'rectangle', p1: { x: 660, y: 35 }, p2: { x: 765, y: 125 } },
    { ...e('A-ARREDI'), id: genId('line'), type: 'line', start: { x: 660, y: 35 }, end: { x: 765, y: 125 } },
    { ...e('A-ARREDI'), id: genId('line'), type: 'line', start: { x: 765, y: 35 }, end: { x: 660, y: 125 } },

    // North symbol & Trees outside
    { ...e('TESTI'), id: genId('blk'), type: 'block_ref', blockName: 'SIMBOLO_NORD', position: { x: 920, y: 480 }, scaleX: 1, scaleY: 1, rotation: 0 },
    { ...e('A-ARREDI'), id: genId('blk'), type: 'block_ref', blockName: 'ALBERO', position: { x: -120, y: 450 }, scaleX: 1, scaleY: 1, rotation: 0 },
    { ...e('A-ARREDI'), id: genId('blk'), type: 'block_ref', blockName: 'ALBERO', position: { x: -110, y: 150 }, scaleX: 0.85, scaleY: 0.85, rotation: 0 },

    // Room Labels
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: 135, y: 312 }, content: 'SOGGIORNO / PRANZO', height: 17, rotation: 0 },
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: 185, y: 290 }, content: '24.6 m²', height: 13, rotation: 0 },
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: 130, y: 415 }, content: 'CUCINA', height: 18, rotation: 0 },
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: 485, y: 455 }, content: 'CAMERA', height: 18, rotation: 0 },
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: 485, y: 430 }, content: '15.2 m²', height: 14, rotation: 0 },
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: 510, y: 165 }, content: 'BAGNO', height: 18, rotation: 0 },

    // Dimensions
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: 0, y: 560 }, p2: { x: 800, y: 560 }, textPosition: { x: 400, y: 625 }, textHeight: 16, arrowSize: 12 },
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: 0, y: 0 }, p2: { x: 435, y: 0 }, textPosition: { x: 217, y: -55 }, textHeight: 16, arrowSize: 12 },
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: 450, y: 0 }, p2: { x: 800, y: 0 }, textPosition: { x: 625, y: -55 }, textHeight: 16, arrowSize: 12 },
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: 800, y: 0 }, p2: { x: 800, y: 560 }, textPosition: { x: 860, y: 280 }, textHeight: 16, arrowSize: 12 },
  ];

  doc.entities = entities;
  doc.camera = { ...createDefaultCamera(), panX: 240, panY: 540, zoom: 0.72 };
  doc.layouts[0].viewportCenter = { x: 400, y: 280 };
  doc.layouts[0].viewportScale = 0.34;
  return doc;
}

// SAMPLE 2: Mechanical Precision Flange (mm)
export function createMechanicalSample(): CadDocument {
  const doc = createEmptyDocument('Flangia_Meccanica_DN150.dwg');
  const e = (layer: string) => ({
    layer,
    color: 'ByLayer',
    lineType: 'ByLayer' as const,
    lineTypeScale: 1,
    lineWeight: -1,
  });

  const entities: CadEntity[] = [
    // Center axes
    { ...e('ASSI'), id: genId('line'), type: 'line', start: { x: -160, y: 0 }, end: { x: 160, y: 0 } },
    { ...e('ASSI'), id: genId('line'), type: 'line', start: { x: 0, y: -160 }, end: { x: 0, y: 160 } },
    // Pitch circle (dashed center)
    { ...e('ASSI'), id: genId('circle'), type: 'circle', center: { x: 0, y: 0 }, radius: 105 },

    // Main outer flange & hub circles
    { ...e('A-MURI'), id: genId('circle'), type: 'circle', center: { x: 0, y: 0 }, radius: 135, thickness: 22 },
    { ...e('A-MURI'), id: genId('circle'), type: 'circle', center: { x: 0, y: 0 }, radius: 75, thickness: 40 },
    { ...e('A-MURI'), id: genId('circle'), type: 'circle', center: { x: 0, y: 0 }, radius: 48 },

    // Keyway slot at top of bore
    { ...e('A-MURI'), id: genId('polyline'), type: 'polyline', points: [{ x: -8, y: 47.3 }, { x: -8, y: 56 }, { x: 8, y: 56 }, { x: 8, y: 47.3 }], closed: false },

    // 6 Bolt holes around pitch circle
    ...[0, 60, 120, 180, 240, 300].flatMap((deg) => {
      const rad = (deg * Math.PI) / 180;
      const cx = 105 * Math.cos(rad);
      const cy = 105 * Math.sin(rad);
      return [
        { ...e('A-MURI'), id: genId('circle'), type: 'circle' as const, center: { x: cx, y: cy }, radius: 11 },
        { ...e('ASSI'), id: genId('line'), type: 'line' as const, start: { x: cx - 16, y: cy }, end: { x: cx + 16, y: cy } },
        { ...e('ASSI'), id: genId('line'), type: 'line' as const, start: { x: cx, y: cy - 16 }, end: { x: cx, y: cy + 16 } },
      ];
    }),

    // Side cross-section view on the right (x = 240..330)
    { ...e('A-MURI'), id: genId('polyline'), type: 'polyline', points: [{ x: 240, y: -135 }, { x: 265, y: -135 }, { x: 265, y: -75 }, { x: 305, y: -75 }, { x: 305, y: -48 }, { x: 240, y: -48 }], closed: true },
    { ...e('A-MURI'), id: genId('polyline'), type: 'polyline', points: [{ x: 240, y: 48 }, { x: 305, y: 48 }, { x: 305, y: 75 }, { x: 265, y: 75 }, { x: 265, y: 135 }, { x: 240, y: 135 }], closed: true },
    { ...e('TRATTEGGI'), id: genId('hatch'), type: 'hatch', boundary: [{ x: 240, y: 48 }, { x: 305, y: 48 }, { x: 305, y: 75 }, { x: 265, y: 75 }, { x: 265, y: 135 }, { x: 240, y: 135 }], pattern: 'ANSI31', scale: 7, angle: 45, opacity: 0.7 },
    { ...e('TRATTEGGI'), id: genId('hatch'), type: 'hatch', boundary: [{ x: 240, y: -135 }, { x: 265, y: -135 }, { x: 265, y: -75 }, { x: 305, y: -75 }, { x: 305, y: -48 }, { x: 240, y: -48 }], pattern: 'ANSI31', scale: 7, angle: 45, opacity: 0.7 },
    { ...e('ASSI'), id: genId('line'), type: 'line', start: { x: 220, y: 0 }, end: { x: 330, y: 0 } },

    // Mechanical Dimensions
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'diameter', p1: { x: -135, y: 0 }, p2: { x: 135, y: 0 }, textPosition: { x: 0, y: 170 }, textHeight: 11, arrowSize: 8 },
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'radius', p1: { x: 0, y: 0 }, p2: { x: 53, y: 53 }, textPosition: { x: 95, y: 95 }, textHeight: 10, arrowSize: 7 },
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: 240, y: 135 }, p2: { x: 305, y: 135 }, textPosition: { x: 272, y: 165 }, textHeight: 10, arrowSize: 7 },
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: 240, y: -135 }, p2: { x: 240, y: 135 }, textPosition: { x: 205, y: 0 }, textHeight: 10, arrowSize: 7 },

    // Title annotations
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: -115, y: -195 }, content: 'FLANGIA ACCIAIO S355 - VISTA FRONTALE', height: 11, rotation: 0 },
    { ...e('TESTI'), id: genId('txt'), type: 'text', position: { x: 225, y: -195 }, content: 'SEZIONE A-A', height: 11, rotation: 0 },
    { ...e('QUOTE'), id: genId('ldr'), type: 'leader', points: [{ x: 105, y: 11 }, { x: 155, y: 75 }, { x: 185, y: 75 }], text: '6x Ø22 SU Ø210', textHeight: 9 },
  ];

  doc.entities = entities;
  doc.camera = { ...createDefaultCamera(), panX: 430, panY: 340, zoom: 1.45 };
  doc.layouts[0].viewportCenter = { x: 85, y: 0 };
  doc.layouts[0].viewportScale = 0.65;
  doc.layouts[0].titleBlockTitle = 'FLANGIA DN150 - DISEGNO COSTRUTTIVO';
  doc.layouts[0].titleBlockScaleText = 'SCALA 1:2';
  return doc;
}

// SAMPLE 3: 3D Pavilion Architectural Solid Model
export function create3DPavilionSample(): CadDocument {
  const doc = createEmptyDocument('Padiglione_3D.dwg');
  const e = (layer: string, color = 'ByLayer') => ({
    layer,
    color,
    lineType: 'ByLayer' as const,
    lineTypeScale: 1,
    lineWeight: -1,
  });

  const entities: CadEntity[] = [
    // Base platform slab
    { ...e('SOLIDI-3D', '#6C7A89'), id: genId('s3d'), type: 'solid3d', primitive: 'box', position: { x: 0, y: 0, z: 0 }, size: { x: 360, y: 240, z: 16 }, rotation: { x: 0, y: 0, z: 0 } },
    // Upper steps
    { ...e('SOLIDI-3D', '#8899AA'), id: genId('s3d'), type: 'solid3d', primitive: 'box', position: { x: 0, y: -135, z: 0 }, size: { x: 140, y: 30, z: 8 }, rotation: { x: 0, y: 0, z: 0 } },
    // 6 Classical Columns (cylinders)
    ...[-140, 0, 140].flatMap((cx) =>
      [-85, 85].map((cy) => ({
        ...e('SOLIDI-3D', '#E6ECF2'),
        id: genId('s3d'),
        type: 'solid3d' as const,
        primitive: 'cylinder' as const,
        position: { x: cx, y: cy, z: 16 },
        size: { x: 12, y: 12, z: 150 },
        rotation: { x: 0, y: 0, z: 0 },
      }))
    ),
    // Back Feature Wall
    { ...e('SOLIDI-3D', '#38ABDF'), id: genId('s3d'), type: 'solid3d', primitive: 'box', position: { x: 0, y: 98, z: 16 }, size: { x: 250, y: 14, z: 150 }, rotation: { x: 0, y: 0, z: 0 } },
    // Cantilevered Roof Slab
    { ...e('SOLIDI-3D', '#D9E4F0'), id: genId('s3d'), type: 'solid3d', primitive: 'box', position: { x: 0, y: 0, z: 166 }, size: { x: 390, y: 265, z: 16 }, rotation: { x: 0, y: 0, z: 0 } },
    // Skylight Pyramid Dome
    { ...e('SOLIDI-3D', '#4CC9F0'), id: genId('s3d'), type: 'solid3d', primitive: 'pyramid', position: { x: 0, y: 0, z: 182 }, size: { x: 110, y: 110, z: 42 }, rotation: { x: 0, y: 0, z: Math.PI / 4 } },
    // Central Pedestal + Sculpture Torus & Sphere (clearly visible from front/SW iso)
    { ...e('SOLIDI-3D', '#FFBF00'), id: genId('s3d'), type: 'solid3d', primitive: 'cylinder', position: { x: 0, y: -25, z: 16 }, size: { x: 24, y: 18, z: 34 }, rotation: { x: 0, y: 0, z: 0 } },
    { ...e('SOLIDI-3D', '#FF6B6B'), id: genId('s3d'), type: 'solid3d', primitive: 'torus', position: { x: 0, y: -25, z: 80 }, size: { x: 24, y: 6, z: 0 }, rotation: { x: Math.PI / 2, y: 0, z: 0 } },
    { ...e('SOLIDI-3D', '#FFD166'), id: genId('s3d'), type: 'solid3d', primitive: 'sphere', position: { x: 0, y: -25, z: 80 }, size: { x: 11, y: 11, z: 11 }, rotation: { x: 0, y: 0, z: 0 } },
    // 2D Footprint Outline + Dimensions on XY plane
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: -180, y: -120 }, p2: { x: 180, y: -120 }, textPosition: { x: 0, y: -175 }, textHeight: 14, arrowSize: 9 },
    { ...e('QUOTE'), id: genId('dim'), type: 'dimension', kind: 'linear', p1: { x: 180, y: -120 }, p2: { x: 180, y: 120 }, textPosition: { x: 225, y: 0 }, textHeight: 14, arrowSize: 9 },
  ];

  doc.entities = entities;
  doc.camera = {
    ...createDefaultCamera(),
    panX: 500,
    panY: 360,
    zoom: 1.1,
    is3D: true,
    presetView: 'swIso',
    visualStyle: 'shadedEdges',
    orbitAzimuth: Math.PI * 0.22,
    orbitPolar: Math.PI * 0.38,
    orbitTarget: { x: 0, y: 0, z: 58 },
    orbitDistance: 670,
  };
  return doc;
}
