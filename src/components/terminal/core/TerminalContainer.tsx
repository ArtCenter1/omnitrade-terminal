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
  WorkspaceLayout
} from '@/lib/workspace';
import { componentRegistry } from '@/lib/component-registry';
import { ResizableSplitter } from '@/components/ui/resizable-splitter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Terminal Container Props
 */
interface TerminalContainerProps {
  className?: string;
}

/**
 * Terminal Container Component
 */
export const TerminalContainer: React.FC<TerminalContainerProps> = ({ className }) => {
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
      return <ContainerRenderer container={layout} />;
    case LayoutItemType.COMPONENT:
      return <ComponentRenderer component={layout} />;
    case LayoutItemType.STACK:
      return <StackRenderer stack={layout} />;
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
  const [dropPosition, setDropPosition] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);

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

  // Calculate initial sizes if not provided
  const initialSizes = sizes || children.map(() => 100 / children.length);

  // Handle container drag over
  function handleContainerDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    // Get container dimensions
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Determine drop position (left, right, top, bottom)
    // Create drop zones of 20% of the container size on each edge
    const edgeSize = 0.2;
    let position: 'left' | 'right' | 'top' | 'bottom' | null = null;

    if (x < width * edgeSize) {
      position = 'left';
    } else if (x > width * (1 - edgeSize)) {
      position = 'right';
    } else if (y < height * edgeSize) {
      position = 'top';
    } else if (y > height * (1 - edgeSize)) {
      position = 'bottom';
    }

    setDropTarget(container.id);
    setDropPosition(position);

    e.dataTransfer.dropEffect = 'move';
  }

  // Handle container drop
  function handleContainerDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Get the drag data
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      if (data.type === 'tab' && currentWorkspace && dropPosition) {
        // If we have all component data, we can create a new tab directly
        if (data.componentId && data.title) {
          // Create a new component item
          const newComponent: ComponentLayoutItem = {
            id: `component-${Date.now()}`,
            type: LayoutItemType.COMPONENT,
            componentId: data.componentId,
            title: data.title,
            componentState: data.componentState || {}
          };

          // Create a new stack for the component
          const newStack: StackLayoutItem = {
            id: `stack-${Date.now()}`,
            type: LayoutItemType.STACK,
            children: [newComponent],
            activeItemIndex: 0
          };

          // Handle the rest of the drop logic
          handleDropLogic(newStack);

          // If we have source stack info, remove the tab from there
          if (data.stackId && data.tabId) {
            // Find the source stack
            const sourceStack = findStackById(currentWorkspace.root, data.stackId);

            // Find the tab in the source stack
            const tabIndex = sourceStack?.children.findIndex(child => child.id === data.tabId) ?? -1;

            if (sourceStack && tabIndex !== -1) {
              // Remove the tab from the source stack
              const newSourceChildren = [...sourceStack.children];
              newSourceChildren.splice(tabIndex, 1);

              // Update the source stack
              const updatedSourceStack = {
                ...sourceStack,
                children: newSourceChildren,
                activeItemIndex: Math.min(sourceStack.activeItemIndex, newSourceChildren.length - 1)
              };

              // Update the workspace with the modified source stack
              updateWorkspace(updateStackInWorkspace(
                currentWorkspace,
                data.stackId,
                updatedSourceStack
              ));
            }
          }

          return;
        }

        // Traditional flow - find the source stack and move the tab
        if (data.stackId && data.tabId) {
          // Find the source stack
          const sourceStack = findStackById(currentWorkspace.root, data.stackId);

          // Find the tab in the source stack
          const tabIndex = sourceStack?.children.findIndex(child => child.id === data.tabId) ?? -1;

          if (sourceStack && tabIndex !== -1) {
            // Get the tab
            const tab = sourceStack.children[tabIndex];

            // Remove the tab from the source stack
            const newSourceChildren = [...sourceStack.children];
            newSourceChildren.splice(tabIndex, 1);

            // Update the source stack
            const updatedSourceStack = {
              ...sourceStack,
              children: newSourceChildren,
              activeItemIndex: Math.min(sourceStack.activeItemIndex, newSourceChildren.length - 1)
            };

            // Create a new stack for the tab
            const newStack: StackLayoutItem = {
              id: `stack-${Date.now()}`,
              type: LayoutItemType.STACK,
              children: [tab],
              activeItemIndex: 0
            };

            // Handle the drop logic
            handleDropLogic(newStack, updatedSourceStack, data.stackId);
          }
        }
      }
    } catch (error) {
      console.error('Error handling container drop:', error);
    }

    setDropTarget(null);
    setDropPosition(null);
  }

  // Handle the drop logic for creating/updating containers
  function handleDropLogic(
    newStack: StackLayoutItem,
    updatedSourceStack?: StackLayoutItem,
    sourceStackId?: string
  ) {
    if (!currentWorkspace || !dropPosition) return;

    // Determine the new container direction based on drop position
    const newDirection =
      dropPosition === 'left' || dropPosition === 'right'
        ? SplitDirection.HORIZONTAL
        : SplitDirection.VERTICAL;

    // Create a new container or update the existing one
    let updatedContainer: ContainerLayoutItem;

    if (container.direction === newDirection) {
      // If the container already has the right direction, just add the new stack
      const newChildren = [...container.children];
      const insertIndex = dropPosition === 'left' || dropPosition === 'top' ? 0 : newChildren.length;
      newChildren.splice(insertIndex, 0, newStack);

      // Calculate new sizes
      const newSizes = container.sizes
        ? [...container.sizes]
        : container.children.map(() => 100 / container.children.length);

      // Add size for the new child
      const newChildSize = 30; // 30% of the container
      const totalSize = newSizes.reduce((sum, size) => sum + size, 0);
      const sizeFactor = (totalSize - newChildSize) / totalSize;

      // Adjust existing sizes and add new size
      const adjustedSizes = newSizes.map(size => size * sizeFactor);
      if (dropPosition === 'left' || dropPosition === 'top') {
        adjustedSizes.unshift(newChildSize);
      } else {
        adjustedSizes.push(newChildSize);
      }

      updatedContainer = {
        ...container,
        children: newChildren,
        sizes: adjustedSizes
      };
    } else {
      // If the container has a different direction, create a new nested container
      const newNestedContainer: ContainerLayoutItem = {
        id: `container-${Date.now()}`,
        type: LayoutItemType.CONTAINER,
        direction: newDirection,
        children: dropPosition === 'left' || dropPosition === 'top'
          ? [newStack, ...container.children]
          : [...container.children, newStack],
        sizes: dropPosition === 'left' || dropPosition === 'top'
          ? [30, 70] // 30% for new stack, 70% for existing content
          : [70, 30] // 70% for existing content, 30% for new stack
      };

      updatedContainer = newNestedContainer;
    }

    // Start with the current workspace
    let updatedWorkspace = currentWorkspace;

    // If we have a source stack to update, do that first
    if (updatedSourceStack && sourceStackId) {
      updatedWorkspace = updateStackInWorkspace(
        updatedWorkspace,
        sourceStackId,
        updatedSourceStack
      );
    }

    // Update the container
    updatedWorkspace = updateContainerInWorkspace(
      updatedWorkspace,
      container.id,
      updatedContainer
    );

    // Update the workspace
    updateWorkspace(updatedWorkspace);
  }

  // Render drop indicators
  function renderDropIndicators(containerId: string) {
    if (dropTarget !== containerId || !dropPosition) {
      return null;
    }

    const indicatorStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      zIndex: 100
    };

    switch (dropPosition) {
      case 'left':
        return (
          <div
            style={{
              ...indicatorStyle,
              left: 0,
              top: 0,
              width: '20%',
              height: '100%'
            }}
          />
        );
      case 'right':
        return (
          <div
            style={{
              ...indicatorStyle,
              right: 0,
              top: 0,
              width: '20%',
              height: '100%'
            }}
          />
        );
      case 'top':
        return (
          <div
            style={{
              ...indicatorStyle,
              left: 0,
              top: 0,
              width: '100%',
              height: '20%'
            }}
          />
        );
      case 'bottom':
        return (
          <div
            style={{
              ...indicatorStyle,
              left: 0,
              bottom: 0,
              width: '100%',
              height: '20%'
            }}
          />
        );
      default:
        return null;
    }
  }

  // Update a container in the workspace
  function updateContainerInWorkspace(
    workspace: WorkspaceLayout,
    containerId: string,
    updatedContainer: ContainerLayoutItem
  ): WorkspaceLayout {
    const updateContainerInLayout = (layoutItem: LayoutItem): LayoutItem => {
      if (layoutItem.id === containerId) {
        return updatedContainer;
      }

      if (layoutItem.type === LayoutItemType.CONTAINER) {
        const container = layoutItem as ContainerLayoutItem;

        return {
          ...container,
          children: container.children.map(updateContainerInLayout)
        };
      }

      return layoutItem;
    };

    return {
      ...workspace,
      root: updateContainerInLayout(workspace.root) as ContainerLayoutItem
    };
  }

  // Find a stack by ID in the workspace
  function findStackById(
    layoutItem: LayoutItem,
    stackId: string
  ): StackLayoutItem | null {
    if (layoutItem.type === LayoutItemType.STACK && layoutItem.id === stackId) {
      return layoutItem as StackLayoutItem;
    }

    if (layoutItem.type === LayoutItemType.CONTAINER) {
      const container = layoutItem as ContainerLayoutItem;

      for (const child of container.children) {
        const result = findStackById(child, stackId);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

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
      <ResizableSplitter
        direction={direction === SplitDirection.HORIZONTAL ? 'horizontal' : 'vertical'}
        initialSizes={initialSizes}
        minSizes={children.map(child => {
          if (direction === SplitDirection.HORIZONTAL) {
            return child.minWidth || 10;
          } else {
            return child.minHeight || 10;
          }
        })}
        className="h-full"
      >
        {children.map((child, index) => (
          <div key={child.id} className="h-full">
            <ErrorBoundary>
              <LayoutRenderer layout={child} />
            </ErrorBoundary>
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
 */
const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component }) => {
  const { componentId, componentState, title } = component;
  const [error, setError] = useState<Error | null>(null);
  const componentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: any = null;
    let isMounted = true;

    const renderComponent = async () => {
      if (!componentContainerRef.current || !isMounted) {
        return;
      }

      try {
        // Check if component is registered
        if (!componentRegistry.hasComponent(componentId)) {
          throw new Error(`Component ${componentId} is not registered`);
        }

        // Create component instance
        instance = componentRegistry.createInstance(componentId);
        if (!instance) {
          throw new Error(`Failed to create instance of component ${componentId}`);
        }

        // Render component
        if (isMounted && componentContainerRef.current) {
          instance.render(componentContainerRef.current);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error rendering component ${componentId}:`, err);
          setError(err as Error);
        }
      }
    };

    // Start rendering
    renderComponent();

    // Clean up on unmount
    return () => {
      isMounted = false;

      // Use setTimeout to delay the disposal until after the current render cycle
      if (instance) {
        try {
          // Schedule disposal for the next tick to avoid React rendering conflicts
          setTimeout(() => {
            try {
              instance.dispose();
            } catch (err) {
              console.warn(`Error disposing component ${componentId}:`, err);
            }
          }, 0);
        } catch (err) {
          console.warn(`Error scheduling disposal for component ${componentId}:`, err);
        }
      }
    };
  }, [componentId, componentState]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full border border-red-700 rounded-md p-4">
        <p className="text-red-500 font-semibold">Error loading component</p>
        <p className="text-gray-400 text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {title && (
        <div className="bg-gray-800 px-3 py-1 text-sm font-medium border-b border-gray-700">
          {title}
        </div>
      )}
      <div ref={componentContainerRef} className="flex-1"></div>
    </div>
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
 */
const StackRenderer: React.FC<StackRendererProps> = ({ stack }) => {
  const { children, activeItemIndex, title } = stack;
  const [activeTab, setActiveTab] = useState<string>(
    children[activeItemIndex]?.id || (children[0]?.id || '')
  );
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const { currentWorkspace, updateWorkspace } = useWorkspace();

  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center h-full border border-dashed border-gray-700 rounded-md">
        <p className="text-gray-400">Empty stack</p>
      </div>
    );
  }

  // Handle tab drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    setIsDragging(true);
    setDraggedTab(tabId);

    // Set drag data
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'tab',
      stackId: stack.id,
      tabId,
      componentId: children.find(child => child.id === tabId)?.componentId,
      title: children.find(child => child.id === tabId)?.title,
      componentState: children.find(child => child.id === tabId)?.componentState
    }));

    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';

    // Create a drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = children.find(child => child.id === tabId)?.title || 'Tab';
    dragImage.className = 'bg-gray-800 text-white px-3 py-1 rounded opacity-70 absolute -left-[9999px]';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Remove the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // Handle tab drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle tab drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    try {
      // Get the drag data
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      if (data.type === 'tab' && data.stackId && data.tabId && currentWorkspace) {
        // Find the source stack
        const sourceStack = findStackById(currentWorkspace.root, data.stackId);

        // Find the tab in the source stack
        const tabIndex = sourceStack?.children.findIndex(child => child.id === data.tabId) ?? -1;

        if (sourceStack && tabIndex !== -1) {
          // Get the tab
          const tab = sourceStack.children[tabIndex];

          // If dropping on the same stack, reorder the tabs
          if (data.stackId === stack.id) {
            // Get the target index
            const targetIndex = Array.from(e.currentTarget.children).findIndex(
              child => child.contains(e.target as Node)
            );

            if (targetIndex !== -1 && targetIndex !== tabIndex) {
              // Create a new array of children with the tab moved to the new position
              const newChildren = [...sourceStack.children];
              newChildren.splice(tabIndex, 1);
              newChildren.splice(targetIndex, 0, tab);

              // Update the source stack
              const updatedSourceStack = {
                ...sourceStack,
                children: newChildren,
                activeItemIndex: targetIndex
              };

              // Update the workspace
              const updatedWorkspace = updateStackInWorkspace(
                currentWorkspace,
                data.stackId,
                updatedSourceStack
              );

              // Update the workspace
              updateWorkspace(updatedWorkspace);

              // Set the active tab
              setActiveTab(tab.id);
            }
          } else {
            // If dropping on a different stack, move the tab to the new stack
            // Remove the tab from the source stack
            const newSourceChildren = [...sourceStack.children];
            newSourceChildren.splice(tabIndex, 1);

            // Update the source stack
            const updatedSourceStack = {
              ...sourceStack,
              children: newSourceChildren,
              activeItemIndex: Math.min(sourceStack.activeItemIndex, newSourceChildren.length - 1)
            };

            // Add the tab to the target stack
            const newTargetChildren = [...stack.children, tab];

            // Update the target stack
            const updatedTargetStack = {
              ...stack,
              children: newTargetChildren,
              activeItemIndex: newTargetChildren.length - 1
            };

            // Update the workspace
            let updatedWorkspace = updateStackInWorkspace(
              currentWorkspace,
              data.stackId,
              updatedSourceStack
            );

            updatedWorkspace = updateStackInWorkspace(
              updatedWorkspace,
              stack.id,
              updatedTargetStack
            );

            // Update the workspace
            updateWorkspace(updatedWorkspace);

            // Set the active tab
            setActiveTab(tab.id);
          }
        }
      }
    } catch (error) {
      console.error('Error handling tab drop:', error);
    }

    setIsDragging(false);
    setDraggedTab(null);
  };

  // Handle tab drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTab(null);
  };

  // Find a stack by ID in the workspace
  const findStackById = (
    layoutItem: LayoutItem,
    stackId: string
  ): StackLayoutItem | null => {
    if (layoutItem.type === LayoutItemType.STACK && layoutItem.id === stackId) {
      return layoutItem as StackLayoutItem;
    }

    if (layoutItem.type === LayoutItemType.CONTAINER) {
      const container = layoutItem as ContainerLayoutItem;

      for (const child of container.children) {
        const result = findStackById(child, stackId);
        if (result) {
          return result;
        }
      }
    }

    return null;
  };

  // Update a stack in the workspace
  const updateStackInWorkspace = (
    workspace: WorkspaceLayout,
    stackId: string,
    updatedStack: StackLayoutItem
  ): WorkspaceLayout => {
    const updateStackInLayout = (layoutItem: LayoutItem): LayoutItem => {
      if (layoutItem.type === LayoutItemType.STACK && layoutItem.id === stackId) {
        return updatedStack;
      }

      if (layoutItem.type === LayoutItemType.CONTAINER) {
        const container = layoutItem as ContainerLayoutItem;

        return {
          ...container,
          children: container.children.map(updateStackInLayout)
        };
      }

      return layoutItem;
    };

    return {
      ...workspace,
      root: updateStackInLayout(workspace.root) as ContainerLayoutItem
    };
  };

  return (
    <div className="h-full flex flex-col">
      {title && (
        <div className="bg-gray-800 px-3 py-1 text-sm font-medium border-b border-gray-700">
          {title}
        </div>
      )}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList
          className="bg-gray-900 border-b border-gray-800 flex-wrap"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {children.map(child => (
            <TabsTrigger
              key={child.id}
              value={child.id}
              draggable
              onDragStart={(e) => handleDragStart(e, child.id)}
              onDragEnd={handleDragEnd}
              className={`cursor-move ${draggedTab === child.id ? 'opacity-50' : ''}`}
            >
              {child.title || 'Untitled'}
            </TabsTrigger>
          ))}
        </TabsList>
        {children.map(child => (
          <TabsContent
            key={child.id}
            value={child.id}
            className="flex-1 p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <ErrorBoundary>
              <ComponentRenderer component={child} />
            </ErrorBoundary>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
