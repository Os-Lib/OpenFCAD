import React, { useMemo, useState } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { exportToSVG } from '../../engine/dxf';
import { saveCadFileDialog } from '../../engine/fileIO';

export const PlotModal: React.FC = () => {
  const open = useCadStore((s) => s.modals.plot);
  const setModal = useCadStore((s) => s.setModal);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);

  const [paper, setPaper] = useState('ISO A3 (420.00 x 297.00 mm)');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [ctb, setCtb] = useState<'openfcad.ctb' | 'monochrome.ctb' | 'grayscale.ctb'>('monochrome.ctb');
  const [scale, setScale] = useState('Adatta al foglio');

  const svgOptions = useMemo(() => {
    const paperMap: Record<string, [number, number]> = {
      'ISO A4 (297.00 x 210.00 mm)': [297, 210],
      'ISO A3 (420.00 x 297.00 mm)': [420, 297],
      'ISO A2 (594.00 x 420.00 mm)': [594, 420],
      'ISO A1 (841.00 x 594.00 mm)': [841, 594],
      'ISO A0 (1189.00 x 841.00 mm)': [1189, 841],
    };
    const [rawW, rawH] = paperMap[paper] || [420, 297];
    const paperWidthMm = orientation === 'landscape' ? rawW : rawH;
    const paperHeightMm = orientation === 'landscape' ? rawH : rawW;
    const scaleMap: Record<string, number> = { '1:1': 1, '1:10': 0.1, '1:20': 0.05, '1:50': 0.02, '1:100': 0.01 };
    const fixedScale = scaleMap[scale];
    return {
      monochrome: ctb === 'monochrome.ctb',
      grayscale: ctb === 'grayscale.ctb',
      background: '#FFFFFF',
      paperWidthMm,
      paperHeightMm,
      fixedScale,
      respectPlotFlag: true,
    };
  }, [paper, orientation, ctb, scale]);

  const svgPreview = useMemo(() => {
    if (!open || !doc) return '';
    return exportToSVG(doc, svgOptions);
  }, [open, doc, svgOptions]);

  if (!open || !doc) return null;

  const handlePrintPdf = () => {
    const win = window.open('', '_blank', 'width=1000,height=720');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Stampa - ${doc.name}</title><style>
      @page { size: ${orientation}; margin: 10mm; }
      body { margin: 0; display: flex; flex-direction: column; align-items: center; font-family: Segoe UI, Arial; }
      svg { max-width: 100%; max-height: 90vh; border: 1px solid #111; }
      .meta { margin-top: 8px; font-size: 11px; color: #333; width: 100%; display: flex; justify-content: space-between; }
    </style></head><body>${svgPreview}<div class="meta"><span>${doc.name}</span><span>${paper} • ${scale} • ${ctb}</span></div><script>setTimeout(()=>window.print(), 250);</script></body></html>`);
    win.document.close();
  };

  const handleExportSvg = async () => {
    await saveCadFileDialog(doc, 'svg', svgOptions);
  };

  const handleExportPng = () => {
    const img = new Image();
    const blob = new Blob([svgPreview], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 2400;
      c.height = Math.round((2400 * img.height) / Math.max(1, img.width));
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = doc.name.replace(/\.dwg$/i, '') + '.png';
      a.click();
    };
    img.src = url;
  };

  return (
    <div className="cad-modal-backdrop" onClick={() => setModal('plot', false)}>
      <div className="cad-modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>STAMPA - MODELLO ({doc.name})</span>
          <button onClick={() => setModal('plot', false)}>✕</button>
        </div>

        <div className="plot-grid">
          <div className="plot-controls">
            <div className="form-group">
              <label>Stampante / Plotter</label>
              <select defaultValue="OpenFCAD PDF (Alta Qualità).pc3">
                <option>OpenFCAD PDF (Alta Qualità).pc3</option>
                <option>OpenFCAD Vector PDF.pc3</option>
                <option>OpenFCAD SVG / PNG.pc3</option>
              </select>
            </div>

            <div className="form-group">
              <label>Formato foglio</label>
              <select value={paper} onChange={(e) => setPaper(e.target.value)}>
                <option>ISO A4 (297.00 x 210.00 mm)</option>
                <option>ISO A3 (420.00 x 297.00 mm)</option>
                <option>ISO A2 (594.00 x 420.00 mm)</option>
                <option>ISO A1 (841.00 x 594.00 mm)</option>
                <option>ISO A0 (1189.00 x 841.00 mm)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tabella stili di stampa (CTB)</label>
              <select value={ctb} onChange={(e) => setCtb(e.target.value as any)}>
                <option value="monochrome.ctb">monochrome.ctb (Monocromatico tecnico)</option>
                <option value="grayscale.ctb">grayscale.ctb (Scala di grigi)</option>
                <option value="openfcad.ctb">openfcad.ctb (Colori layer)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Scala di stampa</label>
              <select value={scale} onChange={(e) => setScale(e.target.value)}>
                <option>Adatta al foglio</option>
                <option>1:1</option>
                <option>1:10</option>
                <option>1:20</option>
                <option>1:50</option>
                <option>1:100</option>
              </select>
            </div>

            <div className="form-group">
              <label>Orientamento</label>
              <div className="radio-row">
                <label>
                  <input type="radio" checked={orientation === 'landscape'} onChange={() => setOrientation('landscape')} /> Orizzontale
                </label>
                <label>
                  <input type="radio" checked={orientation === 'portrait'} onChange={() => setOrientation('portrait')} /> Verticale
                </label>
              </div>
            </div>
          </div>

          <div className="plot-preview-box">
            <div className="plot-preview-label">Anteprima di stampa ({ctb})</div>
            <div
              className="plot-svg-frame"
              dangerouslySetInnerHTML={{ __html: svgPreview }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="ofcad-btn" onClick={handleExportSvg}>Esporta SVG</button>
          <button className="ofcad-btn" onClick={handleExportPng}>Esporta PNG HD</button>
          <button className="ofcad-btn primary" onClick={handlePrintPdf}>Stampa / Salva PDF</button>
          <button className="ofcad-btn" onClick={() => setModal('plot', false)}>Annulla</button>
        </div>
      </div>
    </div>
  );
};
