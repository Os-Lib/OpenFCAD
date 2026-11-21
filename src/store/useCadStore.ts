import { create } from 'zustand';
import {
  ActiveCommandState,
  BlockDefinition,
  CadDocument,
  CadEntity,
  CommandLogEntry,
  DraftingSettings,
  HatchPatternName,
  Layer,
  LayoutSheet,
  LineEntity,
  LineTypeName,
  OsnapMode,
  Point2D,
  PresetView,
  Solid3DEntity,
  VisualStyle,
  WorkspaceType,
} from '../types/cad';
import {
  add,
  alignEntities,
  angleBetween,
  arcFrom3Points,
  areEntitiesDuplicate,
  breakEntityBetweenPoints,
  chamferTwoLines,
  circleFrom3Points,
  degToRad,
  dist,
  distPointToSegment,
  divideEntity,
  explodeEntity,
  extendEntityAtClick,
  filletTwoLines,
  genId,
  getDocumentBBox,
  getEntityArea,
  getEntityCentroid,
  getEntityLength,
  getPolygonVertices,
  getRectangleCorners,
  joinEntities,
  measureEntityByDistance,
  mid,
  mirrorEntity,
  normAngle,
  normalize,
  offsetEntity,
  pointInPolygon,
  polygonArea,
  radToDeg,
  rotateEntity,
  rotatePoint,
  samplePolyline,
  scaleEntity,
  scaleVec,
  stretchEntity,
  sub,
  translateEntity,
  trimEntityAtClick,
} from '../engine/math';
import { applyGripMove, distToEntity, hitTestEntities, isEntityLocked, isEntityVisible, selectEntitiesInBox } from '../engine/osnap';
import { evalCadNumber, parseCoordinateInput, resolveCommand } from '../engine/commands';
import {
  create3DPavilionSample,
  createApartmentSample,
  createEmptyDocument,
  createMechanicalSample,
} from '../engine/samples';
import { importFromDXF } from '../engine/dxf';
import { openCadFileDialog, saveCadFileDialog } from '../engine/fileIO';
import { performBoolean3D, revolve2DToSolid3D } from '../engine/csg3d';

export type RibbonTabId =
  | 'home'
  | 'insert'
  | 'annotate'
  | 'parametric'
  | '3dtools'
  | 'home3d'
  | 'solids'
  | 'view'
  | 'manage'
  | 'output';

export interface ActiveModalState {
  layerManager: boolean;
  plot: boolean;
  units: boolean;
  options: boolean;
  script: boolean;
  textWindowF2: boolean;
  createBlock: boolean;
  arrayDialog: 'rect' | 'polar' | null;
  parameters: boolean;
  mtextEditor: { entityId?: string; position: Point2D; initialText: string; height: number; isMText: boolean } | null;
  tableEditor: { entityId?: string; position?: Point2D } | null;
  layoutSetup: boolean;
}

export interface CadStoreState {
  // Multi-document
  documents: CadDocument[];
  activeDocId: string | 'start';
  nextDocNumber: number;
  recentFiles: { name: string; date: string; sampleId?: string }[];

  // UI Chrome
  language: string;
  customLanguagePacks: Record<string, Record<string, string>>;
  theme: 'dark' | 'light';
  workspace: WorkspaceType;
  activeRibbonTab: RibbonTabId;
  ribbonCollapsed: boolean;
  cleanScreen: boolean;
  showPropertiesPalette: boolean;
  showBlocksPalette: boolean;
  showQuickCalc: boolean;
  modals: ActiveModalState;

  // Drafting settings
  settings: DraftingSettings;

  // Command Line & Interactive state
  command: ActiveCommandState | null;
  lastCommandId: string;
  commandLog: CommandLogEntry[];
  cursorWorld: Point2D;
  statusMessage: string;
  clipboard: CadEntity[];
  activeBlockToInsert: { name: string; scale: number; rotationDeg: number } | null;

  // Helper getter
  getActiveDoc: () => CadDocument | null;

  // Document management
  setActiveDoc: (id: string | 'start') => void;
  newDocument: (template?: 'iso2d' | 'iso3d') => void;
  openSample: (kind: 'apartment' | 'mechanical' | 'pavilion3d') => void;
  closeDocument: (id: string) => void;
  importDocumentContent: (name: string, content: string, filePath?: string) => void;
  markDocumentSaved: (name?: string, filePath?: string) => void;

  // UI actions
  setLanguage: (lang: string) => void;
  importLanguagePack: (lang: string, dict: Record<string, string>) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setWorkspace: (ws: WorkspaceType) => void;
  setActiveRibbonTab: (tab: RibbonTabId) => void;
  toggleRibbonCollapsed: () => void;
  toggleCleanScreen: () => void;
  togglePropertiesPalette: (force?: boolean) => void;
  toggleBlocksPalette: (force?: boolean) => void;
  toggleQuickCalc: (force?: boolean) => void;
  setModal: <K extends keyof ActiveModalState>(key: K, value: ActiveModalState[K]) => void;
  closeAllModals: () => void;
  updateSettings: (patch: Partial<DraftingSettings>) => void;
  toggleOsnapMode: (mode: OsnapMode) => void;

  // Command & Logging
  log: (text: string, kind?: CommandLogEntry['kind']) => void;
  setCursorWorld: (pt: Point2D) => void;
  startCommand: (commandIdOrName: string, extraParams?: Record<string, any>) => void;
  cancelCommand: () => void;
  repeatLastCommand: () => void;
  submitCanvasClick: (worldPt: Point2D, hitToleranceWorld: number, shiftKey?: boolean) => void;
  submitCommandInput: (rawText: string) => void;
  submitCommandOption: (optValue: string) => void;
  finishMultiStepCommand: () => void;
  runScript: (scriptText: string) => void;

  // Direct Document Mutations
  pushUndo: (description: string) => void;
  undo: () => void;
  redo: () => void;
  setSelection: (ids: string[], mode?: 'replace' | 'add' | 'toggle' | 'remove') => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  addEntity: (entity: CadEntity, undoDescription?: string) => void;
  updateEntity: (id: string, patch: Partial<CadEntity>, recordUndo?: boolean) => void;
  updateSelectedEntities: (patch: Partial<CadEntity>) => void;
  moveGrip: (entityId: string, gripIndex: number, newPt: Point2D, recordUndo?: boolean) => void;
  copyToClipboard: () => void;
  cutToClipboard: () => void;
  pasteFromClipboard: () => void;

  // Layers & Properties
  setActiveLayer: (layerName: string) => void;
  setActiveColor: (color: string) => void;
  setActiveLineType: (lt: LineTypeName) => void;
  setActiveLineWeight: (lw: number) => void;
  addLayer: (name?: string) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  isolateLayer: (layerName: string) => void;
  unisolateLayers: () => void;

  // Blocks & Groups & Arrays & Constraints
  createBlockFromSelection: (name: string, description: string, basePoint: Point2D) => void;
  startInsertBlock: (name: string, scale?: number, rotationDeg?: number) => void;
  createRectangularArray: (rows: number, cols: number, dx: number, dy: number) => void;
  createPolarArray: (center: Point2D, count: number, totalAngleDeg: number, rotateItems: boolean) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  applyGeometricConstraint: (kind: 'horizontal' | 'vertical' | 'parallel' | 'perpendicular' | 'concentric' | 'equal' | 'fix') => void;

  // Camera, 3D & Spaces
  updateCamera: (patch: Partial<CadDocument['camera']>) => void;
  zoomExtents: (canvasWidth?: number, canvasHeight?: number) => void;
  setPresetView: (view: PresetView) => void;
  setVisualStyle: (style: VisualStyle) => void;
  setActiveSpace: (space: 'model' | string) => void;
  addLayout: () => void;
  updateLayout: (layoutId: string, patch: Partial<LayoutSheet>) => void;
  extrudeSelected2D: (height: number) => void;
  drawOrderSelected: (mode: 'front' | 'back') => void;
  performBooleanSelected: (op: 'union' | 'subtract' | 'intersect') => void;
  revolveSelected2D: () => void;
  setParametricVar: (name: string, value: number) => void;
  deleteParametricVar: (name: string) => void;
  resetWorkspaceStorage: () => void;
}

const DEFAULT_SETTINGS: DraftingSettings = {
  gridOn: true,
  gridSpacing: 20,
  gridMajorEvery: 5,
  snapOn: false,
  snapSpacing: 10,
  orthoOn: false,
  polarOn: true,
  polarAngle: 45,
  osnapOn: true,
  osnapModes: {
    endpoint: true,
    midpoint: true,
    center: true,
    geometricCenter: true,
    node: true,
    quadrant: true,
    intersection: true,
    perpendicular: true,
    tangent: false,
    nearest: false,
  },
  otrackOn: true,
  dynInputOn: true,
  showLineWeight: false,
  showTransparency: true,
  quickPropertiesOn: false,
  showViewCube: true,
  showNavBar: true,
  showUcsIcon: true,
  annotationScale: '1:1',
  crosshairSize: 100,
  pickboxSize: 10,
  modelBgColor: '#212830',
  units: 'mm',
  precision: 2,
  filletRadius: 15,
  chamferDist1: 15,
  chamferDist2: 15,
  offsetDistance: 20,
  hatchPattern: 'ANSI31',
  hatchScale: 10,
  hatchAngle: 45,
  textHeight: 14,
  dimTextHeight: 12,
  dimArrowSize: 8,
};

function nowTime(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

function makeBaseEntityProps(doc: CadDocument) {
  return {
    layer: doc.activeLayer,
    color: doc.activeColor,
    lineType: doc.activeLineType,
    lineTypeScale: 1,
    lineWeight: doc.activeLineWeight,
  };
}

// Helper to mutate active doc cleanly
function updateActiveDoc(
  state: CadStoreState,
  updater: (doc: CadDocument) => CadDocument
): Partial<CadStoreState> {
  if (state.activeDocId === 'start') return {};
  return {
    documents: state.documents.map((d) => (d.id === state.activeDocId ? updater(d) : d)),
  };
}

function withUndoSnapshot(doc: CadDocument, description: string): CadDocument {
  const snap = {
    entities: structuredClone(doc.entities),
    layers: structuredClone(doc.layers),
    blocks: structuredClone(doc.blocks),
    activeLayer: doc.activeLayer,
    description,
  };
  const undoStack = [...doc.undoStack.slice(-79), snap];
  return { ...doc, undoStack, redoStack: [], modified: true };
}

const STORAGE_KEY = 'openfcad_state_v1';

function defaultTabForWorkspace(ws: WorkspaceType, prefer3D = false): RibbonTabId {
  if (ws === '3dbasics') return 'home3d';
  if (ws === '3dmodeling') return 'solids';
  return prefer3D ? '3dtools' : 'home';
}

interface PersistedCadData {
  documents: CadDocument[];
  activeDocId: string | 'start';
  nextDocNumber: number;
  recentFiles: { name: string; date: string; sampleId?: string }[];
  language?: string;
  customLanguagePacks?: Record<string, Record<string, string>>;
  theme: 'dark' | 'light';
  workspace: WorkspaceType;
  settings: DraftingSettings;
}

function loadPersistedState(): PersistedCadData | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.documents)) return null;
    const docs: CadDocument[] = parsed.documents.map((d: any) => ({
      ...createEmptyDocument(d.name || 'Disegno.dwg'),
      ...d,
      undoStack: [],
      redoStack: [],
      selectedIds: [],
    }));
    const validTheme: 'dark' | 'light' = parsed.theme === 'light' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.body.className = validTheme === 'dark' ? 'dark-theme' : 'light-theme';
    }
    return {
      documents: docs,
      activeDocId: parsed.activeDocId || (docs[docs.length - 1]?.id ?? 'start'),
      nextDocNumber: typeof parsed.nextDocNumber === 'number' ? parsed.nextDocNumber : 2,
      recentFiles: Array.isArray(parsed.recentFiles) ? parsed.recentFiles : [],
      language: typeof parsed.language === 'string' && parsed.language.trim() ? parsed.language.trim() : 'it',
      customLanguagePacks:
        parsed.customLanguagePacks && typeof parsed.customLanguagePacks === 'object'
          ? parsed.customLanguagePacks
          : {},
      theme: validTheme,
      workspace: ['drafting', '3dbasics', '3dmodeling'].includes(parsed.workspace) ? parsed.workspace : 'drafting',
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
        osnapModes: { ...DEFAULT_SETTINGS.osnapModes, ...(parsed.settings?.osnapModes || {}) },
      },
    };
  } catch {
    return null;
  }
}

const persisted = loadPersistedState();
const initialDoc = createApartmentSample();
const initialBlank = createEmptyDocument('Disegno1.dwg');

export const useCadStore = create<CadStoreState>((set, get) => ({
  documents: persisted ? persisted.documents : [initialBlank, initialDoc],
  activeDocId: persisted ? persisted.activeDocId : initialDoc.id,
  nextDocNumber: persisted ? persisted.nextDocNumber : 2,
  recentFiles: persisted
    ? persisted.recentFiles
    : [
        { name: 'Planimetria_Appartamento.dwg', date: 'Oggi, 14:50', sampleId: 'apartment' },
        { name: 'Flangia_Meccanica_DN150.dwg', date: 'Oggi, 14:40', sampleId: 'mechanical' },
        { name: 'Padiglione_3D.dwg', date: 'Ieri, 18:15', sampleId: 'pavilion3d' },
      ],

  language: persisted?.language || 'it',
  customLanguagePacks: persisted?.customLanguagePacks || {},
  theme: persisted ? persisted.theme : 'dark',
  workspace: persisted ? persisted.workspace : 'drafting',
  activeRibbonTab:
    persisted?.workspace === '3dbasics'
      ? 'home3d'
      : persisted?.workspace === '3dmodeling'
        ? 'solids'
        : 'home',
  ribbonCollapsed: false,
  cleanScreen: false,
  showPropertiesPalette: true,
  showBlocksPalette: false,
  showQuickCalc: false,
  modals: {
    layerManager: false,
    plot: false,
    units: false,
    options: false,
    script: false,
    textWindowF2: false,
    createBlock: false,
    arrayDialog: null,
    parameters: false,
    mtextEditor: null,
    tableEditor: null,
    layoutSetup: false,
  },

  settings: persisted ? persisted.settings : DEFAULT_SETTINGS,

  command: null,
  lastCommandId: 'LINE',
  commandLog: [
    { id: 'log_0', text: 'OpenFCAD — Ambiente CAD 2D/3D Italiano pronto.', kind: 'info', timestamp: nowTime() },
    { id: 'log_1', text: 'Digita un comando (es. LINEA, CERCHIO, RETTANGOLO, TAGLIA, RACCORDO, ESTRUDI, 3DORBITA) o usa la barra multifunzione.', kind: 'info', timestamp: nowTime() },
  ],
  cursorWorld: { x: 0, y: 0 },
  statusMessage: 'Pronto',
  clipboard: [],
  activeBlockToInsert: null,

  getActiveDoc: () => {
    const s = get();
    if (s.activeDocId === 'start') return null;
    return s.documents.find((d) => d.id === s.activeDocId) || null;
  },

  setActiveDoc: (id) => set({ activeDocId: id, command: null }),

  newDocument: (template = 'iso2d') => {
    const s = get();
    const num = s.nextDocNumber;
    const doc = createEmptyDocument(`Disegno${num}.dwg`);
    if (template === 'iso3d') {
      doc.camera.is3D = true;
      doc.camera.presetView = 'swIso';
      doc.camera.visualStyle = 'shadedEdges';
    }
    const nextWs: WorkspaceType = template === 'iso3d' ? '3dmodeling' : s.workspace;
    set({
      documents: [...s.documents, doc],
      activeDocId: doc.id,
      nextDocNumber: num + 1,
      command: null,
      workspace: nextWs,
      activeRibbonTab: defaultTabForWorkspace(nextWs, template === 'iso3d'),
    });
    const tplName = template === 'iso3d' ? 'openfcad-3d.dwt' : 'openfcad-iso.dwt';
    get().log(`Nuovo disegno creato da modello ${tplName} (${doc.name})`, 'info');
  },

  openSample: (kind) => {
    const doc =
      kind === 'apartment'
        ? createApartmentSample()
        : kind === 'mechanical'
          ? createMechanicalSample()
          : create3DPavilionSample();
    const s = get();
    const nextTab = defaultTabForWorkspace(s.workspace, kind === 'pavilion3d');
    const existing = s.documents.find((d) => d.name === doc.name);
    if (existing) {
      set({
        activeDocId: existing.id,
        command: null,
        activeRibbonTab: nextTab,
      });
      return;
    }
    set({
      documents: [...s.documents, doc],
      activeDocId: doc.id,
      command: null,
      activeRibbonTab: nextTab,
    });
    get().log(`Aperto disegno di esempio: ${doc.name} (${doc.entities.length} oggetti)`, 'info');
  },

  closeDocument: (id) => {
    const s = get();
    const remaining = s.documents.filter((d) => d.id !== id);
    let nextActive: string | 'start' = s.activeDocId;
    if (s.activeDocId === id) {
      nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : 'start';
    }
    set({ documents: remaining, activeDocId: nextActive, command: null });
  },

  importDocumentContent: (name, content, filePath) => {
    try {
      const lower = name.toLowerCase();
      let doc: CadDocument;
      if (lower.endsWith('.dxf')) {
        const parsed = importFromDXF(content);
        doc = createEmptyDocument(name);
        doc.entities = parsed.entities;
        doc.layers = parsed.layers;
        doc.blocks = { ...doc.blocks, ...parsed.blocks };
        doc.filePath = filePath;
      } else {
        const parsed = JSON.parse(content);
        doc = {
          ...createEmptyDocument(name),
          ...parsed,
          id: genId('doc'),
          name,
          filePath,
          modified: false,
          undoStack: [],
          redoStack: [],
        };
      }
      set((s) => ({
        documents: [...s.documents, doc],
        activeDocId: doc.id,
        command: null,
        recentFiles: [{ name, date: 'Adesso' }, ...s.recentFiles.filter((r) => r.name !== name).slice(0, 7)],
      }));
      setTimeout(() => get().zoomExtents(), 50);
      get().log(
        `Importato "${name}" con successo (${doc.entities.length} oggetti, ${doc.layers.length} layer, ${Object.keys(doc.blocks).length} blocchi).`,
        'result'
      );
    } catch (err: any) {
      get().log(`Errore durante l'importazione di ${name}: ${err?.message || err}`, 'error');
    }
  },

  markDocumentSaved: (name, filePath) => {
    set((s) =>
      updateActiveDoc(s, (doc) => ({
        ...doc,
        name: name || doc.name,
        filePath: filePath || doc.filePath,
        modified: false,
      }))
    );
    const doc = get().getActiveDoc();
    if (doc) get().log(`Disegno salvato: ${doc.name}`, 'result');
  },

  setLanguage: (language) => {
    const clean = (language || 'it').trim();
    set({ language: clean });
    get().log(`Lingua interfaccia impostata su: ${clean.toUpperCase()}`, 'info');
  },

  importLanguagePack: (lang, dict) => {
    const clean = (lang || 'custom').trim();
    set((s) => ({
      language: clean,
      customLanguagePacks: {
        ...s.customLanguagePacks,
        [clean]: { ...(s.customLanguagePacks[clean] || {}), ...dict },
      },
    }));
    get().log(`Pacchetto lingua "${clean}" importato (${Object.keys(dict).length} voci).`, 'result');
  },

  setTheme: (theme) => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    set((s) => ({
      theme,
      settings: {
        ...s.settings,
        modelBgColor: theme === 'dark' ? '#212830' : '#F4F6F9',
      },
    }));
  },

  setWorkspace: (workspace) => {
    const tabMap: Record<WorkspaceType, RibbonTabId> = {
      drafting: 'home',
      '3dbasics': 'home3d',
      '3dmodeling': 'solids',
    };
    set({
      workspace,
      activeRibbonTab: tabMap[workspace],
    });
    const labels: Record<WorkspaceType, string> = {
      drafting: 'Disegno e annotazione',
      '3dbasics': 'Elementi 3D di base',
      '3dmodeling': 'Modellazione 3D',
    };
    get().log(`Area di lavoro cambiata in: ${labels[workspace]}`, 'info');
  },

  setActiveRibbonTab: (activeRibbonTab) => set({ activeRibbonTab, ribbonCollapsed: false }),
  toggleRibbonCollapsed: () => set((s) => ({ ribbonCollapsed: !s.ribbonCollapsed })),
  toggleCleanScreen: () => set((s) => ({ cleanScreen: !s.cleanScreen })),
  togglePropertiesPalette: (force) => set((s) => ({ showPropertiesPalette: force ?? !s.showPropertiesPalette })),
  toggleBlocksPalette: (force) => set((s) => ({ showBlocksPalette: force ?? !s.showBlocksPalette })),
  toggleQuickCalc: (force) => set((s) => ({ showQuickCalc: force ?? !s.showQuickCalc })),
  setModal: (key, value) => set((s) => ({ modals: { ...s.modals, [key]: value } })),
  closeAllModals: () =>
    set({
      modals: {
        layerManager: false,
        plot: false,
        units: false,
        options: false,
        script: false,
        textWindowF2: false,
        createBlock: false,
        arrayDialog: null,
        parameters: false,
        mtextEditor: null,
        tableEditor: null,
        layoutSetup: false,
      },
    }),
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  toggleOsnapMode: (mode) =>
    set((s) => ({
      settings: {
        ...s.settings,
        osnapModes: { ...s.settings.osnapModes, [mode]: !s.settings.osnapModes[mode] },
      },
    })),

  log: (text, kind = 'info') =>
    set((s) => ({
      commandLog: [
        ...s.commandLog.slice(-199),
        { id: genId('log'), text, kind, timestamp: nowTime() },
      ],
    })),

  setCursorWorld: (cursorWorld) => set({ cursorWorld }),

  cancelCommand: () => {
    const s = get();
    if (s.command) {
      get().log('*Annulla*', 'info');
      set({ command: null, activeBlockToInsert: null, statusMessage: 'Pronto' });
    } else {
      get().clearSelection();
    }
  },

  repeatLastCommand: () => {
    const last = get().lastCommandId;
    if (last) get().startCommand(last);
  },

  // START ANY CAD COMMAND
  startCommand: (rawId, extraParams = {}) => {
    const s = get();
    const meta = resolveCommand(rawId);
    const id = meta ? meta.id : rawId.toUpperCase();
    const displayName = meta ? meta.italian : id;

    // Non-document global commands
    if (id === 'NEW') return get().newDocument();
    if (id === 'OPEN') {
      openCadFileDialog().then((res) => {
        if (res) get().importDocumentContent(res.name, res.content, res.filePath);
      });
      return;
    }
    if (id === 'OPTIONS' || id === 'LANGUAGE') return get().setModal('options', true);
    if (id === 'UNITS') return get().setModal('units', true);
    if (id === 'QUICKCALC') return get().toggleQuickCalc(true);
    if (id === 'PARAMETERS') return get().setModal('parameters', true);
    if (id === 'SCRIPT') return get().setModal('script', true);

    const doc = get().getActiveDoc();
    if (!doc) {
      get().newDocument();
      return get().startCommand(id, extraParams);
    }

    get().log(`Comando: ${displayName}`, 'command');

    // Immediate commands
    switch (id) {
      case 'SAVE': {
        saveCadFileDialog(doc, 'json').then((res) => {
          if (res) get().markDocumentSaved(res.name, res.filePath);
        });
        return;
      }
      case 'EXPORT_DXF': {
        saveCadFileDialog(doc, 'dxf').then((res) => {
          if (res) get().markDocumentSaved(res.name, res.filePath);
        });
        return;
      }
      case 'UNDO':
        return get().undo();
      case 'REDO':
        return get().redo();
      case 'LAYER':
        return get().setModal('layerManager', true);
      case 'PROPERTIES':
        return get().togglePropertiesPalette();
      case 'INSERT':
        return get().toggleBlocksPalette(true);
      case 'PLOT':
        return get().setModal('plot', true);
      case 'DRAWORDER_FRONT':
        return get().drawOrderSelected('front');
      case 'DRAWORDER_BACK':
        return get().drawOrderSelected('back');
      case 'UNION':
        return get().performBooleanSelected('union');
      case 'SUBTRACT':
        return get().performBooleanSelected('subtract');
      case 'INTERSECT':
        return get().performBooleanSelected('intersect');
      case 'REVOLVE':
        return get().revolveSelected2D();
      case 'SELECTALL': {
        const visIds = doc.entities.filter((e) => isEntityVisible(e, doc.layers)).map((e) => e.id);
        get().setSelection(visIds, 'replace');
        get().log(`Selezionati ${visIds.length} oggetti.`, 'result');
        return;
      }
      case 'ZOOM_EXTENTS':
        return get().zoomExtents();
      case 'REGEN':
        get().log('Rigenerazione del modello in corso.', 'result');
        return;
      case 'VIEW_TOP':
        return get().setPresetView('top');
      case 'VIEW_ISO':
      case '3DORBIT':
        return get().setPresetView('swIso');
      case 'GROUP':
        return get().groupSelected();
      case 'UNGROUP':
        return get().ungroupSelected();
      case 'BLOCK':
        return get().setModal('createBlock', true);
      case 'ARRAY_RECT':
        if (doc.selectedIds.length === 0) {
          get().log('Selezionare prima gli oggetti per creare la serie rettangolare.', 'error');
          return;
        }
        return get().setModal('arrayDialog', 'rect');
      case 'ARRAY_POLAR':
        if (doc.selectedIds.length === 0) {
          get().log('Selezionare prima gli oggetti per creare la serie polare.', 'error');
          return;
        }
        return get().setModal('arrayDialog', 'polar');
      case 'ERASE': {
        if (doc.selectedIds.length > 0) {
          get().deleteSelected();
          return;
        }
        set({
          lastCommandId: id,
          command: { name: 'ERASE', displayName: 'CANCELLA', step: 0, prompt: 'Selezionare oggetti da cancellare:', points: [], params: {} },
        });
        return;
      }
      case 'EXPLODE': {
        if (doc.selectedIds.length === 0) {
          get().log('Selezionare almeno un oggetto composto (rettangolo, polilinea, poligono o blocco) da esplodere.', 'error');
          return;
        }
        let count = 0;
        set((st) =>
          updateActiveDoc(st, (d) => {
            const nextDoc = withUndoSnapshot(d, 'Esplodi');
            const nextEnts: CadEntity[] = [];
            for (const ent of nextDoc.entities) {
              if (d.selectedIds.includes(ent.id)) {
                const parts = explodeEntity(ent, d.blocks);
                if (parts) {
                  nextEnts.push(...parts);
                  count++;
                  continue;
                }
              }
              nextEnts.push(ent);
            }
            return { ...nextDoc, entities: nextEnts, selectedIds: [] };
          })
        );
        get().log(`Esplosi ${count} oggetti.`, 'result');
        return;
      }
      case 'JOIN': {
        const selected = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
        const res = joinEntities(selected);
        if (!res || res.length === 0) {
          get().log('Selezionare almeno 2 entità contigue (linee, archi o polilinee aperte) da unire.', 'error');
          return;
        }
        const removeIds = new Set(selected.filter((e) => e.type === 'line' || e.type === 'arc' || (e.type === 'polyline' && !e.closed)).map((e) => e.id));
        set((st) =>
          updateActiveDoc(st, (d) => {
            const nextDoc = withUndoSnapshot(d, 'Unisci');
            return {
              ...nextDoc,
              entities: [...nextDoc.entities.filter((e) => !removeIds.has(e.id)), ...res],
              selectedIds: res.map((r) => r.id),
            };
          })
        );
        get().log(`Uniti ${removeIds.size} oggetti in ${res.length} polilinea.`, 'result');
        return;
      }
      case 'LIST': {
        if (doc.selectedIds.length === 0) {
          get().log('Nessun oggetto selezionato. Seleziona uno o più oggetti e ripeti LISTA.', 'info');
          return;
        }
        for (const ent of doc.entities.filter((e) => doc.selectedIds.includes(e.id))) {
          const len = getEntityLength(ent);
          const area = getEntityArea(ent);
          get().log(
            `  [${ent.type.toUpperCase()}] Layer: ${ent.layer} | Lunghezza: ${len.toFixed(2)} ${s.settings.units}${area > 0 ? ` | Area: ${area.toFixed(2)} ${s.settings.units}²` : ''}`,
            'result'
          );
        }
        return;
      }
      case 'PURGE': {
        const usedLayers = new Set(doc.entities.map((e) => e.layer));
        const usedBlocks = new Set<string>();
        for (const e of doc.entities) {
          if (e.type === 'block_ref') {
            usedBlocks.add(e.blockName);
            const def = doc.blocks[e.blockName];
            if (def) {
              for (const child of def.entities) usedLayers.add(child.layer);
            }
          }
        }
        usedLayers.add('0');
        usedLayers.add(doc.activeLayer);
        const beforeLayers = doc.layers.length;
        const beforeBlocks = Object.keys(doc.blocks).length;
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Elimina inutilizzati');
            const nextBlocks: Record<string, BlockDefinition> = {};
            for (const [bKey, bVal] of Object.entries(d.blocks)) {
              if (bVal.category !== 'Utente' || usedBlocks.has(bKey)) {
                nextBlocks[bKey] = bVal;
              }
            }
            return {
              ...next,
              layers: next.layers.filter((l) => usedLayers.has(l.name)),
              blocks: nextBlocks,
            };
          })
        );
        const afterDoc = get().getActiveDoc();
        const remLayers = beforeLayers - (afterDoc?.layers.length || beforeLayers);
        const remBlocks = beforeBlocks - (afterDoc ? Object.keys(afterDoc.blocks).length : beforeBlocks);
        get().log(`ELIMINA completato: rimossi ${remLayers} layer e ${remBlocks} blocchi utente inutilizzati.`, 'result');
        return;
      }
      case 'OVERKILL': {
        let removed = 0;
        set((st) =>
          updateActiveDoc(st, (d) => {
            const kept: CadEntity[] = [];
            for (const ent of d.entities) {
              if (!isEntityLocked(ent, d.layers) && kept.some((k) => areEntitiesDuplicate(k, ent))) {
                removed++;
              } else {
                kept.push(ent);
              }
            }
            if (removed === 0) return d;
            const next = withUndoSnapshot(d, 'Elimina duplicati');
            return { ...next, entities: kept, selectedIds: [] };
          })
        );
        get().log(
          removed > 0
            ? `ELIMINADUP: rimosse ${removed} geometrie duplicate.`
            : 'ELIMINADUP: nessuna geometria duplicata trovata.',
          'result'
        );
        return;
      }
      case 'SELECTSIMILAR': {
        const selectedEnts = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
        if (selectedEnts.length === 0) {
          get().log('Selezionare almeno un oggetto campione e ripetere SELEZIONASIMILI.', 'info');
          return;
        }
        const keys = new Set(selectedEnts.map((e) => `${e.type}::${e.layer}`));
        const matchingIds = doc.entities
          .filter((e) => isEntityVisible(e, doc.layers) && keys.has(`${e.type}::${e.layer}`))
          .map((e) => e.id);
        get().setSelection(matchingIds, 'replace');
        get().log(`SELEZIONASIMILI: selezionati ${matchingIds.length} oggetti.`, 'result');
        return;
      }
      case 'LAYISO': {
        const firstSel = doc.entities.find((e) => doc.selectedIds.includes(e.id));
        const targetLayer = firstSel ? firstSel.layer : doc.activeLayer;
        get().isolateLayer(targetLayer);
        get().log(`Layer "${targetLayer}" isolato.`, 'result');
        return;
      }
      case 'LAYUNISO': {
        get().unisolateLayers();
        get().log('Tutti i layer ripristinati.', 'result');
        return;
      }
      case 'EXTRUDE': {
        if (doc.selectedIds.length === 0) {
          get().log('Selezionare prima un cerchio, rettangolo, poligono o polilinea chiusa da estrudere.', 'error');
          return;
        }
        set({
          lastCommandId: id,
          command: {
            name: 'EXTRUDE',
            displayName: 'ESTRUDI',
            step: 0,
            prompt: 'Specificare altezza di estrusione <100>:',
            points: [],
            params: { defaultHeight: 100 },
          },
        });
        return;
      }
    }

    // Interactive commands
    set({ lastCommandId: id });

    const setCmd = (
      prompt: string,
      options?: ActiveCommandState['options'],
      params: Record<string, any> = {}
    ) => {
      set({
        command: { name: id, displayName, step: 0, prompt, options, points: [], params: { ...extraParams, ...params } },
        statusMessage: `${displayName}: ${prompt}`,
      });
    };

    switch (id) {
      case 'LINE':
        setCmd('Specificare primo punto:');
        break;
      case 'POLYLINE':
        setCmd('Specificare punto iniziale:', undefined, { arcMode: false, bulges: [] });
        break;
      case 'CIRCLE':
        setCmd('Specificare centro del cerchio o [2P/3P]:', [
          { label: '2P', key: '2P', value: '2P' },
          { label: '3P', key: '3P', value: '3P' },
        ], { mode: 'cr' });
        break;
      case 'CIRCLE_2P':
        setCmd('Specificare primo punto estremo del diametro del cerchio:', undefined, { mode: '2p' });
        break;
      case 'CIRCLE_3P':
        setCmd('Specificare primo punto sul cerchio:', undefined, { mode: '3p' });
        break;
      case 'ARC':
        setCmd('Specificare punto iniziale dell\'arco o [Centro]:', [
          { label: 'Centro', key: 'C', value: 'CENTER_MODE' },
        ], { arcMode: '3p' });
        break;
      case 'RECTANGLE':
        setCmd('Specificare primo angolo:');
        break;
      case 'POLYGON':
        setCmd('Digitare numero di lati <6>:', [
          { label: '3', key: '3', value: '3' },
          { label: '5', key: '5', value: '5' },
          { label: '6', key: '6', value: '6' },
          { label: '8', key: '8', value: '8' },
        ], { sides: 6, inscribed: true });
        break;
      case 'ELLIPSE':
        setCmd('Specificare centro dell\'ellisse:');
        break;
      case 'SPLINE':
        setCmd('Specificare primo punto della spline:');
        break;
      case 'XLINE':
        setCmd('Specificare punto di passaggio o [Orizz/Vert]:', [
          { label: 'Orizz', key: 'O', value: 'H' },
          { label: 'Vert', key: 'V', value: 'V' },
        ]);
        break;
      case 'RAY':
        setCmd('Specificare punto iniziale della semiretta:');
        break;
      case 'POINT':
        setCmd('Specificare posizione del punto:');
        break;
      case 'DONUT':
        setCmd('Specificare diametro interno dell\'anello <20>:', undefined, { stage: 'inner', innerD: 20, outerD: 40 });
        break;
      case 'DIVIDE':
        setCmd('Selezionare oggetto da dividere in segmenti uguali:', undefined, { stage: 'pick', segments: 4 });
        break;
      case 'MEASURE_SEG':
        setCmd('Selezionare oggetto lungo il quale inserire punti a distanza fissa:', undefined, { stage: 'pick', interval: 25 });
        break;
      case 'HATCH':
        setCmd(
          `Selezionare punto interno ad un'area chiusa o cliccare un oggetto chiuso [Motivo: ${s.settings.hatchPattern}]:`,
          [
            { label: 'ANSI31', key: '1', value: 'ANSI31' },
            { label: 'SOLID', key: '2', value: 'SOLID' },
            { label: 'NET', key: '3', value: 'NET' },
            { label: 'BRICK', key: '4', value: 'BRICK' },
            { label: 'AR-CONC', key: '5', value: 'AR-CONC' },
          ]
        );
        break;
      case 'REVCLOUD':
        setCmd('Specificare punti del contorno nuvola di revisione (Invio per chiudere):');
        break;
      case 'TEXT':
      case 'MTEXT':
        setCmd('Specificare punto di inserimento del testo:');
        break;
      case 'TABLE':
        setCmd('Specificare angolo superiore sinistro della tabella:');
        break;
      case 'DIMLINEAR':
      case 'DIMALIGNED':
        setCmd('Specificare origine della prima linea di estensione:');
        break;
      case 'DIMRADIUS':
      case 'DIMDIAMETER':
        setCmd('Selezionare un cerchio o un arco:');
        break;
      case 'DIMANGULAR':
        setCmd('Specificare vertice dell\'angolo:');
        break;
      case 'LEADER':
        setCmd('Specificare posizione della punta freccia:');
        break;
      case 'STRETCH':
        setCmd('Specificare primo angolo della finestra di stiramento:', undefined, { stage: 'box1' });
        break;
      case 'BREAK':
        setCmd('Selezionare oggetto al primo punto di rottura:', undefined, { stage: 'p1' });
        break;
      case 'ALIGN':
        if (doc.selectedIds.length === 0) {
          setCmd('Selezionare oggetti da allineare (poi Invio):', undefined, { pickingSelection: true, stage: 'src1' });
        } else {
          setCmd('Specificare primo punto di origine (Src1):', undefined, { pickingSelection: false, stage: 'src1' });
        }
        break;
      case 'MOVE':
      case 'COPY':
      case 'ROTATE':
      case 'MIRROR':
      case 'SCALE': {
        if (doc.selectedIds.length === 0) {
          setCmd('Selezionare oggetti (clicca oggetti, poi premi Invio o Tasto Destro):', undefined, { pickingSelection: true });
        } else {
          const prompts: Record<string, string> = {
            MOVE: 'Specificare punto base di spostamento:',
            COPY: 'Specificare punto base di copia:',
            ROTATE: 'Specificare punto base di rotazione:',
            MIRROR: 'Specificare primo punto della linea speculare:',
            SCALE: 'Specificare punto base di scala:',
          };
          setCmd(prompts[id], undefined, { pickingSelection: false });
        }
        break;
      }
      case 'MOVE3D':
        if (doc.selectedIds.length === 0) {
          get().log('Selezionare prima almeno un oggetto o solido 3D.', 'error');
          return;
        }
        setCmd('Digitare spostamento 3D dX,dY,dZ (es. 50,0,30):');
        break;
      case 'ROTATE3D':
        if (doc.selectedIds.length === 0) {
          get().log('Selezionare prima almeno un oggetto o solido 3D.', 'error');
          return;
        }
        setCmd('Digitare asse e gradi (es. Z,90 oppure X,45 o Y,30):');
        break;
      case 'TRIM':
        setCmd('Taglio rapido: cliccare i segmenti da tagliare tra le intersezioni (ESC per terminare):');
        break;
      case 'EXTEND':
        setCmd('Estensione rapida: cliccare l\'estremità di una linea, polilinea o arco (ESC per terminare):');
        break;
      case 'OFFSET':
        setCmd(
          `Specificare distanza di offset <${s.settings.offsetDistance}> o [Attraverso]:`,
          [{ label: 'Attraverso', key: 'A', value: 'THROUGH' }],
          { distance: s.settings.offsetDistance, stage: 'distance', through: false }
        );
        break;
      case 'FILLET':
        setCmd(`Selezionare prima linea o [Raggio] (Raggio corrente = ${s.settings.filletRadius}):`, [
          { label: 'Raggio', key: 'R', value: 'RADIUS' },
          { label: 'R=0', key: '0', value: 'R0' },
        ], { radius: s.settings.filletRadius, stage: 'first' });
        break;
      case 'CHAMFER':
        setCmd(`Selezionare prima linea o [Distanza] (Dist = ${s.settings.chamferDist1}, ${s.settings.chamferDist2}):`, [
          { label: 'Distanza', key: 'D', value: 'DIST' },
        ], { d1: s.settings.chamferDist1, d2: s.settings.chamferDist2, stage: 'first' });
        break;
      case 'MATCHPROP':
        setCmd('Selezionare oggetto di origine:', undefined, { stage: 'source' });
        break;
      case 'DIST':
        setCmd('Specificare primo punto da misurare:');
        break;
      case 'AREA':
        setCmd('Specificare primo angolo dell\'area o cliccare [Oggetto]:', [{ label: 'Oggetto', key: 'O', value: 'OBJ' }]);
        break;
      case 'ID':
        setCmd('Specificare punto per visualizzare coordinate:');
        break;
      case 'ZOOM_WINDOW':
        setCmd('Specificare primo angolo della finestra di zoom:');
        break;
      case 'PAN':
        setCmd('Trascinare con il mouse per eseguire Pan (ESC per uscire):');
        break;
      case 'BOX':
        setCmd('Specificare primo angolo della base del parallelepipedo:');
        break;
      case 'CYLINDER':
        setCmd('Specificare punto centrale della base del cilindro:');
        break;
      case 'SPHERE':
        setCmd('Specificare centro della sfera:');
        break;
      case 'CONE':
        setCmd('Specificare punto centrale della base del cono:');
        break;
      case 'PYRAMID':
        setCmd('Specificare punto centrale della base della piramide:');
        break;
      case 'TORUS':
        setCmd('Specificare centro del toro:');
        break;
      case 'INSERT_BLOCK':
        setCmd(`Specificare punto di inserimento per blocco "${extraParams.blockName || 'PORTA_80'}":`);
        break;
      default:
        get().log(`Comando sconosciuto: "${rawId}". Digita un comando valido (es. LINEA, CERCHIO, SPOSTA, TAGLIA).`, 'error');
        break;
    }
  },

  submitCommandOption: (optValue) => {
    const s = get();
    const cmd = s.command;
    if (!cmd) return;
    const doc = s.getActiveDoc();
    if (!doc) return;

    if (cmd.name === 'LINE') {
      if (optValue === 'CLOSE' && cmd.points.length >= 2) {
        const first = cmd.points[0];
        const last = cmd.points[cmd.points.length - 1];
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Chiudi Linea');
            return {
              ...next,
              entities: [
                ...next.entities,
                { ...makeBaseEntityProps(d), id: genId('line'), type: 'line', start: last, end: first },
              ],
            };
          })
        );
        set({ command: null });
        get().log('Poligono di linee chiuso.', 'result');
        return;
      }
      if (optValue === 'UNDO' && cmd.points.length >= 2) {
        get().undo();
        const pts = cmd.points.slice(0, -1);
        set({ command: { ...cmd, points: pts } });
        return;
      }
    }

    if (cmd.name === 'POLYLINE') {
      if (optValue === 'ARC_MODE' || optValue === 'LINE_MODE') {
        const arcMode = optValue === 'ARC_MODE';
        const hasClose = cmd.points.length >= 3;
        set({
          command: {
            ...cmd,
            prompt: arcMode
              ? 'Modalità Arco — Specificare punto successivo o [Linea/Chiudi/Annulla]:'
              : 'Modalità Linea — Specificare punto successivo o [Arco/Chiudi/Annulla]:',
            options: [
              arcMode ? { label: 'Linea', key: 'L', value: 'LINE_MODE' } : { label: 'Arco', key: 'R', value: 'ARC_MODE' },
              ...(hasClose ? [{ label: 'Chiudi', key: 'C', value: 'CLOSE' }] : []),
              { label: 'Annulla', key: 'A', value: 'UNDO' },
            ],
            params: { ...cmd.params, arcMode },
          },
        });
        return;
      }
      if (optValue === 'CLOSE' && cmd.points.length >= 3) {
        const rawBulges: number[] = Array.isArray(cmd.params.bulges)
          ? [...cmd.params.bulges]
          : cmd.points.slice(0, -1).map(() => 0);
        const bulges = [...rawBulges.slice(0, cmd.points.length - 1), cmd.params.arcMode ? 0.41421356 : 0];
        const hasBulge = bulges.some((b) => Math.abs(b) > 1e-6);
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Polilinea chiusa');
            return {
              ...next,
              entities: [
                ...next.entities,
                {
                  ...makeBaseEntityProps(d),
                  id: genId('polyline'),
                  type: 'polyline',
                  points: cmd.points,
                  closed: true,
                  ...(hasBulge ? { bulges } : {}),
                },
              ],
            };
          })
        );
        set({ command: null });
        get().log(`Creata polilinea chiusa con ${cmd.points.length} vertici.`, 'result');
        return;
      }
      if (optValue === 'UNDO' && cmd.points.length > 1) {
        const prevPts = cmd.points.slice(0, -1);
        const prevBulges = Array.isArray(cmd.params.bulges) ? cmd.params.bulges.slice(0, -1) : [];
        set({
          command: {
            ...cmd,
            points: prevPts,
            params: { ...cmd.params, bulges: prevBulges },
          },
        });
        return;
      }
    }

    if (cmd.name === 'ARC' && optValue === 'CENTER_MODE') {
      set({
        command: {
          ...cmd,
          prompt: 'Specificare centro dell\'arco:',
          options: undefined,
          params: { ...cmd.params, arcMode: 'center' },
        },
      });
      return;
    }

    if (cmd.name === 'OFFSET' && optValue === 'THROUGH') {
      set({
        command: {
          ...cmd,
          prompt: 'Modalità Attraverso attiva. Selezionare oggetto da sottoporre ad offset:',
          options: undefined,
          params: { ...cmd.params, through: true, stage: 'select' },
        },
      });
      return;
    }

    if (cmd.name === 'CIRCLE') {
      if (optValue === '2P') {
        set({ command: { ...cmd, name: 'CIRCLE_2P', prompt: 'Specificare primo punto estremo del diametro:', options: undefined, params: { mode: '2p' } } });
        return;
      }
      if (optValue === '3P') {
        set({ command: { ...cmd, name: 'CIRCLE_3P', prompt: 'Specificare primo punto sul cerchio:', options: undefined, params: { mode: '3p' } } });
        return;
      }
      if (optValue === 'DIAMETER') {
        set({ command: { ...cmd, prompt: 'Specificare diametro del cerchio:', params: { ...cmd.params, useDiameter: true } } });
        return;
      }
    }

    if (cmd.name === 'POLYGON') {
      const n = parseInt(optValue, 10);
      if (!Number.isNaN(n) && n >= 3) {
        set({
          command: {
            ...cmd,
            step: 1,
            prompt: `Specificare centro del poligono (${n} lati):`,
            options: undefined,
            params: { ...cmd.params, sides: n },
          },
        });
        return;
      }
      if (optValue === 'I' || optValue === 'C') {
        set({
          command: {
            ...cmd,
            step: 3,
            prompt: 'Specificare raggio del cerchio:',
            options: undefined,
            params: { ...cmd.params, inscribed: optValue === 'I' },
          },
        });
        return;
      }
    }

    if (cmd.name === 'XLINE') {
      if (optValue === 'H' || optValue === 'V') {
        set({
          command: {
            ...cmd,
            prompt: `Specificare punto di passaggio (${optValue === 'H' ? 'Orizzontale' : 'Verticale'}):`,
            options: undefined,
            params: { ...cmd.params, fixedDir: optValue === 'H' ? { x: 1, y: 0 } : { x: 0, y: 1 } },
          },
        });
        return;
      }
    }

    if (cmd.name === 'HATCH') {
      const validPatterns: HatchPatternName[] = [
        'ANSI31', 'ANSI32', 'ANSI33', 'ANSI37', 'SOLID', 'NET', 'BRICK',
        'DOTS', 'HONEY', 'CROSS', 'AR-CONC', 'AR-SAND', 'AR-HBONE', 'EARTH', 'GRATE',
      ];
      if (validPatterns.includes(optValue as HatchPatternName)) {
        get().updateSettings({ hatchPattern: optValue as HatchPatternName });
        set({ command: { ...cmd, prompt: `Selezionare area chiusa [Motivo: ${optValue}]:` } });
        return;
      }
    }

    if (cmd.name === 'ALIGN' && (optValue === 'SCALE_YES' || optValue === 'SCALE_NO') && cmd.points.length >= 4) {
      const [src1, dst1, src2, dst2] = cmd.points;
      const scaleToMatch = optValue === 'SCALE_YES';
      const ids = new Set(doc.selectedIds);
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, 'Allinea');
          const aligned = alignEntities(
            next.entities.filter((e) => ids.has(e.id) && !isEntityLocked(e, d.layers)),
            src1,
            dst1,
            src2,
            dst2,
            scaleToMatch
          );
          const alignedMap = new Map(aligned.map((a) => [a.id, a]));
          return {
            ...next,
            entities: next.entities.map((e) => alignedMap.get(e.id) || e),
          };
        })
      );
      get().log(`Allineati ${ids.size} oggetti (${scaleToMatch ? 'con adattamento scala' : 'scala invariata'}).`, 'result');
      set({ command: null });
      return;
    }

    if (cmd.name === 'FILLET') {
      if (optValue === 'RADIUS') {
        set({ command: { ...cmd, prompt: `Specificare raggio di raccordo <${s.settings.filletRadius}>:`, params: { ...cmd.params, stage: 'setRadius' } } });
        return;
      }
      if (optValue === 'R0') {
        get().updateSettings({ filletRadius: 0 });
        set({ command: { ...cmd, prompt: 'Raggio impostato a 0. Selezionare prima linea:', params: { ...cmd.params, radius: 0, stage: 'first' } } });
        return;
      }
    }

    if (cmd.name === 'CHAMFER' && optValue === 'DIST') {
      set({ command: { ...cmd, prompt: `Specificare prima distanza di cima <${s.settings.chamferDist1}>:`, params: { ...cmd.params, stage: 'setDist' } } });
      return;
    }

    if (cmd.name === 'MIRROR' && (optValue === 'YES' || optValue === 'NO')) {
      const [p1, p2] = cmd.points;
      const deleteSource = optValue === 'YES';
      const ids = new Set(doc.selectedIds);
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, 'Specchio');
          const mirrored = next.entities
            .filter((e) => ids.has(e.id) && !isEntityLocked(e, d.layers))
            .map((e) => mirrorEntity(e, p1, p2, true));
          const kept = deleteSource ? next.entities.filter((e) => !ids.has(e.id)) : next.entities;
          return { ...next, entities: [...kept, ...mirrored], selectedIds: mirrored.map((m) => m.id) };
        })
      );
      set({ command: null });
      get().log(`Specchio completato (${deleteSource ? 'origine cancellata' : 'origine mantenuta'}).`, 'result');
      return;
    }

    if (cmd.name === 'AREA' && optValue === 'OBJ') {
      set({ command: { ...cmd, prompt: 'Cliccare un oggetto chiuso per calcolarne Area e Perimetro:', params: { mode: 'obj' } } });
    }
  },

  finishMultiStepCommand: () => {
    const s = get();
    const cmd = s.command;
    if (!cmd) {
      get().repeatLastCommand();
      return;
    }
    const doc = s.getActiveDoc();
    if (!doc) return;

    if (cmd.params.pickingSelection) {
      if (doc.selectedIds.length === 0) {
        get().log('Nessun oggetto selezionato.', 'info');
        set({ command: null });
        return;
      }
      const prompts: Record<string, string> = {
        MOVE: 'Specificare punto base di spostamento:',
        COPY: 'Specificare punto base di copia:',
        ROTATE: 'Specificare punto base di rotazione:',
        MIRROR: 'Specificare primo punto della linea speculare:',
        SCALE: 'Specificare punto base di scala:',
        STRETCH: 'Specificare punto base di stiramento:',
        ALIGN: 'Specificare primo punto di origine (Src1):',
      };
      set({ command: { ...cmd, params: { ...cmd.params, pickingSelection: false }, prompt: prompts[cmd.name] || 'Specificare punto base:' } });
      return;
    }

    if (cmd.name === 'POLYLINE' && cmd.points.length >= 2) {
      const rawBulges: number[] = Array.isArray(cmd.params.bulges)
        ? cmd.params.bulges.slice(0, cmd.points.length - 1)
        : [];
      const hasBulge = rawBulges.some((b) => Math.abs(b) > 1e-6);
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, 'Polilinea');
          return {
            ...next,
            entities: [
              ...next.entities,
              {
                ...makeBaseEntityProps(d),
                id: genId('polyline'),
                type: 'polyline',
                points: cmd.points,
                closed: false,
                ...(hasBulge ? { bulges: rawBulges } : {}),
              },
            ],
          };
        })
      );
      get().log(`Creata polilinea con ${cmd.points.length} vertici.`, 'result');
      set({ command: null });
      return;
    }

    if (cmd.name === 'DONUT') {
      if (cmd.params.stage === 'inner') {
        const innerD = cmd.params.innerD ?? 20;
        const outerD = cmd.params.outerD ?? Math.max(innerD + 10, 40);
        set({
          command: {
            ...cmd,
            prompt: `Specificare diametro esterno dell'anello <${outerD}>:`,
            params: { ...cmd.params, innerD, stage: 'outer' },
          },
        });
        return;
      }
      if (cmd.params.stage === 'outer') {
        set({
          command: {
            ...cmd,
            prompt: 'Specificare centro dell\'anello (clicca più volte, ESC per terminare):',
            params: { ...cmd.params, stage: 'center' },
          },
        });
        return;
      }
    }

    if (cmd.name === 'DIVIDE' && cmd.params.stage === 'count') {
      const segs = cmd.params.segments || 4;
      const target = doc.entities.find((e) => e.id === cmd.params.targetId);
      if (target) {
        const pts = divideEntity(target, segs);
        if (pts.length > 0) {
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Dividi');
              const baseProps = makeBaseEntityProps(d);
              const created: CadEntity[] = pts.map((p) => ({
                ...baseProps,
                id: genId('point'),
                type: 'point',
                position: p,
              }));
              return { ...next, entities: [...next.entities, ...created] };
            })
          );
          get().log(`Creati ${pts.length} punti di divisione (${segs} segmenti).`, 'result');
        } else {
          get().log('Impossibile dividere l\'oggetto selezionato.', 'error');
        }
      }
      set({ command: null });
      return;
    }

    if (cmd.name === 'MEASURE_SEG' && cmd.params.stage === 'dist') {
      const interval = cmd.params.interval || 25;
      const target = doc.entities.find((e) => e.id === cmd.params.targetId);
      if (target) {
        const pts = measureEntityByDistance(target, interval);
        if (pts.length > 0) {
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Misura segmenti');
              const baseProps = makeBaseEntityProps(d);
              const created: CadEntity[] = pts.map((p) => ({
                ...baseProps,
                id: genId('point'),
                type: 'point',
                position: p,
              }));
              return { ...next, entities: [...next.entities, ...created] };
            })
          );
          get().log(`Creati ${pts.length} punti a passo ${interval}.`, 'result');
        } else {
          get().log('Nessun punto generato (lunghezza inferiore al passo o oggetto non supportato).', 'info');
        }
      }
      set({ command: null });
      return;
    }

    if (cmd.name === 'ALIGN' && cmd.params.stage === 'scaleOpt') {
      get().submitCommandOption('SCALE_NO');
      return;
    }

    if (cmd.name === 'SPLINE' && cmd.points.length >= 2) {
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, 'Spline');
          return {
            ...next,
            entities: [...next.entities, { ...makeBaseEntityProps(d), id: genId('spline'), type: 'spline', controlPoints: cmd.points, closed: false }],
          };
        })
      );
      get().log(`Creata spline con ${cmd.points.length} punti di controllo.`, 'result');
      set({ command: null });
      return;
    }

    if (cmd.name === 'REVCLOUD' && cmd.points.length >= 3) {
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, 'Nuvola di revisione');
          return {
            ...next,
            entities: [...next.entities, { ...makeBaseEntityProps(d), id: genId('revcloud'), type: 'revcloud', points: cmd.points, arcLength: 18, closed: true }],
          };
        })
      );
      get().log('Nuvola di revisione creata.', 'result');
      set({ command: null });
      return;
    }

    if (cmd.name === 'AREA' && cmd.points.length >= 3) {
      const a = polygonArea(cmd.points);
      let perim = 0;
      for (let i = 0; i < cmd.points.length; i++) perim += dist(cmd.points[i], cmd.points[(i + 1) % cmd.points.length]);
      get().log(`Area = ${a.toFixed(s.settings.precision)} ${s.settings.units}² | Perimetro = ${perim.toFixed(s.settings.precision)} ${s.settings.units}`, 'result');
      set({ command: null });
      return;
    }

    if (cmd.name === 'OFFSET' && cmd.params.stage === 'distance') {
      set({ command: { ...cmd, prompt: `Distanza = ${s.settings.offsetDistance}. Selezionare oggetto da sottoporre ad offset:`, params: { ...cmd.params, stage: 'select' } } });
      return;
    }

    if (cmd.name === 'POLYGON' && cmd.step === 0) {
      set({ command: { ...cmd, step: 1, prompt: `Specificare centro del poligono (${cmd.params.sides} lati):`, options: undefined } });
      return;
    }

    if (cmd.name === 'EXTRUDE') {
      get().extrudeSelected2D(cmd.params.defaultHeight || 100);
      set({ command: null });
      return;
    }

    // Default Enter finishes continuous commands like LINE, COPY, TRIM, EXTEND, OFFSET, POINT
    set({ command: null, statusMessage: 'Pronto' });
  },

  // HANDLE TEXT / COORDINATE / NUMBER SUBMISSION IN COMMAND LINE OR DYNAMIC INPUT
  submitCommandInput: (rawText) => {
    const s = get();
    const trimmed = rawText.trim();
    if (!trimmed) {
      get().finishMultiStepCommand();
      return;
    }

    const cmd = s.command;
    if (!cmd) {
      get().startCommand(trimmed);
      return;
    }

    // Check clickable option shortcuts
    if (cmd.options) {
      const upper = trimmed.toUpperCase();
      const matchedOpt = cmd.options.find(
        (o) => o.key.toUpperCase() === upper || o.label.toUpperCase() === upper || o.value.toUpperCase() === upper
      );
      if (matchedOpt) {
        get().log(`> ${trimmed}`, 'prompt');
        get().submitCommandOption(matchedOpt.value);
        return;
      }
    }

    // Text-entry commands
    if ((cmd.name === 'TEXT' || cmd.name === 'MTEXT') && cmd.step === 1) {
      const pos = cmd.points[0];
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, 'Testo');
          const ent: CadEntity =
            cmd.name === 'TEXT'
              ? {
                  ...makeBaseEntityProps(d),
                  id: genId('text'),
                  type: 'text',
                  position: pos,
                  content: trimmed,
                  height: st.settings.textHeight,
                  rotation: 0,
                }
              : {
                  ...makeBaseEntityProps(d),
                  id: genId('mtext'),
                  type: 'mtext',
                  position: pos,
                  content: trimmed,
                  height: st.settings.textHeight,
                  width: Math.max(120, trimmed.length * st.settings.textHeight * 0.7),
                  rotation: 0,
                };
          return { ...next, entities: [...next.entities, ent] };
        })
      );
      get().log(`Testo creato: "${trimmed}"`, 'result');
      set({ command: null });
      return;
    }

    if (cmd.name === 'LEADER' && cmd.step === 2) {
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, 'Direttrice');
          return {
            ...next,
            entities: [
              ...next.entities,
              {
                ...makeBaseEntityProps(d),
                id: genId('leader'),
                type: 'leader',
                points: cmd.points,
                text: trimmed,
                textHeight: st.settings.dimTextHeight,
              },
            ],
          };
        })
      );
      get().log(`Direttrice creata: "${trimmed}"`, 'result');
      set({ command: null });
      return;
    }

    const activeDoc = s.getActiveDoc();
    const vars = activeDoc?.parametricVars;

    if (cmd.name === 'EXTRUDE') {
      const h = evalCadNumber(trimmed, vars);
      if (h !== null && h !== 0) {
        get().extrudeSelected2D(h);
        set({ command: null });
        return;
      }
    }

    if (cmd.name === 'DONUT') {
      const v = evalCadNumber(trimmed, vars);
      if (cmd.params.stage === 'inner' && v !== null && v >= 0) {
        const outerD = Math.max(v + 10, cmd.params.outerD ?? 40);
        set({
          command: {
            ...cmd,
            prompt: `Specificare diametro esterno dell'anello <${outerD}>:`,
            params: { ...cmd.params, innerD: v, outerD, stage: 'outer' },
          },
        });
        return;
      }
      if (cmd.params.stage === 'outer' && v !== null && v > (cmd.params.innerD ?? 0)) {
        set({
          command: {
            ...cmd,
            prompt: 'Specificare centro dell\'anello (clicca più volte, ESC per terminare):',
            params: { ...cmd.params, outerD: v, stage: 'center' },
          },
        });
        return;
      }
    }

    if (cmd.name === 'DIVIDE' && cmd.params.stage === 'count' && activeDoc) {
      const nRaw = evalCadNumber(trimmed, vars);
      if (nRaw !== null && nRaw >= 2 && nRaw <= 200) {
        const segs = Math.round(nRaw);
        const target = activeDoc.entities.find((e) => e.id === cmd.params.targetId);
        if (target) {
          const pts = divideEntity(target, segs);
          if (pts.length > 0) {
            set((st) =>
              updateActiveDoc(st, (d) => {
                const next = withUndoSnapshot(d, 'Dividi');
                const baseProps = makeBaseEntityProps(d);
                const created: CadEntity[] = pts.map((p) => ({
                  ...baseProps,
                  id: genId('point'),
                  type: 'point',
                  position: p,
                }));
                return { ...next, entities: [...next.entities, ...created] };
              })
            );
            get().log(`Creati ${pts.length} punti di divisione (${segs} segmenti).`, 'result');
          } else {
            get().log('Impossibile dividere questo tipo di oggetto.', 'error');
          }
        }
        set({ command: null });
        return;
      }
    }

    if (cmd.name === 'MEASURE_SEG' && cmd.params.stage === 'dist' && activeDoc) {
      const distRaw = evalCadNumber(trimmed, vars);
      if (distRaw !== null && distRaw > 0.05) {
        const target = activeDoc.entities.find((e) => e.id === cmd.params.targetId);
        if (target) {
          const pts = measureEntityByDistance(target, distRaw);
          if (pts.length > 0) {
            set((st) =>
              updateActiveDoc(st, (d) => {
                const next = withUndoSnapshot(d, 'Misura segmenti');
                const baseProps = makeBaseEntityProps(d);
                const created: CadEntity[] = pts.map((p) => ({
                  ...baseProps,
                  id: genId('point'),
                  type: 'point',
                  position: p,
                }));
                return { ...next, entities: [...next.entities, ...created] };
              })
            );
            get().log(`Creati ${pts.length} punti lungo l'oggetto (passo = ${distRaw}).`, 'result');
          } else {
            get().log('Nessun punto generato per questo passo/oggetto.', 'info');
          }
        }
        set({ command: null });
        return;
      }
    }

    if (cmd.name === 'MOVE3D' && activeDoc) {
      const parts = trimmed.split(',').map((p) => evalCadNumber(p.trim(), vars));
      if (parts.length === 3 && parts.every((n) => n !== null)) {
        const [dx, dy, dz] = parts as [number, number, number];
        const ids = new Set(activeDoc.selectedIds);
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Sposta 3D');
            return {
              ...next,
              entities: next.entities.map((e) => {
                if (!ids.has(e.id) || isEntityLocked(e, d.layers)) return e;
                if (e.type === 'solid3d') {
                  return {
                    ...e,
                    position: { x: e.position.x + dx, y: e.position.y + dy, z: e.position.z + dz },
                  };
                }
                const shifted = translateEntity(e, dx, dy);
                return { ...shifted, elevation: (shifted.elevation || 0) + dz };
              }),
            };
          })
        );
        get().log(`Spostamento 3D applicato (${dx}, ${dy}, ${dz}).`, 'result');
        set({ command: null });
        return;
      }
      get().log('Formato non valido. Inserire dX,dY,dZ (es. 50,0,30).', 'error');
      return;
    }

    if (cmd.name === 'ROTATE3D' && activeDoc) {
      const parts = trimmed.split(',').map((p) => p.trim());
      const axis = parts[0]?.toLowerCase() as 'x' | 'y' | 'z';
      const deg = parts.length >= 2 ? evalCadNumber(parts[1], vars) : null;
      if ((axis === 'x' || axis === 'y' || axis === 'z') && deg !== null) {
        const rad = degToRad(deg);
        const ids = new Set(activeDoc.selectedIds);
        const selEnts = activeDoc.entities.filter((e) => ids.has(e.id));
        const centroid =
          selEnts.length > 0
            ? selEnts.reduce(
                (acc, e) => {
                  const c = getEntityCentroid(e, activeDoc.blocks);
                  return { x: acc.x + c.x / selEnts.length, y: acc.y + c.y / selEnts.length };
                },
                { x: 0, y: 0 }
              )
            : { x: 0, y: 0 };
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Ruota 3D');
            return {
              ...next,
              entities: next.entities.map((e) => {
                if (!ids.has(e.id) || isEntityLocked(e, d.layers)) return e;
                if (e.type === 'solid3d') {
                  return {
                    ...e,
                    rotation: { ...e.rotation, [axis]: (e.rotation[axis] || 0) + rad },
                  };
                }
                return axis === 'z' ? rotateEntity(e, centroid, rad) : e;
              }),
            };
          })
        );
        get().log(`Rotazione 3D su asse ${axis.toUpperCase()} di ${deg}° applicata.`, 'result');
        set({ command: null });
        return;
      }
      get().log('Formato non valido. Inserire Asse,Gradi (es. Z,90 o X,45).', 'error');
      return;
    }

    if (cmd.name === 'POLYGON' && cmd.step === 0) {
      const n = evalCadNumber(trimmed, vars);
      if (n !== null && n >= 3 && n <= 64) {
        set({
          command: {
            ...cmd,
            step: 1,
            prompt: `Specificare centro del poligono (${Math.round(n)} lati):`,
            options: undefined,
            params: { ...cmd.params, sides: Math.round(n) },
          },
        });
        return;
      }
    }

    if (cmd.name === 'OFFSET' && cmd.params.stage === 'distance') {
      const dVal = evalCadNumber(trimmed, vars);
      if (dVal !== null && dVal > 0) {
        get().updateSettings({ offsetDistance: dVal });
        set({
          command: {
            ...cmd,
            prompt: `Distanza offset = ${dVal}. Selezionare oggetto:`,
            params: { ...cmd.params, distance: dVal, stage: 'select' },
          },
        });
        return;
      }
    }

    if (cmd.name === 'FILLET' && cmd.params.stage === 'setRadius') {
      const rVal = evalCadNumber(trimmed, vars);
      if (rVal !== null && rVal >= 0) {
        get().updateSettings({ filletRadius: rVal });
        set({
          command: {
            ...cmd,
            prompt: `Raggio = ${rVal}. Selezionare prima linea:`,
            params: { ...cmd.params, radius: rVal, stage: 'first' },
          },
        });
        return;
      }
    }

    if (cmd.name === 'CHAMFER' && cmd.params.stage === 'setDist') {
      const dVal = evalCadNumber(trimmed, vars);
      if (dVal !== null && dVal >= 0) {
        get().updateSettings({ chamferDist1: dVal, chamferDist2: dVal });
        set({
          command: {
            ...cmd,
            prompt: `Distanza cima = ${dVal}. Selezionare prima linea:`,
            params: { ...cmd.params, d1: dVal, d2: dVal, stage: 'first' },
          },
        });
        return;
      }
    }

    // Numeric parameters for ROTATE / SCALE / CIRCLE / POLYGON / 3D Height
    const lastPt = cmd.points[cmd.points.length - 1];
    const parsed = parseCoordinateInput(trimmed, lastPt, s.cursorWorld, vars);

    if (parsed.kind === 'number') {
      const val = parsed.value;
      if (cmd.name === 'ROTATE' && cmd.points.length === 1) {
        const doc = s.getActiveDoc();
        if (!doc) return;
        const origin = cmd.points[0];
        const rad = degToRad(val);
        const ids = new Set(doc.selectedIds);
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Ruota');
            return {
              ...next,
              entities: next.entities.map((e) => (ids.has(e.id) && !isEntityLocked(e, d.layers) ? rotateEntity(e, origin, rad) : e)),
            };
          })
        );
        get().log(`Ruotati ${ids.size} oggetti di ${val}°.`, 'result');
        set({ command: null });
        return;
      }

      if (cmd.name === 'SCALE' && cmd.points.length === 1 && val > 0) {
        const doc = s.getActiveDoc();
        if (!doc) return;
        const origin = cmd.points[0];
        const ids = new Set(doc.selectedIds);
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Scala');
            return {
              ...next,
              entities: next.entities.map((e) => (ids.has(e.id) && !isEntityLocked(e, d.layers) ? scaleEntity(e, origin, val) : e)),
            };
          })
        );
        get().log(`Scalati ${ids.size} oggetti con fattore ${val}.`, 'result');
        set({ command: null });
        return;
      }

      if (cmd.name === 'CIRCLE' && cmd.points.length === 1 && val > 0) {
        const radius = cmd.params.useDiameter ? val / 2 : val;
        const center = cmd.points[0];
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Cerchio');
            return {
              ...next,
              entities: [...next.entities, { ...makeBaseEntityProps(d), id: genId('circle'), type: 'circle', center, radius }],
            };
          })
        );
        get().log(`Creato cerchio R=${radius.toFixed(2)}.`, 'result');
        set({ command: null });
        return;
      }

      if (cmd.name === 'POLYGON' && cmd.points.length === 1 && val > 0) {
        const center = cmd.points[0];
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Poligono');
            return {
              ...next,
              entities: [
                ...next.entities,
                {
                  ...makeBaseEntityProps(d),
                  id: genId('polygon'),
                  type: 'polygon',
                  center,
                  radius: val,
                  sides: cmd.params.sides || 6,
                  rotation: 0,
                  inscribed: cmd.params.inscribed ?? true,
                },
              ],
            };
          })
        );
        get().log(`Creato poligono di ${cmd.params.sides || 6} lati (R=${val}).`, 'result');
        set({ command: null });
        return;
      }

      // 3D solid height input
      if ((cmd.name === 'BOX' || cmd.name === 'CYLINDER' || cmd.name === 'CONE' || cmd.name === 'PYRAMID') && cmd.points.length === 2) {
        const doc = s.getActiveDoc();
        if (!doc) return;
        const [p1, p2] = cmd.points;
        const solid: Solid3DEntity =
          cmd.name === 'BOX'
            ? {
                ...makeBaseEntityProps(doc),
                id: genId('solid3d'),
                type: 'solid3d',
                primitive: 'box',
                position: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: 0 },
                size: { x: Math.max(1, Math.abs(p2.x - p1.x)), y: Math.max(1, Math.abs(p2.y - p1.y)), z: Math.max(1, val) },
                rotation: { x: 0, y: 0, z: 0 },
              }
            : {
                ...makeBaseEntityProps(doc),
                id: genId('solid3d'),
                type: 'solid3d',
                primitive: cmd.name.toLowerCase() as Solid3DEntity['primitive'],
                position: { x: p1.x, y: p1.y, z: 0 },
                size: { x: Math.max(1, dist(p1, p2)), y: Math.max(1, dist(p1, p2)), z: Math.max(1, val) },
                rotation: { x: 0, y: 0, z: 0 },
              };
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, cmd.displayName);
            return { ...next, entities: [...next.entities, solid] };
          })
        );
        get().log(`Creato solido 3D ${cmd.displayName} (H=${val}).`, 'result');
        set({ command: null });
        if (!doc.camera.is3D) get().setPresetView('swIso');
        return;
      }

      if (cmd.name === 'SPHERE' && cmd.points.length === 1 && val > 0) {
        const doc = s.getActiveDoc();
        if (!doc) return;
        const p1 = cmd.points[0];
        const solid: Solid3DEntity = {
          ...makeBaseEntityProps(doc),
          id: genId('solid3d'),
          type: 'solid3d',
          primitive: 'sphere',
          position: { x: p1.x, y: p1.y, z: val },
          size: { x: val, y: val, z: val },
          rotation: { x: 0, y: 0, z: 0 },
        };
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Sfera 3D');
            return { ...next, entities: [...next.entities, solid] };
          })
        );
        get().log(`Creata Sfera 3D R=${val}.`, 'result');
        set({ command: null });
        if (!doc.camera.is3D) get().setPresetView('swIso');
        return;
      }

      // Direct distance entry along current cursor direction!
      if (lastPt) {
        const dir = normalize(sub(s.cursorWorld, lastPt));
        const nextPt = add(lastPt, scaleVec(dir, val));
        get().submitCanvasClick(nextPt, 0.001);
        return;
      }
    }

    if (parsed.kind === 'point') {
      get().log(`> ${trimmed} (${parsed.point.x.toFixed(2)}, ${parsed.point.y.toFixed(2)})`, 'prompt');
      get().submitCanvasClick(parsed.point, 0.001);
      return;
    }

    // Maybe user typed a new command while another was active
    const nextMeta = resolveCommand(trimmed);
    if (nextMeta) {
      get().startCommand(nextMeta.id);
      return;
    }

    get().log(`Input non riconosciuto: "${trimmed}"`, 'error');
  },

  // HANDLE INTERACTIVE CANVAS POINT CLICK FOR ACTIVE COMMAND
  submitCanvasClick: (pt, hitTol, shiftKey = false) => {
    const s = get();
    const doc = s.getActiveDoc();
    if (!doc) return;
    const cmd = s.command;

    // No active command -> selection
    if (!cmd) {
      const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol, doc.blocks);
      if (hit) {
        if (shiftKey) {
          get().setSelection([hit.id], 'remove');
        } else {
          // If entity belongs to a group, select whole group
          const groupIds = hit.groupId
            ? doc.entities.filter((e) => e.groupId === hit.groupId).map((e) => e.id)
            : [hit.id];
          get().setSelection(groupIds, 'add');
        }
      } else if (!shiftKey) {
        get().clearSelection();
      }
      return;
    }

    // Selection-picking stage of Modify commands
    if (cmd.params.pickingSelection) {
      const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol, doc.blocks);
      if (hit) {
        get().setSelection([hit.id], 'toggle');
        get().log(`Oggetti selezionati: ${get().getActiveDoc()?.selectedIds.length || 0} (Invio per confermare)`, 'info');
      }
      return;
    }

    const addEntity = (ent: CadEntity, label: string) => {
      set((st) =>
        updateActiveDoc(st, (d) => {
          const next = withUndoSnapshot(d, label);
          return { ...next, entities: [...next.entities, ent] };
        })
      );
    };

    const base = makeBaseEntityProps(doc);

    const resolveLineForCorner = (clickPt: Point2D): { docAfter: CadDocument; line: LineEntity } | null => {
      const currentDoc = get().getActiveDoc();
      if (!currentDoc) return null;
      const hit = hitTestEntities(clickPt, currentDoc.entities, currentDoc.layers, hitTol * 1.4, currentDoc.blocks);
      if (!hit || isEntityLocked(hit, currentDoc.layers)) return null;
      if (hit.type === 'line') return { docAfter: currentDoc, line: hit };
      if (hit.type === 'rectangle' || (hit.type === 'polyline' && (!hit.bulges || hit.bulges.every((b) => Math.abs(b) < 1e-6)))) {
        const exploded = (explodeEntity(hit, currentDoc.blocks) || []).filter((e): e is LineEntity => e.type === 'line');
        if (exploded.length === 0) return null;
        let best = exploded[0];
        let bestD = Infinity;
        for (const l of exploded) {
          const d = distPointToSegment(clickPt, l.start, l.end).distance;
          if (d < bestD) {
            bestD = d;
            best = l;
          }
        }
        set((st) =>
          updateActiveDoc(st, (d) => {
            const next = withUndoSnapshot(d, 'Esplodi per raccordo/cima');
            return { ...next, entities: [...next.entities.filter((e) => e.id !== hit.id), ...exploded] };
          })
        );
        const updatedDoc = get().getActiveDoc();
        return updatedDoc ? { docAfter: updatedDoc, line: best } : null;
      }
      return null;
    };

    switch (cmd.name) {
      case 'LINE': {
        if (cmd.points.length === 0) {
          set({
            command: {
              ...cmd,
              points: [pt],
              prompt: 'Specificare punto successivo o [Annulla]:',
              options: [{ label: 'Annulla', key: 'A', value: 'UNDO' }],
            },
          });
        } else {
          const prev = cmd.points[cmd.points.length - 1];
          addEntity({ ...base, id: genId('line'), type: 'line', start: prev, end: pt }, 'Linea');
          const newPts = [...cmd.points, pt];
          set({
            command: {
              ...cmd,
              points: newPts,
              prompt: newPts.length >= 3 ? 'Specificare punto successivo o [Chiudi/Annulla]:' : 'Specificare punto successivo o [Annulla]:',
              options:
                newPts.length >= 3
                  ? [
                      { label: 'Chiudi', key: 'C', value: 'CLOSE' },
                      { label: 'Annulla', key: 'A', value: 'UNDO' },
                    ]
                  : [{ label: 'Annulla', key: 'A', value: 'UNDO' }],
            },
          });
        }
        return;
      }

      case 'POLYLINE': {
        const prevBulges: number[] = Array.isArray(cmd.params.bulges) ? [...cmd.params.bulges] : [];
        const newBulges = cmd.points.length >= 1 ? [...prevBulges, cmd.params.arcMode ? 0.41421356 : 0] : prevBulges;
        const newPts = [...cmd.points, pt];
        const arcMode = Boolean(cmd.params.arcMode);
        set({
          command: {
            ...cmd,
            points: newPts,
            prompt:
              newPts.length >= 3
                ? `Specificare punto successivo o [${arcMode ? 'Linea' : 'Arco'}/Chiudi/Annulla] (Invio per terminare):`
                : `Specificare punto successivo o [${arcMode ? 'Linea' : 'Arco'}/Annulla]:`,
            options: [
              arcMode ? { label: 'Linea', key: 'L', value: 'LINE_MODE' } : { label: 'Arco', key: 'R', value: 'ARC_MODE' },
              ...(newPts.length >= 3 ? [{ label: 'Chiudi', key: 'C', value: 'CLOSE' }] : []),
              { label: 'Annulla', key: 'A', value: 'UNDO' },
            ],
            params: { ...cmd.params, bulges: newBulges },
          },
        });
        return;
      }

      case 'CIRCLE': {
        if (cmd.points.length === 0) {
          set({
            command: {
              ...cmd,
              points: [pt],
              prompt: 'Specificare raggio del cerchio o [Diametro]:',
              options: [{ label: 'Diametro', key: 'D', value: 'DIAMETER' }],
            },
          });
        } else {
          const r = cmd.params.useDiameter ? dist(cmd.points[0], pt) / 2 : dist(cmd.points[0], pt);
          if (r > 0.001) {
            addEntity({ ...base, id: genId('circle'), type: 'circle', center: cmd.points[0], radius: r }, 'Cerchio');
            get().log(`Cerchio creato (${cmd.params.useDiameter ? 'D=' + (r * 2).toFixed(s.settings.precision) : 'R=' + r.toFixed(s.settings.precision)}).`, 'result');
          }
          set({ command: null });
        }
        return;
      }

      case 'CIRCLE_2P': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo punto estremo del diametro:' } });
        } else {
          const c = mid(cmd.points[0], pt);
          const r = dist(cmd.points[0], pt) / 2;
          if (r > 0.001) addEntity({ ...base, id: genId('circle'), type: 'circle', center: c, radius: r }, 'Cerchio 2P');
          set({ command: null });
        }
        return;
      }

      case 'CIRCLE_3P': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo punto sul cerchio:' } });
        } else if (cmd.points.length === 1) {
          set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Specificare terzo punto sul cerchio:' } });
        } else {
          const res = circleFrom3Points(cmd.points[0], cmd.points[1], pt);
          if (res) {
            addEntity({ ...base, id: genId('circle'), type: 'circle', center: res.center, radius: res.radius }, 'Cerchio 3P');
          } else {
            get().log('I tre punti sono collineari: impossibile creare il cerchio.', 'error');
          }
          set({ command: null });
        }
        return;
      }

      case 'ARC': {
        if (cmd.params.arcMode === 'center') {
          if (cmd.points.length === 0) {
            set({ command: { ...cmd, points: [pt], prompt: 'Specificare punto iniziale dell\'arco:' } });
          } else if (cmd.points.length === 1) {
            set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Specificare punto finale dell\'arco (angolo):' } });
          } else {
            const center = cmd.points[0];
            const radius = Math.max(0.1, dist(center, cmd.points[1]));
            const startAngle = angleBetween(center, cmd.points[1]);
            const endAngle = angleBetween(center, pt);
            addEntity({ ...base, id: genId('arc'), type: 'arc', center, radius, startAngle, endAngle }, 'Arco');
            set({ command: null });
          }
        } else {
          if (cmd.points.length === 0) {
            set({ command: { ...cmd, points: [pt], options: undefined, prompt: 'Specificare secondo punto dell\'arco:' } });
          } else if (cmd.points.length === 1) {
            set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Specificare punto finale dell\'arco:' } });
          } else {
            const arc = arcFrom3Points(cmd.points[0], cmd.points[1], pt);
            if (arc) {
              addEntity({ ...base, id: genId('arc'), type: 'arc', ...arc }, 'Arco');
            } else {
              get().log('Punti collineari: impossibile creare l\'arco.', 'error');
            }
            set({ command: null });
          }
        }
        return;
      }

      case 'RECTANGLE': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo angolo opposto:' } });
        } else {
          addEntity({ ...base, id: genId('rectangle'), type: 'rectangle', p1: cmd.points[0], p2: pt }, 'Rettangolo');
          set({ command: null });
        }
        return;
      }

      case 'POLYGON': {
        if (cmd.points.length === 0) {
          set({
            command: {
              ...cmd,
              step: 2,
              points: [pt],
              prompt: 'Specificare raggio oppure [Inscritto/Circoscritto]:',
              options: [
                { label: 'Inscritto', key: 'I', value: 'I' },
                { label: 'Circoscritto', key: 'C', value: 'C' },
              ],
            },
          });
        } else {
          const r = dist(cmd.points[0], pt);
          const rot = angleBetween(cmd.points[0], pt);
          if (r > 0.001) {
            addEntity(
              {
                ...base,
                id: genId('polygon'),
                type: 'polygon',
                center: cmd.points[0],
                radius: r,
                sides: cmd.params.sides || 6,
                rotation: rot,
                inscribed: cmd.params.inscribed ?? true,
              },
              'Poligono'
            );
          }
          set({ command: null });
        }
        return;
      }

      case 'ELLIPSE': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare estremo del primo semiasse:' } });
        } else if (cmd.points.length === 1) {
          set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Specificare distanza dell\'altro semiasse:' } });
        } else {
          const c = cmd.points[0];
          const rx = Math.max(0.1, dist(c, cmd.points[1]));
          const ry = Math.max(0.1, dist(c, pt));
          const rot = angleBetween(c, cmd.points[1]);
          addEntity({ ...base, id: genId('ellipse'), type: 'ellipse', center: c, rx, ry, rotation: rot }, 'Ellisse');
          set({ command: null });
        }
        return;
      }

      case 'SPLINE': {
        set({
          command: {
            ...cmd,
            points: [...cmd.points, pt],
            prompt: 'Specificare punto successivo della spline (Invio o Tasto Destro per terminare):',
          },
        });
        return;
      }

      case 'XLINE': {
        if (cmd.params.fixedDir) {
          addEntity({ ...base, id: genId('xline'), type: 'xline', origin: pt, direction: cmd.params.fixedDir }, 'XLinea');
          return;
        }
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo punto di direzione:' } });
        } else {
          addEntity({ ...base, id: genId('xline'), type: 'xline', origin: cmd.points[0], direction: normalize(sub(pt, cmd.points[0])) }, 'XLinea');
          set({ command: null });
        }
        return;
      }

      case 'RAY': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare punto di direzione:' } });
        } else {
          addEntity({ ...base, id: genId('ray'), type: 'ray', origin: cmd.points[0], direction: normalize(sub(pt, cmd.points[0])) }, 'Raggio');
          set({ command: null });
        }
        return;
      }

      case 'POINT': {
        addEntity({ ...base, id: genId('point'), type: 'point', position: pt }, 'Punto');
        return;
      }

      case 'DONUT': {
        if (cmd.params.stage === 'center') {
          const innerD = cmd.params.innerD ?? 20;
          const outerD = cmd.params.outerD ?? 40;
          const rIn = innerD / 2;
          const rOut = Math.max(rIn + 0.5, outerD / 2);
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Anello');
              const baseProps = makeBaseEntityProps(d);
              const created: CadEntity[] = [
                { ...baseProps, id: genId('circle'), type: 'circle', center: pt, radius: rOut },
              ];
              if (rIn > 0.1) {
                created.push({ ...baseProps, id: genId('circle'), type: 'circle', center: pt, radius: rIn });
              } else {
                const boundary = Array.from({ length: 36 }, (_, i) => {
                  const a = (i / 36) * Math.PI * 2;
                  return { x: pt.x + rOut * Math.cos(a), y: pt.y + rOut * Math.sin(a) };
                });
                created.push({
                  ...baseProps,
                  id: genId('hatch'),
                  type: 'hatch',
                  boundary,
                  pattern: 'SOLID',
                  scale: 10,
                  angle: 0,
                  opacity: 0.85,
                });
              }
              return { ...next, entities: [...next.entities, ...created] };
            })
          );
          get().log(`Anello Øint=${innerD}, Øest=${outerD} posizionato.`, 'result');
        }
        return;
      }

      case 'DIVIDE': {
        if (cmd.params.stage === 'pick') {
          const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.4, doc.blocks);
          if (!hit) {
            get().log('Selezionare un oggetto da dividere.', 'info');
            return;
          }
          set({
            command: {
              ...cmd,
              prompt: 'Digitare numero di segmenti <4>:',
              params: { ...cmd.params, stage: 'count', targetId: hit.id },
            },
          });
        }
        return;
      }

      case 'MEASURE_SEG': {
        if (cmd.params.stage === 'pick') {
          const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.4, doc.blocks);
          if (!hit) {
            get().log('Selezionare un oggetto lungo il quale misurare i segmenti.', 'info');
            return;
          }
          set({
            command: {
              ...cmd,
              prompt: 'Specificare lunghezza del segmento <25>:',
              params: { ...cmd.params, stage: 'dist', targetId: hit.id },
            },
          });
        }
        return;
      }

      case 'REVCLOUD': {
        set({
          command: {
            ...cmd,
            points: [...cmd.points, pt],
            prompt: `Nuvola di revisione (${cmd.points.length + 1} punti) - Invio per chiudere:`,
          },
        });
        return;
      }

      case 'HATCH': {
        // Find smallest closed shape containing pt or hit directly
        const candidates: { boundary: Point2D[]; area: number }[] = [];
        for (const e of doc.entities) {
          if (!isEntityVisible(e, doc.layers)) continue;
          let poly: Point2D[] | null = null;
          if (e.type === 'rectangle') poly = getRectangleCorners(e);
          else if (e.type === 'polygon') poly = getPolygonVertices(e);
          else if (e.type === 'polyline' && e.closed && e.points.length >= 3) poly = samplePolyline(e, 16);
          else if (e.type === 'circle') {
            if (dist(pt, e.center) <= e.radius + hitTol) {
              poly = Array.from({ length: 48 }, (_, i) => {
                const a = (i / 48) * Math.PI * 2;
                return { x: e.center.x + e.radius * Math.cos(a), y: e.center.y + e.radius * Math.sin(a) };
              });
            }
          }
          if (poly && poly.length >= 3 && pointInPolygon(pt, poly)) {
            candidates.push({ boundary: poly, area: polygonArea(poly) });
          }
        }
        candidates.sort((a, b) => a.area - b.area);
        if (candidates.length > 0) {
          addEntity(
            {
              ...base,
              id: genId('hatch'),
              type: 'hatch',
              boundary: candidates[0].boundary,
              pattern: s.settings.hatchPattern,
              scale: s.settings.hatchScale,
              angle: s.settings.hatchAngle,
              opacity: 0.65,
            },
            'Tratteggio'
          );
          get().log(`Tratteggio ${s.settings.hatchPattern} applicato (Area: ${candidates[0].area.toFixed(1)}).`, 'result');
        } else {
          get().log('Nessun contorno chiuso trovato nel punto indicato. Clicca dentro un rettangolo, cerchio, poligono o polilinea chiusa.', 'error');
        }
        return;
      }

      case 'TEXT': {
        if (cmd.step === 0) {
          set({
            command: {
              ...cmd,
              step: 1,
              points: [pt],
              prompt: 'Digitare il testo nella riga di comando e premere Invio:',
            },
          });
        }
        return;
      }

      case 'MTEXT': {
        get().setModal('mtextEditor', {
          position: pt,
          initialText: '',
          height: s.settings.dimTextHeight * 1.4,
          isMText: true,
        });
        set({ command: null });
        return;
      }

      case 'TABLE': {
        get().setModal('tableEditor', { position: pt });
        set({ command: null });
        return;
      }

      case 'DIMLINEAR':
      case 'DIMALIGNED': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare origine della seconda linea di estensione:' } });
        } else if (cmd.points.length === 1) {
          set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Specificare posizione della linea di quota:' } });
        } else {
          addEntity(
            {
              ...base,
              id: genId('dim'),
              type: 'dimension',
              kind: cmd.name === 'DIMLINEAR' ? 'linear' : 'aligned',
              p1: cmd.points[0],
              p2: cmd.points[1],
              textPosition: pt,
              textHeight: s.settings.dimTextHeight,
              arrowSize: s.settings.dimArrowSize,
            },
            'Quota'
          );
          set({ command: null });
        }
        return;
      }

      case 'DIMRADIUS':
      case 'DIMDIAMETER': {
        const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.5, doc.blocks);
        if (hit && (hit.type === 'circle' || hit.type === 'arc')) {
          const ang = angleBetween(hit.center, pt);
          const edge = { x: hit.center.x + hit.radius * Math.cos(ang), y: hit.center.y + hit.radius * Math.sin(ang) };
          const opp = { x: hit.center.x - hit.radius * Math.cos(ang), y: hit.center.y - hit.radius * Math.sin(ang) };
          addEntity(
            {
              ...base,
              id: genId('dim'),
              type: 'dimension',
              kind: cmd.name === 'DIMRADIUS' ? 'radius' : 'diameter',
              p1: cmd.name === 'DIMRADIUS' ? hit.center : opp,
              p2: edge,
              textPosition: { x: hit.center.x + (hit.radius + 25) * Math.cos(ang), y: hit.center.y + (hit.radius + 25) * Math.sin(ang) },
              textHeight: s.settings.dimTextHeight,
              arrowSize: s.settings.dimArrowSize,
            },
            'Quota Radiale'
          );
          set({ command: null });
        } else {
          get().log('Selezionare un cerchio o un arco.', 'error');
        }
        return;
      }

      case 'DIMANGULAR': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare primo punto del primo lato:' } });
        } else if (cmd.points.length === 1) {
          set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Specificare secondo punto del secondo lato:' } });
        } else {
          const vertex = cmd.points[0];
          const p1 = cmd.points[1];
          const p2 = pt;
          const midPt = mid(p1, p2);
          addEntity(
            {
              ...base,
              id: genId('dim'),
              type: 'dimension',
              kind: 'angular',
              p1,
              p2,
              p3: vertex,
              textPosition: midPt,
              textHeight: s.settings.dimTextHeight,
              arrowSize: s.settings.dimArrowSize,
            },
            'Quota Angolare'
          );
          set({ command: null });
        }
        return;
      }

      case 'LEADER': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, step: 1, points: [pt], prompt: 'Specificare punto di appoggio della nota:' } });
        } else if (cmd.points.length === 1) {
          const elbow = { x: pt.x + (pt.x >= cmd.points[0].x ? 25 : -25), y: pt.y };
          set({
            command: {
              ...cmd,
              step: 2,
              points: [cmd.points[0], pt, elbow],
              prompt: 'Digitare il testo della direttrice e premere Invio:',
            },
          });
        }
        return;
      }

      case 'ERASE': {
        const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol, doc.blocks);
        if (hit && !isEntityLocked(hit, doc.layers)) {
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Cancella');
              return { ...next, entities: next.entities.filter((e) => e.id !== hit.id) };
            })
          );
        }
        return;
      }

      case 'MOVE': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo punto di spostamento:' } });
        } else {
          const dx = pt.x - cmd.points[0].x;
          const dy = pt.y - cmd.points[0].y;
          const ids = new Set(doc.selectedIds);
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Sposta');
              return {
                ...next,
                entities: next.entities.map((e) => (ids.has(e.id) && !isEntityLocked(e, d.layers) ? translateEntity(e, dx, dy) : e)),
              };
            })
          );
          set({ command: null });
          get().log(`Spostati ${ids.size} oggetti (dX=${dx.toFixed(2)}, dY=${dy.toFixed(2)}).`, 'result');
        }
        return;
      }

      case 'STRETCH': {
        const stage = cmd.params.stage || 'box1';
        if (stage === 'box1') {
          set({
            command: {
              ...cmd,
              points: [pt],
              prompt: 'Specificare secondo angolo della finestra di stiramento:',
              params: { ...cmd.params, stage: 'box2' },
            },
          });
        } else if (stage === 'box2') {
          const p0 = cmd.points[0];
          const box = {
            minX: Math.min(p0.x, pt.x),
            minY: Math.min(p0.y, pt.y),
            maxX: Math.max(p0.x, pt.x),
            maxY: Math.max(p0.y, pt.y),
          };
          const stretchIds = selectEntitiesInBox(p0, pt, true, doc.entities, doc.layers, doc.blocks);
          if (stretchIds.length === 0) {
            get().log('Nessun oggetto intercettato dalla finestra. Specificare nuovo primo angolo:', 'info');
            set({ command: { ...cmd, points: [], params: { ...cmd.params, stage: 'box1' } } });
            return;
          }
          get().setSelection(stretchIds, 'replace');
          set({
            command: {
              ...cmd,
              points: [p0, pt],
              prompt: `Intercettati ${stretchIds.length} oggetti. Specificare punto base di stiramento:`,
              params: { ...cmd.params, stage: 'base', box, stretchIds },
            },
          });
        } else if (stage === 'base') {
          set({
            command: {
              ...cmd,
              points: [...cmd.points, pt],
              prompt: 'Specificare secondo punto di spostamento:',
              params: { ...cmd.params, stage: 'target', basePt: pt },
            },
          });
        } else {
          const basePt: Point2D = cmd.params.basePt || cmd.points[cmd.points.length - 1];
          const dx = pt.x - basePt.x;
          const dy = pt.y - basePt.y;
          const box = cmd.params.box;
          const ids = new Set<string>(cmd.params.stretchIds || doc.selectedIds);
          if (box) {
            set((st) =>
              updateActiveDoc(st, (d) => {
                const next = withUndoSnapshot(d, 'Stira');
                return {
                  ...next,
                  entities: next.entities.map((e) => (ids.has(e.id) && !isEntityLocked(e, d.layers) ? stretchEntity(e, box, dx, dy) : e)),
                };
              })
            );
            get().log(`Stirati ${ids.size} oggetti (dX=${dx.toFixed(2)}, dY=${dy.toFixed(2)}).`, 'result');
          }
          set({ command: null });
        }
        return;
      }

      case 'BREAK': {
        if (cmd.params.stage === 'p1') {
          const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.4, doc.blocks);
          if (!hit || isEntityLocked(hit, doc.layers)) {
            get().log('Selezionare un oggetto sbloccato al primo punto di rottura.', 'info');
            return;
          }
          set({
            command: {
              ...cmd,
              points: [pt],
              prompt: 'Specificare secondo punto di rottura sull\'oggetto:',
              params: { ...cmd.params, stage: 'p2', targetId: hit.id },
            },
          });
        } else {
          const target = doc.entities.find((e) => e.id === cmd.params.targetId);
          const p1 = cmd.points[0];
          if (target && p1) {
            const broken = breakEntityBetweenPoints(target, p1, pt);
            if (broken) {
              set((st) =>
                updateActiveDoc(st, (d) => {
                  const next = withUndoSnapshot(d, 'Spezza');
                  return {
                    ...next,
                    entities: [...next.entities.filter((e) => e.id !== target.id), ...broken],
                  };
                })
              );
              get().log('Oggetto spezzato tra i due punti.', 'result');
            } else {
              get().log('Impossibile spezzare questo oggetto nei punti indicati.', 'error');
            }
          }
          set({ command: null });
        }
        return;
      }

      case 'ALIGN': {
        const pts = [...cmd.points, pt];
        if (pts.length === 1) {
          set({ command: { ...cmd, points: pts, prompt: 'Specificare primo punto di destinazione (Dst1):', params: { ...cmd.params, stage: 'dst1' } } });
        } else if (pts.length === 2) {
          set({ command: { ...cmd, points: pts, prompt: 'Specificare secondo punto di origine (Src2):', params: { ...cmd.params, stage: 'src2' } } });
        } else if (pts.length === 3) {
          set({ command: { ...cmd, points: pts, prompt: 'Specificare secondo punto di destinazione (Dst2):', params: { ...cmd.params, stage: 'dst2' } } });
        } else {
          set({
            command: {
              ...cmd,
              points: pts.slice(0, 4),
              prompt: 'Adattare la scala degli oggetti ai punti di allineamento? [Sì/No] <N>:',
              options: [
                { label: 'No (Mantieni scala)', key: 'N', value: 'SCALE_NO' },
                { label: 'Sì (Adatta scala)', key: 'S', value: 'SCALE_YES' },
              ],
              params: { ...cmd.params, stage: 'scaleOpt' },
            },
          });
        }
        return;
      }

      case 'COPY': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo punto (clicca più volte per copie multiple, ESC per uscire):' } });
        } else {
          const dx = pt.x - cmd.points[0].x;
          const dy = pt.y - cmd.points[0].y;
          const ids = new Set(doc.selectedIds);
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Copia');
              const copies = next.entities.filter((e) => ids.has(e.id)).map((e) => translateEntity(e, dx, dy, true));
              return { ...next, entities: [...next.entities, ...copies] };
            })
          );
          get().log(`Copiati ${ids.size} oggetti.`, 'result');
        }
        return;
      }

      case 'ROTATE': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare angolo di rotazione (clicca direzione o digita gradi):' } });
        } else {
          const origin = cmd.points[0];
          const rad = angleBetween(origin, pt);
          const ids = new Set(doc.selectedIds);
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Ruota');
              return {
                ...next,
                entities: next.entities.map((e) => (ids.has(e.id) && !isEntityLocked(e, d.layers) ? rotateEntity(e, origin, rad) : e)),
              };
            })
          );
          get().log(`Ruotati ${ids.size} oggetti di ${radToDeg(rad).toFixed(1)}°.`, 'result');
          set({ command: null });
        }
        return;
      }

      case 'MIRROR': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo punto della linea speculare:' } });
        } else if (cmd.points.length === 1) {
          set({
            command: {
              ...cmd,
              points: [...cmd.points, pt],
              prompt: 'Cancellare gli oggetti di origine? [Sì/No] <N>:',
              options: [
                { label: 'No (Mantieni)', key: 'N', value: 'NO' },
                { label: 'Sì (Cancella)', key: 'S', value: 'YES' },
              ],
            },
          });
        }
        return;
      }

      case 'SCALE': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare fattore di scala (digita numero o clicca distanza):' } });
        } else {
          const origin = cmd.points[0];
          const factor = Math.max(0.05, dist(origin, pt) / 100);
          const ids = new Set(doc.selectedIds);
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Scala');
              return {
                ...next,
                entities: next.entities.map((e) => (ids.has(e.id) && !isEntityLocked(e, d.layers) ? scaleEntity(e, origin, factor) : e)),
              };
            })
          );
          get().log(`Scalati ${ids.size} oggetti (fattore ${factor.toFixed(2)}).`, 'result');
          set({ command: null });
        }
        return;
      }

      case 'TRIM': {
        const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.4, doc.blocks);
        if (!hit || isEntityLocked(hit, doc.layers)) return;
        const vis = doc.entities.filter((e) => isEntityVisible(e, doc.layers));
        const res = trimEntityAtClick(hit, pt, vis, doc.blocks);
        if (res) {
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Taglia');
              return {
                ...next,
                entities: [...next.entities.filter((e) => e.id !== res.removeId), ...res.replacements],
              };
            })
          );
          get().log('Oggetto tagliato all\'intersezione.', 'result');
        } else {
          get().log('Nessuna intersezione trovata per tagliare questo oggetto.', 'info');
        }
        return;
      }

      case 'EXTEND': {
        const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.4, doc.blocks);
        if (!hit || (hit.type !== 'line' && hit.type !== 'polyline' && hit.type !== 'arc') || isEntityLocked(hit, doc.layers)) {
          get().log('Cliccare una linea, polilinea o arco da estendere verso un bordo.', 'info');
          return;
        }
        const vis = doc.entities.filter((e) => isEntityVisible(e, doc.layers));
        const extended = extendEntityAtClick(hit, pt, vis, doc.blocks);
        if (extended) {
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Estendi');
              return {
                ...next,
                entities: next.entities.map((e) => (e.id === hit.id ? extended : e)),
              };
            })
          );
          get().log('Oggetto esteso al bordo.', 'result');
        } else {
          get().log('Nessun bordo trovato lungo la direzione dell\'oggetto.', 'info');
        }
        return;
      }

      case 'OFFSET': {
        if (cmd.params.stage === 'distance' || cmd.params.stage === 'select') {
          const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.3, doc.blocks);
          if (hit) {
            set({
              command: {
                ...cmd,
                prompt: cmd.params.through
                  ? 'Specificare il punto attraverso cui far passare l\'offset:'
                  : 'Specificare un punto sul lato in cui eseguire l\'offset:',
                options: undefined,
                params: { ...cmd.params, stage: 'side', targetId: hit.id },
              },
            });
          }
        } else if (cmd.params.stage === 'side') {
          const target = doc.entities.find((e) => e.id === cmd.params.targetId);
          if (target) {
            const offDist = cmd.params.through
              ? Math.max(0.1, distToEntity(pt, target, doc.blocks).distance)
              : cmd.params.distance || s.settings.offsetDistance;
            const off = offsetEntity(target, offDist, pt);
            if (off) {
              addEntity(off, 'Offset');
              get().log(`Offset eseguito (dist = ${offDist.toFixed(s.settings.precision)}).`, 'result');
            }
          }
          set({
            command: {
              ...cmd,
              prompt: 'Selezionare oggetto successivo per offset (ESC per uscire):',
              params: { ...cmd.params, stage: 'select', targetId: undefined },
            },
          });
        }
        return;
      }

      case 'FILLET': {
        const resolved = resolveLineForCorner(pt);
        if (!resolved) {
          get().log('Selezionare una linea (o rettangolo/polilinea) sbloccata per il raccordo.', 'error');
          return;
        }
        const hitLine = resolved.line;
        const curDoc = resolved.docAfter;
        if (cmd.params.stage === 'first' || cmd.params.stage === 'setRadius') {
          set({
            command: {
              ...cmd,
              prompt: 'Selezionare seconda linea da raccordare:',
              params: { ...cmd.params, stage: 'second', firstLineId: hitLine.id, firstPick: pt },
            },
          });
        } else {
          const l1 = curDoc.entities.find((e) => e.id === cmd.params.firstLineId) as LineEntity | undefined;
          if (l1 && l1.id !== hitLine.id) {
            const res = filletTwoLines(
              l1,
              hitLine,
              cmd.params.radius ?? s.settings.filletRadius,
              cmd.params.firstPick,
              pt
            );
            if (res) {
              set((st) =>
                updateActiveDoc(st, (d) => {
                  const next = withUndoSnapshot(d, 'Raccordo');
                  const updated = next.entities.map((e) =>
                    e.id === l1.id ? res.line1 : e.id === hitLine.id ? res.line2 : e
                  );
                  if (res.arc) updated.push(res.arc);
                  return { ...next, entities: updated };
                })
              );
              get().log(`Raccordo completato (R=${cmd.params.radius ?? s.settings.filletRadius}).`, 'result');
            } else {
              get().log('Impossibile raccordare linee parallele o non valide.', 'error');
            }
          }
          set({ command: null });
        }
        return;
      }

      case 'CHAMFER': {
        const resolved = resolveLineForCorner(pt);
        if (!resolved) {
          get().log('Selezionare una linea (o rettangolo/polilinea) sbloccata per la cima.', 'error');
          return;
        }
        const hitLine = resolved.line;
        const curDoc = resolved.docAfter;
        if (cmd.params.stage === 'first' || cmd.params.stage === 'setDist') {
          set({
            command: {
              ...cmd,
              prompt: 'Selezionare seconda linea per la cima:',
              params: { ...cmd.params, stage: 'second', firstLineId: hitLine.id, firstPick: pt },
            },
          });
        } else {
          const l1 = curDoc.entities.find((e) => e.id === cmd.params.firstLineId) as LineEntity | undefined;
          if (l1 && l1.id !== hitLine.id) {
            const res = chamferTwoLines(
              l1,
              hitLine,
              cmd.params.d1 ?? s.settings.chamferDist1,
              cmd.params.d2 ?? s.settings.chamferDist2,
              cmd.params.firstPick,
              pt
            );
            if (res) {
              set((st) =>
                updateActiveDoc(st, (d) => {
                  const next = withUndoSnapshot(d, 'Cima');
                  const updated = next.entities.map((e) =>
                    e.id === l1.id ? res.line1 : e.id === hitLine.id ? res.line2 : e
                  );
                  if (res.bevel) updated.push(res.bevel);
                  return { ...next, entities: updated };
                })
              );
              get().log('Cima completata.', 'result');
            } else {
              get().log('Impossibile eseguire cima su linee parallele.', 'error');
            }
          }
          set({ command: null });
        }
        return;
      }

      case 'MATCHPROP': {
        const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.3, doc.blocks);
        if (!hit) return;
        if (cmd.params.stage === 'source') {
          set({
            command: {
              ...cmd,
              prompt: `Origine: Layer ${hit.layer}. Selezionare oggetti di destinazione:`,
              params: { stage: 'dest', source: { layer: hit.layer, color: hit.color, lineType: hit.lineType, lineWeight: hit.lineWeight } },
            },
          });
        } else {
          set((st) =>
            updateActiveDoc(st, (d) => {
              const next = withUndoSnapshot(d, 'Corrispondenza proprietà');
              return {
                ...next,
                entities: next.entities.map((e) => (e.id === hit.id ? { ...e, ...cmd.params.source } : e)),
              };
            })
          );
          get().log('Proprietà applicate all\'oggetto.', 'result');
        }
        return;
      }

      case 'DIST': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo punto:' } });
        } else {
          const p1 = cmd.points[0];
          const d = dist(p1, pt);
          const dx = pt.x - p1.x;
          const dy = pt.y - p1.y;
          const ang = radToDeg(angleBetween(p1, pt));
          const pr = s.settings.precision;
          get().log(
            `Distanza = ${d.toFixed(pr)} ${s.settings.units} | Angolo nel piano XY = ${ang.toFixed(1)}° | Delta X = ${dx.toFixed(pr)}, Delta Y = ${dy.toFixed(pr)}`,
            'result'
          );
          set({ command: null });
        }
        return;
      }

      case 'AREA': {
        if (cmd.params.mode === 'obj') {
          const hit = hitTestEntities(pt, doc.entities, doc.layers, hitTol * 1.4, doc.blocks);
          if (hit) {
            const a = getEntityArea(hit);
            const len = getEntityLength(hit);
            get().log(`Area = ${a.toFixed(s.settings.precision)} ${s.settings.units}² | Perimetro = ${len.toFixed(s.settings.precision)} ${s.settings.units}`, 'result');
            set({ command: null });
          }
          return;
        }
        set({
          command: {
            ...cmd,
            points: [...cmd.points, pt],
            prompt: `Specificare punto successivo dell'area (${cmd.points.length + 1} punti, Invio per calcolare):`,
          },
        });
        return;
      }

      case 'ID': {
        const pr = s.settings.precision;
        get().log(`X = ${pt.x.toFixed(pr)}   Y = ${pt.y.toFixed(pr)}   Z = 0.00`, 'result');
        set({ command: null });
        return;
      }

      case 'ZOOM_WINDOW': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare angolo opposto della finestra di zoom:' } });
        } else {
          const p1 = cmd.points[0];
          const minX = Math.min(p1.x, pt.x);
          const maxX = Math.max(p1.x, pt.x);
          const minY = Math.min(p1.y, pt.y);
          const maxY = Math.max(p1.y, pt.y);
          const bw = Math.max(1, maxX - minX);
          const bh = Math.max(1, maxY - minY);
          const vw = window.innerWidth - 320;
          const vh = window.innerHeight - 280;
          const zoom = Math.min(vw / bw, vh / bh) * 0.9;
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          get().updateCamera({ zoom, panX: vw / 2 - cx * zoom, panY: vh / 2 + cy * zoom });
          set({ command: null });
        }
        return;
      }

      // 3D Primitives interactive placement
      case 'BOX': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare secondo angolo della base:' } });
        } else if (cmd.points.length === 1) {
          set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Digitare altezza Z (o clicca per H=100):' } });
        } else {
          const [p1, p2] = cmd.points;
          const h = Math.max(10, dist(p2, pt));
          addEntity(
            {
              ...base,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: 'box',
              position: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: 0 },
              size: { x: Math.max(1, Math.abs(p2.x - p1.x)), y: Math.max(1, Math.abs(p2.y - p1.y)), z: h },
              rotation: { x: 0, y: 0, z: 0 },
            },
            'Parallelepipedo 3D'
          );
          set({ command: null });
          if (!doc.camera.is3D) get().setPresetView('swIso');
        }
        return;
      }

      case 'CYLINDER':
      case 'CONE':
      case 'PYRAMID': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare raggio della base:' } });
        } else if (cmd.points.length === 1) {
          set({ command: { ...cmd, points: [...cmd.points, pt], prompt: 'Digitare altezza Z (o clicca per confermare):' } });
        } else {
          const [c, rPt] = cmd.points;
          const r = Math.max(1, dist(c, rPt));
          const h = Math.max(10, dist(rPt, pt));
          addEntity(
            {
              ...base,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: cmd.name.toLowerCase() as Solid3DEntity['primitive'],
              position: { x: c.x, y: c.y, z: 0 },
              size: { x: r, y: r, z: h },
              rotation: { x: 0, y: 0, z: 0 },
            },
            `${cmd.displayName} 3D`
          );
          set({ command: null });
          if (!doc.camera.is3D) get().setPresetView('swIso');
        }
        return;
      }

      case 'SPHERE': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare raggio della sfera:' } });
        } else {
          const r = Math.max(1, dist(cmd.points[0], pt));
          addEntity(
            {
              ...base,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: 'sphere',
              position: { x: cmd.points[0].x, y: cmd.points[0].y, z: r },
              size: { x: r, y: r, z: r },
              rotation: { x: 0, y: 0, z: 0 },
            },
            'Sfera 3D'
          );
          set({ command: null });
          if (!doc.camera.is3D) get().setPresetView('swIso');
        }
        return;
      }

      case 'TORUS': {
        if (cmd.points.length === 0) {
          set({ command: { ...cmd, points: [pt], prompt: 'Specificare raggio principale del toro:' } });
        } else {
          const r = Math.max(5, dist(cmd.points[0], pt));
          addEntity(
            {
              ...base,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: 'torus',
              position: { x: cmd.points[0].x, y: cmd.points[0].y, z: r * 0.25 },
              size: { x: r, y: r * 0.25, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
            },
            'Toro 3D'
          );
          set({ command: null });
          if (!doc.camera.is3D) get().setPresetView('swIso');
        }
        return;
      }

      case 'INSERT_BLOCK': {
        const bName = cmd.params.blockName || 'PORTA_80';
        const scale = cmd.params.scale ?? 1;
        const rot = degToRad(cmd.params.rotationDeg ?? 0);
        addEntity(
          {
            ...base,
            id: genId('block_ref'),
            type: 'block_ref',
            blockName: bName,
            position: pt,
            scaleX: scale,
            scaleY: scale,
            rotation: rot,
          },
          `Inserisci blocco ${bName}`
        );
        get().log(`Blocco "${bName}" inserito in (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}).`, 'result');
        set({ command: null, activeBlockToInsert: null });
        return;
      }
    }
  },

  runScript: (scriptText) => {
    const lines = scriptText.split(/\r?\n/);
    get().log(`Esecuzione script (${lines.length} righe)...`, 'info');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith(';')) continue;
      if (line === '.') {
        get().finishMultiStepCommand();
      } else {
        get().submitCommandInput(line);
      }
    }
    get().log('Script completato.', 'result');
  },

  pushUndo: (description) => set((s) => updateActiveDoc(s, (d) => withUndoSnapshot(d, description))),

  undo: () => {
    const doc = get().getActiveDoc();
    if (!doc || doc.undoStack.length === 0) {
      get().log('Nulla da annullare.', 'info');
      return;
    }
    const last = doc.undoStack[doc.undoStack.length - 1];
    set((s) =>
      updateActiveDoc(s, (d) => ({
        ...d,
        entities: last.entities,
        layers: last.layers,
        blocks: last.blocks,
        activeLayer: last.activeLayer,
        selectedIds: [],
        undoStack: d.undoStack.slice(0, -1),
        redoStack: [
          ...d.redoStack,
          {
            entities: structuredClone(d.entities),
            layers: structuredClone(d.layers),
            blocks: structuredClone(d.blocks),
            activeLayer: d.activeLayer,
            description: last.description,
          },
        ],
      }))
    );
    get().log(`Annullato: ${last.description}`, 'info');
  },

  redo: () => {
    const doc = get().getActiveDoc();
    if (!doc || doc.redoStack.length === 0) {
      get().log('Nulla da ripetere.', 'info');
      return;
    }
    const nextSnap = doc.redoStack[doc.redoStack.length - 1];
    set((s) =>
      updateActiveDoc(s, (d) => ({
        ...d,
        entities: nextSnap.entities,
        layers: nextSnap.layers,
        blocks: nextSnap.blocks,
        activeLayer: nextSnap.activeLayer,
        selectedIds: [],
        redoStack: d.redoStack.slice(0, -1),
        undoStack: [
          ...d.undoStack,
          {
            entities: structuredClone(d.entities),
            layers: structuredClone(d.layers),
            blocks: structuredClone(d.blocks),
            activeLayer: d.activeLayer,
            description: nextSnap.description,
          },
        ],
      }))
    );
    get().log(`Ripetuto: ${nextSnap.description}`, 'info');
  },

  setSelection: (ids, mode = 'replace') =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const curr = new Set(d.selectedIds);
        if (mode === 'replace') return { ...d, selectedIds: [...new Set(ids)] };
        if (mode === 'add') {
          ids.forEach((i) => curr.add(i));
          return { ...d, selectedIds: [...curr] };
        }
        if (mode === 'remove') {
          ids.forEach((i) => curr.delete(i));
          return { ...d, selectedIds: [...curr] };
        }
        ids.forEach((i) => (curr.has(i) ? curr.delete(i) : curr.add(i)));
        return { ...d, selectedIds: [...curr] };
      })
    ),

  clearSelection: () => set((s) => updateActiveDoc(s, (d) => ({ ...d, selectedIds: [] }))),

  deleteSelected: () => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) return;
    const ids = new Set(doc.selectedIds);
    let removed = 0;
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, 'Cancella');
        const kept = next.entities.filter((e) => {
          if (ids.has(e.id) && !isEntityLocked(e, d.layers)) {
            removed++;
            return false;
          }
          return true;
        });
        return { ...next, entities: kept, selectedIds: [] };
      })
    );
    get().log(`Cancellati ${removed} oggetti.`, 'result');
  },

  addEntity: (entity, undoDescription = 'Aggiungi oggetto') =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, undoDescription);
        return { ...next, entities: [...next.entities, entity] };
      })
    ),

  updateEntity: (id, patch, recordUndo = true) =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const baseDoc = recordUndo ? withUndoSnapshot(d, 'Modifica proprietà') : d;
        return {
          ...baseDoc,
          entities: baseDoc.entities.map((e) => (e.id === id ? ({ ...e, ...patch } as CadEntity) : e)),
        };
      })
    ),

  updateSelectedEntities: (patch) =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        if (d.selectedIds.length === 0) return d;
        const ids = new Set(d.selectedIds);
        const next = withUndoSnapshot(d, 'Modifica proprietà');
        return {
          ...next,
          entities: next.entities.map((e) => (ids.has(e.id) ? ({ ...e, ...patch } as CadEntity) : e)),
        };
      })
    ),

  moveGrip: (entityId, gripIndex, newPt, recordUndo = false) =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const target = d.entities.find((e) => e.id === entityId);
        if (!target || isEntityLocked(target, d.layers)) return d;
        const baseDoc = recordUndo ? withUndoSnapshot(d, 'Modifica grip') : d;
        return {
          ...baseDoc,
          entities: baseDoc.entities.map((e) => (e.id === entityId ? applyGripMove(e, gripIndex, newPt) : e)),
        };
      })
    ),

  copyToClipboard: () => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) return;
    const picked = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
    set({ clipboard: structuredClone(picked) });
    get().log(`Copiati ${picked.length} oggetti negli Appunti.`, 'info');
  },

  cutToClipboard: () => {
    get().copyToClipboard();
    get().deleteSelected();
  },

  pasteFromClipboard: () => {
    const s = get();
    const doc = s.getActiveDoc();
    if (!doc || s.clipboard.length === 0) return;
    const pasted = s.clipboard.map((e) => translateEntity(e, 30, -30, true));
    set((st) =>
      updateActiveDoc(st, (d) => {
        const next = withUndoSnapshot(d, 'Incolla');
        return { ...next, entities: [...next.entities, ...pasted], selectedIds: pasted.map((p) => p.id) };
      })
    );
    get().log(`Incollati ${pasted.length} oggetti.`, 'result');
  },

  setActiveLayer: (layerName) =>
    set((s) => updateActiveDoc(s, (d) => ({ ...d, activeLayer: layerName }))),

  setActiveColor: (color) => {
    const doc = get().getActiveDoc();
    if (doc && doc.selectedIds.length > 0) {
      get().updateSelectedEntities({ color });
    }
    set((s) => updateActiveDoc(s, (d) => ({ ...d, activeColor: color })));
  },

  setActiveLineType: (lineType) => {
    const doc = get().getActiveDoc();
    if (doc && doc.selectedIds.length > 0) {
      get().updateSelectedEntities({ lineType });
    }
    set((s) => updateActiveDoc(s, (d) => ({ ...d, activeLineType: lineType })));
  },

  setActiveLineWeight: (lineWeight) => {
    const doc = get().getActiveDoc();
    if (doc && doc.selectedIds.length > 0) {
      get().updateSelectedEntities({ lineWeight });
    }
    set((s) => updateActiveDoc(s, (d) => ({ ...d, activeLineWeight: lineWeight })));
  },

  addLayer: (name) =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, 'Nuovo Layer');
        let idx = next.layers.length;
        let finalName = name || `Layer${idx}`;
        while (next.layers.some((l) => l.name === finalName)) {
          idx++;
          finalName = `Layer${idx}`;
        }
        const newL: Layer = {
          id: genId('layer'),
          name: finalName,
          color: '#38ABDF',
          on: true,
          frozen: false,
          locked: false,
          lineType: 'CONTINUOUS',
          lineWeight: 0.25,
          transparency: 0,
          plot: true,
        };
        return { ...next, layers: [...next.layers, newL] };
      })
    ),

  updateLayer: (id, patch) =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const oldLayer = d.layers.find((l) => l.id === id);
        if (!oldLayer) return d;
        let nextPatch = { ...patch };
        let renameFrom: string | null = null;
        let renameTo: string | null = null;
        if (typeof patch.name === 'string') {
          const clean = patch.name.trim();
          if (oldLayer.name === '0' || !clean || (clean !== oldLayer.name && d.layers.some((l) => l.name === clean))) {
            delete nextPatch.name;
          } else if (clean !== oldLayer.name) {
            nextPatch.name = clean;
            renameFrom = oldLayer.name;
            renameTo = clean;
          }
        }
        const updatedLayers = d.layers.map((l) => (l.id === id ? { ...l, ...nextPatch } : l));
        if (!renameFrom || !renameTo) {
          return { ...d, modified: true, layers: updatedLayers };
        }
        const newBlocks: Record<string, BlockDefinition> = {};
        for (const [bName, bDef] of Object.entries(d.blocks)) {
          newBlocks[bName] = {
            ...bDef,
            entities: bDef.entities.map((e) => (e.layer === renameFrom ? { ...e, layer: renameTo! } : e)),
          };
        }
        return {
          ...d,
          modified: true,
          activeLayer: d.activeLayer === renameFrom ? renameTo : d.activeLayer,
          layers: updatedLayers,
          entities: d.entities.map((e) => (e.layer === renameFrom ? { ...e, layer: renameTo! } : e)),
          blocks: newBlocks,
        };
      })
    ),

  deleteLayer: (id) =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const target = d.layers.find((l) => l.id === id);
        if (!target || target.name === '0' || target.name === d.activeLayer) return d;
        const next = withUndoSnapshot(d, 'Elimina Layer');
        return {
          ...next,
          layers: next.layers.filter((l) => l.id !== id),
          entities: next.entities.map((e) => (e.layer === target.name ? { ...e, layer: '0' } : e)),
        };
      })
    ),

  isolateLayer: (layerName) =>
    set((s) =>
      updateActiveDoc(s, (d) => ({
        ...d,
        layers: d.layers.map((l) => ({ ...l, on: l.name === layerName })),
      }))
    ),

  unisolateLayers: () =>
    set((s) =>
      updateActiveDoc(s, (d) => ({
        ...d,
        layers: d.layers.map((l) => ({ ...l, on: true, frozen: false })),
      }))
    ),

  createBlockFromSelection: (name, description, basePoint) => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) return;
    const picked = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_') || `BLOCCO_${Object.keys(doc.blocks).length + 1}`;
    const def: BlockDefinition = {
      name: cleanName,
      description: description || 'Blocco creato dall\'utente',
      category: 'Utente',
      basePoint,
      entities: structuredClone(picked),
    };
    const ids = new Set(doc.selectedIds);
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, `Crea blocco ${cleanName}`);
        return {
          ...next,
          blocks: { ...next.blocks, [cleanName]: def },
          entities: [
            ...next.entities.filter((e) => !ids.has(e.id)),
            {
              ...makeBaseEntityProps(d),
              id: genId('block_ref'),
              type: 'block_ref',
              blockName: cleanName,
              position: basePoint,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
            },
          ],
          selectedIds: [],
        };
      })
    );
    get().log(`Blocco "${cleanName}" creato (${picked.length} oggetti).`, 'result');
  },

  startInsertBlock: (name, scale = 1, rotationDeg = 0) => {
    set({ activeBlockToInsert: { name, scale, rotationDeg } });
    get().startCommand('INSERT_BLOCK', { blockName: name, scale, rotationDeg });
  },

  createRectangularArray: (rows, cols, dx, dy) => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) return;
    const src = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
    const added: CadEntity[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;
        for (const e of src) {
          added.push(translateEntity(e, c * dx, r * dy, true));
        }
      }
    }
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, 'Serie rettangolare');
        return { ...next, entities: [...next.entities, ...added] };
      })
    );
    get().log(`Serie rettangolare ${rows}x${cols} creata (+${added.length} oggetti).`, 'result');
  },

  createPolarArray: (center, count, totalAngleDeg, rotateItems) => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0 || count < 2) return;
    const src = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
    const stepRad = degToRad(totalAngleDeg) / count;
    const added: CadEntity[] = [];
    for (let i = 1; i < count; i++) {
      const a = i * stepRad;
      for (const e of src) {
        if (rotateItems) {
          added.push(rotateEntity(e, center, a, true));
        } else {
          const c = getEntityCentroid(e, doc.blocks);
          const newC = rotatePoint(c, center, a);
          added.push(translateEntity(e, newC.x - c.x, newC.y - c.y, true));
        }
      }
    }
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, 'Serie polare');
        return { ...next, entities: [...next.entities, ...added] };
      })
    );
    get().log(`Serie polare (${count} elementi su ${totalAngleDeg}°) creata.`, 'result');
  },

  groupSelected: () => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length < 2) {
      get().log('Selezionare almeno 2 oggetti da raggruppare.', 'info');
      return;
    }
    const gid = genId('grp');
    const ids = new Set(doc.selectedIds);
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, 'Raggruppa');
        return { ...next, entities: next.entities.map((e) => (ids.has(e.id) ? { ...e, groupId: gid } : e)) };
      })
    );
    get().log(`Gruppo creato con ${ids.size} oggetti.`, 'result');
  },

  ungroupSelected: () => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) return;
    const ids = new Set(doc.selectedIds);
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, 'Separa gruppo');
        return { ...next, entities: next.entities.map((e) => (ids.has(e.id) ? { ...e, groupId: undefined } : e)) };
      })
    );
    get().log('Gruppo separato.', 'result');
  },

  applyGeometricConstraint: (kind) => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) {
      get().log('Selezionare prima gli oggetti a cui applicare il vincolo geometrico.', 'error');
      return;
    }
    const selected = doc.entities.filter((e) => doc.selectedIds.includes(e.id));
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, `Vincolo ${kind}`);
        let ents = [...next.entities];
        if (kind === 'horizontal') {
          ents = ents.map((e) =>
            d.selectedIds.includes(e.id) && e.type === 'line' ? { ...e, end: { x: e.end.x, y: e.start.y } } : e
          );
        } else if (kind === 'vertical') {
          ents = ents.map((e) =>
            d.selectedIds.includes(e.id) && e.type === 'line' ? { ...e, end: { x: e.start.x, y: e.end.y } } : e
          );
        } else if (kind === 'parallel' && selected.length >= 2) {
          const lines = selected.filter((e): e is LineEntity => e.type === 'line');
          if (lines.length >= 2) {
            const refDir = normalize(sub(lines[0].end, lines[0].start));
            const lineIds = new Set(lines.slice(1).map((l) => l.id));
            ents = ents.map((e) => {
              if (e.type === 'line' && lineIds.has(e.id)) {
                const len = dist(e.start, e.end);
                const curDir = normalize(sub(e.end, e.start));
                const sign = curDir.x * refDir.x + curDir.y * refDir.y < 0 ? -1 : 1;
                return { ...e, end: add(e.start, scaleVec(refDir, len * sign)) };
              }
              return e;
            });
          }
        } else if (kind === 'perpendicular' && selected.length >= 2) {
          const lines = selected.filter((e): e is LineEntity => e.type === 'line');
          if (lines.length >= 2) {
            const d1 = normalize(sub(lines[0].end, lines[0].start));
            const perpDir = { x: -d1.y, y: d1.x };
            const targetIds = new Set(lines.slice(1).map((l) => l.id));
            ents = ents.map((e) => {
              if (e.type === 'line' && targetIds.has(e.id)) {
                const len = dist(e.start, e.end);
                const curDir = normalize(sub(e.end, e.start));
                const sign = curDir.x * perpDir.x + curDir.y * perpDir.y < 0 ? -1 : 1;
                return { ...e, end: add(e.start, scaleVec(perpDir, len * sign)) };
              }
              return e;
            });
          }
        } else if (kind === 'concentric' && selected.length >= 2) {
          const first = selected.find((e) => e.type === 'circle' || e.type === 'arc');
          if (first && (first.type === 'circle' || first.type === 'arc')) {
            ents = ents.map((e) =>
              d.selectedIds.includes(e.id) && (e.type === 'circle' || e.type === 'arc') ? { ...e, center: { ...first.center } } : e
            );
          }
        } else if (kind === 'equal' && selected.length >= 2) {
          const first = selected[0];
          if (first.type === 'circle') {
            ents = ents.map((e) =>
              d.selectedIds.includes(e.id) && e.type === 'circle' ? { ...e, radius: first.radius } : e
            );
          } else if (first.type === 'line') {
            const targetLen = dist(first.start, first.end);
            ents = ents.map((e) => {
              if (d.selectedIds.includes(e.id) && e.type === 'line' && e.id !== first.id) {
                const dir = normalize(sub(e.end, e.start));
                return { ...e, end: add(e.start, scaleVec(dir, targetLen)) };
              }
              return e;
            });
          }
        } else if (kind === 'fix') {
          ents = ents.map((e) => (d.selectedIds.includes(e.id) ? { ...e, fixed: !e.fixed } : e));
        }
        return {
          ...next,
          entities: ents,
          constraints: [...next.constraints, { id: genId('cns'), kind, entityIds: [...d.selectedIds] }],
        };
      })
    );
    get().log(`Vincolo parametrico "${kind.toUpperCase()}" applicato.`, 'result');
  },

  updateCamera: (patch) =>
    set((s) => updateActiveDoc(s, (d) => ({ ...d, camera: { ...d.camera, ...patch } }))),

  zoomExtents: (canvasWidth, canvasHeight) => {
    const doc = get().getActiveDoc();
    if (!doc) return;
    const vw = canvasWidth || Math.max(400, window.innerWidth - 320);
    const vh = canvasHeight || Math.max(300, window.innerHeight - 280);
    const bb = getDocumentBBox(doc.entities, doc.blocks);
    if (!bb) {
      get().updateCamera({ panX: vw / 2, panY: vh / 2, zoom: 1 });
      return;
    }
    const w = Math.max(10, bb.maxX - bb.minX);
    const h = Math.max(10, bb.maxY - bb.minY);
    const zoom = Math.min(vw / w, vh / h) * 0.82;
    const cx = (bb.minX + bb.maxX) / 2;
    const cy = (bb.minY + bb.maxY) / 2;
    get().updateCamera({
      zoom,
      panX: vw / 2 - cx * zoom,
      panY: vh / 2 + cy * zoom,
      orbitTarget: { x: cx, y: cy, z: 30 },
      orbitDistance: Math.max(w, h) * 1.35,
    });
  },

  setPresetView: (view) => {
    const doc = get().getActiveDoc();
    if (!doc) return;
    if (view === 'top') {
      get().updateCamera({
        presetView: 'top',
        is3D: false,
        visualStyle: '2dwireframe',
      });
      return;
    }
    const presets: Record<Exclude<PresetView, 'top'>, { az: number; pol: number }> = {
      bottom: { az: 0, pol: Math.PI - 0.05 },
      front: { az: 0, pol: Math.PI / 2 },
      back: { az: Math.PI, pol: Math.PI / 2 },
      left: { az: -Math.PI / 2, pol: Math.PI / 2 },
      right: { az: Math.PI / 2, pol: Math.PI / 2 },
      swIso: { az: Math.PI * 0.25, pol: Math.PI * 0.34 },
      seIso: { az: -Math.PI * 0.25, pol: Math.PI * 0.34 },
      neIso: { az: -Math.PI * 0.75, pol: Math.PI * 0.34 },
      nwIso: { az: Math.PI * 0.75, pol: Math.PI * 0.34 },
    };
    const p = presets[view];
    const nextStyle: VisualStyle = doc.camera.visualStyle === '2dwireframe' ? 'shadedEdges' : doc.camera.visualStyle;
    get().updateCamera({
      presetView: view,
      is3D: true,
      visualStyle: nextStyle,
      orbitAzimuth: p.az,
      orbitPolar: p.pol,
    });
  },

  setVisualStyle: (style) => {
    const is3D = style !== '2dwireframe';
    get().updateCamera({
      visualStyle: style,
      is3D,
      presetView: is3D && get().getActiveDoc()?.camera.presetView === 'top' ? 'swIso' : get().getActiveDoc()?.camera.presetView || 'top',
    });
  },

  setActiveSpace: (space) =>
    set((s) => updateActiveDoc(s, (d) => ({ ...d, activeSpace: space }))),

  addLayout: () =>
    set((s) =>
      updateActiveDoc(s, (d) => {
        const num = d.layouts.length + 1;
        const newL: LayoutSheet = {
          id: genId('layout'),
          name: `Layout${num}`,
          paperWidth: 420,
          paperHeight: 297,
          margin: 12,
          viewportCenter: { x: 200, y: 150 },
          viewportScale: 0.4,
          autoFit: true,
          titleBlockTitle: `TAVOLA 0${num}`,
          titleBlockAuthor: 'Studio Tecnico CAD',
          titleBlockScaleText: 'SCALA 1:50',
        };
        return { ...d, layouts: [...d.layouts, newL], activeSpace: newL.id };
      })
    ),

  updateLayout: (layoutId, patch) =>
    set((s) =>
      updateActiveDoc(s, (d) => ({
        ...d,
        modified: true,
        layouts: d.layouts.map((l) => (l.id === layoutId ? { ...l, ...patch } : l)),
      }))
    ),

  extrudeSelected2D: (height) => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) return;
    let count = 0;
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, 'Estrudi 3D');
        const created: Solid3DEntity[] = [];
        for (const e of next.entities) {
          if (!d.selectedIds.includes(e.id)) continue;
          const common = {
            layer: e.layer,
            color: e.color === 'ByLayer' ? '#38ABDF' : e.color,
            lineType: 'CONTINUOUS' as const,
            lineTypeScale: 1,
            lineWeight: -1,
          };
          if (e.type === 'rectangle') {
            created.push({
              ...common,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: 'box',
              position: { x: (e.p1.x + e.p2.x) / 2, y: (e.p1.y + e.p2.y) / 2, z: e.elevation || 0 },
              size: { x: Math.abs(e.p2.x - e.p1.x), y: Math.abs(e.p2.y - e.p1.y), z: height },
              rotation: { x: 0, y: 0, z: e.rotation || 0 },
            });
            count++;
          } else if (e.type === 'circle') {
            created.push({
              ...common,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: 'cylinder',
              position: { x: e.center.x, y: e.center.y, z: e.elevation || 0 },
              size: { x: e.radius, y: e.radius, z: height },
              rotation: { x: 0, y: 0, z: 0 },
            });
            count++;
          } else if (e.type === 'polygon') {
            created.push({
              ...common,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: 'extrude',
              position: { x: 0, y: 0, z: e.elevation || 0 },
              size: { x: e.radius * 2, y: e.radius * 2, z: height },
              rotation: { x: 0, y: 0, z: 0 },
              profile: getPolygonVertices(e),
              extrudeHeight: height,
            });
            count++;
          } else if (e.type === 'polyline' && e.points.length >= 3) {
            created.push({
              ...common,
              id: genId('solid3d'),
              type: 'solid3d',
              primitive: 'extrude',
              position: { x: 0, y: 0, z: e.elevation || 0 },
              size: { x: 100, y: 100, z: height },
              rotation: { x: 0, y: 0, z: 0 },
              profile: samplePolyline(e, 12),
              extrudeHeight: height,
            });
            count++;
          }
        }
        return { ...next, entities: [...next.entities, ...created], selectedIds: created.map((c) => c.id) };
      })
    );
    if (count > 0) {
      get().log(`Estrusi ${count} profili 2D in solidi 3D (altezza = ${height}).`, 'result');
      get().setPresetView('swIso');
    } else {
      get().log('Nessun profilo 2D estrudibile selezionato (usa Rettangolo, Cerchio, Poligono o Polilinea).', 'error');
    }
  },

  drawOrderSelected: (mode) => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) {
      get().log('Selezionare almeno un oggetto per modificarne l\'ordine di visualizzazione.', 'info');
      return;
    }
    const ids = new Set(doc.selectedIds);
    set((s) =>
      updateActiveDoc(s, (d) => {
        const next = withUndoSnapshot(d, mode === 'front' ? 'Porta in primo piano' : 'Porta sullo sfondo');
        const picked = next.entities.filter((e) => ids.has(e.id));
        const others = next.entities.filter((e) => !ids.has(e.id));
        return {
          ...next,
          entities: mode === 'front' ? [...others, ...picked] : [...picked, ...others],
        };
      })
    );
    get().log(mode === 'front' ? 'Oggetti portati davanti.' : 'Oggetti portati dietro.', 'result');
  },

  performBooleanSelected: (op) => {
    const doc = get().getActiveDoc();
    if (!doc) return;
    const solids = doc.entities.filter(
      (e): e is Solid3DEntity => doc.selectedIds.includes(e.id) && e.type === 'solid3d'
    );
    if (solids.length < 2) {
      get().log('Selezionare almeno 2 solidi 3D per eseguire l\'operazione booleana.', 'error');
      return;
    }
    let acc: Solid3DEntity | null = solids[0];
    for (let i = 1; i < solids.length && acc; i++) {
      acc = performBoolean3D(acc, solids[i], op);
    }
    if (!acc) {
      get().log(`Operazione booleana 3D (${op.toUpperCase()}) non riuscita: geometria risultante vuota.`, 'error');
      return;
    }
    const resultSolid: Solid3DEntity = {
      ...acc,
      id: genId('solid3d'),
    };
    const removeIds = new Set(solids.map((s) => s.id));
    set((st) =>
      updateActiveDoc(st, (d) => {
        const next = withUndoSnapshot(d, `Booleana 3D: ${op}`);
        return {
          ...next,
          entities: [...next.entities.filter((e) => !removeIds.has(e.id)), resultSolid],
          selectedIds: [resultSolid.id],
        };
      })
    );
    const labelMap = { union: 'UNIONE', subtract: 'SOTTRAI', intersect: 'INTERSECA' };
    get().log(`Operazione ${labelMap[op]} 3D completata su ${solids.length} solidi.`, 'result');
  },

  revolveSelected2D: () => {
    const doc = get().getActiveDoc();
    if (!doc || doc.selectedIds.length === 0) {
      get().log('Selezionare prima un profilo 2D (polilinea, rettangolo, poligono, cerchio o linea).', 'error');
      return;
    }
    const target = doc.entities.find(
      (e) =>
        doc.selectedIds.includes(e.id) &&
        (e.type === 'polyline' || e.type === 'rectangle' || e.type === 'polygon' || e.type === 'circle' || e.type === 'line')
    );
    if (!target) {
      get().log('Nessun profilo 2D valido trovato nella selezione.', 'error');
      return;
    }
    let profile: Point2D[] = [];
    if (target.type === 'polyline') {
      profile = samplePolyline(target, 12);
      if (target.closed && profile.length >= 2) profile = [...profile, profile[0]];
    } else if (target.type === 'rectangle') {
      const c = getRectangleCorners(target);
      profile = [...c, c[0]];
    } else if (target.type === 'polygon') {
      const c = getPolygonVertices(target);
      profile = [...c, c[0]];
    } else if (target.type === 'circle') {
      profile = Array.from({ length: 25 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return { x: target.center.x + target.radius * Math.cos(a), y: target.center.y + target.radius * Math.sin(a) };
      });
    } else if (target.type === 'line') {
      profile = [target.start, target.end];
    }
    if (profile.length < 2) return;
    const minX = Math.min(...profile.map((p) => p.x));
    const maxX = Math.max(...profile.map((p) => p.x));
    const axisX = minX >= 2 || maxX <= -2 ? 0 : minX - 10;
    const solid = revolve2DToSolid3D(profile, axisX, 28, {
      layer: target.layer,
      color: target.color === 'ByLayer' ? '#38ABDF' : target.color,
      lineType: 'CONTINUOUS',
      lineTypeScale: 1,
      lineWeight: -1,
    });
    if (!solid) {
      get().log('Impossibile generare il solido di rivoluzione dal profilo selezionato.', 'error');
      return;
    }
    const withId: Solid3DEntity = { ...solid, id: genId('solid3d') };
    set((st) =>
      updateActiveDoc(st, (d) => {
        const next = withUndoSnapshot(d, 'Rivoluzione 3D');
        return { ...next, entities: [...next.entities, withId], selectedIds: [withId.id] };
      })
    );
    get().log(`Solido di rivoluzione 3D creato attorno all'asse X=${axisX.toFixed(1)}.`, 'result');
    get().setPresetView('swIso');
  },

  setParametricVar: (name, value) => {
    const clean = name.trim();
    if (!clean || !Number.isFinite(value)) return;
    set((s) =>
      updateActiveDoc(s, (d) => ({
        ...d,
        modified: true,
        parametricVars: { ...d.parametricVars, [clean]: value },
      }))
    );
    get().log(`Parametro "${clean}" = ${value} salvato.`, 'result');
  },

  deleteParametricVar: (name) => {
    set((s) =>
      updateActiveDoc(s, (d) => {
        const nextVars = { ...d.parametricVars };
        delete nextVars[name];
        return { ...d, modified: true, parametricVars: nextVars };
      })
    );
    get().log(`Parametro "${name}" eliminato.`, 'info');
  },

  resetWorkspaceStorage: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
    const freshApt = createApartmentSample();
    const freshBlank = createEmptyDocument('Disegno1.dwg');
    if (typeof document !== 'undefined') document.body.className = 'dark-theme';
    set({
      documents: [freshBlank, freshApt],
      activeDocId: freshApt.id,
      nextDocNumber: 2,
      theme: 'dark',
      workspace: 'drafting',
      activeRibbonTab: 'home',
      settings: { ...DEFAULT_SETTINGS, osnapModes: { ...DEFAULT_SETTINGS.osnapModes } },
      command: null,
      statusMessage: 'Sessione ripristinata ai valori predefiniti',
    });
    get().log('Sessione e spazio di lavoro ripristinati ai valori predefiniti.', 'result');
  },
}));

// Debounced automatic persistence to localStorage (excludes undo stacks & transient selection)
let persistTimer: ReturnType<typeof setTimeout> | null = null;
if (typeof window !== 'undefined' && window.localStorage) {
  useCadStore.subscribe((state) => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      try {
        const payload: PersistedCadData = {
          documents: state.documents.map((d) => ({
            ...d,
            undoStack: [],
            redoStack: [],
            selectedIds: [],
          })),
          activeDocId: state.activeDocId,
          nextDocNumber: state.nextDocNumber,
          recentFiles: state.recentFiles,
          language: state.language,
          customLanguagePacks: state.customLanguagePacks,
          theme: state.theme,
          workspace: state.workspace,
          settings: state.settings,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore quota exceeded or private mode storage restrictions
      }
    }, 800);
  });
}
