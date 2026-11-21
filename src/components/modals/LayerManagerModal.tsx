import React, { useEffect, useState } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { LINE_TYPES, LINE_WEIGHTS, Layer } from '../../types/cad';

const LayerNameInput: React.FC<{
  layerName: string;
  disabled: boolean;
  onCommit: (nextName: string) => void;
}> = ({ layerName, disabled, onCommit }) => {
  const [draft, setDraft] = useState(layerName);

  useEffect(() => {
    setDraft(layerName);
  }, [layerName]);

  const commit = () => {
    const clean = draft.trim();
    if (clean && clean !== layerName) {
      setDraft(clean);
      onCommit(clean);
    } else {
      setDraft(layerName);
    }
  };

  return (
    <input
      type="text"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          commit();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
          if (draft.trim() !== layerName) {
            e.stopPropagation();
            setDraft(layerName);
            (e.target as HTMLInputElement).blur();
          }
        }
      }}
      className="layer-name-input"
    />
  );
};

export const LayerManagerModal: React.FC = () => {
  const open = useCadStore((s) => s.modals.layerManager);
  const setModal = useCadStore((s) => s.setModal);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const addLayer = useCadStore((s) => s.addLayer);
  const updateLayer = useCadStore((s) => s.updateLayer);
  const deleteLayer = useCadStore((s) => s.deleteLayer);
  const setActiveLayer = useCadStore((s) => s.setActiveLayer);

  const [search, setSearch] = useState('');

  if (!open || !doc) return null;

  const filtered = doc.layers.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="cad-modal-backdrop" onClick={() => setModal('layerManager', false)}>
      <div className="cad-modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>GESTORE PROPRIETÀ LAYER — {doc.name} (Corrente: {doc.activeLayer})</span>
          <button onClick={() => setModal('layerManager', false)}>✕</button>
        </div>

        <div className="modal-toolbar">
          <button className="ofcad-btn primary" onClick={() => addLayer()}>+ Nuovo Layer</button>
          <input
            type="text"
            className="modal-search"
            placeholder="Filtra layer per nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="modal-count">{filtered.length} / {doc.layers.length} layer</span>
        </div>

        <div className="layer-table-wrap">
          <table className="layer-table">
            <thead>
              <tr>
                <th>Stato</th>
                <th>Nome</th>
                <th>On</th>
                <th>Congela</th>
                <th>Blocca</th>
                <th>Colore</th>
                <th>Tipo di linea</th>
                <th>Spessore</th>
                <th>Trasp. %</th>
                <th>Stampa</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const isCurrent = l.name === doc.activeLayer;
                return (
                  <tr key={l.id} className={isCurrent ? 'current-row' : ''}>
                    <td>
                      <button
                        className={`cur-check ${isCurrent ? 'active' : ''}`}
                        onClick={() => setActiveLayer(l.name)}
                        title="Imposta come layer corrente"
                      >
                        {isCurrent ? '✔' : '○'}
                      </button>
                    </td>
                    <td>
                      <LayerNameInput
                        layerName={l.name}
                        disabled={l.name === '0'}
                        onCommit={(nextName) => updateLayer(l.id, { name: nextName })}
                      />
                    </td>
                    <td>
                      <button
                        className={`tbl-badge-btn ${l.on ? 'on' : 'off'}`}
                        onClick={() => updateLayer(l.id, { on: !l.on })}
                        title={l.on ? 'Layer acceso (clicca per spegnere)' : 'Layer spento'}
                      >
                        {l.on ? '● ON' : '○ OFF'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`tbl-badge-btn ${l.frozen ? 'frozen' : 'thaw'}`}
                        onClick={() => updateLayer(l.id, { frozen: !l.frozen })}
                        title={l.frozen ? 'Congelato' : 'Scongelato'}
                      >
                        {l.frozen ? '❄' : '☀'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`tbl-badge-btn ${l.locked ? 'locked' : 'unlocked'}`}
                        onClick={() => updateLayer(l.id, { locked: !l.locked })}
                        title={l.locked ? 'Bloccato' : 'Sbloccato'}
                      >
                        {l.locked ? '🔒' : '🔓'}
                      </button>
                    </td>
                    <td>
                      <label className="layer-color-pick">
                        <input
                          type="color"
                          value={l.color}
                          onChange={(e) => updateLayer(l.id, { color: e.target.value })}
                        />
                        <span>{l.color}</span>
                      </label>
                    </td>
                    <td>
                      <select
                        className="layer-cell-select"
                        value={l.lineType}
                        onChange={(e) => updateLayer(l.id, { lineType: e.target.value as Layer['lineType'] })}
                      >
                        {LINE_TYPES.filter((lt) => lt.id !== 'ByLayer').map((lt) => (
                          <option key={lt.id} value={lt.id}>{lt.id}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="layer-cell-select"
                        value={l.lineWeight}
                        onChange={(e) => updateLayer(l.id, { lineWeight: parseFloat(e.target.value) })}
                      >
                        {LINE_WEIGHTS.filter((w) => w >= 0).map((w) => (
                          <option key={w} value={w}>{w.toFixed(2)} mm</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="layer-num-input"
                        min={0}
                        max={90}
                        value={l.transparency}
                        onChange={(e) => updateLayer(l.id, { transparency: Math.min(90, Math.max(0, Number(e.target.value) || 0)) })}
                      />
                    </td>
                    <td>
                      <button
                        className={`tbl-badge-btn ${l.plot ? 'plot-on' : 'off'}`}
                        onClick={() => updateLayer(l.id, { plot: !l.plot })}
                        title={l.plot ? 'Stampabile' : 'Non stampare'}
                      >
                        {l.plot ? 'SÌ' : 'NO'}
                      </button>
                    </td>
                    <td>
                      <button
                        className="ofcad-btn-danger-sm"
                        disabled={l.name === '0' || isCurrent}
                        onClick={() => deleteLayer(l.id)}
                        title="Elimina layer"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="ofcad-btn primary" onClick={() => setModal('layerManager', false)}>Chiudi</button>
        </div>
      </div>
    </div>
  );
};
