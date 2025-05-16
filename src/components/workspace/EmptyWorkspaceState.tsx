import React from 'react';
import { Button } from '../ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext'; // Added
import {
  LayoutItemType,
  ComponentLayoutItem,
  StackLayoutItem,
  ContainerLayoutItem,
  SplitDirection,
} from '@/lib/workspace'; // Added SplitDirection

interface EmptyWorkspaceStateProps {
  onOpenModuleSelector: () => void; // Changed: no event argument
}

const EmptyWorkspaceState: React.FC<EmptyWorkspaceStateProps> = ({
  onOpenModuleSelector,
}) => {
  const { currentWorkspace, updateWorkspace } = useWorkspace(); // Added

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const isModuleDrag = e.dataTransfer.types.includes('application/x-module');
    if (isModuleDrag) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[EmptyWorkspaceState] handleDrop triggered');

    if (!currentWorkspace) {
      console.error(
        '[EmptyWorkspaceState] No current workspace found for drop.',
      );
      return;
    }

    let dataText = e.dataTransfer.getData('application/x-module');
    if (!dataText) {
      console.warn(
        '[EmptyWorkspaceState] No application/x-module data, trying text/plain',
      );
      dataText = e.dataTransfer.getData('text/plain');
    }

    if (!dataText) {
      console.error('[EmptyWorkspaceState] No drag data found.');
      return;
    }

    console.log('[EmptyWorkspaceState] Received data:', dataText);
    let data;
    try {
      data = JSON.parse(dataText);
    } catch (parseError) {
      console.error(
        '[EmptyWorkspaceState] Failed to parse drag data JSON:',
        parseError,
      );
      return;
    }

    console.log('[EmptyWorkspaceState] Parsed data:', data);

    if (data.type === 'module' && data.moduleId) {
      const newComponentId = `component-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newStackId = `stack-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const newComponent: ComponentLayoutItem = {
        id: newComponentId,
        type: LayoutItemType.COMPONENT,
        componentId: data.moduleId,
        title: data.moduleName || 'New Module',
        componentState: {},
      };

      const newStack: StackLayoutItem = {
        id: newStackId,
        type: LayoutItemType.STACK,
        children: [newComponent],
        activeItemIndex: 0,
      };

      // If the current workspace root is null or not a container, or if it's an empty container,
      // we replace the root with the new stack.
      // This logic assumes that EmptyWorkspaceState is shown when the workspace is truly empty
      // or its root container has no children.
      if (
        !currentWorkspace.root ||
        (currentWorkspace.root.type === LayoutItemType.CONTAINER &&
          (currentWorkspace.root as ContainerLayoutItem).children.length === 0)
      ) {
        console.log(
          '[EmptyWorkspaceState] Workspace is empty, setting new stack as root.',
        );
        // Create a new root container to hold the stack
        const newRootContainer: ContainerLayoutItem = {
          id: `container-root-${Date.now()}`,
          type: LayoutItemType.CONTAINER,
          direction: SplitDirection.HORIZONTAL, // or 'vertical', doesn't matter much for a single stack
          children: [newStack],
          sizes: [100],
        };
        updateWorkspace({
          ...currentWorkspace,
          root: newRootContainer,
        });
      } else {
        // This case should ideally not be reached if EmptyWorkspaceState is only shown for truly empty workspaces.
        // If it can be shown in other scenarios, more complex logic to add to an existing layout would be needed here,
        // similar to what's in TerminalContainer's handleContainerDrop and addItemToContainer.
        // For now, we'll log an error as this implies an unexpected state.
        console.error(
          '[EmptyWorkspaceState] Drop occurred but workspace root is not empty or is not a container. This scenario is not fully handled here.',
        );
        // As a fallback, try to replace the root if it's not what we expect.
        // This is a simplistic recovery and might not be ideal for all cases.
        const newRootContainer: ContainerLayoutItem = {
          id: `container-root-${Date.now()}`,
          type: LayoutItemType.CONTAINER,
          direction: SplitDirection.HORIZONTAL,
          children: [newStack],
          sizes: [100],
        };
        updateWorkspace({
          ...currentWorkspace,
          root: newRootContainer,
        });
      }
    } else {
      console.warn(
        '[EmptyWorkspaceState] Dropped data is not a recognized module type or missing moduleId.',
      );
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center p-8 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Optional: A larger icon representing an empty state or workspace */}
      <svg
        className="w-20 h-20 text-neutral-300 dark:text-neutral-700 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M4 7c0-1.1.9-2 2-2h4M4 7l4 4M20 7c0-1.1-.9-2-2-2h-4M20 7l-4 4m0 0l-4-4m4 4v6a2 2 0 002 2h2"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 12h.01v.01h-.01V12zm0-4h.01v.01h-.01V8zm0 8h.01v.01h-.01V16z"
        />
      </svg>

      <h2 className="text-2xl font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
        Your workspace is empty
      </h2>
      <p className="mb-4 max-w-md">
        Click the button below or drag and drop modules onto the workspace to
        get started.
      </p>

      {/* Arrow/Line Indicator */}
      <div className="my-4">
        <svg
          className="w-10 h-10 text-blue-500 dark:text-blue-400 animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          ></path>
        </svg>
      </div>

      <Button
        variant="default" // Assuming 'default' or 'primary' variant exists
        size="lg"
        onClick={onOpenModuleSelector} // Changed: no event argument
      >
        Add Module
      </Button>
    </div>
  );
};

export default EmptyWorkspaceState;
