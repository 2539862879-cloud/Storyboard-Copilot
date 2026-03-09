import { useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { invoke } from '@tauri-apps/api/core';
import { Canvas } from './features/canvas/Canvas';
import { TitleBar } from './components/TitleBar';
import { SettingsDialog } from './components/SettingsDialog';
import { UpdateAvailableDialog } from './components/UpdateAvailableDialog';
import { GlobalErrorDialog } from './components/GlobalErrorDialog';
import { ProjectManager } from './features/project/ProjectManager';
import { useThemeStore } from './stores/themeStore';
import { useProjectStore } from './stores/projectStore';
import { useSettingsStore } from './stores/settingsStore';
import { checkForUpdateOncePerDay } from './features/update/application/checkForUpdate';
import {
  subscribeOpenGlobalErrorDialog,
  type GlobalErrorDialogDetail,
} from './features/app/errorDialogEvents';
import {
  subscribeOpenSettingsDialog,
  type SettingsCategory,
} from './features/settings/settingsEvents';

function toRgbCssValue(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return '59 130 246';
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function App() {
  const { theme } = useThemeStore();
  const uiRadiusPreset = useSettingsStore((state) => state.uiRadiusPreset);
  const themeTonePreset = useSettingsStore((state) => state.themeTonePreset);
  const accentColor = useSettingsStore((state) => state.accentColor);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialCategory, setSettingsInitialCategory] = useState<SettingsCategory>('general');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [globalError, setGlobalError] = useState<GlobalErrorDialogDetail | null>(null);

  const isHydrated = useProjectStore((state) => state.isHydrated);
  const hydrate = useProjectStore((state) => state.hydrate);
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const closeProject = useProjectStore((state) => state.closeProject);
  const hasNotifiedFrontendReady = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.uiRadius = uiRadiusPreset;
  }, [uiRadiusPreset]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.themeTone = themeTonePreset;
  }, [themeTonePreset]);

  useEffect(() => {
    const root = document.documentElement;
    const isMac =
      typeof navigator !== 'undefined'
      && /(Mac|iPhone|iPad|iPod)/i.test(`${navigator.platform} ${navigator.userAgent}`);
    root.dataset.platform = isMac ? 'macos' : 'default';
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const normalized = accentColor.startsWith('#') ? accentColor : `#${accentColor}`;
    root.style.setProperty('--accent', normalized);
    root.style.setProperty('--accent-rgb', toRgbCssValue(normalized));
  }, [accentColor]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const unsubscribe = subscribeOpenGlobalErrorDialog((detail) => {
      setGlobalError(detail);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeOpenSettingsDialog(({ category }) => {
      setSettingsInitialCategory(category ?? 'general');
      setShowSettings(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) {
      bootScreen.classList.add('boot-screen--hide');
      window.setTimeout(() => {
        bootScreen.remove();
      }, 220);
    }

    if (hasNotifiedFrontendReady.current) {
      return;
    }

    hasNotifiedFrontendReady.current = true;

    const notifyFrontendReady = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      try {
        await invoke('frontend_ready');
      } catch (error) {
        console.warn('failed to notify frontend readiness', error);
      }
    };

    void notifyFrontendReady();
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;
    const runUpdateCheck = async () => {
      const result = await checkForUpdateOncePerDay();
      if (!cancelled && result.hasUpdate) {
        setLatestVersion(result.latestVersion ?? '');
        setCurrentVersion(result.currentVersion ?? '');
        setShowUpdateDialog(true);
      }
    };

    void runUpdateCheck();
    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <ReactFlowProvider>
        <div className="w-full h-full bg-bg-dark" />
      </ReactFlowProvider>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col bg-bg-dark">
        <TitleBar
          onSettingsClick={() => {
            setSettingsInitialCategory('general');
            setShowSettings(true);
          }}
          showBackButton={!!currentProjectId}
          onBackClick={closeProject}
        />

        <main className="flex-1 relative">
          {currentProjectId ? <Canvas /> : <ProjectManager />}
        </main>

        <SettingsDialog
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          initialCategory={settingsInitialCategory}
        />
        <UpdateAvailableDialog
          isOpen={showUpdateDialog}
          onClose={() => setShowUpdateDialog(false)}
          latestVersion={latestVersion}
          currentVersion={currentVersion}
        />
        <GlobalErrorDialog
          isOpen={Boolean(globalError)}
          title={globalError?.title ?? ''}
          message={globalError?.message ?? ''}
          details={globalError?.details}
          onClose={() => setGlobalError(null)}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
