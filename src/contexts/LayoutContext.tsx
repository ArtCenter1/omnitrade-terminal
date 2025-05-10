import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SideBarPosition,
  PanelPosition,
  ActivityBarPosition,
  PanelAlignment,
  EditorTabsMode,
  QuickInputPosition,
} from '@/types/layout';

interface LayoutContextType {
  // Side Bar
  primarySideBarVisible: boolean;
  primarySideBarPosition: SideBarPosition;
  secondarySideBarVisible: boolean;

  // Panel
  panelVisible: boolean;
  panelPosition: PanelPosition;
  panelAlignment: PanelAlignment;
  panelMaximized: boolean;

  // Activity Bar
  activityBarVisible: boolean;
  activityBarPosition: ActivityBarPosition;

  // Status Bar
  statusBarVisible: boolean;

  // Editor
  editorTabsMode: EditorTabsMode;
  showEditorTabs: boolean;

  // Layout Modes
  zenMode: boolean;
  fullScreen: boolean;
  centeredLayout: boolean;

  // Quick Input (Command Palette)
  quickInputPosition: QuickInputPosition;

  // Methods
  togglePrimarySideBar: () => void;
  toggleSecondarySideBar: () => void;
  togglePanel: () => void;
  toggleActivityBar: () => void;
  toggleStatusBar: () => void;
  toggleZenMode: () => void;
  toggleFullScreen: () => void;
  toggleCenteredLayout: () => void;
  setPrimarySideBarPosition: (position: SideBarPosition) => void;
  setPanelPosition: (position: PanelPosition) => void;
  setPanelAlignment: (alignment: PanelAlignment) => void;
  setActivityBarPosition: (position: ActivityBarPosition) => void;
  setEditorTabsMode: (mode: EditorTabsMode) => void;
  setQuickInputPosition: (position: QuickInputPosition) => void;
  maximizePanel: (maximized: boolean) => void;
  resetLayout: () => void;
}

const defaultLayoutContext: LayoutContextType = {
  primarySideBarVisible: true,
  primarySideBarPosition: 'left',
  secondarySideBarVisible: false,

  panelVisible: true,
  panelPosition: 'bottom',
  panelAlignment: 'center',
  panelMaximized: false,

  activityBarVisible: true,
  activityBarPosition: 'default',

  statusBarVisible: true,

  editorTabsMode: 'multiple',
  showEditorTabs: true,

  zenMode: false,
  fullScreen: false,
  centeredLayout: false,

  quickInputPosition: 'center-top',

  togglePrimarySideBar: () => {},
  toggleSecondarySideBar: () => {},
  togglePanel: () => {},
  toggleActivityBar: () => {},
  toggleStatusBar: () => {},
  toggleZenMode: () => {},
  toggleFullScreen: () => {},
  toggleCenteredLayout: () => {},
  setPrimarySideBarPosition: () => {},
  setPanelPosition: () => {},
  setPanelAlignment: () => {},
  setActivityBarPosition: () => {},
  setEditorTabsMode: () => {},
  setQuickInputPosition: () => {},
  maximizePanel: () => {},
  resetLayout: () => {},
};

const LayoutContext = createContext<LayoutContextType>(defaultLayoutContext);

export const useLayoutContext = () => useContext(LayoutContext);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize state with default values or from localStorage
  const [primarySideBarVisible, setPrimarySideBarVisible] = useState(
    defaultLayoutContext.primarySideBarVisible,
  );
  const [primarySideBarPosition, setPrimarySideBarPosition] =
    useState<SideBarPosition>(defaultLayoutContext.primarySideBarPosition);
  const [secondarySideBarVisible, setSecondarySideBarVisible] = useState(
    defaultLayoutContext.secondarySideBarVisible,
  );

  const [panelVisible, setPanelVisible] = useState(
    defaultLayoutContext.panelVisible,
  );
  const [panelPosition, setPanelPosition] = useState<PanelPosition>(
    defaultLayoutContext.panelPosition,
  );
  const [panelAlignment, setPanelAlignment] = useState<PanelAlignment>(
    defaultLayoutContext.panelAlignment,
  );
  const [panelMaximized, setPanelMaximized] = useState(
    defaultLayoutContext.panelMaximized,
  );

  const [activityBarVisible, setActivityBarVisible] = useState(
    defaultLayoutContext.activityBarVisible,
  );
  const [activityBarPosition, setActivityBarPosition] =
    useState<ActivityBarPosition>(defaultLayoutContext.activityBarPosition);

  const [statusBarVisible, setStatusBarVisible] = useState(
    defaultLayoutContext.statusBarVisible,
  );

  const [editorTabsMode, setEditorTabsMode] = useState<EditorTabsMode>(
    defaultLayoutContext.editorTabsMode,
  );
  const [showEditorTabs, setShowEditorTabs] = useState(
    defaultLayoutContext.showEditorTabs,
  );

  const [zenMode, setZenMode] = useState(defaultLayoutContext.zenMode);
  const [fullScreen, setFullScreen] = useState(defaultLayoutContext.fullScreen);
  const [centeredLayout, setCenteredLayout] = useState(
    defaultLayoutContext.centeredLayout,
  );

  const [quickInputPosition, setQuickInputPosition] =
    useState<QuickInputPosition>(defaultLayoutContext.quickInputPosition);

  // Load saved layout from localStorage on component mount
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('vscode-layout');
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);

        // Apply saved layout settings
        setPrimarySideBarVisible(
          parsedLayout.primarySideBarVisible ??
            defaultLayoutContext.primarySideBarVisible,
        );
        setPrimarySideBarPosition(
          parsedLayout.primarySideBarPosition ??
            defaultLayoutContext.primarySideBarPosition,
        );
        setSecondarySideBarVisible(
          parsedLayout.secondarySideBarVisible ??
            defaultLayoutContext.secondarySideBarVisible,
        );

        setPanelVisible(
          parsedLayout.panelVisible ?? defaultLayoutContext.panelVisible,
        );
        setPanelPosition(
          parsedLayout.panelPosition ?? defaultLayoutContext.panelPosition,
        );
        setPanelAlignment(
          parsedLayout.panelAlignment ?? defaultLayoutContext.panelAlignment,
        );
        setPanelMaximized(
          parsedLayout.panelMaximized ?? defaultLayoutContext.panelMaximized,
        );

        setActivityBarVisible(
          parsedLayout.activityBarVisible ??
            defaultLayoutContext.activityBarVisible,
        );
        setActivityBarPosition(
          parsedLayout.activityBarPosition ??
            defaultLayoutContext.activityBarPosition,
        );

        setStatusBarVisible(
          parsedLayout.statusBarVisible ??
            defaultLayoutContext.statusBarVisible,
        );

        setEditorTabsMode(
          parsedLayout.editorTabsMode ?? defaultLayoutContext.editorTabsMode,
        );
        setShowEditorTabs(
          parsedLayout.showEditorTabs ?? defaultLayoutContext.showEditorTabs,
        );

        setZenMode(parsedLayout.zenMode ?? defaultLayoutContext.zenMode);
        setFullScreen(
          parsedLayout.fullScreen ?? defaultLayoutContext.fullScreen,
        );
        setCenteredLayout(
          parsedLayout.centeredLayout ?? defaultLayoutContext.centeredLayout,
        );

        setQuickInputPosition(
          parsedLayout.quickInputPosition ??
            defaultLayoutContext.quickInputPosition,
        );
      }
    } catch (error) {
      console.error('Error loading layout from localStorage:', error);
    }
  }, []);

  // Save layout to localStorage whenever it changes
  useEffect(() => {
    try {
      const layoutToSave = {
        primarySideBarVisible,
        primarySideBarPosition,
        secondarySideBarVisible,
        panelVisible,
        panelPosition,
        panelAlignment,
        panelMaximized,
        activityBarVisible,
        activityBarPosition,
        statusBarVisible,
        editorTabsMode,
        showEditorTabs,
        zenMode,
        fullScreen,
        centeredLayout,
        quickInputPosition,
      };

      localStorage.setItem('vscode-layout', JSON.stringify(layoutToSave));
    } catch (error) {
      console.error('Error saving layout to localStorage:', error);
    }
  }, [
    primarySideBarVisible,
    primarySideBarPosition,
    secondarySideBarVisible,
    panelVisible,
    panelPosition,
    panelAlignment,
    panelMaximized,
    activityBarVisible,
    activityBarPosition,
    statusBarVisible,
    editorTabsMode,
    showEditorTabs,
    zenMode,
    fullScreen,
    centeredLayout,
    quickInputPosition,
  ]);

  // Toggle functions
  const togglePrimarySideBar = () =>
    setPrimarySideBarVisible(!primarySideBarVisible);
  const toggleSecondarySideBar = () =>
    setSecondarySideBarVisible(!secondarySideBarVisible);
  const togglePanel = () => setPanelVisible(!panelVisible);
  const toggleActivityBar = () => setActivityBarVisible(!activityBarVisible);
  const toggleStatusBar = () => setStatusBarVisible(!statusBarVisible);
  const toggleZenMode = () => setZenMode(!zenMode);
  const toggleFullScreen = () => setFullScreen(!fullScreen);
  const toggleCenteredLayout = () => setCenteredLayout(!centeredLayout);

  // Reset layout to defaults
  const resetLayout = () => {
    setPrimarySideBarVisible(defaultLayoutContext.primarySideBarVisible);
    setPrimarySideBarPosition(defaultLayoutContext.primarySideBarPosition);
    setSecondarySideBarVisible(defaultLayoutContext.secondarySideBarVisible);
    setPanelVisible(defaultLayoutContext.panelVisible);
    setPanelPosition(defaultLayoutContext.panelPosition);
    setPanelAlignment(defaultLayoutContext.panelAlignment);
    setPanelMaximized(defaultLayoutContext.panelMaximized);
    setActivityBarVisible(defaultLayoutContext.activityBarVisible);
    setActivityBarPosition(defaultLayoutContext.activityBarPosition);
    setStatusBarVisible(defaultLayoutContext.statusBarVisible);
    setEditorTabsMode(defaultLayoutContext.editorTabsMode);
    setShowEditorTabs(defaultLayoutContext.showEditorTabs);
    setZenMode(defaultLayoutContext.zenMode);
    setFullScreen(defaultLayoutContext.fullScreen);
    setCenteredLayout(defaultLayoutContext.centeredLayout);
    setQuickInputPosition(defaultLayoutContext.quickInputPosition);
  };

  // Maximize panel
  const maximizePanel = (maximized: boolean) => setPanelMaximized(maximized);

  const contextValue: LayoutContextType = {
    primarySideBarVisible,
    primarySideBarPosition,
    secondarySideBarVisible,
    panelVisible,
    panelPosition,
    panelAlignment,
    panelMaximized,
    activityBarVisible,
    activityBarPosition,
    statusBarVisible,
    editorTabsMode,
    showEditorTabs,
    zenMode,
    fullScreen,
    centeredLayout,
    quickInputPosition,
    togglePrimarySideBar,
    toggleSecondarySideBar,
    togglePanel,
    toggleActivityBar,
    toggleStatusBar,
    toggleZenMode,
    toggleFullScreen,
    toggleCenteredLayout,
    setPrimarySideBarPosition,
    setPanelPosition,
    setPanelAlignment,
    setActivityBarPosition,
    setEditorTabsMode,
    setQuickInputPosition,
    maximizePanel,
    resetLayout,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};
