import React, { useState } from 'react';
import { useCadStore } from '../../store/useCadStore';

export const QuickCalcPalette: React.FC = () => {
  const show = useCadStore((s) => s.showQuickCalc);
  const toggle = useCadStore((s) => s.toggleQuickCalc);
  const submitCommandInput = useCadStore((s) => s.submitCommandInput);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);

  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [convVal, setConvVal] = useState('100');
  const [fromUnit, setFromUnit] = useState<'mm' | 'cm' | 'm' | 'in' | 'ft'>('mm');
  const [toUnit, setToUnit] = useState<'mm' | 'cm' | 'm' | 'in' | 'ft'>('cm');

  if (!show) return null;

  const evaluate = () => {
    const clean = expr.trim().replace(/,/g, '.');
    if (!clean || !/^[0-9a-zA-Z_+\-*/().,\s]+$/.test(clean)) {
      setResult('Errore');
      return;
    }
    const mathScope: Record<string, unknown> = {
      sin: (deg: number) => Math.sin((deg * Math.PI) / 180),
      cos: (deg: number) => Math.cos((deg * Math.PI) / 180),
      tan: (deg: number) => Math.tan((deg * Math.PI) / 180),
      asin: (v: number) => (Math.asin(v) * 180) / Math.PI,
      acos: (v: number) => (Math.acos(v) * 180) / Math.PI,
      atan: (v: number) => (Math.atan(v) * 180) / Math.PI,
      sqrt: Math.sqrt,
      abs: Math.abs,
      pow: Math.pow,
      pi: Math.PI,
      PI: Math.PI,
    };
    if (doc?.parametricVars) {
      for (const [k, v] of Object.entries(doc.parametricVars)) {
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) && !(k in mathScope)) {
          mathScope[k] = v;
        }
      }
    }
    try {
      const argNames = Object.keys(mathScope);
      const argValues = Object.values(mathScope);
      // eslint-disable-next-line no-new-func
      const val = Function(...argNames, `"use strict"; return (${clean});`)(...argValues);
      if (typeof val === 'number' && Number.isFinite(val)) {
        const resStr = Number(val.toFixed(6)).toString();
        setResult(resStr);
        setHistory((h) => [`${expr} = ${resStr}`, ...h.slice(0, 8)]);
      } else {
        setResult('Errore');
      }
    } catch {
      setResult('Errore');
    }
  };

  const toMm: Record<string, number> = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 };
  const converted = ((parseFloat(convVal) || 0) * toMm[fromUnit]) / toMm[toUnit];

  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '(', '+', ')', 'sqrt(', 'pi', '='];

  return (
    <aside className="cad-palette calc-palette">
      <div className="palette-header">
        <span>CALCOLATRICE RAPIDA</span>
        <button className="palette-close" onClick={() => toggle(false)}>×</button>
      </div>

      <div className="calc-body">
        <div className="calc-display">
          <input
            type="text"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && evaluate()}
            placeholder="Es. 120*cos(30) + 45"
          />
          <div className="calc-result">= {result}</div>
        </div>

        <div className="calc-actions">
          <button onClick={() => { setExpr(''); setResult('0'); }}>C</button>
          <button onClick={() => setExpr((e) => e.slice(0, -1))}>⌫</button>
          <button
            className="accent"
            onClick={() => submitCommandInput(result)}
            title="Invia il risultato alla riga di comando attiva"
          >
            Applica a comando
          </button>
        </div>

        <div className="calc-keypad">
          {keys.map((k) => (
            <button
              key={k}
              className={k === '=' ? 'eq-btn' : ''}
              onClick={() => (k === '=' ? evaluate() : setExpr((e) => e + k))}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="calc-converter">
          <div className="prop-group-title">Conversione Unità</div>
          <div className="conv-row">
            <input type="number" value={convVal} onChange={(e) => setConvVal(e.target.value)} />
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value as any)}>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
            <span>→</span>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value as any)}>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
          </div>
          <div className="conv-out">{converted.toFixed(4)} {toUnit}</div>
        </div>

        {history.length > 0 && (
          <div className="calc-hist">
            {history.map((h, i) => (
              <div key={i}>{h}</div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
