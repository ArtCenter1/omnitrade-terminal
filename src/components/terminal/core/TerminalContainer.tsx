/**
 * Terminal Container
 *
 * The main container for the terminal application.
 * Handles workspace layout rendering and component instantiation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  LayoutItem,
  LayoutItemType,
  ContainerLayoutItem,
  ComponentLayoutItem,
  StackLayoutItem,
  SplitDirection,
  WorkspaceLayout,
} from '@/lib/workspace';
import { componentRegistry } from '@/lib/component-registry';
import { ResizableSplitter } from '@/components/ui/resizable-splitter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useTheme } from 'next-themes';

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
}

/**
 * Terminal Container Component
 */
export const TerminalContainer: React.FC<TerminalContainerProps> = ({
  className,
}) => {
  const { currentWorkspace } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No workspace selected</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`h-full w-full ${className || ''}`}>
      <ErrorBoundary>
        <LayoutRenderer layout={currentWorkspace.root} />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Layout Renderer Props
 */
interface LayoutRendererProps {
  layout: LayoutItem;
}

/**
 * Layout Renderer Component
 * Recursively renders the layout tree
 */
const LayoutRenderer: React.FC<LayoutRendererProps> = ({ layout }) => {
  switch (layout.type) {
    case LayoutItemType.CONTAINER:
      return <ContainerRenderer container={layout as ContainerLayoutItem} />;
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
}

/**
 * Container Renderer Component
 */
const ContainerRenderer: React.FC<ContainerRendererProps> = ({ container }) => {
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
      root: newRoot as ContainerLayoutItem,
    };
  }

  if (children.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full border border-dashed border-gray-700 rounded-md"
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
        onDragLeave={() => {
          setDropTarget(null);
          setDropPosition(null);
        }}
      >
        <p className="text-gray-400">Drop components here</p>
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
          <LayoutRenderer layout={children[0]} />
        </ErrorBoundary>
        {renderDropIndicators(container.id)}
      </div>
    );
  }

  const initialSizes = sizes || children.map(() => 100 / children.length);

  function handleContainerDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    let dragType = 'unknown';
    const isModuleDrag = e.dataTransfer.types.includes(
      'application/omnitrade-module',
    );
    if (isModuleDrag) dragType = 'module';
    else if (e.dataTransfer.effectAllowed === 'move') dragType = 'tab';

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { width, height } = rect;
    const edgeSize = 0.2;
    let position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null = null;
    const allowCenterDrop = children.length === 0 || dragType === 'module';

    if (x < width * edgeSize) position = 'left';
    else if (x > width * (1 - edgeSize)) position = 'right';
    else if (y < height * edgeSize) position = 'top';
    else if (y > height * (1 - edgeSize)) position = 'bottom';
    else if (allowCenterDrop) position = 'center';

    setDropTarget(container.id);
    setDropPosition(position);
    e.dataTransfer.dropEffect = 'move';
  }

  function handleContainerDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const isModuleDrop = e.dataTransfer.types.includes(
        'application/omnitrade-module',
      );
      if (isModuleDrop && currentWorkspace) {
        const moduleId = e.dataTransfer.getData('application/omnitrade-module');
        if (moduleId) {
          let moduleName = 'New Module';
          try {
            const dataText = e.dataTransfer.getData('text/plain');
            if (dataText)
              moduleName = JSON.parse(dataText).moduleName || moduleName;
          } catch (err) {
            console.warn('Could not parse module name');
          }
          const newComponent: ComponentLayoutItem = {
            id: `component-${Date.now()}`,
            type: LayoutItemType.COMPONENT,
            componentId: moduleId,
            title: moduleName,
            componentState: {},
          };
          const newStack: StackLayoutItem = {
            id: `stack-${Date.now()}`,
            type: LayoutItemType.STACK,
            children: [newComponent],
            activeItemIndex: 0,
          };
          addItemToContainer(container, newStack, dropPosition);
          return;
        }
      }
      const dataText = e.dataTransfer.getData('text/plain');
      if (!dataText) return console.error('No drag data found');
      const data = JSON.parse(dataText);

      if (data.type === 'module' && currentWorkspace) {
        // Fallback
        if (data.moduleId) {
          const newComponent: ComponentLayoutItem = {
            id: `component-${Date.now()}`,
            type: LayoutItemType.COMPONENT,
            componentId: data.moduleId,
            title: data.moduleName || 'New Module',
            componentState: {},
          };
          const newStack: StackLayoutItem = {
            id: `stack-${Date.now()}`,
            type: LayoutItemType.STACK,
            children: [newComponent],
            activeItemIndex: 0,
          };
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
    setDropTarget(null);
    setDropPosition(null);
  }

  function addItemToContainer(
    targetContainer: ContainerLayoutItem,
    item: LayoutItem,
    position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null,
  ) {
    if (!currentWorkspace) return;
    if (
      !position ||
      (position === 'center' && targetContainer.children.length === 0)
    ) {
      const updatedContainer: ContainerLayoutItem = {
        ...targetContainer,
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
        }
        return;
      }
      const newContainer: ContainerLayoutItem = {
        id: `container-${Date.now()}`,
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL,
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
      const newChildren = [...targetContainer.children];
      const insertIndex =
        position === 'left' || position === 'top' ? 0 : newChildren.length;
      newChildren.splice(insertIndex, 0, item);
      const newSizes = targetContainer.sizes
        ? [...targetContainer.sizes]
        : targetContainer.children.map(
            () => 100 / (targetContainer.children.length || 1),
          );
      const newChildSize = 30;
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
      const newContainer: ContainerLayoutItem = {
        id: `container-${Date.now()}`,
        type: LayoutItemType.CONTAINER,
        direction: splitDirection,
        children:
          position === 'left' || position === 'top'
            ? [item, { ...targetContainer }]
            : [{ ...targetContainer }, item],
        sizes: [30, 70],
      };
      const parentContainer = findParentContainer(
        currentWorkspace.root,
        targetContainer.id,
      );
      if (parentContainer) {
        const childIndex = parentContainer.children.findIndex(
          (c) => c.id === targetContainer.id,
        );
        if (childIndex !== -1) {
          const newParentChildren = [...parentContainer.children];
          newParentChildren[childIndex] = newContainer;
          const updatedParentContainer: ContainerLayoutItem = {
            ...parentContainer,
            children: newParentChildren,
          };
          updateWorkspace(
            updateContainerInWorkspace(
              currentWorkspace,
              parentContainer.id,
              updatedParentContainer,
            ),
          );
        }
      } else if (currentWorkspace.root.id === targetContainer.id) {
        updateWorkspace({ ...currentWorkspace, root: newContainer });
      }
    }
  }

  function handleDropLogic(
    item: LayoutItem,
    sourceStack?: StackLayoutItem,
    sourceStackId?: string,
  ) {
    if (!currentWorkspace || !dropPosition) return;
    let updatedWs = { ...currentWorkspace };
    if (sourceStack && sourceStackId) {
      updatedWs = updateStackInWorkspace(updatedWs, sourceStackId, sourceStack);
    }
    addItemToContainer(container, item, dropPosition);
  }

  function renderDropIndicators(containerId: string) {
    if (dropTarget !== containerId || !dropPosition) return null;
    const base = 'absolute bg-blue-500 opacity-50 pointer-events-none';
    let style: React.CSSProperties = {};
    if (dropPosition === 'left')
      style = { left: 0, top: 0, bottom: 0, width: '50%' };
    else if (dropPosition === 'right')
      style = { right: 0, top: 0, bottom: 0, width: '50%' };
    else if (dropPosition === 'top')
      style = { top: 0, left: 0, right: 0, height: '50%' };
    else if (dropPosition === 'bottom')
      style = { bottom: 0, left: 0, right: 0, height: '50%' };
    else if (dropPosition === 'center')
      style = { top: '25%', left: '25%', width: '50%', height: '50%' };
    else return null;
    return <div className={base} style={style} />;
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
        const updatedChildren = currentStack.children.map((child) => {
          const updatedChild = updateContainerInLayout(child);
          if (updatedChild.type === LayoutItemType.COMPONENT) {
            // Or other valid child types of a stack
            return updatedChild as ComponentLayoutItem;
          }
          console.warn(
            "A non-component item found in stack's children during updateContainerInLayout",
            updatedChild,
          );
          return child;
        });
        return { ...currentStack, children: updatedChildren };
      }
      return layoutItem;
    };
    const newRoot = updateContainerInLayout(workspace.root);
    return { ...workspace, root: newRoot as ContainerLayoutItem };
  }

  function findParentContainer(
    layoutItem: LayoutItem,
    childId: string,
  ): ContainerLayoutItem | null {
    if (layoutItem.type === LayoutItemType.CONTAINER) {
      const c = layoutItem as ContainerLayoutItem;
      if (c.children.some((child) => child.id === childId)) return c;
      for (const child of c.children) {
        const parent = findParentContainer(child, childId);
        if (parent) return parent;
      }
    }
    return null;
  }

  return (
    <div
      className="h-full w-full flex"
      style={{
        flexDirection:
          direction === SplitDirection.HORIZONTAL ? 'row' : 'column',
      }}
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
        minSizes={children.map(() => 5)}
        // onResize prop removed to fix TS error. Verify correct prop if resizing logic is needed.
        // onLayoutChange={(newSizes) => { // Example: if prop is onLayoutChange
        //   if (currentWorkspace) {
        //     const updatedContainer = { ...container, sizes: newSizes };
        //     updateWorkspace(updateContainerInWorkspace(currentWorkspace, container.id, updatedContainer));
        //   }
        // }}
      >
        {children.map((child) => (
          <div key={child.id} className="h-full w-full relative">
            <ErrorBoundary>
              <LayoutRenderer layout={child} />
            </ErrorBoundary>
            {renderDropIndicators(container.id)}
          </div>
        ))}
      </ResizableSplitter>
      {renderDropIndicators(container.id)}
    </div>
  );
};

interface ComponentRendererProps {
  component: ComponentLayoutItem;
}
const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component }) => {
  const ref = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any | null>(null); // IComponent
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    const renderComponent = async () => {
      if (ref.current && !instanceRef.current) {
        try {
          const instance = componentRegistry.createInstance(
            component.componentId,
          );
          if (instance && isMounted) {
            instanceRef.current = instance;
            // `createInstance` handles initialization, so we don't call instance.initialize() here.
            // It might return a promise if init is async, but registry handles that.
            // For now, assume instance is ready or will be by the time render is called.

            while (ref.current?.firstChild)
              ref.current.removeChild(ref.current.firstChild);

            // If createInstance's initialize is async and not awaited by registry,
            // we might need to await it here or ensure registry makes it ready.
            // Assuming instance is ready to render:
            if (ref.current) {
              // Check ref.current again before rendering
              instance.render(ref.current);
            }

            if (instance.onThemeChanged)
              instance.onThemeChanged(theme === 'dark' ? 'dark' : 'light');
            if (component.componentState && instance.onSettingsChanged)
              instance.onSettingsChanged(component.componentState);
          } else if (!instance && isMounted) {
            console.error(
              `Failed to create instance for component ${component.componentId}`,
            );
            if (ref.current)
              ref.current.innerHTML = `<div class="p-4 text-red-500">Error creating: ${component.title}</div>`;
          }
        } catch (error) {
          console.error(
            `Error in ComponentRenderer for ${component.componentId}:`,
            error,
          );
          if (ref.current && isMounted)
            ref.current.innerHTML = `<div class="p-4 text-red-500">Error: ${component.title}</div>`;
        }
      }
    };
    renderComponent();
    return () => {
      isMounted = false;
      if (instanceRef.current) {
        try {
          instanceRef.current.dispose();
        } catch (e) {
          console.error(`Error disposing ${component.componentId}:`, e);
        }
        instanceRef.current = null;
      }
    };
  }, [component.id, component.componentId, component.componentState, theme]);

  useEffect(() => {
    if (instanceRef.current?.onSettingsChanged && component.componentState) {
      instanceRef.current.onSettingsChanged(component.componentState);
    }
  }, [component.componentState]);

  useEffect(() => {
    if (instanceRef.current?.onThemeChanged) {
      instanceRef.current.onThemeChanged(theme === 'dark' ? 'dark' : 'light');
    }
  }, [theme]);

  return (
    <div ref={ref} id={component.id} className="h-full w-full component-host" />
  );
};

interface StackRendererProps {
  stack: StackLayoutItem;
}
const StackRenderer: React.FC<StackRendererProps> = ({ stack }) => {
  const { id, children, activeItemIndex } = stack;
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dropTargetTab, setDropTargetTab] = useState<string | null>(null);

  if (!children || children.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Empty Stack
      </div>
    );
  }

  const activeTabId = children[activeItemIndex]?.id || children[0]?.id;

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    tabId: string,
  ) => {
    const tabData = children.find((c) => c.id === tabId) as
      | ComponentLayoutItem
      | undefined;
    if (tabData) {
      const payload = {
        type: 'tab',
        tabId,
        stackId: id,
        componentId: tabData.componentId,
        title: tabData.title,
        componentState: tabData.componentState,
      };
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
      setDraggedTab(tabId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target as HTMLElement;
    const tabTrigger = target.closest('[role="tab"]');
    if (tabTrigger) {
      const tabIdAttr =
        tabTrigger.getAttribute('data-state') === 'active'
          ? activeTabId
          : tabTrigger.getAttribute('aria-controls')?.replace('-content', '');
      if (tabIdAttr && tabIdAttr !== draggedTab) setDropTargetTab(tabIdAttr);
      else setDropTargetTab(null);
    } else setDropTargetTab(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dataText = e.dataTransfer.getData('text/plain');
    if (!dataText || !currentWorkspace) return;
    try {
      const data = JSON.parse(dataText);
      if (data.type === 'tab' && data.stackId !== id && dropTargetTab) {
        const sourceStack = findStackById(currentWorkspace.root, data.stackId);
        const sourceTabIndex =
          sourceStack?.children.findIndex((c) => c.id === data.tabId) ?? -1;
        if (sourceStack && sourceTabIndex !== -1) {
          const tabToMove = sourceStack.children[
            sourceTabIndex
          ] as ComponentLayoutItem;
          const updatedSourceChildren = sourceStack.children.filter(
            (c) => c.id !== data.tabId,
          );
          const updatedSourceStack: StackLayoutItem = {
            ...sourceStack,
            children: updatedSourceChildren,
            activeItemIndex: Math.max(0, updatedSourceChildren.length - 1),
          };
          const targetTabIndex = children.findIndex(
            (c) => c.id === dropTargetTab,
          );
          const newTargetChildren = [...children];
          newTargetChildren.splice(
            targetTabIndex !== -1 ? targetTabIndex : children.length,
            0,
            tabToMove,
          );
          const updatedTargetStack: StackLayoutItem = {
            ...stack,
            children: newTargetChildren,
            activeItemIndex: newTargetChildren.findIndex(
              (c) => c.id === tabToMove.id,
            ),
          };
          let tempWorkspace = updateStackInWorkspace(
            currentWorkspace,
            id,
            updatedTargetStack,
          );
          tempWorkspace = updateStackInWorkspace(
            tempWorkspace,
            data.stackId,
            updatedSourceStack,
          );
          updateWorkspace(tempWorkspace);
        }
      } else if (
        data.type === 'tab' &&
        data.stackId === id &&
        draggedTab &&
        dropTargetTab &&
        draggedTab !== dropTargetTab
      ) {
        const draggedIdx = children.findIndex((c) => c.id === draggedTab);
        const targetIdx = children.findIndex((c) => c.id === dropTargetTab);
        if (draggedIdx !== -1 && targetIdx !== -1) {
          const newChildren = [...children];
          const [item] = newChildren.splice(draggedIdx, 1);
          newChildren.splice(targetIdx, 0, item);
          const updatedStack: StackLayoutItem = {
            ...stack,
            children: newChildren,
            activeItemIndex: targetIdx,
          };
          updateWorkspace(
            updateStackInWorkspace(currentWorkspace, id, updatedStack),
          );
        }
      }
    } catch (err) {
      console.error('Error handling tab drop:', err);
    }
    setDraggedTab(null);
    setDropTargetTab(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    setDraggedTab(null);
    setDropTargetTab(null);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      setDropTargetTab(null);
  };

  const updateStackInWorkspace = (
    workspace: WorkspaceLayout,
    stackIdToUpdate: string,
    updatedStackData: StackLayoutItem,
  ): WorkspaceLayout => {
    const updateLayout = (layoutItem: LayoutItem): LayoutItem => {
      if (
        layoutItem.id === stackIdToUpdate &&
        layoutItem.type === LayoutItemType.STACK
      ) {
        return updatedStackData;
      }
      if (layoutItem.type === LayoutItemType.CONTAINER) {
        const currentContainer = layoutItem as ContainerLayoutItem;
        return {
          ...currentContainer,
          children: currentContainer.children.map(updateLayout),
        };
      }
      if (layoutItem.type === LayoutItemType.STACK) {
        const currentStack = layoutItem as StackLayoutItem;
        const updatedChildren = currentStack.children.map((child) => {
          const updatedChild = updateLayout(child);
          if (updatedChild.type === LayoutItemType.COMPONENT) {
            return updatedChild as ComponentLayoutItem;
          }
          console.warn(
            "A non-component item found in stack's children during StackRenderer's updateLayout",
            updatedChild,
          );
          return child;
        });
        return { ...currentStack, children: updatedChildren };
      }
      return layoutItem;
    };
    const newRoot = updateLayout(workspace.root);
    return { ...workspace, root: newRoot as ContainerLayoutItem };
  };

  return (
    <div className="h-full flex flex-col bg-theme-secondary theme-transition">
      <Tabs
        value={activeTabId}
        onValueChange={(tabId) => {
          const newActiveIndex = children.findIndex(
            (child) => child.id === tabId,
          );
          if (newActiveIndex !== -1 && currentWorkspace) {
            const updatedStack = { ...stack, activeItemIndex: newActiveIndex };
            updateWorkspace(
              updateStackInWorkspace(currentWorkspace, id, updatedStack),
            );
          }
        }}
        className="flex flex-col flex-grow"
      >
        <TabsList
          className="bg-theme-secondary border-b border-theme-border justify-start"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
        >
          {children.map((child) => (
            <TabsTrigger
              key={child.id}
              value={child.id}
              draggable
              onDragStart={(e) => handleDragStart(e, child.id)}
              onDragEnd={handleDragEnd}
              className={`px-3 py-1.5 text-xs ${dropTargetTab === child.id ? 'bg-blue-500 text-white' : ''}`}
              style={{ opacity: draggedTab === child.id ? 0.5 : 1 }}
            >
              {(child as ComponentLayoutItem).title ||
                (child as ComponentLayoutItem).componentId}
            </TabsTrigger>
          ))}
        </TabsList>
        {children.map((child) => (
          <TabsContent
            key={child.id}
            value={child.id}
            className="flex-grow overflow-auto"
          >
            <ErrorBoundary>
              <LayoutRenderer layout={child} />
            </ErrorBoundary>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
