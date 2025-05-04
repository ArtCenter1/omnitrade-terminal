/**
 * Alerts Panel Wrapper
 * 
 * A wrapper for the Alerts Panel component that implements the IComponent interface.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Alerts Panel Component Props
 */
interface AlertsPanelComponentProps extends BaseTerminalComponentProps {
  // No additional props needed yet
}

/**
 * Alerts Panel Component State
 */
interface AlertsPanelComponentState {
  isLoading: boolean;
  error: Error | null;
}

/**
 * Simple Alerts Panel Component
 * This is a placeholder implementation until a real alerts panel is implemented
 */
const SimpleAlertsPanel: React.FC = () => {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Price Alerts</h3>
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          New Alert
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
          <div>
            <div className="flex items-center">
              <Bell className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="font-medium">BTC/USDT</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">Price above $65,000</div>
          </div>
          <div className="text-sm text-gray-400">Created 2h ago</div>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
          <div>
            <div className="flex items-center">
              <Bell className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="font-medium">ETH/USDT</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">Price below $3,000</div>
          </div>
          <div className="text-sm text-gray-400">Created 1d ago</div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-400">
        Alerts are saved locally and will trigger notifications in the browser.
      </div>
    </div>
  );
};

/**
 * Alerts Panel Component React Implementation
 */
const AlertsPanelComponentReact: React.FC<AlertsPanelComponentProps> = ({ 
  id
}) => {
  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary>
        <SimpleAlertsPanel />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Alerts Panel Component Class
 */
export class AlertsPanelComponent extends BaseTerminalComponent<AlertsPanelComponentProps, AlertsPanelComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: AlertsPanelComponentProps = { id: 'alerts-panel' }) {
    super(
      {
        id: 'alerts-panel',
        name: 'Alerts Panel',
        description: 'Displays and manages price alerts',
        version: '1.0.0',
        category: 'market',
        tags: ['alerts', 'notifications', 'price'],
        settings: []
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null
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
    this.root.render(
      <AlertsPanelComponentReact
        id={this.props.id}
      />
    );
  }
  
  /**
   * Update the component
   */
  protected onUpdate(): void {
    if (!this.root || !this.container) return;
    
    // Update the React component
    this.root.render(
      <AlertsPanelComponentReact
        id={this.props.id}
      />
    );
  }
  
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
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return AlertsPanelComponentReact;
  }
}
