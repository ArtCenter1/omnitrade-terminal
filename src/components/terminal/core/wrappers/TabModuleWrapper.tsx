/**
 * TabModuleWrapper Component
 *
 * This component wraps existing terminal components with the TabModule to provide
 * tab functionality, allowing components to be draggable and droppable.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { TabModule } from '@/components/terminal/TabModule';
import { TabData } from '@/components/terminal/VSCodeTabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { IComponent } from '@/lib/component-registry';

/**
 * Creates a wrapper that adds tab functionality to any terminal component
 * @param WrappedComponent The component to wrap with tab functionality
 * @param defaultTitle The default title to use for the tab
 * @returns A new component with tab functionality
 */
export function withTabModule<P extends { id: string }>(
  WrappedComponent: React.ComponentType<P>,
  defaultTitle: string,
) {
  // Return a new component that wraps the provided component with TabModule
  return class WithTabModule extends React.Component<P> {
    private root: any = null;
    private container: HTMLElement | null = null;

    render() {
      // Create a tab with the wrapped component as content
      const tabs: TabData[] = [
        {
          id: `${this.props.id}-tab`,
          title: defaultTitle,
          content: <WrappedComponent {...this.props} />,
          closable: false, // Don't allow closing the main tab
        },
      ];

      return (
        <ErrorBoundary>
          <TabModule moduleId={`${this.props.id}-module`} initialTabs={tabs} />
        </ErrorBoundary>
      );
    }

    // Method to mount the component to a container
    mount(container: HTMLElement) {
      this.container = container;
      this.root = createRoot(container);
      this.root.render(this.render());
      return this;
    }

    // Method to unmount the component
    unmount() {
      if (this.root) {
        this.root.unmount();
        this.root = null;
        this.container = null;
      }
      return this;
    }
  };
}

/**
 * Enhances an existing component class with tab functionality
 * @param ComponentClass The component class to enhance
 * @param defaultTitle The default title for the tab
 * @returns The enhanced component class
 */
export function enhanceWithTabModule(
  ComponentClass: React.ComponentType<any> | any,
  defaultTitle: string,
) {
  // Store the original render method
  const originalRender = ComponentClass.prototype.onRender;
  const originalUpdate = ComponentClass.prototype.onUpdate;

  // Override the render method to wrap the component with TabModule
  ComponentClass.prototype.onRender = function () {
    if (!this.container) return;

    // Create a root for React rendering
    this.root = createRoot(this.container);

    // Create a tab with the component's content
    const tabs: TabData[] = [
      {
        id: `${this.props.id}-tab`,
        title: this.metadata.name || defaultTitle,
        content: this.renderContent(),
        closable: false,
      },
    ];

    // Render the TabModule with the component's content
    this.root.render(
      <ErrorBoundary>
        <TabModule
          moduleId={`${this.props.id}-module`}
          initialTabs={tabs}
          className="h-full"
        />
      </ErrorBoundary>,
    );
  };

  // Override the update method to update the TabModule
  ComponentClass.prototype.onUpdate = function () {
    if (!this.root || !this.container) return;

    // Create a tab with the updated component's content
    const tabs: TabData[] = [
      {
        id: `${this.props.id}-tab`,
        title: this.metadata.name || defaultTitle,
        content: this.renderContent(),
        closable: false,
      },
    ];

    // Update the TabModule with the component's content
    this.root.render(
      <ErrorBoundary>
        <TabModule
          moduleId={`${this.props.id}-module`}
          initialTabs={tabs}
          className="h-full"
        />
      </ErrorBoundary>,
    );
  };

  // Add a method to render the component's content
  ComponentClass.prototype.renderContent = function () {
    // This method should be implemented by the component
    // For now, we'll return a placeholder
    return <div>Component content</div>;
  };

  return ComponentClass;
}
