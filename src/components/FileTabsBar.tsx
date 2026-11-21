import React from 'react';
import { useCadStore } from '../store/useCadStore';

export const FileTabsBar: React.FC = () => {
  const documents = useCadStore((s) => s.documents);
  const activeDocId = useCadStore((s) => s.activeDocId);
  const setActiveDoc = useCadStore((s) => s.setActiveDoc);
  const newDocument = useCadStore((s) => s.newDocument);
  const closeDocument = useCadStore((s) => s.closeDocument);

  return (
    <div className="file-tabs-bar">
      <button
        className={`file-tab start-tab-btn ${activeDocId === 'start' ? 'active' : ''}`}
        onClick={() => setActiveDoc('start')}
      >
        ⌂ Inizio
      </button>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`file-tab ${activeDocId === doc.id ? 'active' : ''}`}
          onClick={() => setActiveDoc(doc.id)}
        >
          <span className="file-tab-name">
            {doc.name}
            {doc.modified ? ' *' : ''}
          </span>
          <button
            className="file-tab-close"
            title="Chiudi disegno"
            onClick={(e) => {
              e.stopPropagation();
              closeDocument(doc.id);
            }}
          >
            ×
          </button>
        </div>
      ))}

      <button className="file-tab-add" onClick={() => newDocument()} title="Nuovo disegno">
        +
      </button>
    </div>
  );
};
