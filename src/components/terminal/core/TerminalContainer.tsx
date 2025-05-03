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
  SplitDirection 
} from '@/lib/workspace';
import { componentRegistry } from '@/lib/component-registry';
import { ResizableSplitter } from '@/components/ui/resizable-splitter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <LayoutRenderer layout={currentWorkspace.root} />
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
  
  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center h-full border border-dashed border-gray-700 rounded-md">
        <p className="text-gray-400">Empty container</p>
      </div>
    );
  }
  
  if (children.length === 1) {
    return <LayoutRenderer layout={children[0]} />;
  }
  
  // Calculate initial sizes if not provided
  const initialSizes = sizes || children.map(() => 100 / children.length);
  
  return (
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
          <LayoutRenderer layout={child} />
        </div>
      ))}
    </ResizableSplitter>
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
    if (!componentContainerRef.current) {
      return;
    }
    
    try {
      // Check if component is registered
      if (!componentRegistry.hasComponent(componentId)) {
        throw new Error(`Component ${componentId} is not registered`);
      }
      
      // Create component instance
      const instance = componentRegistry.createInstance(componentId);
      if (!instance) {
        throw new Error(`Failed to create instance of component ${componentId}`);
      }
      
      // Render component
      instance.render(componentContainerRef.current);
      
      // Clean up on unmount
      return () => {
        instance.dispose();
      };
    } catch (err) {
      console.error(`Error rendering component ${componentId}:`, err);
      setError(err as Error);
    }
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
  
  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center h-full border border-dashed border-gray-700 rounded-md">
        <p className="text-gray-400">Empty stack</p>
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="bg-gray-900 border-b border-gray-800">
          {children.map(child => (
            <TabsTrigger key={child.id} value={child.id}>
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
            <ComponentRenderer component={child} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
