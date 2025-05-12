import React, { useState } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { usePanelContext } from '@/contexts/PanelContext';
import { PanelPosition, PanelAlignment } from '@/types/layout';
import PanelTabs from '../panel/PanelTabs';
import PanelView from '../panel/PanelView';

interface PanelProps {
  position: PanelPosition;
  maximized: boolean;
}

const Panel: React.FC<PanelProps> = ({ position, maximized }) => {
  const { panelAlignment, maximizePanel } = useLayoutContext();
  const { activePanelId, panels } = usePanelContext();

  const [size, setSize] = useState(300); // Default height/width
  const [isResizing, setIsResizing] = useState(false);

  // Get active panel
  const activePanel = panels.find((panel) => panel.id === activePanelId);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startPos =
      position === 'bottom' || position === 'top' ? e.clientY : e.clientX;
    const startSize = size;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      let delta;
      if (position === 'bottom') {
        delta = startPos - e.clientY;
      } else if (position === 'top') {
        delta = e.clientY - startPos;
      } else if (position === 'left') {
        delta = e.clientX - startPos;
      } else {
        // right
        delta = startPos - e.clientX;
      }

      const newSize = Math.max(100, Math.min(800, startSize + delta));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Determine panel classes based on position and alignment
  const getPanelClasses = () => {
    const baseClasses = ['panel', 'bg-[#1e1e1e]', 'text-[#cccccc]', 'flex'];

    // Position specific classes
    if (position === 'bottom') {
      baseClasses.push('flex-col', 'border-t', 'border-[#252526]');
    } else if (position === 'top') {
      baseClasses.push('flex-col', 'border-b', 'border-[#252526]');
    } else if (position === 'left') {
      baseClasses.push('flex-col', 'h-full', 'border-r', 'border-[#252526]');
    } else if (position === 'right') {
      baseClasses.push('flex-col', 'h-full', 'border-l', 'border-[#252526]');
    } else if (position === 'within-editor') {
      baseClasses.push('flex-col', 'border-t', 'border-[#252526]');
    }

    // Alignment specific classes (for bottom/top panels)
    if (
      (position === 'bottom' || position === 'top') &&
      panelAlignment !== 'center'
    ) {
      if (panelAlignment === 'justify') {
        baseClasses.push('w-full');
      } else if (panelAlignment === 'left') {
        baseClasses.push('ml-0');
      } else if (panelAlignment === 'right') {
        baseClasses.push('mr-0');
      }
    }

    return baseClasses.join(' ');
  };

  // Determine resizer classes based on position
  const getResizerClasses = () => {
    const baseClasses = [
      'resizer',
      'absolute',
      'cursor-resize',
      'z-10',
      'hover:bg-[#007acc]',
    ];

    if (position === 'bottom') {
      baseClasses.push(
        'top-0',
        'left-0',
        'right-0',
        'h-1',
        'cursor-row-resize',
      );
    } else if (position === 'top') {
      baseClasses.push(
        'bottom-0',
        'left-0',
        'right-0',
        'h-1',
        'cursor-row-resize',
      );
    } else if (position === 'left') {
      baseClasses.push(
        'right-0',
        'top-0',
        'bottom-0',
        'w-1',
        'cursor-col-resize',
      );
    } else if (position === 'right') {
      baseClasses.push(
        'left-0',
        'top-0',
        'bottom-0',
        'w-1',
        'cursor-col-resize',
      );
    } else if (position === 'within-editor') {
      baseClasses.push(
        'top-0',
        'left-0',
        'right-0',
        'h-1',
        'cursor-row-resize',
      );
    }

    return baseClasses.join(' ');
  };

  // Determine panel size style
  const getPanelStyle = () => {
    const style: React.CSSProperties = { position: 'relative' };

    if (
      position === 'bottom' ||
      position === 'top' ||
      position === 'within-editor'
    ) {
      style.height = maximized ? '100%' : `${size}px`;

      // Handle alignment
      if (panelAlignment === 'center' && !maximized) {
        style.width = '70%';
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
      } else if (panelAlignment === 'left' && !maximized) {
        style.width = '70%';
        style.marginRight = 'auto';
      } else if (panelAlignment === 'right' && !maximized) {
        style.width = '70%';
        style.marginLeft = 'auto';
      }
    } else {
      style.width = `${size}px`;
      style.height = '100%';
    }

    return style;
  };

  // If no active panel, don't render
  if (!activePanel) {
    return null;
  }

  return (
    <div className={getPanelClasses()} style={getPanelStyle()}>
      {/* Panel Tabs */}
      <div className="panel-tabs h-10 flex items-center border-b border-[#252526]">
        <PanelTabs />

        {/* Panel Actions */}
        <div className="panel-actions ml-auto flex items-center pr-2">
          {/* Maximize/Restore Button */}
          <button
            className="p-1 hover:bg-[#2a2d2e] rounded"
            onClick={() => maximizePanel(!maximized)}
            title={maximized ? 'Restore Panel Size' : 'Maximize Panel'}
          >
            <i
              className={`icon ${maximized ? 'icon-restore' : 'icon-maximize'}`}
            ></i>
          </button>

          {/* Close Button */}
          <button
            className="p-1 hover:bg-[#2a2d2e] rounded ml-1"
            onClick={() => {
              /* Close panel */
            }}
            title="Close Panel"
          >
            <i className="icon icon-close"></i>
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="panel-content flex-1 overflow-auto">
        <PanelView panelId={activePanel.id} />
      </div>

      {/* Resizer */}
      {!maximized && (
        <div className={getResizerClasses()} onMouseDown={handleResizeStart} />
      )}
    </div>
  );
};

export default Panel;
