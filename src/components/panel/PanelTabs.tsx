import React from 'react';
import { usePanelContext } from '@/contexts/PanelContext';

const PanelTabs: React.FC = () => {
  const { panels, activePanelId, setActivePanelId } = usePanelContext();

  // Sort panels by order
  const sortedPanels = [...panels].sort((a, b) => {
    return (a.order || 0) - (b.order || 0);
  });

  // Handle tab click
  const handleTabClick = (panelId: string) => {
    setActivePanelId(panelId);
  };

  return (
    <div className="panel-tabs flex h-full overflow-x-auto">
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
  );
};

export default PanelTabs;
