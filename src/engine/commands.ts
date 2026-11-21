import { Point2D } from '../types/cad';
import { degToRad } from './math';

export interface CommandMeta {
  id: string; // canonical uppercase ID, e.g., 'LINE'
  italian: string; // e.g., 'LINEA'
  english: string; // e.g., 'LINE'
  aliases: string[]; // e.g., ['L']
  category: 'Disegna' | 'Edita' | 'Annota' | '3D' | 'Vista' | 'Utilità' | 'Layer/Blocchi' | 'File';
  description: string;
}

export const COMMAND_REGISTRY: CommandMeta[] = [
  // DISEGNA
  { id: 'LINE', italian: 'LINEA', english: 'LINE', aliases: ['L'], category: 'Disegna', description: 'Crea segmenti di linea retta' },
  { id: 'POLYLINE', italian: 'PLINEA', english: 'PLINE', aliases: ['PL', 'POLILINEA'], category: 'Disegna', description: 'Crea una polilinea 2D continua' },
  { id: 'CIRCLE', italian: 'CERCHIO', english: 'CIRCLE', aliases: ['C'], category: 'Disegna', description: 'Crea un cerchio (Centro-Raggio, Diametro, 2P, 3P)' },
  { id: 'CIRCLE_2P', italian: 'CERCHIO2P', english: 'CIRCLE2P', aliases: ['C2P'], category: 'Disegna', description: 'Crea un cerchio da 2 punti del diametro' },
  { id: 'CIRCLE_3P', italian: 'CERCHIO3P', english: 'CIRCLE3P', aliases: ['C3P'], category: 'Disegna', description: 'Crea un cerchio passante per 3 punti' },
  { id: 'ARC', italian: 'ARCO', english: 'ARC', aliases: ['AR', 'A'], category: 'Disegna', description: 'Crea un arco per 3 punti' },
  { id: 'RECTANGLE', italian: 'RETTANGOLO', english: 'RECTANG', aliases: ['RT', 'REC', 'RECT'], category: 'Disegna', description: 'Crea una polilinea rettangolare' },
  { id: 'POLYGON', italian: 'POLIGONO', english: 'POLYGON', aliases: ['PG', 'POL', 'POLIG'], category: 'Disegna', description: 'Crea un poligono regolare equilatero' },
  { id: 'ELLIPSE', italian: 'ELLISSE', english: 'ELLIPSE', aliases: ['EL'], category: 'Disegna', description: 'Crea un\'ellisse da centro e semiassi' },
  { id: 'SPLINE', italian: 'SPLINE', english: 'SPLINE', aliases: ['SPL'], category: 'Disegna', description: 'Crea una curva spline liscia per punti' },
  { id: 'XLINE', italian: 'XLINEA', english: 'XLINE', aliases: ['XL'], category: 'Disegna', description: 'Crea una linea di costruzione infinita' },
  { id: 'RAY', italian: 'RAGGIO', english: 'RAY', aliases: ['RAG'], category: 'Disegna', description: 'Crea una semiretta infinita' },
  { id: 'POINT', italian: 'PUNTO', english: 'POINT', aliases: ['PO'], category: 'Disegna', description: 'Crea un oggetto punto (nodo)' },
  { id: 'DONUT', italian: 'ANELLO', english: 'DONUT', aliases: ['DO', 'ANE'], category: 'Disegna', description: 'Crea un anello pieno tra diametro interno ed esterno' },
  { id: 'DIVIDE', italian: 'DIVIDI', english: 'DIVIDE', aliases: ['DD', 'DIV'], category: 'Disegna', description: 'Inserisce punti equidistanti lungo un oggetto' },
  { id: 'MEASURE_SEG', italian: 'MISURADIV', english: 'MEASURE', aliases: ['MES', 'MDIV'], category: 'Disegna', description: 'Inserisce punti a intervalli di lunghezza fissi lungo un oggetto' },
  { id: 'HATCH', italian: 'TRATTEGGIO', english: 'HATCH', aliases: ['RE', 'H', 'BHATCH', 'PTR'], category: 'Disegna', description: 'Riempie un\'area chiusa con un motivo di tratteggio' },
  { id: 'REVCLOUD', italian: 'NUVOLAR', english: 'REVCLOUD', aliases: ['REV', 'NUVOLA'], category: 'Disegna', description: 'Crea una nuvola di revisione' },

  // EDITA
  { id: 'MOVE', italian: 'SPOSTA', english: 'MOVE', aliases: ['S', 'M'], category: 'Edita', description: 'Sposta oggetti a una distanza e direzione specificate' },
  { id: 'COPY', italian: 'COPIA', english: 'COPY', aliases: ['CP', 'CO'], category: 'Edita', description: 'Copia gli oggetti selezionati' },
  { id: 'ROTATE', italian: 'RUOTA', english: 'ROTATE', aliases: ['RU', 'RO'], category: 'Edita', description: 'Ruota gli oggetti attorno ad un punto base' },
  { id: 'MIRROR', italian: 'SPECCHIO', english: 'MIRROR', aliases: ['SP', 'MI'], category: 'Edita', description: 'Crea una copia speculare degli oggetti' },
  { id: 'SCALE', italian: 'SCALA', english: 'SCALE', aliases: ['SS', 'SC'], category: 'Edita', description: 'Ingrandisce o riduce gli oggetti proporzionalmente' },
  { id: 'TRIM', italian: 'TAGLIA', english: 'TRIM', aliases: ['TA', 'TR'], category: 'Edita', description: 'Taglia gli oggetti in corrispondenza delle intersezioni' },
  { id: 'EXTEND', italian: 'ESTENDI', english: 'EXTEND', aliases: ['ES', 'EX'], category: 'Edita', description: 'Estende gli oggetti fino al bordo più vicino' },
  { id: 'OFFSET', italian: 'OFFSET', english: 'OFFSET', aliases: ['OF', 'O'], category: 'Edita', description: 'Crea linee parallele, cerchi concentrici e curve sfalsate' },
  { id: 'FILLET', italian: 'RACCORDO', english: 'FILLET', aliases: ['RA', 'F'], category: 'Edita', description: 'Arrotonda e raccorda i bordi di due linee' },
  { id: 'CHAMFER', italian: 'CIMA', english: 'CHAMFER', aliases: ['CM', 'CHA'], category: 'Edita', description: 'Smussa gli spigoli di due linee' },
  { id: 'ERASE', italian: 'CANCELLA', english: 'ERASE', aliases: ['CA', 'DEL', 'DELETE'], category: 'Edita', description: 'Rimuove gli oggetti selezionati dal disegno' },
  { id: 'EXPLODE', italian: 'ESPLODI', english: 'EXPLODE', aliases: ['E', 'X'], category: 'Edita', description: 'Scompone oggetti composti (blocchi, rettangoli, polilinee)' },
  { id: 'JOIN', italian: 'UNISCI', english: 'JOIN', aliases: ['U', 'J'], category: 'Edita', description: 'Unisce segmenti contigui in una polilinea' },
  { id: 'STRETCH', italian: 'STIRA', english: 'STRETCH', aliases: ['STI', 'STR'], category: 'Edita', description: 'Stira vertici di oggetti all\'interno di una finestra' },
  { id: 'BREAK', italian: 'SPEZZA', english: 'BREAK', aliases: ['SZ', 'BR'], category: 'Edita', description: 'Spezza un oggetto tra due punti specificati' },
  { id: 'ALIGN', italian: 'ALLINEA', english: 'ALIGN', aliases: ['AL', 'ALLI'], category: 'Edita', description: 'Allinea e scala oggetti su 2 coppie di punti' },
  { id: 'OVERKILL', italian: 'ELIMINADUP', english: 'OVERKILL', aliases: ['OVK', 'EDUP'], category: 'Edita', description: 'Rimuove geometrie duplicate o perfettamente sovrapposte' },
  { id: 'DRAWORDER_FRONT', italian: 'PORTAINAVANTI', english: 'DRAWORDER', aliases: ['OD', 'DR', 'ORDINEDIS'], category: 'Edita', description: 'Porta gli oggetti selezionati sopra tutti gli altri' },
  { id: 'DRAWORDER_BACK', italian: 'PORTASULLOSFONDO', english: 'SENDTOBACK', aliases: ['ODB'], category: 'Edita', description: 'Sposta gli oggetti selezionati sullo sfondo' },
  { id: 'ARRAY_RECT', italian: 'SERIERETT', english: 'ARRAYRECT', aliases: ['SR', 'SERIE'], category: 'Edita', description: 'Distribuisce copie di oggetti in righe e colonne' },
  { id: 'ARRAY_POLAR', italian: 'SERIEPOLARE', english: 'ARRAYPOLAR', aliases: ['SRP'], category: 'Edita', description: 'Distribuisce copie attorno ad un punto centrale' },
  { id: 'MATCHPROP', italian: 'CORRISPROP', english: 'MATCHPROP', aliases: ['CRP', 'MA'], category: 'Edita', description: 'Applica le proprietà di un oggetto selezionato ad altri oggetti' },

  // ANNOTA
  { id: 'TEXT', italian: 'TESTO', english: 'TEXT', aliases: ['T', 'TD', 'DTEXT'], category: 'Annota', description: 'Crea un oggetto di testo a riga singola' },
  { id: 'MTEXT', italian: 'TESTOM', english: 'MTEXT', aliases: ['TSM', 'TSTM', 'MT'], category: 'Annota', description: 'Crea un oggetto di testo multilinea' },
  { id: 'TABLE', italian: 'TABELLA', english: 'TABLE', aliases: ['TB'], category: 'Annota', description: 'Crea una tabella di dati editabile sul disegno' },
  { id: 'DIMLINEAR', italian: 'DIMLINEARE', english: 'DIMLINEAR', aliases: ['DLI', 'QUOTA', 'DIM'], category: 'Annota', description: 'Crea una quota lineare orizzontale o verticale' },
  { id: 'DIMALIGNED', italian: 'DIMALLINEATA', english: 'DIMALIGNED', aliases: ['DAL'], category: 'Annota', description: 'Crea una quota lineare allineata ai due punti' },
  { id: 'DIMRADIUS', italian: 'DIMRAGGIO', english: 'DIMRADIUS', aliases: ['DRA'], category: 'Annota', description: 'Crea una quota raggio per cerchio o arco' },
  { id: 'DIMDIAMETER', italian: 'DIMDIAMETRO', english: 'DIMDIAMETER', aliases: ['DDI'], category: 'Annota', description: 'Crea una quota diametro per cerchio o arco' },
  { id: 'DIMANGULAR', italian: 'DIMANGOLO', english: 'DIMANGULAR', aliases: ['DAN'], category: 'Annota', description: 'Crea una quota angolare tra 3 punti' },
  { id: 'LEADER', italian: 'MULTIDIR', english: 'MLEADER', aliases: ['MLD', 'DIR'], category: 'Annota', description: 'Crea una direttrice con nota di testo' },

  // 3D
  { id: 'BOX', italian: 'PARALLELEPIPEDO', english: 'BOX', aliases: ['BOX3D'], category: '3D', description: 'Crea un parallelepipedo solido 3D' },
  { id: 'CYLINDER', italian: 'CILINDRO', english: 'CYLINDER', aliases: ['CIL', 'CYL'], category: '3D', description: 'Crea un cilindro solido 3D' },
  { id: 'SPHERE', italian: 'SFERA', english: 'SPHERE', aliases: ['SPH'], category: '3D', description: 'Crea una sfera solida 3D' },
  { id: 'CONE', italian: 'CONO', english: 'CONE', aliases: ['CON'], category: '3D', description: 'Crea un cono solido 3D' },
  { id: 'PYRAMID', italian: 'PIRAMIDE', english: 'PYRAMID', aliases: ['PIR'], category: '3D', description: 'Crea una piramide solida 3D' },
  { id: 'TORUS', italian: 'TORO', english: 'TORUS', aliases: ['TOR'], category: '3D', description: 'Crea un toro solido 3D' },
  { id: 'EXTRUDE', italian: 'ESTRUDI', english: 'EXTRUDE', aliases: ['EU', 'EXT'], category: '3D', description: 'Estrude un profilo 2D chiuso in un solido 3D' },
  { id: 'REVOLVE', italian: 'RIVOLUZIONE', english: 'REVOLVE', aliases: ['RIV', 'REV3D'], category: '3D', description: 'Crea un solido 3D ruotando un profilo 2D' },
  { id: 'UNION', italian: 'UNIONE', english: 'UNION', aliases: ['UNI'], category: '3D', description: 'Unisce due o più solidi 3D (Booleana CSG)' },
  { id: 'SUBTRACT', italian: 'SOTTRAI', english: 'SUBTRACT', aliases: ['SOT', 'SU'], category: '3D', description: 'Sottrae il secondo solido 3D dal primo (Booleana CSG)' },
  { id: 'INTERSECT', italian: 'INTERSEZIONE', english: 'INTERSECT', aliases: ['IT', 'IN3D'], category: '3D', description: 'Calcola il volume di intersezione tra solidi 3D' },
  { id: 'MOVE3D', italian: 'SPOSTA3D', english: '3DMOVE', aliases: ['S3', 'M3D'], category: '3D', description: 'Sposta solidi 3D lungo X, Y e Z' },
  { id: 'ROTATE3D', italian: 'RUOTA3D', english: '3DROTATE', aliases: ['R3'], category: '3D', description: 'Ruota solidi 3D attorno agli assi X, Y o Z' },
  { id: '3DORBIT', italian: '3DORBITA', english: '3DORBIT', aliases: ['3DO', 'ORBIT', 'ORBITA'], category: '3D', description: 'Attiva la vista 3D interattiva con orbita libera' },

  // VISTA
  { id: 'ZOOM_EXTENTS', italian: 'ZOOM', english: 'ZOOM', aliases: ['Z', 'ZE'], category: 'Vista', description: 'Esegue zoom estensioni su tutti gli oggetti del disegno' },
  { id: 'ZOOM_WINDOW', italian: 'ZOOMFINESTRA', english: 'ZOOMW', aliases: ['ZW'], category: 'Vista', description: 'Zoom su una finestra rettangolare specificata' },
  { id: 'PAN', italian: 'PAN', english: 'PAN', aliases: ['P'], category: 'Vista', description: 'Sposta la vista nella finestra corrente' },
  { id: 'REGEN', italian: 'RIGEN', english: 'REGEN', aliases: ['RG', 'R', 'RIDIS'], category: 'Vista', description: 'Rigenera l\'intero disegno e ricalcola la grafica' },
  { id: 'VIEW_TOP', italian: 'VISTAALTO', english: 'PLAN', aliases: ['ALTO', 'TOP'], category: 'Vista', description: 'Ripristina la vista piana dall\'alto 2D' },
  { id: 'VIEW_ISO', italian: 'VISTAISO', english: 'ISO', aliases: ['ISO3D'], category: 'Vista', description: 'Passa alla vista assonometrica SO 3D' },

  // LAYER / BLOCCHI / PROPRIETA
  { id: 'LAYER', italian: 'LAYER', english: 'LAYER', aliases: ['LA'], category: 'Layer/Blocchi', description: 'Apre il Gestore Proprietà Layer' },
  { id: 'PROPERTIES', italian: 'PROPRIETA', english: 'PROPERTIES', aliases: ['PR', 'PRO', 'PROP', 'CH'], category: 'Layer/Blocchi', description: 'Apre/chiude la tavolozza Proprietà' },
  { id: 'BLOCK', italian: 'BLOCCO', english: 'BLOCK', aliases: ['B'], category: 'Layer/Blocchi', description: 'Crea una definizione di blocco dagli oggetti selezionati' },
  { id: 'INSERT', italian: 'INSER', english: 'INSERT', aliases: ['IN', 'I'], category: 'Layer/Blocchi', description: 'Apre la tavolozza Blocchi per inserire un blocco' },
  { id: 'GROUP', italian: 'GRUPPO', english: 'GROUP', aliases: ['GP', 'G'], category: 'Layer/Blocchi', description: 'Raggruppa gli oggetti selezionati' },
  { id: 'UNGROUP', italian: 'SEPARAGRUPPO', english: 'UNGROUP', aliases: ['UG'], category: 'Layer/Blocchi', description: 'Separa un gruppo selezionato' },
  { id: 'LAYISO', italian: 'ISOLALAYER', english: 'LAYISO', aliases: ['LI_ISO'], category: 'Layer/Blocchi', description: 'Isola il layer corrente o degli oggetti selezionati' },
  { id: 'LAYUNISO', italian: 'MOSTRALAYER', english: 'LAYUNISO', aliases: ['LAYON'], category: 'Layer/Blocchi', description: 'Ripristina la visibilità di tutti i layer isolati' },

  // UTILITA
  { id: 'DIST', italian: 'DIST', english: 'DIST', aliases: ['DI', 'MISURA', 'MISURAGEOM'], category: 'Utilità', description: 'Misura distanza e angolo tra due punti' },
  { id: 'AREA', italian: 'AREA', english: 'AREA', aliases: ['AA'], category: 'Utilità', description: 'Calcola l\'area e il perimetro di un oggetto o poligono' },
  { id: 'LIST', italian: 'LISTA', english: 'LIST', aliases: ['LI', 'LS'], category: 'Utilità', description: 'Visualizza i dati geometrici degli oggetti selezionati' },
  { id: 'ID', italian: 'ID', english: 'ID', aliases: [], category: 'Utilità', description: 'Visualizza le coordinate UCS di un punto specificato' },
  { id: 'QUICKCALC', italian: 'CALCRAPIDA', english: 'QUICKCALC', aliases: ['CR', 'QC'], category: 'Utilità', description: 'Apre la Calcolatrice Rapida' },
  { id: 'PARAMETERS', italian: 'PARAMETRI', english: 'PARAMETERS', aliases: ['PAR'], category: 'Utilità', description: 'Gestisce le variabili parametriche del disegno' },
  { id: 'UNITS', italian: 'UNITA', english: 'UNITS', aliases: ['UT', 'UN'], category: 'Utilità', description: 'Controlla il formato di visualizzazione di coordinate e unità' },
  { id: 'OPTIONS', italian: 'OPZIONI', english: 'OPTIONS', aliases: ['OP'], category: 'Utilità', description: 'Apre la finestra di dialogo Opzioni' },
  { id: 'PURGE', italian: 'ELIMINA', english: 'PURGE', aliases: ['EN', 'PU'], category: 'Utilità', description: 'Rimuove layer e blocchi inutilizzati dal disegno' },
  { id: 'SCRIPT', italian: 'SCRIPT', english: 'SCRIPT', aliases: ['SCR'], category: 'Utilità', description: 'Apre la console Script per eseguire comandi in sequenza' },
  { id: 'UNDO', italian: 'ANNULLA', english: 'UNDO', aliases: ['AN'], category: 'Utilità', description: 'Annulla l\'ultima operazione' },
  { id: 'REDO', italian: 'RIPETI', english: 'REDO', aliases: ['RIP'], category: 'Utilità', description: 'Ripristina l\'ultima operazione annullata' },
  { id: 'SELECTALL', italian: 'SELEZIONATUTTO', english: 'AI_SELALL', aliases: ['ALL'], category: 'Utilità', description: 'Seleziona tutti gli oggetti visibili nel disegno' },
  { id: 'SELECTSIMILAR', italian: 'SELEZIONASIMILI', english: 'SELECTSIMILAR', aliases: ['SSIM', 'SELSIM'], category: 'Utilità', description: 'Seleziona tutti gli oggetti dello stesso tipo e layer' },

  // FILE
  { id: 'NEW', italian: 'NUOVO', english: 'NEW', aliases: ['QNEW'], category: 'File', description: 'Crea un nuovo disegno vuoto' },
  { id: 'OPEN', italian: 'APRI', english: 'OPEN', aliases: [], category: 'File', description: 'Apre un file DXF o progetto OpenFCAD' },
  { id: 'SAVE', italian: 'SALVA', english: 'QSAVE', aliases: ['SAVE'], category: 'File', description: 'Salva il disegno corrente' },
  { id: 'EXPORT_DXF', italian: 'ESPORTADXF', english: 'DXFOUT', aliases: ['DXFOUT', 'ESPORTA', 'ESP'], category: 'File', description: 'Esporta il disegno in formato DXF standard' },
  { id: 'PLOT', italian: 'STAMPA', english: 'PLOT', aliases: ['PRINT'], category: 'File', description: 'Apre la finestra di Stampa / Plot / PDF / SVG / PNG' },
  { id: 'LANGUAGE', italian: 'LINGUA', english: 'LANGUAGE', aliases: ['LANG', 'I18N'], category: 'Utilità', description: 'Cambia la lingua dell\'interfaccia o importa un pacchetto lingua (.lang.json)' },
];

export function resolveCommand(input: string): CommandMeta | null {
  const clean = input.trim().replace(/^[_-]/, '').toUpperCase();
  if (!clean) return null;
  // Exact match on alias, italian, english, or id
  for (const c of COMMAND_REGISTRY) {
    if (
      c.italian === clean ||
      c.english === clean ||
      c.id === clean ||
      c.aliases.includes(clean)
    ) {
      return c;
    }
  }
  return null;
}

export function searchCommands(query: string, limit = 10): CommandMeta[] {
  const q = query.trim().replace(/^[_-]/, '').toUpperCase();
  if (!q) return [];
  const scored: { meta: CommandMeta; score: number }[] = [];
  for (const c of COMMAND_REGISTRY) {
    let score = 0;
    if (c.aliases.includes(q) || c.italian === q || c.english === q) score = 100;
    else if (c.italian.startsWith(q) || c.english.startsWith(q)) score = 80;
    else if (c.aliases.some((a) => a.startsWith(q))) score = 70;
    else if (c.italian.includes(q) || c.english.includes(q)) score = 50;
    else if (c.description.toUpperCase().includes(q)) score = 20;
    if (score > 0) scored.push({ meta: c, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.meta.italian.localeCompare(b.meta.italian))
    .slice(0, limit)
    .map((s) => s.meta);
}

// Safe simple arithmetic expression evaluator for CAD input (e.g., "120/2", "spessoreMuro*2")
export function evalCadNumber(expr: string, vars?: Record<string, number>): number | null {
  let clean = expr.trim().replace(',', '.');
  if (!clean) return null;
  if (vars) {
    const names = Object.keys(vars).sort((a, b) => b.length - a.length);
    for (const k of names) {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      clean = clean.replace(new RegExp(`\\b${escaped}\\b`, 'g'), `(${vars[k]})`);
    }
  }
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(clean)) return parseFloat(clean);
  // Only allow digits, operators, parens, spaces, dot
  if (!/^[\d+\-*/().\s]+$/.test(clean)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${clean});`)();
    return typeof val === 'number' && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

// Parse coordinate string: "100,50", "@50,25", "@100<45", or single scalar for direct distance entry
export function parseCoordinateInput(
  raw: string,
  lastPoint?: Point2D,
  cursorDirection?: Point2D,
  vars?: Record<string, number>
): { kind: 'point'; point: Point2D } | { kind: 'number'; value: number } | { kind: 'text'; text: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'text', text: '' };

  const isRel = trimmed.startsWith('@');
  const body = isRel ? trimmed.slice(1) : trimmed;

  // Polar: dist<angle
  if (body.includes('<')) {
    const [dStr, aStr] = body.split('<');
    const d = evalCadNumber(dStr, vars);
    const a = evalCadNumber(aStr, vars);
    if (d !== null && a !== null) {
      const rad = degToRad(a);
      const base = isRel && lastPoint ? lastPoint : { x: 0, y: 0 };
      return {
        kind: 'point',
        point: { x: base.x + d * Math.cos(rad), y: base.y + d * Math.sin(rad) },
      };
    }
  }

  // Cartesian: x,y (note: comma separates coordinates, dot is decimal)
  if (body.includes(',')) {
    const parts = body.split(',');
    if (parts.length >= 2) {
      const x = evalCadNumber(parts[0], vars);
      const y = evalCadNumber(parts[1], vars);
      if (x !== null && y !== null) {
        const base = isRel && lastPoint ? lastPoint : { x: 0, y: 0 };
        return { kind: 'point', point: { x: base.x + x, y: base.y + y } };
      }
    }
  }

  // Scalar number -> direct distance entry if lastPoint & cursorDirection available, else raw number
  const num = evalCadNumber(trimmed, vars);
  if (num !== null) {
    if (lastPoint && cursorDirection) {
      const dx = cursorDirection.x - lastPoint.x;
      const dy = cursorDirection.y - lastPoint.y;
      const len = Math.hypot(dx, dy);
      if (len > 1e-6) {
        return {
          kind: 'number',
          value: num,
        };
      }
    }
    return { kind: 'number', value: num };
  }

  return { kind: 'text', text: trimmed };
}
