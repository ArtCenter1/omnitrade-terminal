/**
 * Order Book Component
 * 
 * A simple component for displaying the order book.
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
 * Order Book Component Props
 */
interface OrderBookComponentProps extends BaseTerminalComponentProps {
  symbol?: string;
}

/**
 * Order Book Component State
 */
interface OrderBookComponentState {
  isLoading: boolean;
  error: Error | null;
  symbol: string;
}

/**
 * Order Book Component React Implementation
 */
const OrderBookComponentReact: React.FC<OrderBookComponentProps> = ({ 
  id, 
  symbol = 'BTC/USDT'
}) => {
  return (
    <div className="h-full flex flex-col bg-gray-900 p-4">
      <h3 className="text-lg font-medium mb-4 text-white">Order Book for {symbol}</h3>
      <div className="flex-1 flex flex-col">
        <div className="mb-2">
          <h4 className="text-sm font-medium text-green-500 mb-1">Bids</h4>
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-400">No bids to display</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-red-500 mb-1">Asks</h4>
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-400">No asks to display</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Order Book Component Class
 */
export class OrderBookComponent extends BaseTerminalComponent<OrderBookComponentProps, OrderBookComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: OrderBookComponentProps = { id: 'order-book' }) {
    super(
      {
        id: 'order-book-component',
        name: 'Order Book Component',
        description: 'Displays the order book for a trading pair',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'order book'],
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
      <OrderBookComponentReact
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
      <OrderBookComponentReact
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
    return OrderBookComponentReact;
  }
}
