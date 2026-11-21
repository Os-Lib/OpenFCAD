import React, { useEffect, useRef, useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { resolveCommand, searchCommands } from '../engine/commands';

export const CommandLine: React.FC = () => {
  const command = useCadStore((s) => s.command);
  const commandLog = useCadStore((s) => s.commandLog);
  const submitCommandInput = useCadStore((s) => s.submitCommandInput);
  const submitCommandOption = useCadStore((s) => s.submitCommandOption);
  const cancelCommand = useCadStore((s) => s.cancelCommand);
  const setModal = useCadStore((s) => s.setModal);

  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [selAutoIdx, setSelAutoIdx] = useState(0);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const showAuto = !command && input.trim().length > 0;
  const suggestions = showAuto ? searchCommands(input, 8) : [];

  useEffect(() => {
    setSelAutoIdx(0);
  }, [input]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [commandLog, expanded]);

  // Allow global typing when user isn't editing a control or inside a modal dialog
  useEffect(() => {
    const isTextControl = (el: EventTarget | null): boolean =>
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      (el instanceof HTMLElement && el.isContentEditable);

    const hasModalOpen = () => {
      const m = useCadStore.getState().modals;
      return Boolean(
        m.layerManager ||
          m.plot ||
          m.units ||
          m.options ||
          m.script ||
          m.textWindowF2 ||
          m.createBlock ||
          m.arrayDialog ||
          m.parameters ||
          m.mtextEditor ||
          m.tableEditor ||
          m.layoutSetup
      );
    };

    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasModalOpen()) {
          e.preventDefault();
          useCadStore.getState().closeAllModals();
        } else {
          cancelCommand();
          setInput('');
        }
        return;
      }

      // Never hijack keyboard input, Space repeat, or Enter while any modal is open
      if (hasModalOpen()) return;

      const active = document.activeElement;
      const targetEl = e.target as HTMLElement | null;
      const inModalDom = Boolean(targetEl?.closest('.cad-modal-backdrop'));
      if (inModalDom) return;

      const isEditing = isTextControl(active) || isTextControl(e.target);

      if (e.key === 'F2') {
        e.preventDefault();
        setModal('textWindowF2', !useCadStore.getState().modals.textWindowF2);
        return;
      }
      if (isEditing) return;

      const isActionControl =
        active instanceof HTMLButtonElement ||
        active instanceof HTMLAnchorElement ||
        targetEl instanceof HTMLButtonElement ||
        targetEl?.getAttribute('role') === 'button';

      // Single printable char focuses command line automatically
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === ' ') {
          if (isActionControl) return;
          e.preventDefault();
          useCadStore.getState().finishMultiStepCommand();
          return;
        }
        inputRef.current?.focus();
      } else if (e.key === 'Enter') {
        if (isActionControl) return;
        e.preventDefault();
        useCadStore.getState().finishMultiStepCommand();
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [cancelCommand, setModal]);

  const handleSubmit = (val?: string) => {
    const text = (val ?? input).trim();
    if (text) {
      setCmdHistory((prev) => [text, ...prev.filter((p) => p !== text).slice(0, 30)]);
      setHistIdx(-1);
    }
    setInput('');
    submitCommandInput(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setInput('');
      cancelCommand();
      return;
    }

    const isSpaceSubmit =
      e.key === ' ' &&
      (!command || (!['TEXT', 'MTEXT', 'LEADER'].includes(command.name) && !/[+\-*/,(]$/.test(input.trim())));

    if (e.key === 'Enter' || isSpaceSubmit) {
      e.preventDefault();
      if (showAuto && suggestions.length > 0 && !input.includes(',') && !input.includes('@')) {
        const exactMatch = resolveCommand(input.trim());
        if (selAutoIdx === 0 && exactMatch) {
          handleSubmit(exactMatch.italian);
        } else {
          handleSubmit(suggestions[selAutoIdx]?.italian || input);
        }
      } else {
        handleSubmit();
      }
      return;
    }

    if (e.key === 'Tab' && showAuto && suggestions.length > 0) {
      e.preventDefault();
      setInput(suggestions[selAutoIdx].italian);
      return;
    }

    if (e.key === 'ArrowDown') {
      if (showAuto && suggestions.length > 0) {
        e.preventDefault();
        setSelAutoIdx((i) => (i + 1) % suggestions.length);
      } else if (histIdx > 0) {
        e.preventDefault();
        const next = histIdx - 1;
        setHistIdx(next);
        setInput(cmdHistory[next] || '');
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (showAuto && suggestions.length > 0) {
        e.preventDefault();
        setSelAutoIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
      } else if (cmdHistory.length > 0) {
        e.preventDefault();
        const next = Math.min(cmdHistory.length - 1, histIdx + 1);
        setHistIdx(next);
        setInput(cmdHistory[next] || '');
      }
    }
  };

  const recentLogs = commandLog.slice(expanded ? -14 : -3);

  return (
    <div className={`ofcad-cmdline-wrap ${expanded ? 'expanded' : ''}`}>
      {/* Autocomplete Popup */}
      {showAuto && suggestions.length > 0 && (
        <div className="cmd-autocomplete">
          {suggestions.map((c, idx) => (
            <button
              key={c.id}
              className={`cmd-auto-item ${idx === selAutoIdx ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSubmit(c.italian);
              }}
            >
              <span className="cmd-auto-name">{c.italian}</span>
              <span className="cmd-auto-alias">({c.aliases[0] || c.english})</span>
              <span className="cmd-auto-desc">{c.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Command History Mini Feed */}
      <div className="cmd-history-feed" ref={logRef}>
        {recentLogs.map((entry) => (
          <div key={entry.id} className={`cmd-log-line kind-${entry.kind}`}>
            <span className="cmd-ts">[{entry.timestamp}]</span> {entry.text}
          </div>
        ))}
      </div>

      {/* Main Prompt Input Strip */}
      <div className="cmd-prompt-strip">
        <button
          className="cmd-grip-btn"
          title="Espandi/Riduci cronologia comandi (F2 per finestra completa)"
          onClick={() => setExpanded(!expanded)}
        >
          ⋮⋮
        </button>

        {command ? (
          <div className="cmd-active-badge">
            <button className="cmd-cancel-x" onClick={cancelCommand} title="Annulla comando (ESC)">
              ✕
            </button>
            <span className="cmd-active-name">{command.displayName}</span>
            <span className="cmd-active-prompt">{command.prompt}</span>
            {command.options && command.options.length > 0 && (
              <div className="cmd-options-pills">
                {command.options.map((opt) => (
                  <button
                    key={opt.value}
                    className="cmd-opt-pill"
                    onClick={() => submitCommandOption(opt.value)}
                  >
                    {opt.label.toUpperCase() === opt.key.toUpperCase() ? (
                      <span className="opt-key">{opt.label}</span>
                    ) : (
                      <>
                        <span className="opt-key">{opt.key}</span> {opt.label}
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="cmd-idle-label">Comando:</span>
        )}

        <input
          ref={inputRef}
          className="cmd-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            command
              ? 'Digita coordinate (es. 100,50 o @50<45) o valore e premi Invio...'
              : 'Digita un comando (LINEA, CERCHIO, TAGLIA, RACCORDO, ESTRUDI, 3DORBITA...)'
          }
          spellCheck={false}
          autoComplete="off"
        />

        <button
          className="cmd-f2-btn"
          onClick={() => setModal('textWindowF2', true)}
          title="Apri Finestra di Testo OpenFCAD (F2)"
        >
          F2
        </button>
      </div>
    </div>
  );
};
