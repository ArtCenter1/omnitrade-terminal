import React, { useState } from 'react';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { ViewProvider } from '@/contexts/ViewContext';
import { PanelProvider } from '@/contexts/PanelContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { usePanelContext } from '@/contexts/PanelContext';

interface VSCodePanelProps {
  componentState: {
    activePanel: string;
  };
}

// Inner component that uses the context
const PanelContent: React.FC<VSCodePanelProps> = ({ componentState }) => {
  const { panels, setActivePanelId, activePanelId } = usePanelContext();
  const [currentActivePanel, setCurrentActivePanel] = useState(
    componentState.activePanel || 'terminal',
  );

  // Set active panel when component mounts or when currentActivePanel changes
  React.useEffect(() => {
    setActivePanelId(currentActivePanel);
  }, [currentActivePanel, setActivePanelId]);

  // Sort panels by order
  const sortedPanels = [...panels].sort((a, b) => {
    return (a.order || 0) - (b.order || 0);
  });

  // Handle tab click
  const handleTabClick = (panelId: string) => {
    setActivePanelId(panelId);
    setCurrentActivePanel(panelId);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      {/* Panel Tabs */}
      <div className="panel-tabs h-10 flex items-center border-b border-[#252526]">
        {sortedPanels.map((panel) => (
          <div
            key={panel.id}
            className={`panel-tab flex items-center px-3 h-full cursor-pointer ${
              panel.id === activePanelId
                ? 'active border-t-2 border-t-[#007acc]'
                : 'hover:bg-[#2a2d2e]'
            }`}
            onClick={() => handleTabClick(panel.id)}
          >
            {/* Panel Icon */}
            {panel.icon && (
              <span className={`panel-icon mr-2 ${panel.icon}`}></span>
            )}

            {/* Panel Name */}
            <span className="panel-name">{panel.name}</span>
          </div>
        ))}
      </div>

      {/* Panel Content */}
      <div className="panel-content flex-1 overflow-auto">
        {activePanelId === 'problems' && (
          <div className="p-4">
            <h3 className="text-lg mb-2">Problems</h3>
            <p className="text-[#6c6c6c]">
              No problems have been detected in the workspace.
            </p>
          </div>
        )}

        {activePanelId === 'output' && (
          <div className="p-4">
            <h3 className="text-lg mb-2">Output</h3>
            <pre className="font-mono text-sm">
              {`> Starting development server...
> Server running at http://localhost:3000
> Ready for connections`}
            </pre>
          </div>
        )}

        {activePanelId === 'terminal' && (
          <div className="p-4">
            <div className="font-mono text-sm bg-[#1e1e1e] p-2">
              <div className="text-[#cccccc]">
                user@machine:~/project$ npm start
              </div>
              <div className="text-[#cccccc]">
                Starting development server...
              </div>
              <div className="text-[#cccccc]">
                Server running at http://localhost:3000
              </div>
              <div className="text-[#cccccc]">Ready for connections</div>
              <div className="text-[#cccccc]">user@machine:~/project$ _</div>
            </div>
          </div>
        )}

        {activePanelId === 'debug-console' && (
          <div className="p-4">
            <h3 className="text-lg mb-2">Debug Console</h3>
            <p className="text-[#6c6c6c]">No active debug session.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component that provides the context
const VSCodePanel: React.FC<VSCodePanelProps> = (props) => {
  return (
    <LayoutProvider>
      <ViewProvider>
        <EditorProvider>
          <PanelProvider>
            <PanelContent {...props} />
          </PanelProvider>
        </EditorProvider>
      </ViewProvider>
    </LayoutProvider>
  );
};

export default VSCodePanel;
