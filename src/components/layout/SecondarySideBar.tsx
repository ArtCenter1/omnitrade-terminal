import React, { useState } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useViewContext } from '@/contexts/ViewContext';
import ViewContainer from '../views/ViewContainer';

const SecondarySideBar: React.FC = () => {
  const { primarySideBarPosition } = useLayoutContext();
  const { activeSecondaryViewId, views } = useViewContext();
  const [width, setWidth] = useState(300); // Default width
  const [isResizing, setIsResizing] = useState(false);

  // Secondary sidebar is always opposite to primary sidebar
  const secondarySideBarPosition =
    primarySideBarPosition === 'left' ? 'right' : 'left';

  // Filter views that belong to secondary sidebar
  const secondarySideBarViews = views.filter(
    (view) =>
      view.containerLocation === 'secondary-sidebar' ||
      (view.defaultLocation === 'secondary-sidebar' && !view.containerLocation),
  );

  // Get active view
  const activeView = secondarySideBarViews.find(
    (view) => view.id === activeSecondaryViewId,
  );

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const delta =
        secondarySideBarPosition === 'left'
          ? e.clientX - startX
          : startX - e.clientX;

      const newWidth = Math.max(170, Math.min(800, startWidth + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Determine sidebar classes based on position
  const getSideBarClasses = () => {
    const baseClasses = [
      'secondary-sidebar',
      'bg-[#252526]',
      'text-[#cccccc]',
      'flex',
      'flex-col',
      'h-full',
    ];

    const positionClasses =
      secondarySideBarPosition === 'left'
        ? 'border-r border-[#1e1e1e]'
        : 'border-l border-[#1e1e1e]';

    return [...baseClasses, positionClasses].join(' ');
  };

  // Determine resizer classes based on position
  const getResizerClasses = () => {
    const baseClasses = [
      'resizer',
      'absolute',
      'top-0',
      'h-full',
      'w-1',
      'cursor-col-resize',
      'z-10',
      'hover:bg-[#007acc]',
    ];

    const positionClasses =
      secondarySideBarPosition === 'left' ? 'right-0' : 'left-0';

    return [...baseClasses, positionClasses].join(' ');
  };

  // If no active view, don't render
  if (!activeView) {
    return null;
  }

  return (
    <div
      className={getSideBarClasses()}
      style={{ width: `${width}px`, position: 'relative' }}
    >
      {/* Sidebar Title */}
      <div className="sidebar-title h-10 flex items-center px-4 font-semibold border-b border-[#1e1e1e]">
        {activeView.name}
      </div>

      {/* View Container */}
      <div className="view-container flex-1 overflow-auto">
        <ViewContainer viewId={activeView.id} />
      </div>

      {/* Resizer */}
      <div className={getResizerClasses()} onMouseDown={handleResizeStart} />
    </div>
  );
};

export default SecondarySideBar;
