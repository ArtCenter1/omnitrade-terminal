import React from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { ActivityBarPosition, ActivityBarItem } from '@/types/layout';
import { useViewContext } from '@/contexts/ViewContext';

interface ActivityBarProps {
  position: ActivityBarPosition;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ position }) => {
  const { primarySideBarPosition } = useLayoutContext();
  const { activeViewId, setActiveViewId, activityBarItems } = useViewContext();

  // Determine position classes
  const getPositionClasses = () => {
    const baseClasses = [
      'activity-bar',
      'bg-[#333333]',
      'text-[#cccccc]',
      'z-10',
    ];

    if (position === 'top') {
      return [...baseClasses, 'flex', 'flex-row', 'h-12', 'w-full'].join(' ');
    } else if (position === 'bottom') {
      return [...baseClasses, 'flex', 'flex-row', 'h-12', 'w-full'].join(' ');
    } else {
      // Default position (side)
      const sideClasses =
        primarySideBarPosition === 'left'
          ? 'left-0 border-r border-[#252526]'
          : 'right-0 border-l border-[#252526]';

      return [
        ...baseClasses,
        'flex',
        'flex-col',
        'w-12',
        'h-full',
        sideClasses,
      ].join(' ');
    }
  };

  // Handle item click
  const handleItemClick = (item: ActivityBarItem) => {
    if (item.target === 'view' && item.viewId) {
      setActiveViewId(item.viewId);
    } else if (item.target === 'command' && item.command) {
      // Execute command
      console.log(`Executing command: ${item.command}`);
    }
  };

  // Render activity bar items
  const renderItems = () => {
    return activityBarItems.map((item) => (
      <div
        key={item.id}
        className={`activity-bar-item flex items-center justify-center p-2 cursor-pointer hover:bg-[#2a2d2e] ${
          activeViewId === item.viewId
            ? 'active bg-[#2a2d2e] border-l-2 border-[#007acc]'
            : ''
        }`}
        onClick={() => handleItemClick(item)}
        title={item.name}
      >
        {/* Icon */}
        <div className="icon-container relative">
          <i className={`icon ${item.icon}`}></i>

          {/* Badge if present */}
          {item.badge && (
            <div
              className="badge absolute -top-1 -right-1 rounded-full text-xs flex items-center justify-center"
              style={{
                backgroundColor: item.badgeColor || '#007acc',
                minWidth: '16px',
                height: '16px',
              }}
            >
              {item.badge}
            </div>
          )}
        </div>
      </div>
    ));
  };

  // Render account and manage buttons (typically at bottom)
  const renderBottomItems = () => {
    if (position === 'top' || position === 'bottom') {
      return null; // These items move to title bar in horizontal mode
    }

    return (
      <div className="bottom-items mt-auto">
        <div
          className="activity-bar-item flex items-center justify-center p-2 cursor-pointer hover:bg-[#2a2d2e]"
          title="Accounts"
        >
          <i className="icon icon-account"></i>
        </div>
        <div
          className="activity-bar-item flex items-center justify-center p-2 cursor-pointer hover:bg-[#2a2d2e]"
          title="Manage"
        >
          <i className="icon icon-settings"></i>
        </div>
      </div>
    );
  };

  return (
    <div className={getPositionClasses()}>
      <div
        className={`activity-bar-items ${position === 'top' || position === 'bottom' ? 'flex flex-row' : 'flex flex-col'}`}
      >
        {renderItems()}
      </div>
      {renderBottomItems()}
    </div>
  );
};

export default ActivityBar;
