/**
 * Chart Component
 * 
 * A sample chart component that can be registered with the component registry.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from './BaseTerminalComponent';

/**
 * Chart Component Props
 */
interface ChartComponentProps extends BaseTerminalComponentProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
}

/**
 * Chart Component State
 */
interface ChartComponentState {
  isLoading: boolean;
  error: Error | null;
  symbol: string;
  interval: string;
}

/**
 * Chart Component React Implementation
 */
const ChartComponentReact: React.FC<ChartComponentProps> = ({ 
  id, 
  symbol = 'BTCUSDT', 
  interval = '1h',
  theme = 'dark'
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 p-2 border-b border-gray-700 flex items-center justify-between">
        <div className="font-medium">{symbol}</div>
        <div className="text-sm text-gray-400">{interval}</div>
      </div>
      <div className="flex-1 bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">
          Chart Component (ID: {id})
          <div className="text-sm mt-2">
            This is a placeholder for the actual chart implementation.
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Chart Component Class
 */
export class ChartComponent extends BaseTerminalComponent<ChartComponentProps, ChartComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: ChartComponentProps = { id: 'chart' }) {
    super(
      {
        id: 'chart-component',
        name: 'Chart Component',
        description: 'Displays price charts for trading pairs',
        version: '1.0.0',
        category: 'charts',
        tags: ['trading', 'price', 'analysis'],
        settings: [
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTCUSDT)',
            defaultValue: 'BTCUSDT'
          },
          {
            key: 'interval',
            type: 'select',
            label: 'Interval',
            description: 'Chart time interval',
            defaultValue: '1h',
            options: [
              { label: '1 minute', value: '1m' },
              { label: '5 minutes', value: '5m' },
              { label: '15 minutes', value: '15m' },
              { label: '1 hour', value: '1h' },
              { label: '4 hours', value: '4h' },
              { label: '1 day', value: '1d' },
              { label: '1 week', value: '1w' }
            ]
          }
        ]
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null,
      symbol: props.symbol || 'BTCUSDT',
      interval: props.interval || '1h'
    };
  }
  
  /**
   * Initialize the component
   */
  protected async onInitialize(): Promise<void> {
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));
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
      <ChartComponentReact
        id={this.props.id}
        symbol={this.componentState.symbol}
        interval={this.componentState.interval}
        theme="dark"
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
      <ChartComponentReact
        id={this.props.id}
        symbol={this.componentState.symbol}
        interval={this.componentState.interval}
        theme="dark"
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
   * Handle settings changes
   */
  public onSettingsChanged(settings: Record<string, any>): void {
    if (settings.symbol) {
      this.componentState.symbol = settings.symbol;
    }
    
    if (settings.interval) {
      this.componentState.interval = settings.interval;
    }
    
    this.onUpdate();
  }
  
  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return ChartComponentReact;
  }
}
