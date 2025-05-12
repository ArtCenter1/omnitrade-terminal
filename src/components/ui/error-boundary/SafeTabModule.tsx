import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TabData, VSCodeTabs } from '@/components/terminal/VSCodeTabs';
import { cn } from '@/lib/utils';

interface SafeTabModuleProps {
  moduleId: string;
  initialTabs: TabData[];
  className?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabDragEnd?: (
    draggedTabId: string,
    sourceGroupId: string,
    targetGroupId: string,
    position?: 'left' | 'right' | 'top' | 'bottom',
    targetIndex?: number,
  ) => void;
  onTabReorder?: (draggedTabId: string, targetIndex: number) => void;
}

export const SafeTabModule: React.FC<SafeTabModuleProps> = ({
  moduleId,
  initialTabs,
  className,
  onTabChange,
  onTabClose,
  onTabDragEnd,
  onTabReorder,
}) => {
  const [tabs, setTabs] = useState<TabData[]>(initialTabs || []);
  const [activeTabId, setActiveTabId] = useState<string>(
    initialTabs?.[0]?.id || '',
  );

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);
    if (newTabs.length > 0 && activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    } else if (newTabs.length === 0) {
      setActiveTabId('');
    }
    if (onTabClose) {
      onTabClose(tabId);
    }
  };

  const handleTabReorder = (draggedTabId: string, targetIndex: number) => {
    setTabs((currentTabs) => {
      const draggedTabIndex = currentTabs.findIndex(
        (tab) => tab.id === draggedTabId,
      );
      if (draggedTabIndex === -1) return currentTabs;

      const newTabs = [...currentTabs];
      const [draggedItem] = newTabs.splice(draggedTabIndex, 1);
      newTabs.splice(targetIndex, 0, draggedItem);
      return newTabs;
    });
    if (onTabReorder) {
      onTabReorder(draggedTabId, targetIndex);
    }
  };

  // Wrap each tab's content with an ErrorBoundary
  const tabsWithBoundary = tabs.map((tab) => ({
    ...tab,
    content: (
      <ErrorBoundary key={`${moduleId}-${tab.id}-boundary`}>
        {tab.content}
      </ErrorBoundary>
    ),
  }));

  if (!tabsWithBoundary || tabsWithBoundary.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full text-gray-500',
          className,
        )}
      >
        No tabs to display.
      </div>
    );
  }

  return (
    <VSCodeTabs
      tabs={tabsWithBoundary}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      onTabClose={handleTabClose}
      onTabDragEnd={onTabDragEnd}
      onTabReorder={handleTabReorder}
      className={className}
      groupId={moduleId} // Use moduleId as groupId for VSCodeTabs
    />
  );
};
