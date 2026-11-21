import React, { useEffect } from 'react';
import { useCadStore } from './store/useCadStore';
import { TitleBar } from './components/TitleBar';
import { Ribbon } from './components/Ribbon';
import { FileTabsBar } from './components/FileTabsBar';
import { StartTab } from './components/StartTab';
import { CadCanvas2D } from './components/CadCanvas2D';
import { CadViewport3D } from './components/CadViewport3D';
import { ViewportOverlays } from './components/ViewportOverlays';
import { CommandLine } from './components/CommandLine';
import { StatusBar } from './components/StatusBar';
import { PropertiesPalette } from './components/palettes/PropertiesPalette';
import { BlocksPalette } from './components/palettes/BlocksPalette';
import { QuickCalcPalette } from './components/palettes/QuickCalcPalette';
import { LayerManagerModal } from './components/modals/LayerManagerModal';
import { PlotModal } from './components/modals/PlotModal';
import { CadModals } from './components/modals/CadModals';
import { openCadFileDialog, saveCadFileDialog } from './engine/fileIO';
import { I18nObserver } from './i18n/I18nObserver';
import { LCID_TO_LANG } from './i18n/translations';

export const App: React.FC = () => {
  const activeDocId = useCadStore((s) => s.activeDocId);
  const doc = useCadStore((s) => s.documents.find((d) => d.id === s.activeDocId) || null);
  const cleanScreen = useCadStore((s) => s.cleanScreen);

  // Global OpenFCAD Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      const store = useCadStore.getState();

      // Function keys F3..F12
      if (e.key === 'F3') {
        e.preventDefault();
        store.updateSettings({ osnapOn: !store.settings.osnapOn });
        store.log(`OSNAP ${!store.settings.osnapOn ? 'ATTIVO' : 'DISATTIVO'}`, 'info');
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        store.updateSettings({ gridOn: !store.settings.gridOn });
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        store.updateSettings({ orthoOn: !store.settings.orthoOn });
        store.log(`ORTO ${!store.settings.orthoOn ? 'ATTIVO' : 'DISATTIVO'}`, 'info');
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        store.updateSettings({ snapOn: !store.settings.snapOn });
        return;
      }
      if (e.key === 'F10') {
        e.preventDefault();
        store.updateSettings({ polarOn: !store.settings.polarOn });
        return;
      }
      if (e.key === 'F11') {
        e.preventDefault();
        store.updateSettings({ otrackOn: !store.settings.otrackOn });
        return;
      }
      if (e.key === 'F12') {
        e.preventDefault();
        store.updateSettings({ dynInputOn: !store.settings.dynInputOn });
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === '0') {
          e.preventDefault();
          store.toggleCleanScreen();
          return;
        }
        if (k === '1') {
          e.preventDefault();
          store.togglePropertiesPalette();
          return;
        }
        if (k === '8') {
          e.preventDefault();
          store.toggleQuickCalc();
          return;
        }
        if (k === 'z' && !inInput) {
          e.preventDefault();
          store.undo();
          return;
        }
        if (k === 'y' && !inInput) {
          e.preventDefault();
          store.redo();
          return;
        }
        if (k === 'c' && !inInput) {
          e.preventDefault();
          store.copyToClipboard();
          return;
        }
        if (k === 'x' && !inInput) {
          e.preventDefault();
          store.cutToClipboard();
          return;
        }
        if (k === 'v' && !inInput) {
          e.preventDefault();
          store.pasteFromClipboard();
          return;
        }
        if (k === 'a' && !inInput) {
          e.preventDefault();
          store.startCommand('SELECTALL');
          return;
        }
        if (k === 'n') {
          e.preventDefault();
          store.newDocument('iso2d');
          return;
        }
        if (k === 'p') {
          e.preventDefault();
          store.setModal('plot', true);
          return;
        }
        if (k === 's') {
          e.preventDefault();
          const cur = store.getActiveDoc();
          if (cur) {
            const fmt = e.shiftKey ? 'json' : 'dxf';
            const res = await saveCadFileDialog(cur, fmt);
            if (res) store.markDocumentSaved(res.name, res.filePath);
          }
          return;
        }
        if (k === 'o') {
          e.preventDefault();
          const res = await openCadFileDialog();
          if (res) store.importDocumentContent(res.name, res.content, res.filePath);
          return;
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !inInput) {
        e.preventDefault();
        store.deleteSelected();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Desktop Electron installer language & file association startup integration
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.getInitialLaunchInfo?.().then((info) => {
      if (!info) return;
      const hasSavedState = Boolean(window.localStorage?.getItem('openfcad_state_v1'));
      if (!hasSavedState) {
        if (info.installerLang) {
          useCadStore.getState().setLanguage(info.installerLang);
        } else if (info.installerLcid && LCID_TO_LANG[info.installerLcid]) {
          useCadStore.getState().setLanguage(LCID_TO_LANG[info.installerLcid]);
        }
      }
      if (info.startupFile && info.startupFile.content) {
        useCadStore
          .getState()
          .importDocumentContent(info.startupFile.name, info.startupFile.content, info.startupFile.filePath);
      }
    });

    api.onOpenExternalFile?.((file) => {
      if (file && file.content) {
        useCadStore.getState().importDocumentContent(file.name, file.content, file.filePath);
      }
    });
  }, []);

  return (
    <div className="ofcad-app">
      <I18nObserver />
      <TitleBar />
      {!cleanScreen && <Ribbon />}
      <FileTabsBar />

      {activeDocId === 'start' || !doc ? (
        <StartTab />
      ) : (
        <div className="ofcad-workspace-row">
          <PropertiesPalette />
          <BlocksPalette />

          <div className="ofcad-viewport-stage">
            {doc.camera.is3D && doc.activeSpace === 'model' ? (
              <CadViewport3D />
            ) : (
              <CadCanvas2D />
            )}
            <ViewportOverlays />
            <CommandLine />
          </div>

          <QuickCalcPalette />
        </div>
      )}

      <StatusBar />

      {/* Modals */}
      <LayerManagerModal />
      <PlotModal />
      <CadModals />
    </div>
  );
};

export default App;
