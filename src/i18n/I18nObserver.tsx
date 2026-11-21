import React, { useEffect, useRef } from 'react';
import { useCadStore } from '../store/useCadStore';
import { getLanguageOption, translateString } from './translations';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'TEXTAREA']);
const SKIP_CLASSES = ['rb-layer-name', 'layer-pick-name', 'table-cell-input'];

export const I18nObserver: React.FC = () => {
  const language = useCadStore((s) => s.language);
  const customLanguagePacks = useCadStore((s) => s.customLanguagePacks);

  const origTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const lastAppliedMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const applyingRef = useRef(false);

  useEffect(() => {
    const meta = getLanguageOption(language);
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir || 'ltr';
    document.title =
      meta.code === 'it'
        ? 'OpenFCAD — CAD 2D/3D Italiano'
        : `OpenFCAD — CAD 2D/3D (${meta.nativeName})`;

    const origTextMap = origTextMapRef.current;
    const lastAppliedMap = lastAppliedMapRef.current;

    const shouldSkipElement = (el: HTMLElement | null): boolean => {
      if (!el) return true;
      if (SKIP_TAGS.has(el.tagName)) return true;
      for (const cls of SKIP_CLASSES) {
        if (el.classList.contains(cls)) return true;
      }
      return false;
    };

    const localizeTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (shouldSkipElement(parent)) return;
      const curVal = node.nodeValue ?? '';
      if (!curVal.trim()) return;

      const lastApplied = lastAppliedMap.get(node);
      if (!origTextMap.has(node) || (lastApplied !== undefined && curVal !== lastApplied)) {
        // React updated this text node with a new source string
        origTextMap.set(node, curVal);
      }

      const sourceIt = origTextMap.get(node) ?? curVal;
      const nextVal = translateString(sourceIt, language, customLanguagePacks);
      lastAppliedMap.set(node, nextVal);
      if (node.nodeValue !== nextVal) {
        node.nodeValue = nextVal;
      }
    };

    const localizeElementAttrs = (el: HTMLElement) => {
      if (SKIP_TAGS.has(el.tagName)) return;

      if (el.hasAttribute('title')) {
        const curTitle = el.getAttribute('title') || '';
        const origTitle = el.getAttribute('data-i18n-orig-title');
        const lastTitle = el.getAttribute('data-i18n-last-title');
        let sourceTitle = origTitle;
        if (!sourceTitle || (lastTitle !== null && curTitle !== lastTitle)) {
          sourceTitle = curTitle;
          el.setAttribute('data-i18n-orig-title', sourceTitle);
        }
        const nextTitle = translateString(sourceTitle, language, customLanguagePacks);
        el.setAttribute('data-i18n-last-title', nextTitle);
        if (curTitle !== nextTitle) {
          el.setAttribute('title', nextTitle);
        }
      }

      if (el.hasAttribute('placeholder')) {
        const curPh = el.getAttribute('placeholder') || '';
        const origPh = el.getAttribute('data-i18n-orig-ph');
        const lastPh = el.getAttribute('data-i18n-last-ph');
        let sourcePh = origPh;
        if (!sourcePh || (lastPh !== null && curPh !== lastPh)) {
          sourcePh = curPh;
          el.setAttribute('data-i18n-orig-ph', sourcePh);
        }
        const nextPh = translateString(sourcePh, language, customLanguagePacks);
        el.setAttribute('data-i18n-last-ph', nextPh);
        if (curPh !== nextPh) {
          el.setAttribute('placeholder', nextPh);
        }
      }

      if (el.tagName === 'OPTGROUP' && el.hasAttribute('label')) {
        const curLbl = el.getAttribute('label') || '';
        const origLbl = el.getAttribute('data-i18n-orig-lbl') || curLbl;
        if (!el.hasAttribute('data-i18n-orig-lbl')) {
          el.setAttribute('data-i18n-orig-lbl', origLbl);
        }
        const nextLbl = translateString(origLbl, language, customLanguagePacks);
        if (curLbl !== nextLbl) {
          el.setAttribute('label', nextLbl);
        }
      }
    };

    const localizeTree = (root: Node) => {
      if (applyingRef.current) return;
      applyingRef.current = true;
      try {
        if (root.nodeType === Node.TEXT_NODE) {
          localizeTextNode(root as Text);
          return;
        }
        if (root.nodeType === Node.ELEMENT_NODE) {
          localizeElementAttrs(root as HTMLElement);
        }
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let n: Node | null = walker.currentNode;
        while (n) {
          if (n.nodeType === Node.TEXT_NODE) {
            localizeTextNode(n as Text);
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            localizeElementAttrs(n as HTMLElement);
          }
          n = walker.nextNode();
        }
      } finally {
        applyingRef.current = false;
      }
    };

    const rootEl = document.getElementById('root') || document.body;
    localizeTree(rootEl);

    const observer = new MutationObserver((mutations) => {
      if (applyingRef.current) return;
      for (const m of mutations) {
        if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          applyingRef.current = true;
          try {
            localizeTextNode(m.target as Text);
          } finally {
            applyingRef.current = false;
          }
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((added) => localizeTree(added));
        } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
          applyingRef.current = true;
          try {
            localizeElementAttrs(m.target as HTMLElement);
          } finally {
            applyingRef.current = false;
          }
        }
      }
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'placeholder'],
    });

    return () => observer.disconnect();
  }, [language, customLanguagePacks]);

  return null;
};
