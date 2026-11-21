export type BuiltInLangCode =
  | 'it'
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'pl'
  | 'nl'
  | 'tr';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
  builtIn?: boolean;
}

export const BUILTIN_LANGUAGES: LanguageOption[] = [
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr', builtIn: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr', builtIn: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr', builtIn: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', builtIn: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr', builtIn: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', dir: 'ltr', builtIn: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr', builtIn: true },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', flag: '🇨🇳', dir: 'ltr', builtIn: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr', builtIn: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', dir: 'ltr', builtIn: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', builtIn: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', dir: 'ltr', builtIn: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr', builtIn: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr', builtIn: true },
];

// Extended ISO 639-1 catalogue allowing users to select or customize literally ANY world language
export const WORLD_LANGUAGES: LanguageOption[] = [
  ...BUILTIN_LANGUAGES,
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', dir: 'ltr' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', dir: 'ltr' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', dir: 'ltr' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', dir: 'ltr' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', dir: 'ltr' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', dir: 'ltr' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', dir: 'ltr' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', dir: 'ltr' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', dir: 'ltr' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', dir: 'ltr' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', dir: 'ltr' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', dir: 'ltr' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', dir: 'ltr' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮', dir: 'ltr' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски / Srpski', flag: '🇷🇸', dir: 'ltr' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹', dir: 'ltr' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', dir: 'ltr' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', dir: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', dir: 'ltr' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Filipino', flag: '🇵🇭', dir: 'ltr' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', dir: 'ltr' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🌐', dir: 'ltr' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🌐', dir: 'ltr' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🌐', dir: 'ltr' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸', dir: 'ltr' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', dir: 'ltr' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', dir: 'ltr' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', dir: 'ltr' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', dir: 'ltr' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰', dir: 'ltr' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', dir: 'ltr' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪', dir: 'ltr' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲', dir: 'ltr' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿', dir: 'ltr' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', dir: 'ltr' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿', dir: 'ltr' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳', dir: 'ltr' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲', dir: 'ltr' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭', dir: 'ltr' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦', dir: 'ltr' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', dir: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', dir: 'ltr' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', dir: 'ltr' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', dir: 'ltr' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', dir: 'ltr' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', dir: 'ltr' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', dir: 'ltr' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌐', dir: 'ltr' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🏛️', dir: 'ltr' },
];

// Maps Windows NSIS installer LCID numbers ($LANGUAGE) to OpenFCAD language codes
export const LCID_TO_LANG: Record<number, string> = {
  1040: 'it', // Italian
  1033: 'en', // English (US)
  2057: 'en', // English (UK)
  1034: 'es', // Spanish
  1036: 'fr', // French
  1031: 'de', // German
  2070: 'pt', // Portuguese (PT)
  1046: 'pt', // Portuguese (BR)
  1049: 'ru', // Russian
  2052: 'zh', // Simplified Chinese
  1028: 'zh-TW', // Traditional Chinese
  1041: 'ja', // Japanese
  1042: 'ko', // Korean
  1025: 'ar', // Arabic
  1045: 'pl', // Polish
  1043: 'nl', // Dutch
  1055: 'tr', // Turkish
  1058: 'uk', // Ukrainian
  1029: 'cs', // Czech
  1032: 'el', // Greek
  1038: 'hu', // Hungarian
  1048: 'ro', // Romanian
  1053: 'sv', // Swedish
  1035: 'fi', // Finnish
  1030: 'da', // Danish
  1044: 'no', // Norwegian
};

// Italian keys in positional order -> mapped to 13 target languages
const PHRASE_KEYS = [
  // Workspaces
  'Disegno e annotazione',
  'Elementi 3D di base',
  'Modellazione 3D',
  // Ribbon Tabs
  'Inizio',
  'Inserisci',
  'Annota',
  'Parametrico',
  'Strumenti 3D',
  'Vista',
  'Gestisci',
  'Output',
  'Solidi',
  'Mesh / Booleane',
  'Visualizza 3D',
  // Ribbon Panels
  'Disegna',
  'Edita',
  'Annotazione',
  'Layer',
  'Blocco',
  'Proprietà',
  'Utilità',
  'Primitive 3D',
  'Modellazione Solida',
  'Operazioni Booleane',
  'Trasforma 3D',
  'Stili Visuali',
  'Viste Predefinite',
  'Vincoli Geometrici',
  'Variabili',
  'Testo',
  'Quote',
  'Tabelle',
  'Direttrici',
  'Stampa',
  'Esporta',
  'Sistema',
  // Draw Tools
  'Linea',
  'Polilinea',
  'Cerchio',
  'Arco',
  'Rettangolo',
  'Poligono',
  'Ellisse',
  'Tratteggio',
  'Spline',
  'Altro ▾',
  // Modify Tools
  'Sposta',
  'Ruota',
  'Taglia',
  'Copia',
  'Specchio',
  'Estendi',
  'Scala',
  'Raccordo',
  'Cima',
  'Offset',
  'Serie ▾',
  'Esplodi',
  'Cancella',
  'Unisci',
  'Stira ▾',
  // Annotate / Layer / Block / Props / Utility
  'Quota',
  'Allineata',
  'Tabella',
  'Prop. layer',
  'Proprietà layer',
  'Isola',
  'Mostra',
  'Mostra tutti',
  'Blocchi',
  'Crea',
  'Gruppo',
  'Separa',
  'Corrisp.',
  'Misura',
  'Area',
  'Calc',
  'Appunti ▾',
  // 3D Tools
  'Parallelepip.',
  'Cilindro',
  'Sfera',
  'Cono',
  'Piramide',
  'Toro',
  'Estrudi 2D→3D',
  'Rivoluzione',
  'Unione',
  'Sottrai',
  'Interseca',
  'Sposta 3D',
  'Ruota 3D',
  'Orbita 3D',
  // Palettes & Sidebar
  'PROPRIETÀ',
  'Nessuna selezione',
  'DISEGNO CORRENTE',
  'Oggetti totali',
  'Layer attivi',
  'Layer corrente',
  'Unità',
  'Zoom',
  'Stile',
  'TAVOLOZZA BLOCCHI',
  'CALCOLATRICE RAPIDA',
  // StatusBar & CommandLine
  'Modello',
  'MODELLO',
  'CARTA',
  'Comando:',
  'Digita un comando (LINEA, CERCHIO, TAGLIA, RACCORDO, ESTRUDI, 3DORBITA...)',
  'Digita una parola chiave o comando...',
  // StartTab & AppMenu
  'Nuovo Disegno',
  'Nuovo disegno (2D)',
  'Nuovo disegno 3D',
  'Apri file (.dxf / .json)...',
  'Salva come DXF...',
  'Salva progetto (.ofcad.json)...',
  'Esporta SVG...',
  'Esporta 3D STL...',
  'Console Script OpenFCAD',
  'Stampa / Plot / PDF...',
  'Unità disegno...',
  'Opzioni...',
  'Disegni di Esempio Pronti',
  'Apri file esistente (.dxf / .ofcad.json)...',
  // Modals & Common Actions
  'UNITÀ DISEGNO',
  'OPZIONI — OPENFCAD',
  'CONSOLE SCRIPT OPENFCAD (.SCR)',
  'GESTORE PARAMETRI UTENTE',
  'STAMPA - MODELLO',
  'Lingua interfaccia (Qualunque lingua)',
  'Esporta Pacchetto (.lang.json)',
  'Importa Lingua (.lang.json)',
  'Tema colore interfaccia',
  'Scuro (OpenFCAD Dark)',
  'Chiaro (LightTheme)',
  'Colore sfondo Spazio Modello 2D',
  'Nero classico',
  'Bianco',
  'Raggio raccordo predefinito',
  'Distanza offset predefinita',
  'Ripristina sessione predefinita',
  '+ Nuovo Layer',
  'Filtra layer per nome...',
  'Stato',
  'Nome',
  'Congela',
  'Blocca',
  'Colore',
  'Tipo linea',
  'Spessore',
  'Annulla',
  'Chiudi',
  'Elimina',
  // Viewport & ViewCube
  'ALTO',
  'BASSO',
  'FRONTE',
  'RETRO',
  'SINISTRA',
  'DESTRA',
  'Wireframe 2D',
  'Concettuale',
  'Realistico',
  'Raggi X',
  'Zoom Estensioni',
  'Passa a Vista 3D',
  'Seleziona simili',
] as const;

const LANG_ROWS: Record<Exclude<BuiltInLangCode, 'it'>, string[]> = {
  en: [
    'Drafting & Annotation', '3D Basics', '3D Modeling',
    'Home', 'Insert', 'Annotate', 'Parametric', '3D Tools', 'View', 'Manage', 'Output', 'Solids', 'Mesh / Booleans', '3D View',
    'Draw', 'Modify', 'Annotation', 'Layers', 'Block', 'Properties', 'Utilities', '3D Primitives', 'Solid Modeling', 'Boolean Ops', '3D Transform', 'Visual Styles', 'Preset Views', 'Geometric Constraints', 'Variables', 'Text', 'Dimensions', 'Tables', 'Leaders', 'Plot', 'Export', 'System',
    'Line', 'Polyline', 'Circle', 'Arc', 'Rectangle', 'Polygon', 'Ellipse', 'Hatch', 'Spline', 'More ▾',
    'Move', 'Rotate', 'Trim', 'Copy', 'Mirror', 'Extend', 'Scale', 'Fillet', 'Chamfer', 'Offset', 'Array ▾', 'Explode', 'Erase', 'Join', 'Stretch ▾',
    'Dimension', 'Aligned', 'Table', 'Layer Props', 'Layer Properties', 'Isolate', 'Unisolate', 'Show All', 'Blocks', 'Create', 'Group', 'Ungroup', 'Match', 'Measure', 'Area', 'Calc', 'Clipboard ▾',
    'Box', 'Cylinder', 'Sphere', 'Cone', 'Pyramid', 'Torus', 'Extrude 2D→3D', 'Revolve', 'Union', 'Subtract', 'Intersect', '3D Move', '3D Rotate', '3D Orbit',
    'PROPERTIES', 'No selection', 'CURRENT DRAWING', 'Total objects', 'Active layers', 'Current layer', 'Units', 'Zoom', 'Style', 'BLOCKS PALETTE', 'QUICKCALC',
    'Model', 'MODEL', 'PAPER', 'Command:', 'Type a command (LINE, CIRCLE, TRIM, FILLET, EXTRUDE, 3DORBIT...)', 'Type a keyword or command...',
    'New Drawing', 'New Drawing (2D)', 'New 3D Drawing', 'Open File (.dxf / .json)...', 'Save as DXF...', 'Save Project (.ofcad.json)...', 'Export SVG...', 'Export 3D STL...', 'OpenFCAD Script Console', 'Plot / Print / PDF...', 'Drawing Units...', 'Options...', 'Sample Drawings', 'Open Existing File (.dxf / .ofcad.json)...',
    'DRAWING UNITS', 'OPTIONS — OPENFCAD', 'OPENFCAD SCRIPT CONSOLE (.SCR)', 'USER PARAMETERS MANAGER', 'PLOT - MODEL', 'Interface Language (Any Language)', 'Export Pack (.lang.json)', 'Import Language (.lang.json)', 'Interface Color Theme', 'Dark (OpenFCAD Dark)', 'Light (LightTheme)', '2D Model Space Background Color', 'Classic Black', 'White', 'Default Fillet Radius', 'Default Offset Distance', 'Reset Default Session', '+ New Layer', 'Filter layers by name...', 'State', 'Name', 'Freeze', 'Lock', 'Color', 'Linetype', 'Lineweight', 'Cancel', 'Close', 'Delete',
    'TOP', 'BOTTOM', 'FRONT', 'BACK', 'LEFT', 'RIGHT', '2D Wireframe', 'Conceptual', 'Realistic', 'X-Ray', 'Zoom Extents', 'Switch to 3D View', 'Select Similar',
  ],
  es: [
    'Dibujo y anotación', 'Elementos 3D básicos', 'Modelado 3D',
    'Inicio', 'Insertar', 'Anotar', 'Paramétrico', 'Herramientas 3D', 'Vista', 'Administrar', 'Salida', 'Sólidos', 'Malla / Booleanos', 'Vista 3D',
    'Dibujo', 'Modificar', 'Anotación', 'Capas', 'Bloque', 'Propiedades', 'Utilidades', 'Primitivas 3D', 'Modelado Sólido', 'Booleanas', 'Transformar 3D', 'Estilos Visuales', 'Vistas', 'Restricciones', 'Variables', 'Texto', 'Cotas', 'Tablas', 'Directrices', 'Trazar', 'Exportar', 'Sistema',
    'Línea', 'Polilínea', 'Círculo', 'Arco', 'Rectángulo', 'Polígono', 'Elipse', 'Sombreado', 'Spline', 'Más ▾',
    'Desplazar', 'Girar', 'Recortar', 'Copiar', 'Simetría', 'Alargar', 'Escala', 'Empalme', 'Chaflán', 'Desfase', 'Matriz ▾', 'Descomponer', 'Borrar', 'Unir', 'Estirar ▾',
    'Cota', 'Alineada', 'Tabla', 'Prop. capa', 'Propiedades capa', 'Aislar', 'Mostrar', 'Mostrar todo', 'Bloques', 'Crear', 'Grupo', 'Desagrupar', 'Igualar', 'Medir', 'Área', 'Calc', 'Portapap. ▾',
    'Prisma', 'Cilindro', 'Esfera', 'Cono', 'Pirámide', 'Toroide', 'Extruir 2D→3D', 'Revolución', 'Unión', 'Sustraer', 'Intersecar', 'Mover 3D', 'Girar 3D', 'Órbita 3D',
    'PROPIEDADES', 'Sin selección', 'DIBUJO ACTUAL', 'Objetos totales', 'Capas activas', 'Capa actual', 'Unidades', 'Zoom', 'Estilo', 'PALETA DE BLOQUES', 'CALCULADORA RÁPIDA',
    'Modelo', 'MODELO', 'PAPEL', 'Comando:', 'Escriba un comando (LINEA, CIRCULO, RECORTAR, EMPALME, EXTRUIR...)', 'Escriba palabra clave o comando...',
    'Nuevo Dibujo', 'Nuevo dibujo (2D)', 'Nuevo dibujo 3D', 'Abrir archivo (.dxf / .json)...', 'Guardar como DXF...', 'Guardar proyecto (.ofcad.json)...', 'Exportar SVG...', 'Exportar 3D STL...', 'Consola de Scripts OpenFCAD', 'Trazar / Imprimir / PDF...', 'Unidades de dibujo...', 'Opciones...', 'Dibujos de Ejemplo', 'Abrir archivo existente (.dxf / .ofcad.json)...',
    'UNIDADES DE DIBUJO', 'OPCIONES — OPENFCAD', 'CONSOLA DE SCRIPTS OPENFCAD (.SCR)', 'PARÁMETROS DE USUARIO', 'TRAZAR - MODELO', 'Idioma de la interfaz (Cualquier idioma)', 'Exportar paquete (.lang.json)', 'Importar idioma (.lang.json)', 'Tema de color', 'Oscuro (OpenFCAD Dark)', 'Claro (LightTheme)', 'Color de fondo Espacio Modelo 2D', 'Negro clásico', 'Blanco', 'Radio de empalme', 'Distancia de desfase', 'Restaurar sesión predeterminada', '+ Nueva Capa', 'Filtrar capas por nombre...', 'Estado', 'Nombre', 'Inutilizar', 'Bloquear', 'Color', 'Tipo línea', 'Grosor', 'Cancelar', 'Cerrar', 'Eliminar',
    'SUPERIOR', 'INFERIOR', 'FRONTAL', 'POSTERIOR', 'IZQUIERDA', 'DERECHA', 'Estructura 2D', 'Conceptual', 'Realista', 'Rayos X', 'Zoom Extensión', 'Cambiar a Vista 3D', 'Seleccionar similares',
  ],
  fr: [
    'Dessin et annotation', 'Éléments 3D de base', 'Modélisation 3D',
    'Début', 'Insérer', 'Annoter', 'Paramétrique', 'Outils 3D', 'Vue', 'Gérer', 'Sortie', 'Solides', 'Maillage / Booléens', 'Vue 3D',
    'Dessin', 'Modification', 'Annotation', 'Calques', 'Bloc', 'Propriétés', 'Utilitaires', 'Primitives 3D', 'Modélisation Solide', 'Booléens', 'Transform. 3D', 'Styles Visuels', 'Vues', 'Contraintes', 'Variables', 'Texte', 'Cotes', 'Tableaux', 'Repères', 'Tracer', 'Exporter', 'Système',
    'Ligne', 'Polyligne', 'Cercle', 'Arc', 'Rectangle', 'Polygone', 'Ellipse', 'Hachures', 'Spline', 'Plus ▾',
    'Déplacer', 'Rotation', 'Ajuster', 'Copier', 'Miroir', 'Prolonger', 'Échelle', 'Raccord', 'Chanfrein', 'Décaler', 'Réseau ▾', 'Décomposer', 'Effacer', 'Joindre', 'Étirer ▾',
    'Cote', 'Alignée', 'Tableau', 'Prop. calque', 'Propriétés calque', 'Isoler', 'Afficher', 'Tout afficher', 'Blocs', 'Créer', 'Groupe', 'Dissocier', 'Copier prop.', 'Mesurer', 'Aire', 'Calc', 'Presse-pap. ▾',
    'Boîte', 'Cylindre', 'Sphère', 'Cône', 'Pyramide', 'Tore', 'Extruder 2D→3D', 'Révolution', 'Union', 'Soustraire', 'Intersection', 'Déplacer 3D', 'Rotation 3D', 'Orbite 3D',
    'PROPRIÉTÉS', 'Aucune sélection', 'DESSIN COURANT', 'Objets totaux', 'Calques actifs', 'Calque courant', 'Unités', 'Zoom', 'Style', 'PALETTE DE BLOCS', 'CALCULATRICE RAPIDE',
    'Objet', 'OBJET', 'PAPIER', 'Commande:', 'Tapez une commande (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'Tapez un mot-clé ou une commande...',
    'Nouveau Dessin', 'Nouveau dessin (2D)', 'Nouveau dessin 3D', 'Ouvrir fichier (.dxf / .json)...', 'Enregistrer en DXF...', 'Enregistrer projet (.ofcad.json)...', 'Exporter SVG...', 'Exporter 3D STL...', 'Console de script OpenFCAD', 'Tracer / Imprimer / PDF...', 'Unités de dessin...', 'Options...', 'Dessins d\'exemple', 'Ouvrir un fichier existant (.dxf / .ofcad.json)...',
    'UNITÉS DE DESSIN', 'OPTIONS — OPENFCAD', 'CONSOLE DE SCRIPT OPENFCAD (.SCR)', 'PARAMÈTRES UTILISATEUR', 'TRACER - OBJET', 'Langue de l\'interface (Toute langue)', 'Exporter pack (.lang.json)', 'Importer langue (.lang.json)', 'Thème de couleur', 'Sombre (OpenFCAD Dark)', 'Clair (LightTheme)', 'Couleur d\'arrière-plan 2D', 'Noir classique', 'Blanc', 'Rayon de raccord', 'Distance de décalage', 'Réinitialiser la session', '+ Nouveau Calque', 'Filtrer les calques...', 'État', 'Nom', 'Geler', 'Verrouiller', 'Couleur', 'Type ligne', 'Épaisseur', 'Annuler', 'Fermer', 'Supprimer',
    'HAUT', 'BAS', 'AVANT', 'ARRIÈRE', 'GAUCHE', 'DROITE', 'Filaire 2D', 'Conceptuel', 'Réaliste', 'Rayons X', 'Zoom Étendu', 'Passer en Vue 3D', 'Sélectionner similaires',
  ],
  de: [
    'Zeichnen und Beschriften', '3D-Grundlagen', '3D-Modellierung',
    'Start', 'Einfügen', 'Beschriften', 'Parametrisch', '3D-Werkzeuge', 'Ansicht', 'Verwalten', 'Ausgabe', 'Volumenkörper', 'Netz / Boolesch', '3D-Ansicht',
    'Zeichnen', 'Ändern', 'Beschriftung', 'Layer', 'Block', 'Eigenschaften', 'Dienstprogr.', '3D-Grundkörper', 'Volumenmodell', 'Boolesch', '3D-Transform.', 'Visuelle Stile', 'Ansichten', 'Abhängigkeiten', 'Variablen', 'Text', 'Bemaßung', 'Tabellen', 'Führung', 'Plotten', 'Export', 'System',
    'Linie', 'Polylinie', 'Kreis', 'Bogen', 'Rechteck', 'Polygon', 'Ellipse', 'Schraffur', 'Spline', 'Mehr ▾',
    'Verschieben', 'Drehen', 'Stutzen', 'Kopieren', 'Spiegeln', 'Dehnen', 'Skalieren', 'Abrunden', 'Fase', 'Versetzen', 'Reihe ▾', 'Ursprung', 'Löschen', 'Verbinden', 'Strecken ▾',
    'Bemaßung', 'Ausgerichtet', 'Tabelle', 'Layer-Eig.', 'Layereigenschaften', 'Isolieren', 'Einblenden', 'Alle zeigen', 'Blöcke', 'Erstellen', 'Gruppe', 'Aufheben', 'Anpassen', 'Messen', 'Fläche', 'Rechner', 'Zwischenabl. ▾',
    'Quader', 'Zylinder', 'Kugel', 'Kegel', 'Pyramide', 'Torus', 'Extrudieren', 'Rotation', 'Vereinigung', 'Differenz', 'Schnittmenge', '3D-Versch.', '3D-Drehen', '3D-Orbit',
    'EIGENSCHAFTEN', 'Keine Auswahl', 'AKTUELLE ZEICHNUNG', 'Objekte gesamt', 'Aktive Layer', 'Aktueller Layer', 'Einheiten', 'Zoom', 'Stil', 'BLOCKPALETTE', 'TASCHENRECHNER',
    'Modell', 'MODELL', 'PAPIER', 'Befehl:', 'Befehl eingeben (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'Stichwort oder Befehl eingeben...',
    'Neue Zeichnung', 'Neue Zeichnung (2D)', 'Neue 3D-Zeichnung', 'Datei öffnen (.dxf / .json)...', 'Als DXF speichern...', 'Projekt speichern (.ofcad.json)...', 'SVG exportieren...', '3D-STL exportieren...', 'OpenFCAD Skriptkonsole', 'Plotten / Drucken / PDF...', 'Zeichnungseinheiten...', 'Optionen...', 'Beispielzeichnungen', 'Vorhandene Datei öffnen (.dxf / .ofcad.json)...',
    'ZEICHNUNGSEINHEITEN', 'OPTIONEN — OPENFCAD', 'OPENFCAD SKRIPTKONSOLE (.SCR)', 'BENUTZERPARAMETER', 'PLOTTEN - MODELL', 'Oberflächensprache (Beliebige Sprache)', 'Sprachpaket exportieren (.lang.json)', 'Sprache importieren (.lang.json)', 'Farbschema', 'Dunkel (OpenFCAD Dark)', 'Hell (LightTheme)', 'Hintergrundfarbe 2D-Modellbereich', 'Klassisch Schwarz', 'Weiß', 'Standard-Abrundungsradius', 'Standard-Versatzabstand', 'Standardsitzung zurücksetzen', '+ Neuer Layer', 'Layer nach Namen filtern...', 'Status', 'Name', 'Frieren', 'Sperren', 'Farbe', 'Linientyp', 'Linienstärke', 'Abbrechen', 'Schließen', 'Löschen',
    'OBEN', 'UNTEN', 'VORNE', 'HINTEN', 'LINKS', 'RECHTS', '2D-Drahtkörper', 'Konzeptuell', 'Realistisch', 'Röntgen', 'Zoom Grenzen', 'Zur 3D-Ansicht', 'Ähnliche auswählen',
  ],
  pt: [
    'Desenho e anotação', 'Noções básicas de 3D', 'Modelagem 3D',
    'Início', 'Inserir', 'Anotar', 'Paramétrico', 'Ferramentas 3D', 'Vista', 'Gerenciar', 'Saída', 'Sólidos', 'Malha / Booleanos', 'Vista 3D',
    'Desenhar', 'Modificar', 'Anotação', 'Camadas', 'Bloco', 'Propriedades', 'Utilitários', 'Primitivas 3D', 'Modelagem Sólida', 'Booleanos', 'Transformar 3D', 'Estilos Visuais', 'Vistas', 'Restrições', 'Variáveis', 'Texto', 'Cotas', 'Tabelas', 'Chamadas', 'Plotar', 'Exportar', 'Sistema',
    'Linha', 'Polilinha', 'Círculo', 'Arco', 'Retângulo', 'Polígono', 'Elipse', 'Hachura', 'Spline', 'Mais ▾',
    'Mover', 'Rotacionar', 'Aparar', 'Copiar', 'Espelhar', 'Estender', 'Escala', 'Concordância', 'Chanfro', 'Deslocamento', 'Matriz ▾', 'Explodir', 'Apagar', 'Unir', 'Esticar ▾',
    'Cota', 'Alinhada', 'Tabela', 'Prop. camada', 'Propriedades camada', 'Isolar', 'Mostrar', 'Mostrar tudo', 'Blocos', 'Criar', 'Grupo', 'Desagrupar', 'Igualar', 'Medir', 'Área', 'Calc', 'Área transf. ▾',
    'Caixa', 'Cilindro', 'Esfera', 'Cone', 'Pirâmide', 'Toro', 'Extrudar 2D→3D', 'Revolução', 'União', 'Subtrair', 'Interseção', 'Mover 3D', 'Girar 3D', 'Órbita 3D',
    'PROPRIEDADES', 'Nenhuma seleção', 'DESENHO ATUAL', 'Total de objetos', 'Camadas ativas', 'Camada atual', 'Unidades', 'Zoom', 'Estilo', 'PALETA DE BLOCOS', 'CALCULADORA RÁPIDA',
    'Modelo', 'MODELO', 'PAPEL', 'Comando:', 'Digite um comando (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'Digite palavra-chave ou comando...',
    'Novo Desenho', 'Novo desenho (2D)', 'Novo desenho 3D', 'Abrir arquivo (.dxf / .json)...', 'Salvar como DXF...', 'Salvar projeto (.ofcad.json)...', 'Exportar SVG...', 'Exportar 3D STL...', 'Console de Script OpenFCAD', 'Plotar / Imprimir / PDF...', 'Unidades de desenho...', 'Opções...', 'Desenhos de Exemplo', 'Abrir arquivo existente (.dxf / .ofcad.json)...',
    'UNIDADES DE DESENHO', 'OPÇÕES — OPENFCAD', 'CONSOLE DE SCRIPT OPENFCAD (.SCR)', 'PARÂMETROS DO USUÁRIO', 'PLOTAR - MODELO', 'Idioma da interface (Qualquer idioma)', 'Exportar pacote (.lang.json)', 'Importar idioma (.lang.json)', 'Tema de cores', 'Escuro (OpenFCAD Dark)', 'Claro (LightTheme)', 'Cor de fundo do Espaço Modelo 2D', 'Preto clássico', 'Branco', 'Raio de concordância padrão', 'Distância de deslocamento', 'Restaurar sessão padrão', '+ Nova Camada', 'Filtrar camadas...', 'Estado', 'Nome', 'Congelar', 'Bloquear', 'Cor', 'Tipo linha', 'Espessura', 'Cancelar', 'Fechar', 'Excluir',
    'TOPO', 'FUNDO', 'FRENTE', 'TRÁS', 'ESQUERDA', 'DIREITA', 'Estrutura 2D', 'Conceitual', 'Realista', 'Raio-X', 'Zoom Extensão', 'Mudar para Vista 3D', 'Selecionar similares',
  ],
  ru: [
    'Рисование и аннотации', 'Основы 3D', '3D-моделирование',
    'Главная', 'Вставка', 'Аннотации', 'Параметризация', '3D-инструменты', 'Вид', 'Управление', 'Вывод', 'Тела', 'Сеть / Булевы', '3D-вид',
    'Рисование', 'Редактирование', 'Аннотации', 'Слои', 'Блок', 'Свойства', 'Утилиты', '3D-примитивы', 'Тела', 'Булевы опер.', '3D-преобр.', 'Визуальные стили', 'Виды', 'Зависимости', 'Переменные', 'Текст', 'Размеры', 'Таблицы', 'Выноски', 'Печать', 'Экспорт', 'Система',
    'Отрезок', 'Полилиния', 'Круг', 'Дуга', 'Прямоугольник', 'Многоугольник', 'Эллипс', 'Штриховка', 'Сплайн', 'Ещё ▾',
    'Перенести', 'Повернуть', 'Обрезать', 'Копировать', 'Зеркало', 'Удлинить', 'Масштаб', 'Сопряжение', 'Фаска', 'Смещение', 'Массив ▾', 'Расчленить', 'Стереть', 'Соединить', 'Растянуть ▾',
    'Размер', 'Параллельный', 'Таблица', 'Св-ва слоя', 'Свойства слоя', 'Изолировать', 'Показать', 'Показать все', 'Блоки', 'Создать', 'Группа', 'Разгрупп.', 'Свойства', 'Измерить', 'Площадь', 'Кальк.', 'Буфер ▾',
    'Ящик', 'Цилиндр', 'Сфера', 'Конус', 'Пирамида', 'Тор', 'Выдавить', 'Вращение', 'Объединение', 'Вычитание', 'Пересечение', '3D-перенос', '3D-поворот', '3D-орбита',
    'СВОЙСТВА', 'Ничего не выбрано', 'ТЕКУЩИЙ ЧЕРТЁЖ', 'Всего объектов', 'Активные слои', 'Текущий слой', 'Единицы', 'Масштаб', 'Стиль', 'ПАЛИТРА БЛОКОВ', 'КАЛЬКУЛЯТОР',
    'Модель', 'МОДЕЛЬ', 'ЛИСТ', 'Команда:', 'Введите команду (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'Введите ключевое слово или команду...',
    'Новый чертёж', 'Новый чертёж (2D)', 'Новый 3D-чертёж', 'Открыть файл (.dxf / .json)...', 'Сохранить как DXF...', 'Сохранить проект (.ofcad.json)...', 'Экспорт SVG...', 'Экспорт 3D STL...', 'Консоль скриптов OpenFCAD', 'Печать / Плоттер / PDF...', 'Единицы чертежа...', 'Параметры...', 'Примеры чертежей', 'Открыть существующий файл (.dxf / .ofcad.json)...',
    'ЕДИНИЦЫ ЧЕРТЕЖА', 'ПАРАМЕТРЫ — OPENFCAD', 'КОНСОЛЬ СКРИПТОВ OPENFCAD (.SCR)', 'ПОЛЬЗОВАТЕЛЬСКИЕ ПАРАМЕТРЫ', 'ПЕЧАТЬ - МОДЕЛЬ', 'Язык интерфейса (Любой язык)', 'Экспорт пакета (.lang.json)', 'Импорт языка (.lang.json)', 'Цветовая тема', 'Тёмная (OpenFCAD Dark)', 'Светлая (LightTheme)', 'Цвет фона пространства модели 2D', 'Чёрный', 'Белый', 'Радиус сопряжения', 'Расстояние смещения', 'Сбросить сеанс', '+ Новый слой', 'Фильтр слоёв...', 'Сост.', 'Имя', 'Заморозить', 'Блок.', 'Цвет', 'Тип линии', 'Вес линии', 'Отмена', 'Закрыть', 'Удалить',
    'СВЕРХУ', 'СНИЗУ', 'СПЕРЕДИ', 'СЗАДИ', 'СЛЕВА', 'СПРАВА', '2D-каркас', 'Концептуальный', 'Реалистичный', 'Рентген', 'Показать всё', 'Перейти в 3D-вид', 'Выбрать подобные',
  ],
  zh: [
    '草图与注释', '三维基础', '三维建模',
    '默认', '插入', '注释', '参数化', '三维工具', '视图', '管理', '输出', '实体', '网格 / 布尔', '三维视图',
    '绘图', '修改', '注释', '图层', '块', '特性', '实用工具', '三维基本体', '实体建模', '布尔运算', '三维变换', '视觉样式', '预设视图', '几何约束', '变量', '文字', '标注', '表格', '引线', '打印', '导出', '系统',
    '直线', '多段线', '圆', '圆弧', '矩形', '多边形', '椭圆', '图案填充', '样条曲线', '更多 ▾',
    '移动', '旋转', '修剪', '复制', '镜像', '延伸', '缩放', '圆角', '倒角', '偏移', '阵列 ▾', '分解', '删除', '合并', '拉伸 ▾',
    '标注', '对齐', '表格', '图层特性', '图层特性管理器', '隔离', '显示', '全部显示', '块', '创建', '编组', '解组', '特性匹配', '测量', '面积', '计算器', '剪贴板 ▾',
    '长方体', '圆柱体', '球体', '圆锥体', '棱锥体', '圆环体', '拉伸 2D→3D', '旋转建模', '并集', '差集', '交集', '三维移动', '三维旋转', '三维环绕',
    '特性', '无选择', '当前图形', '对象总数', '活动图层', '当前图层', '单位', '缩放', '样式', '块选项板', '快速计算器',
    '模型', '模型', '布局', '命令:', '输入命令 (LINE, CIRCLE, TRIM, FILLET, EXTRUDE, 3DORBIT...)', '输入关键字或命令...',
    '新建图形', '新建图形 (2D)', '新建 3D 图形', '打开文件 (.dxf / .json)...', '另存为 DXF...', '保存项目 (.ofcad.json)...', '导出 SVG...', '导出 3D STL...', 'OpenFCAD 脚本控制台', '打印 / 绘图仪 / PDF...', '图形单位...', '选项...', '示例图形', '打开现有文件 (.dxf / .ofcad.json)...',
    '图形单位', '选项 — OPENFCAD', 'OPENFCAD 脚本控制台 (.SCR)', '用户参数管理器', '打印 - 模型', '界面语言 (支持任意语言)', '导出语言包 (.lang.json)', '导入语言包 (.lang.json)', '界面颜色主题', '深色 (OpenFCAD Dark)', '浅色 (LightTheme)', '2D 模型空间背景色', '经典黑', '白色', '默认圆角半径', '默认偏移距离', '重置默认会话', '+ 新建图层', '按名称过滤图层...', '状态', '名称', '冻结', '锁定', '颜色', '线型', '线宽', '取消', '关闭', '删除',
    '上', '下', '前', '后', '左', '右', '二维线框', '概念', '真实', 'X 射线', '范围缩放', '切换到三维视图', '选择类似对象',
  ],
  ja: [
    '製図と注釈', '3D 基本', '3D モデリング',
    'ホーム', '挿入', '注釈', 'パラメトリック', '3D ツール', '表示', '管理', '出力', 'ソリッド', 'メッシュ / ブール', '3D ビュー',
    '作成', '修正', '注釈', '画層', 'ブロック', 'プロパティ', 'ユーティリティ', '3D プリミティブ', 'ソリッド作成', 'ブール演算', '3D 変換', '表示スタイル', 'ビュー', '幾何拘束', '変数', '文字', '寸法', '表', '引出線', '印刷', '書き出し', 'システム',
    '線分', 'ポリライン', '円', '円弧', '長方形', 'ポリゴン', '楕円', 'ハッチング', 'スプライン', 'その他 ▾',
    '移動', '回転', 'トリム', '複写', '鏡像', '延長', '尺度変更', 'フィレット', '面取り', 'オフセット', '配列複写 ▾', '分解', '削除', '結合', 'ストレッチ ▾',
    '寸法', '平行', '表', '画層管理', '画層プロパティ', '選択表示', '表示', 'すべて表示', 'ブロック', '作成', 'グループ', '解除', 'プロパティコピー', '計測', '面積', '電卓', 'クリップボード ▾',
    '直方体', '円柱', '球', '円錐', '角錐', 'トーラス', '押し出し', '回転', '和', '差', '交差', '3D 移動', '3D 回転', '3D オービット',
    'プロパティ', '選択なし', '現在の図面', '総オブジェクト数', '有効画層', '現在の画層', '単位', 'ズーム', 'スタイル', 'ブロック パレット', 'クイック電卓',
    'モデル', 'モデル', 'ペーパー', 'コマンド:', 'コマンドを入力 (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'キーワードまたはコマンドを入力...',
    '新規図面', '新規図面 (2D)', '新規 3D 図面', 'ファイルを開く (.dxf / .json)...', 'DXF として保存...', 'プロジェクト保存 (.ofcad.json)...', 'SVG 書き出し...', '3D STL 書き出し...', 'OpenFCAD スクリプトコンソール', '印刷 / プロット / PDF...', '図面単位...', 'オプション...', 'サンプル図面', '既存のファイルを開く (.dxf / .ofcad.json)...',
    '図面単位', 'オプション — OPENFCAD', 'OPENFCAD スクリプトコンソール (.SCR)', 'ユーザパラメータ管理', '印刷 - モデル', 'インターフェース言語 (あらゆる言語)', '言語パック書き出し (.lang.json)', '言語パック読み込み (.lang.json)', 'カラーテーマ', 'ダーク (OpenFCAD Dark)', 'ライト (LightTheme)', '2D モデル空間の背景色', 'クラシック黒', '白', '既定のフィレット半径', '既定のオフセット距離', 'セッションをリセット', '+ 新規画層', '画層名でフィルタ...', '状態', '名前', 'フリーズ', 'ロック', '色', '線種', '線の太さ', 'キャンセル', '閉じる', '削除',
    '平面', '底面', '正面', '背面', '左側面', '右側面', '2D ワイヤフレーム', 'コンセプト', 'リアリスティック', 'X 線', 'オブジェクト範囲ズーム', '3D ビューに切替', '類似オブジェクトを選択',
  ],
  ko: [
    '제도 및 주석', '3D 기본', '3D 모델링',
    '홈', '삽입', '주석', '파라메트릭', '3D 도구', '뷰', '관리', '출력', '솔리드', '메쉬 / 부울', '3D 뷰',
    '그리기', '수정', '주석', '도면층', '블록', '특성', '유틸리티', '3D 기본체', '솔리드 모델링', '부울 연산', '3D 변환', '비주얼 스타일', '뷰', '구속조건', '변수', '문자', '치수', '테이블', '지시선', '플롯', '내보내기', '시스템',
    '선', '폴리선', '원', '호', '직사각형', '다각형', '타원', '해치', '스플라인', '더보기 ▾',
    '이동', '회전', '자르기', '복사', '대칭', '연장', '축척', '모깎기', '모따기', '간격띄우기', '배열 ▾', '분해', '지우기', '결합', '신축 ▾',
    '치수', '정렬', '테이블', '도면층 특성', '도면층 특성 관리자', '분리', '표시', '모두 표시', '블록', '작성', '그룹', '그룹해제', '특성일치', '측정', '면적', '계산기', '클립보드 ▾',
    '상자', '원통', '구', '원추', '피라미드', '토러스', '돌출 2D→3D', '회전', '합집합', '차집합', '교집합', '3D 이동', '3D 회전', '3D 궤도',
    '특성', '선택 없음', '현재 도면', '전체 객체', '활성 도면층', '현재 도면층', '단위', '줌', '스타일', '블록 팔레트', '빠른 계산기',
    '모형', '모형', '용지', '명령:', '명령 입력 (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', '키워드 또는 명령 입력...',
    '새 도면', '새 도면 (2D)', '새 3D 도면', '파일 열기 (.dxf / .json)...', 'DXF로 저장...', '프로젝트 저장 (.ofcad.json)...', 'SVG 내보내기...', '3D STL 내보내기...', 'OpenFCAD 스크립트 콘솔', '플롯 / 인쇄 / PDF...', '도면 단위...', '옵션...', '샘플 도면', '기존 파일 열기 (.dxf / .ofcad.json)...',
    '도면 단위', '옵션 — OPENFCAD', 'OPENFCAD 스크립트 콘솔 (.SCR)', '사용자 매개변수 관리자', '플롯 - 모형', '인터페이스 언어 (모든 언어 지원)', '언어 팩 내보내기 (.lang.json)', '언어 팩 가져오기 (.lang.json)', '색상 테마', '다크 (OpenFCAD Dark)', '라이트 (LightTheme)', '2D 모형 공간 배경색', '클래식 블랙', '화이트', '기본 모깎기 반지름', '기본 간격띄우기 거리', '세션 초기화', '+ 새 도면층', '도면층 이름 필터...', '상태', '이름', '동결', '잠금', '색상', '선종류', '선가중치', '취소', '닫기', '삭제',
    '평면', '저면', '정면', '배면', '좌측면', '우측면', '2D 와이어프레임', '개념', '실제', 'X선', '범위 줌', '3D 뷰로 전환', '유사 객체 선택',
  ],
  ar: [
    'الرسم والتعليق', 'أساسيات 3D', 'النمذجة ثلاثية الأبعاد',
    'الرئيسية', 'إدراج', 'تعليق', 'بارامتري', 'أدوات 3D', 'عرض', 'إدارة', 'إخراج', 'مجسمات', 'شبكة / منطقية', 'عرض 3D',
    'رسم', 'تعديل', 'تعليق', 'طبقات', 'كتلة', 'خصائص', 'أدوات', 'مجسمات أولية', 'نمذجة صلبة', 'عمليات منطقية', 'تحويل 3D', 'أنماط بصرية', 'عروض', 'قيود هندسية', 'متغيرات', 'نص', 'أبعاد', 'جداول', 'أسهم توجيه', 'طباعة', 'تصدير', 'نظام',
    'خط', 'خط متعدد', 'دائرة', 'قوس', 'مستطيل', 'مضلع', 'قطع ناقص', 'تهشير', 'منحنى', 'المزيد ▾',
    'تحريك', 'تدوير', 'قص', 'نسخ', 'مرآة', 'تمديد', 'مقياس', 'شطف دائري', 'شطف حاد', 'إزاحة', 'مصفوفة ▾', 'تفكيك', 'مسح', 'دمج', 'مماطلة ▾',
    'بعد', 'محاذى', 'جدول', 'خصائص الطبقة', 'مدير خصائص الطبقات', 'عزل', 'إظهار', 'إظهار الكل', 'كتل', 'إنشاء', 'مجموعة', 'فك مجموعة', 'مطابقة', 'قياس', 'مساحة', 'حاسبة', 'الحافظة ▾',
    'صندوق', 'أسطوانة', 'كرة', 'مخروط', 'هرم', 'طارة', 'بثق 2D→3D', 'تدوير مجسم', 'اتحاد', 'طرح', 'تقاطع', 'تحريك 3D', 'تدوير 3D', 'مدار 3D',
    'الخصائص', 'لا يوجد تحديد', 'الرسم الحالي', 'إجمالي العناصر', 'الطبقات النشطة', 'الطبقة الحالية', 'الوحدات', 'تكبير', 'النمط', 'لوحة الكتل', 'الحاسبة السريعة',
    'نموذج', 'نموذج', 'ورقة', 'الأمر:', 'اكتب أمراً (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'اكتب كلمة مفتاحية أو أمراً...',
    'رسم جديد', 'رسم جديد (2D)', 'رسم 3D جديد', 'فتح ملف (.dxf / .json)...', 'حفظ بصيغة DXF...', 'حفظ المشروع (.ofcad.json)...', 'تصدير SVG...', 'تصدير 3D STL...', 'وحدة نصوص OpenFCAD', 'طباعة / PDF...', 'وحدات الرسم...', 'خيارات...', 'رسومات نموذجية', 'فتح ملف موجود (.dxf / .ofcad.json)...',
    'وحدات الرسم', 'خيارات — OPENFCAD', 'وحدة نصوص OPENFCAD (.SCR)', 'مدير المعلمات', 'طباعة - نموذج', 'لغة الواجهة (أي لغة)', 'تصدير حزمة (.lang.json)', 'استيراد لغة (.lang.json)', 'سمة الألوان', 'داكن (OpenFCAD Dark)', 'فاتح (LightTheme)', 'لون خلفية النموذج 2D', 'أسود كلاسيكي', 'أبيض', 'نصف قطر الشطف', 'مسافة الإزاحة', 'إعادة ضبط الجلسة', '+ طبقة جديدة', 'تصفية الطبقات...', 'الحالة', 'الاسم', 'تجميد', 'قفل', 'اللون', 'نوع الخط', 'سمك الخط', 'إلغاء', 'إغلاق', 'حذف',
    'أعلى', 'أسفل', 'أمام', 'خلف', 'يسار', 'يمين', 'إطار سلكي 2D', 'مفاهيمي', 'واقعي', 'أشعة سينية', 'تكبير للحدود', 'التبديل لعرض 3D', 'تحديد المشابه',
  ],
  pl: [
    'Rysowanie i opisy', 'Podstawy 3D', 'Modelowanie 3D',
    'Narzędzia główne', 'Wstaw', 'Opisz', 'Parametryczne', 'Narzędzia 3D', 'Widok', 'Zarządzaj', 'Wynik', 'Bryły', 'Siatka / Boole', 'Widok 3D',
    'Rysuj', 'Zmień', 'Opis', 'Warstwy', 'Blok', 'Właściwości', 'Narzędzia', 'Bryły 3D', 'Modelowanie brył', 'Operacje Boole’a', 'Transform. 3D', 'Style wizualne', 'Widoki', 'Więzy', 'Zmienne', 'Tekst', 'Wymiary', 'Tabele', 'Linie odnies.', 'Drukuj', 'Eksport', 'System',
    'Linia', 'Polilinia', 'Okrąg', 'Łuk', 'Prostokąt', 'Wielobok', 'Elipsa', 'Kreskowanie', 'Splajn', 'Więcej ▾',
    'Przesuń', 'Obróć', 'Utnij', 'Kopiuj', 'Lustro', 'Wydłuż', 'Skala', 'Zaokrąglij', 'Fazuj', 'Odsuń', 'Szyk ▾', 'Rozbij', 'Usuń', 'Połącz', 'Rozciągnij ▾',
    'Wymiar', 'Normalny', 'Tabela', 'Właśc. warstwy', 'Menedżer warstw', 'Izoluj', 'Pokaż', 'Pokaż wszystkie', 'Bloki', 'Utwórz', 'Grupa', 'Rozgrupuj', 'Uzgodnij', 'Zmierz', 'Pole', 'Kalk.', 'Schowek ▾',
    'Kostka', 'Walec', 'Kula', 'Stożek', 'Ostrosłup', 'Torus', 'Wyciągnij', 'Obrót 3D', 'Suma', 'Różnica', 'Iloczyn', 'Przesuń 3D', 'Obróć 3D', 'Orbita 3D',
    'WŁAŚCIWOŚCI', 'Brak wyboru', 'BIEŻĄCY RYSUNEK', 'Obiekty łącznie', 'Aktywne warstwy', 'Bieżąca warstwa', 'Jednostki', 'Zoom', 'Styl', 'PALETA BLOKÓW', 'SZYBKI KALKULATOR',
    'Model', 'MODEL', 'PAPIER', 'Polecenie:', 'Wpisz polecenie (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'Wpisz słowo kluczowe lub polecenie...',
    'Nowy Rysunek', 'Nowy rysunek (2D)', 'Nowy rysunek 3D', 'Otwórz plik (.dxf / .json)...', 'Zapisz jako DXF...', 'Zapisz projekt (.ofcad.json)...', 'Eksportuj SVG...', 'Eksportuj 3D STL...', 'Konsola skryptów OpenFCAD', 'Drukuj / Kreśl / PDF...', 'Jednostki rysunku...', 'Opcje...', 'Przykładowe rysunki', 'Otwórz istniejący plik (.dxf / .ofcad.json)...',
    'JEDNOSTKI RYSUNKU', 'OPCJE — OPENFCAD', 'KONSOLA SKRYPTÓW OPENFCAD (.SCR)', 'MENEDŻER PARAMETRÓW', 'DRUKUJ - MODEL', 'Język interfejsu (Dowolny język)', 'Eksportuj pakiet (.lang.json)', 'Importuj język (.lang.json)', 'Motyw kolorów', 'Ciemny (OpenFCAD Dark)', 'Jasny (LightTheme)', 'Kolor tła obszaru modelu 2D', 'Klasyczny czarny', 'Biały', 'Promień zaokrąglenia', 'Odległość odsunięcia', 'Resetuj sesję', '+ Nowa warstwa', 'Filtruj warstwy...', 'Stan', 'Nazwa', 'Zamroź', 'Zablokuj', 'Kolor', 'Rodzaj linii', 'Szerokość', 'Anuluj', 'Zamknij', 'Usuń',
    'GÓRA', 'DÓŁ', 'PRZÓD', 'TYŁ', 'LEWO', 'PRAWO', 'Szkielet 2D', 'Koncepcyjny', 'Realistyczny', 'Rentgen', 'Zoom Zakres', 'Przełącz na widok 3D', 'Wybierz podobne',
  ],
  nl: [
    'Tekenen en annotatie', '3D-basis', '3D-modelleren',
    'Start', 'Invoegen', 'Annoteren', 'Parametrisch', '3D-gereedschap', 'Beeld', 'Beheren', 'Uitvoer', 'Volumes', 'Mesh / Booleaans', '3D-weergave',
    'Tekenen', 'Bewerken', 'Annotatie', 'Lagen', 'Blok', 'Eigenschappen', 'Hulpprogr.', '3D-basisvormen', 'Volume-model', 'Booleaans', '3D-transform.', 'Visuele stijlen', 'Weergaven', 'Relaties', 'Variabelen', 'Tekst', 'Maatvoering', 'Tabellen', 'Aanwijzers', 'Plotten', 'Exporteren', 'Systeem',
    'Lijn', 'Polylijn', 'Cirkel', 'Boog', 'Rechthoek', 'Veelhoek', 'Ellips', 'Arcering', 'Spline', 'Meer ▾',
    'Verplaatsen', 'Roteren', 'Bijsnijden', 'Kopiëren', 'Spiegelen', 'Verlengen', 'Schalen', 'Afronden', 'Afschuinen', 'Offset', 'Reeks ▾', 'Exploderen', 'Wissen', 'Samenvoegen', 'Oprekken ▾',
    'Maat', 'Uitgelijnd', 'Tabel', 'Laag-eig.', 'Laageigenschappen', 'Isoleren', 'Tonen', 'Alles tonen', 'Blokken', 'Maken', 'Groep', 'Degroeperen', 'Overnemen', 'Meten', 'Oppervlak', 'Calc', 'Klembord ▾',
    'Balk', 'Cilinder', 'Bol', 'Kegel', 'Piramide', 'Torus', 'Extruderen', 'Wentelen', 'Verenigen', 'Aftrekken', 'Doorsnede', '3D-verpl.', '3D-roteren', '3D-baan',
    'EIGENSCHAPPEN', 'Geen selectie', 'HUIDIGE TEKENING', 'Totaal objecten', 'Actieve lagen', 'Huidige laag', 'Eenheden', 'Zoom', 'Stijl', 'BLOKKENPALET', 'SNELREKENMACHINE',
    'Model', 'MODEL', 'PAPIER', 'Opdracht:', 'Typ een opdracht (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'Typ een trefwoord of opdracht...',
    'Nieuwe Tekening', 'Nieuwe tekening (2D)', 'Nieuwe 3D-tekening', 'Bestand openen (.dxf / .json)...', 'Opslaan als DXF...', 'Project opslaan (.ofcad.json)...', 'SVG exporteren...', '3D STL exporteren...', 'OpenFCAD Scriptconsole', 'Plotten / Afdrukken / PDF...', 'Tekeningeenheden...', 'Opties...', 'Voorbeeldtekeningen', 'Bestaand bestand openen (.dxf / .ofcad.json)...',
    'TEKENINGEENHEDEN', 'OPTIES — OPENFCAD', 'OPENFCAD SCRIPTCONSOLE (.SCR)', 'GEBRUIKERSPARAMETERS', 'PLOTTEN - MODEL', 'Interfacetaal (Elke taal)', 'Taalpakket exporteren (.lang.json)', 'Taal importeren (.lang.json)', 'Kleurthema', 'Donker (OpenFCAD Dark)', 'Licht (LightTheme)', 'Achtergrondkleur 2D-modelruimte', 'Klassiek zwart', 'Wit', 'Standaard afrondingsstraal', 'Standaard offset-afstand', 'Standaardsessie herstellen', '+ Nieuwe laag', 'Filter lagen op naam...', 'Status', 'Naam', 'Bevriezen', 'Vergrendelen', 'Kleur', 'Lijntype', 'Lijndikte', 'Annuleren', 'Sluiten', 'Verwijderen',
    'BOVEN', 'ONDER', 'VOOR', 'ACHTER', 'LINKS', 'RECHTS', '2D-draadmodel', 'Conceptueel', 'Realistisch', 'Röntgen', 'Zoom Bereik', 'Naar 3D-weergave', 'Soortgelijke selecteren',
  ],
  tr: [
    'Çizim ve Açıklama', '3B Temelleri', '3B Modelleme',
    'Giriş', 'Ekle', 'Açıklama', 'Parametrik', '3B Araçlar', 'Görünüm', 'Yönet', 'Çıktı', 'Katılar', 'Ağ / Boole', '3B Görünüm',
    'Çizim', 'Değiştir', 'Açıklama', 'Katmanlar', 'Blok', 'Özellikler', 'Yardımcılar', '3B İlkel', 'Katı Modelleme', 'Boole İşlemleri', '3B Dönüşüm', 'Görsel Stiller', 'Görünümler', 'Kısıtlamalar', 'Değişkenler', 'Metin', 'Ölçüler', 'Tablolar', 'Oklar', 'Çizdir', 'Dışa Aktar', 'Sistem',
    'Çizgi', 'Çoklu Çizgi', 'Daire', 'Yay', 'Dikdörtgen', 'Çokgen', 'Elips', 'Tarama', 'Spline', 'Diğer ▾',
    'Taşı', 'Döndür', 'elih Budama', 'Kopyala', 'Aynala', 'Uzat', 'Ölçek', 'Yuvarlat', 'Pah Kır', 'Ötele', 'Dizi ▾', 'Patlat', 'Sil', 'Birleştir', 'Sündür ▾',
    'Ölçü', 'Hizalı', 'Tablo', 'Katman Öz.', 'Katman Özellikleri', 'İzole Et', 'Göster', 'Tümünü Göster', 'Bloklar', 'Oluştur', 'Grup', 'Grubu Çöz', 'Eşleştir', 'Ölç', 'Alan', 'Hesap', 'Pano ▾',
    'Kutu', 'Silindir', 'Küre', 'Koni', 'Piramit', 'Simit', 'Ekstrüzyon', 'Döndürme', 'Birleşim', 'Fark', 'Kesişim', '3B Taşı', '3B Döndür', '3B Yörünge',
    'ÖZELLİKLER', 'Seçim yok', 'GEÇERLİ ÇİZİM', 'Toplam nesne', 'Aktif katmanlar', 'Geçerli katman', 'Birimler', 'Yakınlaştır', 'Stil', 'BLOK PALETİ', 'HIZLI HESAP MAKİNESİ',
    'Model', 'MODEL', 'KAĞIT', 'Komut:', 'Bir komut yazın (LINE, CIRCLE, TRIM, FILLET, EXTRUDE...)', 'Anahtar kelime veya komut yazın...',
    'Yeni Çizim', 'Yeni çizim (2D)', 'Yeni 3B çizim', 'Dosya aç (.dxf / .json)...', 'DXF olarak kaydet...', 'Projeyi kaydet (.ofcad.json)...', 'SVG dışa aktar...', '3B STL dışa aktar...', 'OpenFCAD Betik Konsolu', 'Çizdir / Yazdır / PDF...', 'Çizim birimleri...', 'Seçenekler...', 'Örnek Çizimler', 'Mevcut dosyayı aç (.dxf / .ofcad.json)...',
    'ÇİZİM BİRİMLERİ', 'SEÇENEKLER — OPENFCAD', 'OPENFCAD BETİK KONSOLU (.SCR)', 'KULLANICI PARAMETRELERİ', 'ÇİZDİR - MODEL', 'Arayüz Dili (Herhangi bir dil)', 'Dil Paketi Dışa Aktar (.lang.json)', 'Dil Paketi İçe Aktar (.lang.json)', 'Renk Teması', 'Koyu (OpenFCAD Dark)', 'Açık (LightTheme)', '2B Model Alanı Arka Plan Rengi', 'Klasik Siyah', 'Beyaz', 'Varsayılan Yuvarlatma Yarıçapı', 'Varsayılan Öteleme Mesafesi', 'Varsayılan Oturumu Sıfırla', '+ Yeni Katman', 'Katmanları filtrele...', 'Durum', 'Ad', 'Dondur', 'Kilitle', 'Renk', 'Çizgi Tipi', 'Çizgi Kalınlığı', 'İptal', 'Kapat', 'Sil',
    'ÜST', 'ALT', 'ÖN', 'ARKA', 'SOL', 'SAĞ', '2B Tel Kafes', 'Kavramsal', 'Gerçekçi', 'X-Işını', 'Sınırlara Yakınlaştır', '3B Görünüme Geç', 'Benzerleri Seç',
  ],
};

// Fix minor typo in tr row ('elih Budama' -> 'Buda')
LANG_ROWS.tr[47] = 'Buda';

export const UI_DICTIONARY: Record<Exclude<BuiltInLangCode, 'it'>, Record<string, string>> = (() => {
  const out = {} as Record<Exclude<BuiltInLangCode, 'it'>, Record<string, string>>;
  for (const [lang, arr] of Object.entries(LANG_ROWS) as [Exclude<BuiltInLangCode, 'it'>, string[]][]) {
    const map: Record<string, string> = {};
    PHRASE_KEYS.forEach((itKey, idx) => {
      if (arr[idx]) {
        map[itKey] = arr[idx];
      }
    });
    out[lang] = map;
  }
  return out;
})();

export function getLanguageOption(code: string): LanguageOption {
  const norm = (code || 'it').trim();
  const exact = WORLD_LANGUAGES.find((l) => l.code.toLowerCase() === norm.toLowerCase());
  if (exact) return exact;
  const base = norm.split(/[-_]/)[0].toLowerCase();
  return (
    WORLD_LANGUAGES.find((l) => l.code.toLowerCase() === base) || {
      code: norm,
      name: norm.toUpperCase(),
      nativeName: norm.toUpperCase(),
      flag: '🌐',
      dir: 'ltr',
    }
  );
}

export function resolveBaseDict(lang: string): Record<string, string> | null {
  const norm = (lang || 'it').trim().toLowerCase();
  if (norm === 'it' || norm.startsWith('it-')) return null;
  const base = norm.split(/[-_]/)[0] as Exclude<BuiltInLangCode, 'it'>;
  if (base in UI_DICTIONARY) {
    return UI_DICTIONARY[base];
  }
  // For any of the 100+ additional ISO world languages without a built-in table yet,
  // provide the international English CAD dictionary as base so every custom language pack
  // starts from a clean international CAD baseline.
  return UI_DICTIONARY.en;
}

export function translateString(
  raw: string,
  lang: string,
  customPacks?: Record<string, Record<string, string>>
): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  const customDict = customPacks?.[lang];
  if (customDict && customDict[trimmed]) {
    return raw.replace(trimmed, customDict[trimmed]);
  }

  const baseDict = resolveBaseDict(lang);
  if (!baseDict) return raw;

  if (baseDict[trimmed]) {
    return raw.replace(trimmed, baseDict[trimmed]);
  }

  // Automatic suffix preservation for split-dropdown carets ('Cerchio ▾' -> 'Circle ▾'), ellipsis ('...'), and colons (':')
  if (trimmed.endsWith('▾')) {
    const stem = trimmed.replace(/\s*▾$/, '');
    const tr = customDict?.[stem] || baseDict[stem];
    if (tr) return raw.replace(trimmed, `${tr.replace(/\s*▾$/, '')} ▾`);
  }
  if (trimmed.endsWith('...')) {
    const stem = trimmed.slice(0, -3).trim();
    const tr = customDict?.[stem] || baseDict[stem];
    if (tr) return raw.replace(trimmed, `${tr}...`);
  }
  if (trimmed.endsWith(':')) {
    const stem = trimmed.slice(0, -1).trim();
    const tr = customDict?.[stem] || baseDict[stem];
    if (tr) return raw.replace(trimmed, `${tr}:`);
  }

  // Handle common composite patterns (e.g., "Ripeti LINEA", "Comando: LINEA", "GESTORE PROPRIETÀ LAYER — ...")
  if (trimmed.startsWith('Comando: ') && baseDict['Comando:']) {
    return raw.replace('Comando:', baseDict['Comando:']);
  }
  if (trimmed.startsWith('GESTORE PROPRIETÀ LAYER') && baseDict['Proprietà layer']) {
    return raw
      .replace('GESTORE PROPRIETÀ LAYER', baseDict['Proprietà layer'].toUpperCase())
      .replace('Corrente:', `${baseDict['Layer corrente'] || 'Current'}:`);
  }
  if (trimmed.startsWith('Annulla (Ctrl+Z)') && baseDict['Annulla']) {
    return raw.replace('Annulla', baseDict['Annulla']);
  }
  if (trimmed.startsWith('Ripeti (Ctrl+Y)') && baseDict['Copia']) {
    return raw;
  }

  return raw;
}

export function exportLanguagePackTemplate(
  langCode: string,
  customPacks?: Record<string, Record<string, string>>
): string {
  const baseDict = resolveBaseDict(langCode) || {};
  const custom = customPacks?.[langCode] || {};
  const translations: Record<string, string> = {};
  for (const key of PHRASE_KEYS) {
    translations[key] = custom[key] || baseDict[key] || key;
  }
  const meta = getLanguageOption(langCode);
  return JSON.stringify(
    {
      format: 'openfcad-language-pack-v1',
      languageCode: meta.code,
      languageName: meta.name,
      nativeName: meta.nativeName,
      direction: meta.dir || 'ltr',
      translations,
    },
    null,
    2
  );
}
