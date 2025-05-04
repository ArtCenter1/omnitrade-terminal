/**
 * Demo Component
 * 
 * A simple component for demonstrating the drag-and-drop functionality.
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from './BaseTerminalComponent';

/**
 * Demo Component Props
 */
interface DemoComponentProps extends BaseTerminalComponentProps {
  color?: string;
  title?: string;
}

/**
 * Demo Component State
 */
interface DemoComponentState {
  isLoading: boolean;
  error: Error | null;
  color: string;
  counter: number;
}

/**
 * Demo Component React Implementation
 */
const DemoComponentReact: React.FC<DemoComponentProps & { 
  counter: number;
  onIncrement: () => void;
}> = ({ 
  id, 
  color = '#673ab7',
  title = 'Demo Component',
  counter,
  onIncrement
}) => {
  return (
    <div className="h-full flex flex-col">
      <div 
        className="p-4 flex-1 flex flex-col items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <div 
          className="w-16 h-16 rounded-full mb-4 flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: color }}
        >
          {counter}
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">ID: {id}</p>
        <button
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          onClick={onIncrement}
        >
          Increment Counter
        </button>
        <p className="mt-4 text-sm text-gray-400">
          Drag this tab to reorder or create split views
        </p>
      </div>
    </div>
  );
};

/**
 * Available colors for demo components
 */
const DEMO_COLORS = [
  '#673ab7', // Purple
  '#2196f3', // Blue
  '#4caf50', // Green
  '#ff9800', // Orange
  '#e91e63', // Pink
  '#00bcd4', // Cyan
  '#ff5722', // Deep Orange
  '#9c27b0', // Deep Purple
];

/**
 * Get a random color from the available colors
 */
function getRandomColor(): string {
  return DEMO_COLORS[Math.floor(Math.random() * DEMO_COLORS.length)];
}

/**
 * Demo Component Class
 */
export class DemoComponent extends BaseTerminalComponent<DemoComponentProps, DemoComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: DemoComponentProps = { id: 'demo' }) {
    super(
      {
        id: 'demo-component',
        name: 'Demo Component',
        description: 'A simple component for demonstrating the drag-and-drop functionality',
        version: '1.0.0',
        category: 'demo',
        tags: ['demo', 'test'],
        settings: [
          {
            key: 'color',
            type: 'color',
            label: 'Color',
            description: 'The color of the component',
            defaultValue: '#673ab7'
          },
          {
            key: 'title',
            type: 'string',
            label: 'Title',
            description: 'The title of the component',
            defaultValue: 'Demo Component'
          }
        ]
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null,
      color: props.color || getRandomColor(),
      counter: 0
    };
  }
  
  /**
   * Initialize the component
   */
  protected async onInitialize(): Promise<void> {
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 300));
    this.componentState.isLoading = false;
  }
  
  /**
   * Render the component
   */
  protected onRender(): void {
    if (!this.container) return;
    
    // Create a root for React rendering
    this.root = createRoot(this.container);
    
    // Render the React component
    this.renderComponent();
  }
  
  /**
   * Update the component
   */
  protected onUpdate(): void {
    if (!this.root || !this.container) return;
    
    // Update the React component
    this.renderComponent();
  }
  
  /**
   * Render the React component
   */
  private renderComponent(): void {
    this.root.render(
      <DemoComponentReact
        id={this.props.id}
        color={this.componentState.color}
        title={this.props.title}
        counter={this.componentState.counter}
        onIncrement={this.handleIncrement}
      />
    );
  }
  
  /**
   * Handle increment button click
   */
  private handleIncrement = (): void => {
    this.componentState.counter += 1;
    this.onUpdate();
  };
  
  /**
   * Dispose the component
   */
  protected onDispose(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
  
  /**
   * Handle settings changes
   */
  public onSettingsChanged(settings: Record<string, any>): void {
    if (settings.color) {
      this.componentState.color = settings.color;
    }
    
    if (settings.title) {
      this.props.title = settings.title;
    }
    
    this.onUpdate();
  }
  
  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return DemoComponentReact;
  }
}
