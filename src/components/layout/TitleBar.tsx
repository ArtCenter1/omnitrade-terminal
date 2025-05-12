import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';

const TitleBar: React.FC = () => {
  const {
    togglePrimarySideBar,
    toggleSecondarySideBar,
    togglePanel,
    toggleZenMode,
    toggleFullScreen,
    toggleCenteredLayout,
    primarySideBarVisible,
    secondarySideBarVisible,
    panelVisible,
    zenMode,
    fullScreen,
    centeredLayout,
    activityBarPosition,
  } = useLayoutContext();

  // Render account and manage buttons if activity bar is in top/bottom position
  const renderAccountButtons = () => {
    if (activityBarPosition !== 'top' && activityBarPosition !== 'bottom') {
      return null;
    }

    return (
      <div className="account-buttons flex items-center space-x-2">
        <button className="p-1 hover:bg-[#2a2d2e] rounded" title="Accounts">
          <i className="icon icon-account"></i>
        </button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded" title="Manage">
          <i className="icon icon-settings"></i>
        </button>
      </div>
    );
  };

  return (
    <div className="title-bar h-10 bg-[#3c3c3c] text-[#cccccc] flex items-center px-2">
      {/* Application Menu */}
      <div className="app-menu flex items-center space-x-2">
        <button className="p-1 hover:bg-[#2a2d2e] rounded">File</button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded">Edit</button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded">View</button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded">Go</button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded">Run</button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded">Terminal</button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded">Help</button>
      </div>

      {/* Window Title */}
      <div className="window-title flex-1 text-center truncate">
        OmniTrade Terminal
      </div>

      {/* Layout Controls */}
      <div className="layout-controls flex items-center space-x-2">
        {/* Toggle Primary Side Bar */}
        <button
          className={`p-1 rounded ${primarySideBarVisible ? 'bg-[#2a2d2e]' : 'hover:bg-[#2a2d2e]'}`}
          onClick={togglePrimarySideBar}
          title="Toggle Primary Side Bar"
        >
          <i className="icon icon-sidebar"></i>
        </button>

        {/* Toggle Secondary Side Bar */}
        <button
          className={`p-1 rounded ${secondarySideBarVisible ? 'bg-[#2a2d2e]' : 'hover:bg-[#2a2d2e]'}`}
          onClick={toggleSecondarySideBar}
          title="Toggle Secondary Side Bar"
        >
          <i className="icon icon-secondary-sidebar"></i>
        </button>

        {/* Toggle Panel */}
        <button
          className={`p-1 rounded ${panelVisible ? 'bg-[#2a2d2e]' : 'hover:bg-[#2a2d2e]'}`}
          onClick={togglePanel}
          title="Toggle Panel"
        >
          <i className="icon icon-panel"></i>
        </button>

        {/* Customize Layout Button */}
        <div className="relative">
          <button
            className="p-1 hover:bg-[#2a2d2e] rounded"
            title="Customize Layout"
          >
            <i className="icon icon-layout"></i>
          </button>
          {/* Dropdown menu would go here */}
        </div>

        {/* Account buttons if activity bar is in top/bottom position */}
        {renderAccountButtons()}
      </div>

      {/* Window Controls (minimize, maximize, close) */}
      <div className="window-controls flex items-center ml-2 space-x-2">
        <button className="p-1 hover:bg-[#2a2d2e] rounded" title="Minimize">
          <i className="icon icon-minimize"></i>
        </button>
        <button className="p-1 hover:bg-[#2a2d2e] rounded" title="Maximize">
          <i className="icon icon-maximize"></i>
        </button>
        <button className="p-1 hover:bg-[#e81123] rounded" title="Close">
          <i className="icon icon-close"></i>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
