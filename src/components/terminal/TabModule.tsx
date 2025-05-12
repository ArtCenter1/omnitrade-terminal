/**
 * TabModule Component
 *
 * This component implements a module that works like tabs in VS Code, allowing:
 * - Tab reordering within the same group
 * - Moving tabs between groups
 * - Creating split views by dragging tabs to edges
 * - Dropping tabs into empty containers
 */

import React, { useState, useEffect } from 'react';
import { VSCodeTabs, TabData } from './VSCodeTabs';
import { useSafeWorkspace } from '@/components/ui/error-boundary/WorkspaceContextProvider';
import { componentRegistry } from '@/lib/component-registry';
import { LayoutItemType, SplitDirection } from '@/lib/workspace';
import '@/styles/vscode-tabs.css';
import '@/styles/component-tabs.css';

interface TabModuleProps {
  moduleId: string;
  initialTabs?: TabData[];
  className?: string;
}

export const TabModule: React.FC<TabModuleProps> = ({
  moduleId,
  initialTabs = [],
  className,
}) => {
  const [tabs, setTabs] = useState<TabData[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>(
    initialTabs[0]?.id || '',
  );
  const { currentWorkspace, updateWorkspace } = useSafeWorkspace();

  // Add a new tab to this module
  const addTab = (tab: TabData) => {
    setTabs((prevTabs) => [...prevTabs, tab]);
    setActiveTabId(tab.id);
  };

  // Remove a tab from this module
  const removeTab = (tabId: string) => {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));

    // If the active tab is being removed, activate another tab
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
      }
    }
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };

  // Handle tab reorder
  const handleTabReorder = (draggedTabId: string, targetIndex: number) => {
    setTabs((prevTabs) => {
      const newTabs = [...prevTabs];
      const draggedTabIndex = newTabs.findIndex(
        (tab) => tab.id === draggedTabId,
      );
      if (draggedTabIndex === -1) return prevTabs; // Should not happen

      const [draggedTab] = newTabs.splice(draggedTabIndex, 1);
      newTabs.splice(targetIndex, 0, draggedTab);
      return newTabs;
    });
  };

  // Handle tab drag end (for splitting and moving between groups)
  const handleTabDragEnd = (
    draggedTabId: string,
    sourceGroupId: string,
    targetGroupId: string,
    position?: 'left' | 'right' | 'top' | 'bottom',
    targetIndex?: number,
  ) => {
    const tabToMove = tabs.find((tab) => tab.id === draggedTabId);
    if (!tabToMove) return;

    // Case 1: Moving tab to a different group (not splitting)
    if (
      sourceGroupId !== targetGroupId &&
      !position &&
      targetIndex !== undefined
    ) {
      console.log(
        `Moving tab ${draggedTabId} from ${sourceGroupId} to group ${targetGroupId} at index ${targetIndex}`,
      );
      // In a real app, you'd call a workspace context function here to:
      // 1. Remove tab from source group's tabs array
      // 2. Add tab to target group's tabs array at targetIndex
      // For this demo, we'll just log it and remove from current if it's the source
      if (sourceGroupId === moduleId) {
        removeTab(draggedTabId);
        // Potentially, you'd also need to inform the target module to add this tab.
        // This would likely involve a shared state or context (e.g., WorkspaceContext)
      }
      return;
    }

    // Case 2: Creating a split view
    if (position && currentWorkspace) {
      console.log(
        `Creating split view with tab ${draggedTabId} from ${sourceGroupId} to ${targetGroupId} in position ${position}`,
      );

      // Remove the tab from its original module (if it's this one)
      if (sourceGroupId === moduleId) {
        removeTab(draggedTabId);
      }

      // Logic to update workspace layout for split view
      // This is complex and depends heavily on your workspace management implementation.
      // You would typically use the useWorkspace hook's updateWorkspace function.
      const splitDirection =
        position === 'left' || position === 'right'
          ? SplitDirection.HORIZONTAL
          : SplitDirection.VERTICAL;

      console.log(
        `Would create a ${splitDirection} split with tab ${tabToMove.title} relative to module ${targetGroupId}`,
      );
      // Example: updateWorkspace(createSplitLayout(currentWorkspace, targetGroupId, tabToMove, splitDirection, position));
      // For now, we're just logging.
    }
  };

  // Register this module with the component registry
  useEffect(() => {
    // This would typically be done when the module is first created
    // and would involve registering the module with the component registry
    // so it can be found and instantiated by the workspace manager

    return () => {
      // Cleanup when the module is destroyed
    };
  }, [moduleId]);

  return (
    <div className={`tab-module ${className || ''}`}>
      <VSCodeTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        onTabClose={removeTab}
        onTabDragEnd={handleTabDragEnd}
        onTabReorder={handleTabReorder} // Pass the reorder handler
        groupId={moduleId}
      />
    </div>
  );
};
