import React from 'react';

interface PanelViewProps {
  panelId: string;
}

const PanelView: React.FC<PanelViewProps> = ({ panelId }) => {
  // This is a placeholder component that would render the actual panel content
  // In a real implementation, this would render different panel types based on the panelId

  // Render different content based on panel ID
  const renderPanelContent = () => {
    switch (panelId) {
      case 'problems':
        return (
          <div className="p-4">
            <h3 className="text-lg mb-2">Problems</h3>
            <p className="text-[#6c6c6c]">
              No problems have been detected in the workspace.
            </p>
          </div>
        );

      case 'output':
        return (
          <div className="p-4">
            <h3 className="text-lg mb-2">Output</h3>
            <pre className="font-mono text-sm">
              {`> Starting development server...
> Server running at http://localhost:3000
> Ready for connections`}
            </pre>
          </div>
        );

      case 'terminal':
        return (
          <div className="p-4">
            <h3 className="text-lg mb-2">Terminal</h3>
            <div className="font-mono text-sm bg-[#1e1e1e] p-2">
              <div className="text-[#cccccc]">user@machine:~/project$</div>
            </div>
          </div>
        );

      case 'debug-console':
        return (
          <div className="p-4">
            <h3 className="text-lg mb-2">Debug Console</h3>
            <p className="text-[#6c6c6c]">No active debug session.</p>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <h3 className="text-lg mb-2">Panel: {panelId}</h3>
            <p className="text-[#6c6c6c]">
              This is a placeholder for the panel content.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="panel-view-container h-full bg-[#1e1e1e] text-[#d4d4d4] overflow-auto">
      {renderPanelContent()}
    </div>
  );
};

export default PanelView;
