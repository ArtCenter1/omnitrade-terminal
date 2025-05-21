/**
 * Terminal Container
 *
 * The main container for the terminal application.
 * Handles workspace layout rendering and component instantiation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../../../contexts/WorkspaceContext'; // Adjusted for potential deeper structure
import {
  LayoutItem,
  LayoutItemType,
  ContainerLayoutItem,
  ComponentLayoutItem,
  StackLayoutItem,
  SplitDirection,
  WorkspaceLayout,
} from '../../../lib/workspace'; // Adjusted
import { componentRegistry } from '../../../lib/component-registry'; // Adjusted
import { ResizableSplitter } from '../../ui/resizable-splitter'; // Adjusted
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'; // Adjusted
import { ErrorBoundary } from '../../ui/error-boundary'; // Adjusted
import { useTheme } from 'next-themes';
import EmptyWorkspaceState from '../../workspace/EmptyWorkspaceState'; // Corrected import
import '../../../../src/styles/vscode-tabs.css'; // Import the new CSS file

// Helper function to find a stack by ID - moved to a shared scope
function findStackById(
  layoutItem: LayoutItem,
  stackId: string,
): StackLayoutItem | null {
  if (layoutItem.type === LayoutItemType.STACK && layoutItem.id === stackId) {
    return layoutItem as StackLayoutItem;
  }
  if (layoutItem.type === LayoutItemType.CONTAINER) {
    const container = layoutItem as ContainerLayoutItem;
    for (const child of container.children) {
      const found = findStackById(child, stackId);
      if (found) return found;
    }
  }
  // Stacks directly contain ComponentLayoutItems, not other stacks for this search logic
  return null;
}

/**
 * Terminal Container Props
 */
interface TerminalContainerProps {
  className?: string;
  onOpenModuleSelector: (e: React.MouseEvent<HTMLButtonElement>) => void; // Added
}

/**
 * Terminal Container Component
 */
export const TerminalContainer: React.FC<TerminalContainerProps> = ({
  className,
  onOpenModuleSelector, // Added
}) => {
  const { currentWorkspace } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentWorkspace) {
    // If there's no workspace, and the EmptyWorkspaceState is intended to be shown
    // by the parent (TerminalWorkspace), we might need to render EmptyWorkspaceState here directly
    // or ensure TerminalWorkspace handles this. For now, assuming TerminalWorkspace
    // might show its own empty state or controls if no currentWorkspace.
    // However, if currentWorkspace.root is empty, LayoutRenderer will handle EmptyWorkspaceState.
    return (
      <div className="flex items-center justify-center h-full">
        {/* Pass onOpenModuleSelector to a potential EmptyWorkspaceState if rendered here */}
        {/* <EmptyWorkspaceState onOpenModuleSelector={onOpenModuleSelector} /> */}
        <p className="text-gray-400">
          No workspace selected (or workspace root is missing)
        </p>
      </div>
    );
  }

  // If currentWorkspace.root is null/undefined, it means an empty workspace.
  // The ContainerRenderer (when its children are empty) will render EmptyWorkspaceState.
  // We need to pass onOpenModuleSelector down to it.
  if (!currentWorkspace.root) {
    // This case should ideally be handled by ensuring currentWorkspace always has a root,
    // even if it's an empty container. If root can be null, render EmptyWorkspaceState directly.
    return (
      <div ref={containerRef} className={`h-full w-full ${className || ''}`}>
        <EmptyWorkspaceState
          onOpenModuleSelector={() => onOpenModuleSelector(undefined as any)}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`h-full w-full ${className || ''}`}>
      <ErrorBoundary>
        <LayoutRenderer
          layout={currentWorkspace.root}
          onOpenModuleSelector={onOpenModuleSelector}
        />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Layout Renderer Props
 */
interface LayoutRendererProps {
  layout: LayoutItem;
  onOpenModuleSelector: (e: React.MouseEvent<HTMLButtonElement>) => void; // Added
}

/**
 * Layout Renderer Component
 * Recursively renders the layout tree
 */
const LayoutRenderer: React.FC<LayoutRendererProps> = ({
  layout,
  onOpenModuleSelector,
}) => {
  // Added prop
  switch (layout.type) {
    case LayoutItemType.CONTAINER:
      return (
        <ContainerRenderer
          container={layout as ContainerLayoutItem}
          onOpenModuleSelector={onOpenModuleSelector}
        />
      );
    case LayoutItemType.COMPONENT:
      return <ComponentRenderer component={layout as ComponentLayoutItem} />;
    case LayoutItemType.STACK:
      return <StackRenderer stack={layout as StackLayoutItem} />;
    default:
      return <div>Unknown layout type</div>;
  }
};

/**
 * Container Renderer Props
 */
interface ContainerRendererProps {
  container: ContainerLayoutItem;
  onOpenModuleSelector: (e: React.MouseEvent<HTMLButtonElement>) => void; // Added
}

/**
 * Container Renderer Component
 */
const ContainerRenderer: React.FC<ContainerRendererProps> = ({
  container,
  onOpenModuleSelector,
}) => {
  // Added prop
  const { children, direction, sizes } = container;
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<
    'left' | 'right' | 'top' | 'bottom' | 'center' | null
  >(null);

  // Helper function to update a stack within the workspace layout
  function updateStackInWorkspace(
    workspace: WorkspaceLayout,
    stackId: string,
    updatedStack: StackLayoutItem,
  ): WorkspaceLayout {
    const updateStackInLayout = (layoutItem: LayoutItem): LayoutItem => {
      if (
        layoutItem.id === stackId &&
        layoutItem.type === LayoutItemType.STACK
      ) {
        return updatedStack;
      }
      if (layoutItem.type === LayoutItemType.CONTAINER) {
        const currentContainer = layoutItem as ContainerLayoutItem;
        return {
          ...currentContainer,
          children: currentContainer.children.map(updateStackInLayout),
        };
      }
      if (layoutItem.type === LayoutItemType.STACK) {
        const currentStack = layoutItem as StackLayoutItem;
        const updatedChildren = currentStack.children.map((child) => {
          const updatedChild = updateStackInLayout(child);
          // Ensure that children of a stack are ComponentLayoutItems
          if (updatedChild.type === LayoutItemType.COMPONENT) {
            return updatedChild as ComponentLayoutItem;
          }
          // This case should ideally not happen if layout is well-formed
          console.warn(
            "A non-component item found in stack's children during updateStackInLayout",
            updatedChild,
          );
          return child; // or handle error appropriately
        });
        return {
          ...currentStack,
          children: updatedChildren,
        };
      }
      return layoutItem;
    };
    const newRoot = updateStackInLayout(workspace.root);
    return {
      ...workspace,
      root: newRoot as ContainerLayoutItem, // Ensure root is ContainerLayoutItem
    };
  }

  if (children.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full border border-dashed border-gray-700 rounded-md relative"
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
        onDragLeave={() => {
          setDropTarget(null);
          setDropPosition(null);
        }}
      >
        <EmptyWorkspaceState
          onOpenModuleSelector={() => onOpenModuleSelector(undefined as any)}
        />
        {renderDropIndicators(container.id)}
      </div>
    );
  }

  if (children.length === 1) {
    return (
      <div
        className="h-full relative"
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
        onDragLeave={() => {
          setDropTarget(null);
          setDropPosition(null);
        }}
      >
        <ErrorBoundary>
          <LayoutRenderer
            layout={children[0]}
            onOpenModuleSelector={onOpenModuleSelector}
          />
        </ErrorBoundary>
        {renderDropIndicators(container.id)}
      </div>
    );
  }

  const initialSizes = sizes || children.map(() => 100 / children.length);

  function handleContainerDragOver(e: React.DragEvent<HTMLDivElement>) {
    console.log('onDragOver triggered in TerminalContainer'); // Added logging
    e.preventDefault();
    e.stopPropagation();
    let dragType = 'unknown';
    const isModuleDrag = e.dataTransfer.types.includes(
      'application/x-module', // Point 1: Fix mismatched drag data type identifier
    );
    if (isModuleDrag) dragType = 'module';
    else if (e.dataTransfer.effectAllowed === 'move') dragType = 'tab';

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { width, height } = rect;
    const edgeSize = 0.2; // 20% of width/height for edge detection
    let position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null = null;
    const allowCenterDrop = children.length === 0 || dragType === 'module';

    if (x < width * edgeSize) position = 'left';
    else if (x > width * (1 - edgeSize)) position = 'right';
    else if (y < height * edgeSize) position = 'top';
    else if (y > height * (1 - edgeSize)) position = 'bottom';
    else if (allowCenterDrop) position = 'center'; // Only allow center drop if container is empty or dragging a module

    setDropTarget(container.id);
    setDropPosition(position);
    e.dataTransfer.dropEffect = 'move';
  }

  function handleContainerDrop(e: React.DragEvent<HTMLDivElement>) {
    console.log('onDrop triggered in TerminalContainer'); // Added logging
    e.preventDefault();
    e.stopPropagation();
    console.log('[TerminalContainer] handleContainerDrop triggered');
    setDropTarget(null); // Clear visual indicators immediately
    setDropPosition(null);

    try {
      // Prioritize 'application/x-module', fallback to 'text/plain'
      let dataText = e.dataTransfer.getData('application/x-module');
      let dataType = 'application/x-module';
      if (!dataText) {
        dataText = e.dataTransfer.getData('text/plain');
        dataType = 'text/plain';
        console.log(
          '[TerminalContainer] No application/x-module data, falling back to text/plain',
        );
      }

      if (!dataText) {
        console.error(
          '[TerminalContainer] No drag data found in application/x-module or text/plain.',
        );
        return;
      }

      console.log(`[TerminalContainer] Received data (${dataType}):`, dataText);
      let data;
      try {
        data = JSON.parse(dataText); // Point 4: Robust error handling for JSON.parse
      } catch (parseError) {
        console.error(
          '[TerminalContainer] Failed to parse drag data JSON. Raw data:',
          dataText,
          'Error:',
          parseError,
        );
        return; // Prevent further processing if JSON is invalid
      }
      console.log('[TerminalContainer] Parsed data:', data);

      if (data.type === 'module' && currentWorkspace) {
        console.log('[TerminalContainer] Handling module drop...');
        if (data.moduleId) {
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
          console.log(
            '[TerminalContainer] Created new stack for module:',
            newStack,
          );
          addItemToContainer(container, newStack, dropPosition);
          return;
        }
      } else if (data.type === 'tab' && currentWorkspace && dropPosition) {
        if (data.componentId && data.title) {
          // Dropping a fully defined tab
          const newComponent: ComponentLayoutItem = {
            id: `component-${Date.now()}`,
            type: LayoutItemType.COMPONENT,
            componentId: data.componentId,
            title: data.title,
            componentState: data.componentState || {},
          };
          const newStack: StackLayoutItem = {
            id: `stack-${Date.now()}`,
            type: LayoutItemType.STACK,
            children: [newComponent],
            activeItemIndex: 0,
          };
          handleDropLogic(newStack);
          if (data.stackId && data.tabId) {
            // Remove from source
            const sourceStack = findStackById(
              currentWorkspace.root,
              data.stackId,
            );
            if (sourceStack) {
              const tabIndex = sourceStack.children.findIndex(
                (c) => c.id === data.tabId,
              );
              if (tabIndex !== -1) {
                const newSourceChildren = sourceStack.children.filter(
                  (c) => c.id !== data.tabId,
                );
                const updatedSourceStack: StackLayoutItem = {
                  ...sourceStack,
                  children: newSourceChildren,
                  activeItemIndex: Math.min(
                    sourceStack.activeItemIndex,
                    newSourceChildren.length - 1,
                  ),
                };
                updateWorkspace(
                  updateStackInWorkspace(
                    currentWorkspace,
                    data.stackId,
                    updatedSourceStack,
                  ),
                );
              }
            }
          }
          return;
        }
        if (data.stackId && data.tabId) {
          // Moving existing tab
          const sourceStack = findStackById(
            currentWorkspace.root,
            data.stackId,
          );
          if (sourceStack) {
            const tabIndex = sourceStack.children.findIndex(
              (c) => c.id === data.tabId,
            );
            if (tabIndex !== -1) {
              const tab = sourceStack.children[tabIndex];
              const newSourceChildren = sourceStack.children.filter(
                (c) => c.id !== data.tabId,
              );
              const updatedSourceStack: StackLayoutItem = {
                ...sourceStack,
                children: newSourceChildren,
                activeItemIndex: Math.min(
                  sourceStack.activeItemIndex,
                  newSourceChildren.length - 1,
                ),
              };
              const newStack: StackLayoutItem = {
                id: `stack-${Date.now()}`,
                type: LayoutItemType.STACK,
                children: [tab],
                activeItemIndex: 0,
              };
              handleDropLogic(newStack, updatedSourceStack, data.stackId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling container drop:', error);
    }
    // Indicators cleared at the start now
  }

  function addItemToContainer(
    targetContainer: ContainerLayoutItem,
    item: LayoutItem,
    position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null,
  ) {
    console.log('[TerminalContainer] addItemToContainer called:');
    console.log('  > Target Container ID:', targetContainer.id);
    console.log('  > Item to Add:', item);
    console.log('  > Position:', position);

    if (!currentWorkspace) return;

    if (
      !position ||
      (position === 'center' && targetContainer.children.length === 0)
    ) {
      console.log(
        '[TerminalContainer] Adding item directly to container children (empty or no position)',
      );
      const updatedContainer: ContainerLayoutItem = {
        ...targetContainer,
        // Ensure sizes are recalculated if needed, or handle appropriately
        children: [...targetContainer.children, item],
      };
      updateWorkspace(
        updateContainerInWorkspace(
          currentWorkspace,
          targetContainer.id,
          updatedContainer,
        ),
      );
      return;
    }
    const splitDirection =
      position === 'left' || position === 'right'
        ? SplitDirection.HORIZONTAL
        : SplitDirection.VERTICAL;

    if (position === 'center' && targetContainer.children.length > 0) {
      let activeChild = targetContainer.children[0];
      if (activeChild.type === LayoutItemType.STACK) {
        const stack = activeChild as StackLayoutItem;
        if (
          item.type === LayoutItemType.STACK &&
          (item as StackLayoutItem).children.length > 0
        ) {
          console.log(
            '[TerminalContainer] Adding component to existing stack (center drop)',
          );
          const updatedStack: StackLayoutItem = {
            ...stack,
            children: [
              ...stack.children,
              (item as StackLayoutItem).children[0] as ComponentLayoutItem,
            ],
            activeItemIndex: stack.children.length,
          };
          updateWorkspace(
            updateStackInWorkspace(currentWorkspace, stack.id, updatedStack),
          );
        } else {
          console.error(
            'Dropped item is not a valid stack or has no children to add to existing stack.',
          );
          return; // Avoid further processing if item is invalid
        }
        return;
      }
      const newContainer: ContainerLayoutItem = {
        id: `container-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL, // Default to horizontal for center drop into non-stack
        children: [activeChild, item],
        sizes: [50, 50],
      };
      const updatedChildren = [...targetContainer.children];
      updatedChildren[targetContainer.children.indexOf(activeChild)] =
        newContainer;
      const updatedTargetContainer: ContainerLayoutItem = {
        ...targetContainer,
        children: updatedChildren,
      };
      updateWorkspace(
        updateContainerInWorkspace(
          currentWorkspace,
          targetContainer.id,
          updatedTargetContainer,
        ),
      );
      return;
    }
    if (targetContainer.direction === splitDirection) {
      console.log(
        '[TerminalContainer] Adding item to container with matching split direction',
      );
      const newChildren = [...targetContainer.children];
      const insertIndex =
        position === 'left' || position === 'top' ? 0 : newChildren.length;
      newChildren.splice(insertIndex, 0, item);
      const newSizes = targetContainer.sizes
        ? [...targetContainer.sizes]
        : targetContainer.children.map(
            () => 100 / (targetContainer.children.length || 1),
          );
      const newChildSize = 30; // New item takes 30% of the space
      const totalSize = newSizes.reduce((s, sz) => s + sz, 0);
      const sizeFactor =
        totalSize > 0 ? (totalSize - newChildSize) / totalSize : 0;
      const adjustedSizes = newSizes.map((s) => s * sizeFactor);
      if (position === 'left' || position === 'top')
        adjustedSizes.unshift(newChildSize);
      else adjustedSizes.push(newChildSize);
      const updatedContainer: ContainerLayoutItem = {
        ...targetContainer,
        children: newChildren,
        sizes: adjustedSizes,
      };
      updateWorkspace(
        updateContainerInWorkspace(
          currentWorkspace,
          targetContainer.id,
          updatedContainer,
        ),
      );
    } else {
      // Split direction differs, wrap the existing container
      console.log(
        '[TerminalContainer] Wrapping container due to different split direction',
      );
      const newOuterContainer: ContainerLayoutItem = {
        // Renamed for clarity from previous thinking step, matching original intent if 'newContainer' was used
        id: `container-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
        type: LayoutItemType.CONTAINER,
        direction: splitDirection,
        children:
          position === 'left' || position === 'top'
            ? [item, { ...targetContainer }]
            : [{ ...targetContainer }, item],
        sizes: [30, 70], // New item takes 30%, existing takes 70%
      };
      const parentContainer = findParentContainer(
        currentWorkspace.root,
        targetContainer.id,
      );
      if (parentContainer) {
        const updatedParentChildren = parentContainer.children.map((child) =>
          child.id === targetContainer.id ? container : child,
        );
        const updatedParent: ContainerLayoutItem = {
          ...parentContainer,
          children: updatedParentChildren,
        };
        updateWorkspace(
          updateContainerInWorkspace(
            currentWorkspace,
            parentContainer.id,
            updatedParent,
          ),
        );
      } else {
        // This means targetContainer is the root
        updateWorkspace({ ...currentWorkspace, root: container });
      }
    }
  }

  function handleDropLogic(
    newItem: StackLayoutItem,
    sourceStackUpdate?: StackLayoutItem,
    sourceStackId?: string,
  ) {
    if (!currentWorkspace || !dropPosition) return;
    addItemToContainer(container, newItem, dropPosition);
    if (sourceStackUpdate && sourceStackId) {
      updateWorkspace(
        updateStackInWorkspace(
          currentWorkspace,
          sourceStackId,
          sourceStackUpdate,
        ),
      );
    }
  }

  function renderDropIndicators(containerId: string) {
    const currentDropPosition =
      dropTarget === containerId ? dropPosition : null;
    if (currentDropPosition) {
      let indicatorClass =
        'absolute bg-blue-500 opacity-50 pointer-events-none';
      switch (currentDropPosition) {
        case 'left':
          indicatorClass += ' left-0 top-0 w-1/2 h-full';
          break;
        case 'right':
          indicatorClass += ' right-0 top-0 w-1/2 h-full';
          break;
        case 'top':
          indicatorClass += ' left-0 top-0 w-full h-1/2';
          break;
        case 'bottom':
          indicatorClass += ' left-0 bottom-0 w-full h-1/2';
          break;
        case 'center':
          // For center, we might want a different visual, e.g., highlight the whole container
          // or a smaller central area. For now, let's make it a smaller central square.
          indicatorClass +=
            ' left-1/4 top-1/4 w-1/2 h-1/2 border-4 border-blue-600 bg-blue-500 opacity-30';
          break;
      }
      return <div className={indicatorClass}></div>;
    }
    return null;
  }

  function updateContainerInWorkspace(
    workspace: WorkspaceLayout,
    containerId: string,
    updatedContainer: ContainerLayoutItem,
  ): WorkspaceLayout {
    const updateContainerInLayout = (layoutItem: LayoutItem): LayoutItem => {
      if (
        layoutItem.id === containerId &&
        layoutItem.type === LayoutItemType.CONTAINER
      ) {
        return updatedContainer;
      }
      if (layoutItem.type === LayoutItemType.CONTAINER) {
        const currentContainer = layoutItem as ContainerLayoutItem;
        return {
          ...currentContainer,
          children: currentContainer.children.map(updateContainerInLayout),
        };
      }
      if (layoutItem.type === LayoutItemType.STACK) {
        const currentStack = layoutItem as StackLayoutItem;
        // Stacks don't directly contain containers in this logic, so no recursive call needed for stack children
        // However, if a stack's component could somehow render a container, this might need adjustment.
        // For now, assuming stacks only contain components.
        const updatedChildren = currentStack.children.map((child) => {
          const updatedChild = updateContainerInLayout(child); // This line might be problematic if child is not a container
          if (updatedChild.type === LayoutItemType.COMPONENT) {
            return updatedChild as ComponentLayoutItem;
          }
          // This case should ideally not happen if layout is well-formed
          console.warn(
            "A non-component item found in stack's children during updateContainerInLayout",
            updatedChild,
          );
          return child; // or handle error appropriately
        });
        return {
          ...currentStack,
          children: updatedChildren,
        };
      }
      return layoutItem;
    };
    const newRoot = updateContainerInLayout(workspace.root);
    return {
      ...workspace,
      root: newRoot as ContainerLayoutItem, // Ensure root is ContainerLayoutItem
    };
  }

  function findParentContainer(
    layoutItem: LayoutItem,
    childId: string,
  ): ContainerLayoutItem | null {
    if (layoutItem.type === LayoutItemType.CONTAINER) {
      const containerItem = layoutItem as ContainerLayoutItem;
      if (containerItem.children.some((child) => child.id === childId)) {
        return containerItem;
      }
      for (const child of containerItem.children) {
        const found = findParentContainer(child, childId);
        if (found) return found;
      }
    }
    // Stacks do not contain other containers directly in this model
    return null;
  }

  return (
    <div
      className={`flex h-full w-full relative ${direction === SplitDirection.HORIZONTAL ? 'flex-row' : 'flex-col'}`}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      onDragLeave={() => {
        setDropTarget(null);
        setDropPosition(null);
      }}
    >
      <ResizableSplitter
        direction={direction}
        initialSizes={initialSizes}
        minSizes={[50]} // Minimum size for a pane in pixels
        onSizesChange={(newSizes) => {
          if (currentWorkspace) {
            const updatedContainer: ContainerLayoutItem = {
              ...container,
              sizes: newSizes,
            };
            updateWorkspace(
              updateContainerInWorkspace(
                currentWorkspace,
                container.id,
                updatedContainer,
              ),
            );
          }
        }}
      >
        {children.map((child) => (
          <div
            key={child.id}
            className="h-full w-full overflow-hidden relative"
          >
            <ErrorBoundary>
              <LayoutRenderer
                layout={child}
                onOpenModuleSelector={onOpenModuleSelector}
              />
            </ErrorBoundary>
            {/* Drop indicators for individual children might be complex here, handled by container level */}
          </div>
        ))}
      </ResizableSplitter>
      {renderDropIndicators(container.id)}
    </div>
  );
};

/**
 * Component Renderer Props
 */
interface ComponentRendererProps {
  component: ComponentLayoutItem;
}

/**
 * Component Renderer Component
 * Renders a single component based on its ID
 */
const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component }) => {
  const [RenderedComponent, setRenderedComponent] =
    useState<React.ComponentType<any> | null>(null);
  const { theme } = useTheme(); // For passing theme to components if needed

  useEffect(() => {
    // Dynamically load the component
    const renderComponent = async () => {
      try {
        const comp = componentRegistry[component.componentId];
        if (comp && comp.load) {
          const LoadedComponent = await comp.load();
          // Check if LoadedComponent is a module with a default export (common in dynamic imports)
          if (LoadedComponent && LoadedComponent.default) {
            setRenderedComponent(() => LoadedComponent.default);
          } else if (LoadedComponent) {
            setRenderedComponent(() => LoadedComponent);
          } else {
            console.error(
              `Component with ID \"${component.componentId}\" could not be loaded or is not a valid component.`,
            );
            setRenderedComponent(() => () => (
              <div>
                Error loading component:{' '}
                {component.title || component.componentId}
              </div>
            ));
          }
        } else {
          console.error(
            `Component with ID \"${component.componentId}\" not found in registry or has no load function.`,
          );
          setRenderedComponent(() => () => (
            <div>
              Component not found: {component.title || component.componentId}
            </div>
          ));
        }
      } catch (error) {
        console.error(
          `Error loading component \"${component.componentId}\":`,
          error,
        );
        setRenderedComponent(() => () => (
          <div>
            Error loading component: {component.title || component.componentId}
          </div>
        ));
      }
    };

    renderComponent();

    // Cleanup function if needed
    return () => {
      // Perform any cleanup, e.g., if the component had subscriptions
    };
  }, [component.componentId, component.title]); // Re-run if componentId changes

  // Effect for handling component state updates (if any)
  useEffect(() => {
    // This is a placeholder for potential future state management logic within components
    // For example, if components could save/load their internal state via props or context
  }, [component.componentState]);

  // Effect for theme changes, if components need to react to it directly
  useEffect(() => {
    // Pass theme to component if it accepts a theme prop, or handle via CSS variables
  }, [theme]);

  if (!RenderedComponent) {
    return <div>Loading {component.title || component.componentId}...</div>; // Or a spinner
  }

  return (
    <ErrorBoundary fallback={<div>Error in {component.title}</div>}>
      <RenderedComponent {...(component.componentState || {})} />
    </ErrorBoundary>
  );
};

/**
 * Stack Renderer Props
 */
interface StackRendererProps {
  stack: StackLayoutItem;
}

/**
 * Stack Renderer Component
 * Renders a stack of components as tabs
 */
const StackRenderer: React.FC<StackRendererProps> = ({ stack }) => {
  const { children, activeItemIndex, id: stackId } = stack;
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const [draggedTab, setDraggedTab] = useState<ComponentLayoutItem | null>(
    null,
  );
  const [dropTargetInfo, setDropTargetInfo] = useState<{
    targetStackId: string;
    position: 'before' | 'after' | 'in'; // 'in' means add to this stack
    targetTabId?: string; // if position is 'before' or 'after' a specific tab
  } | null>(null);
  interface DropIndicatorInfo {
    targetTabId: string; // ID of the tab before/after which to show indicator
    position: 'before' | 'after';
  }
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorInfo | null>(null);


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const dataText = e.dataTransfer.getData('text/plain');
    let isSameStackDrag = false;
    if (dataText) {
      try {
        const data = JSON.parse(dataText);
        if (data.type === 'tab' && data.stackId === stackId) {
          isSameStackDrag = true;
        }
      } catch (err) {
        // Ignore parsing error, not a valid tab drag for this purpose
      }
    }

    if (e.dataTransfer.types.includes('application/omnitrade-tab')) {
      e.dataTransfer.dropEffect = 'move';
      if (isSameStackDrag) {
        const currentTargetTabElement = (e.target as HTMLElement).closest('[role="tab"]');
        if (currentTargetTabElement) {
          const rect = currentTargetTabElement.getBoundingClientRect();
          const isBefore = e.clientX < rect.left + rect.width / 2;
          const targetTabId = currentTargetTabElement.getAttribute('data-value');
          if (targetTabId && targetTabId !== draggedTab?.id) { // Don't show indicator on the dragged tab itself
            setDropIndicator({ targetTabId, position: isBefore ? 'before' : 'after' });
          } else {
            setDropIndicator(null);
          }
        } else {
          // Potentially indicate dropping at the end of the list if over TabsList but not a specific tab
          // For now, clear if not directly over a tab. If TabsList has padding, this might clear too often.
          // A more robust solution for end-of-list drop might involve checking bounds of TabsList itself.
          setDropIndicator(null);
        }
      } else {
        setDropIndicator(null); // Tab from another stack
      }
      // For general dropTargetInfo (e.g. highlighting whole stack for inter-stack drop)
      // This logic might need refinement if we want BOTH a line indicator AND a stack highlight
      setDropTargetInfo({ targetStackId: stackId, position: 'in' });
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDropIndicator(null);
      setDropTargetInfo(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndicator(null); // Clear line indicator
    setDropTargetInfo(null); // Clear general stack highlight/info
    setDraggedTab(null);

    if (!currentWorkspace) return;

    const dataText = e.dataTransfer.getData('text/plain');
    if (!dataText) return;

    try {
      const data = JSON.parse(dataText);
      if (data.type === 'tab' && data.tabId && data.stackId) {
        if (data.stackId === stackId) {
          // Reordering within the same stack
          const sourceTabIndex = children.findIndex(c => c.id === data.tabId);
          if (sourceTabIndex === -1) {
            console.error("Dragged tab not found in source stack's children for reordering.");
            return; 
          }

          const draggedTabComponent = children[sourceTabIndex];

          // Determine target index
          let targetTabIndex = children.length -1; // Default to end of the list (if not dropping on a specific tab)

          // Attempt to find the actual target tab trigger element
          // e.target might be a child of the button, so use closest to find the tab trigger
          const directTargetElement = e.target as HTMLElement;
          const targetTabTrigger = directTargetElement.closest('[role="tab"]') as HTMLElement | null;

          if (targetTabTrigger) {
            const targetTabIdAttr = targetTabTrigger.getAttribute('data-value'); // Radix UI uses data-value for TabsTrigger value
            if (targetTabIdAttr) {
              const preliminaryTargetIndex = children.findIndex(c => c.id === targetTabIdAttr);
              if (preliminaryTargetIndex !== -1) {
                const rect = targetTabTrigger.getBoundingClientRect();
                const isBefore = e.clientX < rect.left + rect.width / 2;
                
                if (preliminaryTargetIndex === sourceTabIndex) {
                    // Dropping on itself
                    targetTabIndex = isBefore ? preliminaryTargetIndex : preliminaryTargetIndex + 1;
                } else {
                    targetTabIndex = isBefore ? preliminaryTargetIndex : preliminaryTargetIndex + 1;
                }
              }
            }
          } else {
            // Fallback: If not dropping directly on a tab (e.g., empty space in TabsList beyond current tabs),
            // determine if the drop is to the far left or far right of the tab list.
            // This part could be refined by checking e.clientX against the TabsList bounding rect.
            // For now, if not on a specific tab, it defaults to adding at the end or near the source if it's a no-op.
            // The default targetTabIndex (children.length - 1) handles adding to the end.
            // If sourceTabIndex is already at the end, and we are not dropping on a specific tab,
            // it might be a no-op or place it just before the end.
            // For now, the existing default of children.length - 1 is a reasonable fallback.
          }
          
          const newChildren = [...children];
          newChildren.splice(sourceTabIndex, 1); // Remove from old position
          
          // Adjust targetTabIndex because the array is now shorter
          // if the tab was moved from before the target's original position.
          if (sourceTabIndex < targetTabIndex && targetTabIndex > 0) { // check targetTabIndex > 0 for safety
            targetTabIndex--; 
          }
          
          // Ensure targetTabIndex is within bounds
          if (targetTabIndex < 0) targetTabIndex = 0;
          if (targetTabIndex > newChildren.length) targetTabIndex = newChildren.length;

          newChildren.splice(targetTabIndex, 0, draggedTabComponent); // Add to new position

          const updatedStack: StackLayoutItem = {
            ...stack,
            children: newChildren,
            activeItemIndex: targetTabIndex, // Make the moved tab active
          };

          const newWorkspace = updateStackInWorkspace(currentWorkspace, stackId, updatedStack);
          updateWorkspace(newWorkspace);
          return; 
        }

        // Find source stack and the tab being moved
        const sourceStack = findStackById(currentWorkspace.root, data.stackId);
        if (!sourceStack) return;

        const tabToMoveIndex = sourceStack.children.findIndex(
          (c) => c.id === data.tabId,
        );
        if (tabToMoveIndex === -1) return;

        const tabToMove = sourceStack.children[tabToMoveIndex];

        // Remove tab from source stack
        const newSourceChildren = sourceStack.children.filter(
          (c) => c.id !== data.tabId,
        );
        const updatedSourceStack: StackLayoutItem = {
          ...sourceStack,
          children: newSourceChildren,
          activeItemIndex: Math.max(
            0,
            Math.min(sourceStack.activeItemIndex, newSourceChildren.length - 1),
          ),
        };

        // Add tab to target stack (this stack)
        const newTargetChildren = [...children, tabToMove];
        const updatedTargetStack: StackLayoutItem = {
          ...stack,
          children: newTargetChildren,
          activeItemIndex: newTargetChildren.length - 1, // Activate the new tab
        };

        // Update workspace: first the source, then the target
        let tempWorkspace = updateStackInWorkspace(
          currentWorkspace,
          sourceStack.id,
          updatedSourceStack,
        );
        if (updatedSourceStack.children.length === 0) {
          // If source stack becomes empty, remove it or handle as per design
          // This might involve finding the parent container and removing the stack
          console.log(
            `Stack ${sourceStack.id} is now empty. Consider removal logic.`,
          );
          // For now, we'll leave it empty. A more robust solution would remove it.
        }

        tempWorkspace = updateStackInWorkspace(
          tempWorkspace,
          stackId,
          updatedTargetStack,
        );
        updateWorkspace(tempWorkspace);
      }
    } catch (error) {
      console.error('Error handling stack drop:', error);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Clear drop indicator if not dragging over a valid target within this stack
    // Check if the relatedTarget (where the mouse entered) is outside the TabsList
    const currentTarget = e.currentTarget as HTMLElement; // This is the TabsList
    const relatedTarget = e.relatedTarget as HTMLElement | null;

    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDropIndicator(null);
      setDropTargetInfo(null); // Also clear general stack highlight
    }
  };

  if (!children || children.length === 0) {
    // This case should ideally be handled by allowing drop into an empty stack
    // or by ensuring stacks always have at least one child (even a placeholder)
    // For now, render a message or a drop zone
    return (
      <div
        className="flex items-center justify-center h-full border border-dashed border-gray-700 rounded-md p-4"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        <p className="text-gray-400">Empty Stack - Drop Tabs Here</p>
        {dropTargetInfo && dropTargetInfo.targetStackId === stackId && (
          <div className="absolute inset-0 bg-blue-500 opacity-30 pointer-events-none"></div>
        )}
      </div>
    );
  }

  const activeTabId = children[activeItemIndex]?.id;

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    tab: ComponentLayoutItem,
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    // Ensure componentState is included, even if empty, for consistency.
    const componentState = tab.componentState || {};
    const dragData = {
      type: 'tab',
      tabId: tab.id,
      stackId: stackId,
      componentId: tab.componentId,
      title: tab.title,
      componentState: componentState,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.setData('application/omnitrade-tab', tab.id); // Custom type for tab identification
    setDraggedTab(tab);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    setDraggedTab(null);
    setDropIndicator(null);
    setDropTargetInfo(null);
  };

  const updateStackInWorkspace = (
    workspace: WorkspaceLayout,
    targetStackId: string,
    updatedStack: StackLayoutItem,
  ): WorkspaceLayout => {
    const updateLayout = (layoutItem: LayoutItem): LayoutItem => {
      if (
        layoutItem.type === LayoutItemType.STACK &&
        layoutItem.id === targetStackId
      ) {
        return updatedStack;
      }
      if (layoutItem.type === LayoutItemType.CONTAINER) {
        const container = layoutItem as ContainerLayoutItem;
        return {
          ...container,
          children: container.children.map(updateLayout),
        };
      }
      // If layoutItem is a STACK but not the target, recurse on its children if they could be containers (not typical)
      // Or, if it's a component, just return it.
      if (layoutItem.type === LayoutItemType.STACK) {
        const currentStack = layoutItem as StackLayoutItem;
        const updatedChildren = currentStack.children.map((child) => {
          const updatedChild = updateLayout(child); // This line might be problematic if child is not a container
          if (updatedChild.type === LayoutItemType.COMPONENT) {
            return updatedChild as ComponentLayoutItem;
          }
          console.warn(
            "A non-component item found in stack's children during updateStackInWorkspace (StackRenderer)",
            updatedChild,
          );
          return child;
        });
        return {
          ...currentStack,
          children: updatedChildren,
        };
      }
      return layoutItem;
    };

    const newRoot = updateLayout(workspace.root);
    return {
      ...workspace,
      root: newRoot as ContainerLayoutItem, // Assuming root is always a container
    };
  };

  return (
    <div className="h-full flex flex-col bg-theme-secondary theme-transition">
      <Tabs
        value={activeTabId}
        onValueChange={(tabId) => {
          if (currentWorkspace) {
            const newActiveIndex = children.findIndex((c) => c.id === tabId);
            if (newActiveIndex !== -1) {
              const updatedStack: StackLayoutItem = {
                ...stack,
                activeItemIndex: newActiveIndex,
              };
              updateWorkspace(
                updateStackInWorkspace(currentWorkspace, stackId, updatedStack),
              );
            }
          }
        }}
        className="flex flex-col flex-grow"
      >
        <TabsList
          className="flex-shrink-0 bg-theme-secondary-hover theme-transition p-1 rounded-none border-b border-theme-divider"
          onDragOver={handleDragOver} // Allow dropping onto the tab list area
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
        >
          {children.map((child) => (
            <React.Fragment key={child.id}>
              {dropIndicator && dropIndicator.targetTabId === child.id && dropIndicator.position === 'before' && (
                <div className="drop-indicator-before" />
              )}
              <TabsTrigger
                key={child.id} // Keep key on TabsTrigger for React's reconciliation
                value={child.id}
                draggable
                onDragStart={(e) => handleDragStart(e, child)}
                onDragEnd={handleDragEnd}
                // Add onDragOver to individual tabs if needed for more precise indicator control,
                // but TabsList onDragOver should be mostly sufficient.
                // onDragOver={(e) => {
                //   // This could allow setting indicator if directly over a tab button,
                //   // potentially more reliable than e.target in TabsList's onDragOver.
                //   // However, this also means more event handlers.
                // }}
                className={`relative px-3 py-1.5 text-xs rounded-sm theme-transition 
                  data-[state=active]:bg-theme-primary data-[state=active]:text-theme-primary-foreground 
                  hover:bg-theme-accent hover:text-theme-accent-foreground
                  ${draggedTab?.id === child.id ? 'opacity-50' : ''}`}
              >
                {child.title || 'Untitled Tab'}
              </TabsTrigger>
              {dropIndicator && dropIndicator.targetTabId === child.id && dropIndicator.position === 'after' && (
                <div className="drop-indicator-after" />
              )}
            </React.Fragment>
          ))}
        </TabsList>
        {children.map((child) => (
          <TabsContent
            key={child.id}
            value={child.id}
            className="flex-grow overflow-auto bg-theme-background theme-transition p-0 data-[state=inactive]:hidden"
          >
            <ErrorBoundary fallback={<div>Error in {child.title}</div>}>
              <ComponentRenderer component={child} />
            </ErrorBoundary>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
