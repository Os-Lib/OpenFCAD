import { CadDocument } from '../types/cad';
import { exportToDXF, exportToSTL, exportToSVG, SvgExportOptions } from './dxf';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      onMaximizedChange: (cb: (val: boolean) => void) => void;
      openFile: (filters?: any[]) => Promise<{ filePath: string; name: string; content: string } | null>;
      saveFile: (opts: { defaultName: string; content: string; filters?: any[] }) => Promise<{ filePath: string; name: string } | null>;
      getInitialLaunchInfo?: () => Promise<{
        installerLang?: string | null;
        installerLcid?: number | null;
        osLocale?: string | null;
        startupFile?: { filePath: string; name: string; content: string } | null;
      }>;
      onOpenExternalFile?: (cb: (file: { filePath: string; name: string; content: string }) => void) => void;
    };
  }
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function openCadFileDialog(): Promise<{ name: string; content: string; filePath?: string } | null> {
  if (window.electronAPI?.openFile) {
    return window.electronAPI.openFile();
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dxf,.json,.ofcad.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, content: String(reader.result || '') });
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

export async function saveCadFileDialog(
  doc: CadDocument,
  format: 'dxf' | 'json' | 'svg' | 'stl' = 'dxf',
  svgOptions?: SvgExportOptions
): Promise<{ name: string; filePath?: string } | null> {
  const baseName = doc.name.replace(/\.(dwg|dxf|ofcad\.json|json|svg|stl)$/i, '');
  let content = '';
  let ext = format;
  let mime = 'text/plain;charset=utf-8';
  let filters: { name: string; extensions: string[] }[] = [];

  if (format === 'dxf') {
    content = exportToDXF(doc);
    ext = 'dxf';
    filters = [{ name: 'DXF Standard (*.dxf)', extensions: ['dxf'] }];
  } else if (format === 'json') {
    const serializable = { ...doc, undoStack: [], redoStack: [], selectedIds: [] };
    content = JSON.stringify(serializable, null, 2);
    ext = 'ofcad.json' as any;
    mime = 'application/json';
    filters = [{ name: 'Progetto OpenFCAD (*.ofcad.json)', extensions: ['json'] }];
  } else if (format === 'svg') {
    content = exportToSVG(doc, svgOptions);
    ext = 'svg';
    mime = 'image/svg+xml';
    filters = [{ name: 'Vettoriale SVG (*.svg)', extensions: ['svg'] }];
  } else if (format === 'stl') {
    content = exportToSTL(doc);
    ext = 'stl';
    filters = [{ name: 'Modello 3D STL (*.stl)', extensions: ['stl'] }];
  }

  const defaultName = `${baseName}.${ext}`;

  if (window.electronAPI?.saveFile) {
    return window.electronAPI.saveFile({ defaultName, content, filters });
  }
  downloadTextFile(defaultName, content, mime);
  return { name: defaultName };
}
