import React, { useState, useEffect } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import ActivityBar from './ActivityBar';
import PrimarySideBar from './PrimarySideBar';
import SecondarySideBar from './SecondarySideBar';
import EditorPart from './EditorPart';
import Panel from './Panel';
import StatusBar from './StatusBar';
import TitleBar from './TitleBar';
import {
  SideBarPosition,
  PanelPosition,
  ActivityBarPosition,
} from '@/types/layout';

interface WorkbenchProps {
  children?: React.ReactNode;
}

const Workbench: React.FC<WorkbenchProps> = ({ children }) => {
  const {
    primarySideBarVisible,
    primarySideBarPosition,
    secondarySideBarVisible,
    panelVisible,
    panelPosition,
    panelMaximized,
    activityBarVisible,
    activityBarPosition,
    statusBarVisible,
    zenMode,
    fullScreen,
    centeredLayout,
  } = useLayoutContext();

  // Determine layout classes based on state
  const getWorkbenchClasses = () => {
    const classes = [
      'vscode-workbench',
      'flex',
      'flex-col',
      'h-screen',
      'w-screen',
      'overflow-hidden',
    ];

    if (zenMode) classes.push('zen-mode');
    if (fullScreen) classes.push('full-screen');
    if (centeredLayout) classes.push('centered-layout');

    return classes.join(' ');
  };

  // Determine main content classes based on state
  const getMainContentClasses = () => {
    const classes = ['main-content', 'flex', 'flex-1', 'overflow-hidden'];
    return classes.join(' ');
  };

  return (
    <div className={getWorkbenchClasses()}>
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content Area */}
      <div className={getMainContentClasses()}>
        {/* Activity Bar */}
        {activityBarVisible && <ActivityBar position={activityBarPosition} />}

        {/* Primary Side Bar */}
        {primarySideBarVisible && primarySideBarPosition === 'left' && (
          <PrimarySideBar />
        )}

        {/* Editor Part */}
        <EditorPart />

        {/* Primary Side Bar (right position) */}
        {primarySideBarVisible && primarySideBarPosition === 'right' && (
          <PrimarySideBar />
        )}

        {/* Secondary Side Bar */}
        {secondarySideBarVisible && <SecondarySideBar />}
      </div>

      {/* Panel (if not positioned within editor part) */}
      {panelVisible && panelPosition !== 'within-editor' && (
        <Panel position={panelPosition} maximized={panelMaximized} />
      )}

      {/* Status Bar */}
      {statusBarVisible && <StatusBar />}
    </div>
  );
};

export default Workbench;
