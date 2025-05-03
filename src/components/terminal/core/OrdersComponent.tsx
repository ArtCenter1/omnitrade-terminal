/**
 * Orders Component
 * 
 * A simple component for displaying orders.
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
 * Orders Component Props
 */
interface OrdersComponentProps extends BaseTerminalComponentProps {
  symbol?: string;
}

/**
 * Orders Component State
 */
interface OrdersComponentState {
  isLoading: boolean;
  error: Error | null;
  symbol: string;
}

/**
 * Orders Component React Implementation
 */
const OrdersComponentReact: React.FC<OrdersComponentProps> = ({ 
  id, 
  symbol = 'BTC/USDT'
}) => {
  return (
    <div className="h-full flex flex-col bg-gray-900 p-4">
      <h3 className="text-lg font-medium mb-4 text-white">Orders for {symbol}</h3>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">No orders to display</p>
      </div>
    </div>
  );
};

/**
 * Orders Component Class
 */
export class OrdersComponent extends BaseTerminalComponent<OrdersComponentProps, OrdersComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: OrdersComponentProps = { id: 'orders' }) {
    super(
      {
        id: 'orders-component',
        name: 'Orders Component',
        description: 'Displays orders for a trading pair',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'orders'],
        settings: [
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTC/USDT)',
            defaultValue: 'BTC/USDT'
          }
        ]
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null,
      symbol: props.symbol || 'BTC/USDT'
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
      <OrdersComponentReact
        id={this.props.id}
        symbol={this.componentState.symbol}
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
      <OrdersComponentReact
        id={this.props.id}
        symbol={this.componentState.symbol}
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
      this.onUpdate();
    }
  }
  
  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return OrdersComponentReact;
  }
}
