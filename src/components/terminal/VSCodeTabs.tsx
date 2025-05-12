/**
 * VS Code-like Tabs Component
 *
 * This component implements a tab system similar to Visual Studio Code, where:
 * 1. Tabs can be dragged and reordered within the same tab group
 * 2. Tabs can be moved to another tab group
 * 3. Tabs can be dragged to the edge of a panel to create a split view (horizontal or vertical)
 * 4. Empty containers can accept tab drops to create new tab groups
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface TabData {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  closable?: boolean;
}

interface VSCodeTabsProps {
  tabs: TabData[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabDragEnd?: (
    draggedTabId: string,
    sourceGroupId: string,
    targetGroupId: string,
    position?: 'left' | 'right' | 'top' | 'bottom',
    targetIndex?: number,
  ) => void;
  onTabReorder?: (draggedTabId: string, targetIndex: number) => void; // New prop for reordering
  className?: string;
  groupId?: string;
}

export const VSCodeTabs: React.FC<VSCodeTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabDragEnd,
  onTabReorder, // Added new prop
  className,
  groupId = 'default',
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    position: 'left' | 'right' | 'top' | 'bottom' | null;
    index: number | null;
  }>({ position: null, index: null });
  const tabsRef = useRef<HTMLDivElement>(null);

  // Handle tab drag start
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    tabId: string,
  ) => {
    e.dataTransfer.setData(
      'application/vscode-tab',
      JSON.stringify({
        tabId,
        sourceGroupId: groupId,
      }),
    );
    setDraggedTabId(tabId);

    // Set a drag image (optional)
    const dragImage = document.createElement('div');
    dragImage.textContent = tabs.find((tab) => tab.id === tabId)?.title || '';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Handle tab drag over
  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();

    const currentTarget = e.currentTarget as HTMLElement;
    const rect = currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Using 25% of width/height for edge detection
    const edgeThresholdX = rect.width * 0.25;
    const edgeThresholdY = rect.height * 0.25; // Relevant if tabs have significant height or can be stacked

    if (x < edgeThresholdX) {
      setDropIndicator({ position: 'left', index });
    } else if (x > rect.width - edgeThresholdX) {
      setDropIndicator({ position: 'right', index });
    } else if (y < edgeThresholdY) {
      setDropIndicator({ position: 'top', index });
    } else if (y > rect.height - edgeThresholdY) {
      setDropIndicator({ position: 'bottom', index });
    } else {
      // Drop in the central area of the tab, indicates reordering within the same list
      setDropIndicator({ position: null, index });
    }
  };

  // Handle tab drag leave
  const handleDragLeave = () => {
    setDropIndicator({ position: null, index: null });
  };

  // Handle tab drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/vscode-tab'));
      const { tabId, sourceGroupId } = data;

      // If dropping on the same group, handle reordering
      if (
        sourceGroupId === groupId &&
        dropIndicator.position === null &&
        dropIndicator.index !== null &&
        onTabReorder
      ) {
        onTabReorder(tabId, dropIndicator.index);
      }
      // If dropping on an edge, handle splitting
      else if (dropIndicator.position !== null && onTabDragEnd) {
        onTabDragEnd(tabId, sourceGroupId, groupId, dropIndicator.position);
      }
      // If dropping a tab from a different group onto this group's tab list (not an edge)
      else if (
        sourceGroupId !== groupId &&
        dropIndicator.position === null &&
        dropIndicator.index !== null &&
        onTabDragEnd
      ) {
        onTabDragEnd(
          tabId,
          sourceGroupId,
          groupId,
          undefined,
          dropIndicator.index,
        );
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }

    setDraggedTabId(null);
    setDropIndicator({ position: null, index: null });
  };

  // Handle tab drag end
  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDropIndicator({ position: null, index: null });
  };

  // Clean up drop indicator when component unmounts
  useEffect(() => {
    return () => {
      setDropIndicator({ position: null, index: null });
    };
  }, []);

  return (
    <div className={cn('vscode-tabs-container', className)}>
      <div
        ref={tabsRef}
        className="vscode-tabs-list"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={cn(
              'vscode-tab',
              activeTabId === tab.id && 'active',
              draggedTabId === tab.id && 'dragging',
            )}
            draggable
            onClick={() => onTabChange(tab.id)}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-title">{tab.title}</span>
            {tab.closable !== false && onTabClose && (
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <X size={14} />
              </button>
            )}
            {dropIndicator.index === index && dropIndicator.position && (
              <div className={`drop-indicator ${dropIndicator.position}`} />
            )}
          </div>
        ))}
      </div>
      <div className="vscode-tab-content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn('tab-panel', activeTabId === tab.id && 'active')}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};
