export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type LineTypeName =
  | 'ByLayer'
  | 'CONTINUOUS'
  | 'DASHED'
  | 'DASHED2'
  | 'CENTER'
  | 'CENTER2'
  | 'HIDDEN'
  | 'HIDDEN2'
  | 'DASHDOT'
  | 'PHANTOM'
  | 'BORDER'
  | 'DIVIDE'
  | 'DOT';

export type HatchPatternName =
  | 'SOLID'
  | 'ANSI31'
  | 'ANSI32'
  | 'ANSI33'
  | 'ANSI37'
  | 'NET'
  | 'BRICK'
  | 'DOTS'
  | 'HONEY'
  | 'CROSS'
  | 'AR-CONC'
  | 'AR-SAND'
  | 'AR-HBONE'
  | 'EARTH'
  | 'GRATE';

export type DimensionKind = 'linear' | 'aligned' | 'radius' | 'diameter' | 'angular';

export type Solid3DPrimitiveKind =
  | 'box'
  | 'cylinder'
  | 'sphere'
  | 'cone'
  | 'pyramid'
  | 'torus'
  | 'extrude'
  | 'mesh';

export type WorkspaceType = 'drafting' | '3dbasics' | '3dmodeling';

export type VisualStyle =
  | '2dwireframe'
  | '3dwireframe'
  | 'conceptual'
  | 'realistic'
  | 'shaded'
  | 'shadedEdges'
  | 'xray';

export type PresetView =
  | 'top'
  | 'bottom'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'swIso'
  | 'seIso'
  | 'neIso'
  | 'nwIso';

export type UnitType = 'mm' | 'cm' | 'm' | 'in' | 'ft';

export interface Layer {
  id: string;
  name: string;
  color: string; // Hex color
  aciColor?: number;
  on: boolean;
  frozen: boolean;
  locked: boolean;
  lineType: Exclude<LineTypeName, 'ByLayer'>;
  lineWeight: number; // mm, e.g., 0.25
  transparency: number; // 0..90
  plot: boolean;
}

export interface EntityBase {
  id: string;
  type: string;
  layer: string;
  color: string; // 'ByLayer' or hex '#RRGGBB'
  lineType: LineTypeName;
  lineTypeScale: number;
  lineWeight: number; // -1 = ByLayer, else mm
  elevation?: number; // Z height in 3D
  thickness?: number; // 2.5D extrusion thickness
  groupId?: string;
  visible?: boolean;
  fixed?: boolean;
}

export interface LineEntity extends EntityBase {
  type: 'line';
  start: Point2D;
  end: Point2D;
}

export interface PolylineEntity extends EntityBase {
  type: 'polyline';
  points: Point2D[];
  closed: boolean;
  width?: number;
  bulges?: number[]; // tan(theta/4) per segment; 0 = straight line
}

export interface CircleEntity extends EntityBase {
  type: 'circle';
  center: Point2D;
  radius: number;
}

export interface ArcEntity extends EntityBase {
  type: 'arc';
  center: Point2D;
  radius: number;
  startAngle: number; // radians, CCW from +X
  endAngle: number; // radians, CCW from +X
}

export interface RectangleEntity extends EntityBase {
  type: 'rectangle';
  p1: Point2D;
  p2: Point2D;
  rotation?: number; // radians around center
}

export interface PolygonEntity extends EntityBase {
  type: 'polygon';
  center: Point2D;
  radius: number;
  sides: number;
  rotation: number;
  inscribed: boolean;
}

export interface EllipseEntity extends EntityBase {
  type: 'ellipse';
  center: Point2D;
  rx: number;
  ry: number;
  rotation: number; // radians
}

export interface SplineEntity extends EntityBase {
  type: 'spline';
  controlPoints: Point2D[];
  closed: boolean;
}

export interface XLineEntity extends EntityBase {
  type: 'xline';
  origin: Point2D;
  direction: Point2D; // unit vector
}

export interface RayEntity extends EntityBase {
  type: 'ray';
  origin: Point2D;
  direction: Point2D;
}

export interface PointEntity extends EntityBase {
  type: 'point';
  position: Point2D;
}

export interface HatchEntity extends EntityBase {
  type: 'hatch';
  boundary: Point2D[];
  pattern: HatchPatternName;
  scale: number;
  angle: number; // degrees
  opacity: number;
}

export interface TextEntity extends EntityBase {
  type: 'text';
  position: Point2D;
  content: string;
  height: number;
  rotation: number; // radians
  align?: 'left' | 'center' | 'right';
}

export interface MTextEntity extends EntityBase {
  type: 'mtext';
  position: Point2D;
  content: string;
  height: number;
  width: number;
  rotation: number;
}

export interface DimensionEntity extends EntityBase {
  type: 'dimension';
  kind: DimensionKind;
  p1: Point2D;
  p2: Point2D;
  p3?: Point2D; // vertex for angular, or arc/offset point
  textPosition: Point2D;
  textOverride?: string;
  textHeight: number;
  arrowSize: number;
}

export interface LeaderEntity extends EntityBase {
  type: 'leader';
  points: Point2D[];
  text: string;
  textHeight: number;
}

export interface BlockRefEntity extends EntityBase {
  type: 'block_ref';
  blockName: string;
  position: Point2D;
  scaleX: number;
  scaleY: number;
  rotation: number; // radians
}

export interface RevCloudEntity extends EntityBase {
  type: 'revcloud';
  points: Point2D[];
  arcLength: number;
  closed: boolean;
}

export interface TableEntity extends EntityBase {
  type: 'table';
  position: Point2D; // top-left corner
  rows: number;
  cols: number;
  colWidth: number;
  rowHeight: number;
  cells: string[][];
  textHeight: number;
}

export interface Solid3DEntity extends EntityBase {
  type: 'solid3d';
  primitive: Solid3DPrimitiveKind;
  position: Point3D;
  size: Point3D; // box: w,d,h; cyl/cone: radius,topRadius,height; sphere: r,r,r; torus: R,tube,0
  rotation: Point3D; // euler radians
  profile?: Point2D[]; // for extruded 2D shapes
  extrudeHeight?: number;
  meshPositions?: number[]; // flat local triangles [x,y,z,...] for CSG / revolve meshes
  meshNormals?: number[];
}

export type CadEntity =
  | LineEntity
  | PolylineEntity
  | CircleEntity
  | ArcEntity
  | RectangleEntity
  | PolygonEntity
  | EllipseEntity
  | SplineEntity
  | XLineEntity
  | RayEntity
  | PointEntity
  | HatchEntity
  | TextEntity
  | MTextEntity
  | DimensionEntity
  | LeaderEntity
  | BlockRefEntity
  | RevCloudEntity
  | TableEntity
  | Solid3DEntity;

export interface BlockDefinition {
  name: string;
  description: string;
  category: 'Architettura' | 'Meccanica' | 'Annotazione' | 'Utente';
  basePoint: Point2D;
  entities: CadEntity[];
}

export interface LayoutSheet {
  id: string;
  name: string; // e.g., 'Layout1', 'Layout2'
  paperWidth: number; // mm (A3 = 420)
  paperHeight: number; // mm (A3 = 297)
  margin: number; // mm
  viewportCenter: Point2D;
  viewportScale: number; // e.g. 0.02 (1:50)
  titleBlockTitle: string;
  titleBlockAuthor: string;
  titleBlockScaleText: string;
  autoFit?: boolean;
}

export interface ViewportCamera {
  panX: number; // screen pixels offset of world (0,0)
  panY: number;
  zoom: number; // pixels per world unit
  presetView: PresetView;
  visualStyle: VisualStyle;
  is3D: boolean;
  orbitAzimuth: number; // radians
  orbitPolar: number; // radians
  orbitTarget: Point3D;
  orbitDistance: number;
}

export type OsnapMode =
  | 'endpoint'
  | 'midpoint'
  | 'center'
  | 'geometricCenter'
  | 'node'
  | 'quadrant'
  | 'intersection'
  | 'perpendicular'
  | 'tangent'
  | 'nearest';

export interface OsnapResult {
  point: Point2D;
  mode: OsnapMode;
  entityId?: string;
  label: string;
}

export interface GripPoint {
  entityId: string;
  gripIndex: number;
  point: Point2D;
  kind: 'vertex' | 'midpoint' | 'center' | 'quadrant' | 'stretch';
}

export interface DraftingSettings {
  gridOn: boolean;
  gridSpacing: number;
  gridMajorEvery: number;
  snapOn: boolean;
  snapSpacing: number;
  orthoOn: boolean;
  polarOn: boolean;
  polarAngle: number; // degrees: 5, 10, 15, 30, 45, 90
  osnapOn: boolean;
  osnapModes: Record<OsnapMode, boolean>;
  otrackOn: boolean;
  dynInputOn: boolean;
  showLineWeight: boolean;
  showTransparency: boolean;
  quickPropertiesOn: boolean;
  showViewCube: boolean;
  showNavBar: boolean;
  showUcsIcon: boolean;
  annotationScale: string; // '1:1', '1:50', etc.
  crosshairSize: number; // percentage 5..100
  pickboxSize: number; // px
  modelBgColor: string;
  units: UnitType;
  precision: number; // decimal digits
  filletRadius: number;
  chamferDist1: number;
  chamferDist2: number;
  offsetDistance: number;
  hatchPattern: HatchPatternName;
  hatchScale: number;
  hatchAngle: number;
  textHeight: number;
  dimTextHeight: number;
  dimArrowSize: number;
}

export interface HistorySnapshot {
  entities: CadEntity[];
  layers: Layer[];
  blocks: Record<string, BlockDefinition>;
  activeLayer: string;
  description: string;
}

export interface CadDocument {
  id: string;
  name: string; // 'Disegno1.dwg'
  filePath?: string;
  modified: boolean;
  entities: CadEntity[];
  layers: Layer[];
  activeLayer: string;
  activeColor: string; // 'ByLayer' or hex
  activeLineType: LineTypeName;
  activeLineWeight: number; // -1 ByLayer
  blocks: Record<string, BlockDefinition>;
  selectedIds: string[];
  camera: ViewportCamera;
  activeSpace: 'model' | string; // 'model' or layout id
  layouts: LayoutSheet[];
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  parametricVars: Record<string, number>;
  constraints: GeometricConstraint[];
}

export interface GeometricConstraint {
  id: string;
  kind: 'horizontal' | 'vertical' | 'parallel' | 'perpendicular' | 'concentric' | 'equal' | 'fix';
  entityIds: string[];
}

export interface CommandLogEntry {
  id: string;
  text: string;
  kind: 'command' | 'prompt' | 'info' | 'error' | 'result';
  timestamp: string;
}

export interface ActiveCommandState {
  name: string; // Canonical internal id, e.g. 'LINE', 'CIRCLE', 'MOVE'
  displayName: string; // Italian name, e.g. 'LINEA', 'CERCHIO', 'SPOSTA'
  step: number;
  prompt: string;
  options?: { label: string; key: string; value: string }[];
  points: Point2D[];
  tempEntityIds?: string[];
  params: Record<string, any>;
}

// Standard CAD ACI index colors (1..16 + key grays)
export const CAD_ACI_COLORS: { aci: number; name: string; hex: string }[] = [
  { aci: 1, name: 'Rosso', hex: '#FF0000' },
  { aci: 2, name: 'Giallo', hex: '#FFFF00' },
  { aci: 3, name: 'Verde', hex: '#00FF00' },
  { aci: 4, name: 'Ciano', hex: '#00FFFF' },
  { aci: 5, name: 'Blu', hex: '#007FFF' },
  { aci: 6, name: 'Magenta', hex: '#FF00FF' },
  { aci: 7, name: 'Bianco', hex: '#FFFFFF' },
  { aci: 8, name: 'Grigio scuro', hex: '#808080' },
  { aci: 9, name: 'Grigio chiaro', hex: '#C0C0C0' },
  { aci: 30, name: 'Arancione', hex: '#FF7F00' },
  { aci: 40, name: 'Oro', hex: '#FFBF00' },
  { aci: 94, name: 'Verde oliva', hex: '#66CC66' },
  { aci: 140, name: 'Azzurro', hex: '#38ABDF' },
  { aci: 170, name: 'Indaco', hex: '#5C7CFA' },
  { aci: 210, name: 'Viola', hex: '#B197FC' },
  { aci: 252, name: 'Antracite', hex: '#545454' },
];

export const LINE_WEIGHTS: number[] = [
  -1, 0.0, 0.05, 0.09, 0.13, 0.15, 0.18, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0, 1.2, 1.58, 2.11,
];

export const LINE_TYPES: { id: LineTypeName; label: string; dash: number[] }[] = [
  { id: 'ByLayer', label: 'DaLayer', dash: [] },
  { id: 'CONTINUOUS', label: 'Continuous (Continua)', dash: [] },
  { id: 'DASHED', label: 'DASHED (Tratteggiata)', dash: [10, 5] },
  { id: 'DASHED2', label: 'DASHED2 (Trattegg. fine)', dash: [5, 2.5] },
  { id: 'CENTER', label: 'CENTER (Linea d\'asse)', dash: [18, 4, 4, 4] },
  { id: 'CENTER2', label: 'CENTER2 (Asse fine)', dash: [10, 2.5, 2.5, 2.5] },
  { id: 'HIDDEN', label: 'HIDDEN (Nascosta)', dash: [5, 3] },
  { id: 'HIDDEN2', label: 'HIDDEN2 (Nascosta fine)', dash: [3, 2] },
  { id: 'DASHDOT', label: 'DASHDOT (Tratto punto)', dash: [12, 4, 2, 4] },
  { id: 'PHANTOM', label: 'PHANTOM (Fantasma)', dash: [20, 4, 4, 4, 4, 4] },
  { id: 'BORDER', label: 'BORDER (Bordo)', dash: [18, 4, 18, 4, 2, 4] },
  { id: 'DIVIDE', label: 'DIVIDE (Dividi)', dash: [16, 4, 2, 4, 2, 4] },
  { id: 'DOT', label: 'DOT (Punteggiata)', dash: [2, 4] },
];
