/**
 * Order Book Wrapper
 * 
 * A wrapper for the existing OrderBook component that implements the IComponent interface.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { OrderBook } from '@/components/terminal/OrderBook';
import { TradingPair } from '@/components/terminal/TradingPairSelector';

/**
 * Order Book Component Props
 */
interface OrderBookComponentProps extends BaseTerminalComponentProps {
  selectedPair?: TradingPair;
}

/**
 * Order Book Component State
 */
interface OrderBookComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
}

/**
 * Order Book Component React Implementation
 */
const OrderBookComponentReact: React.FC<OrderBookComponentProps> = ({ 
  id, 
  selectedPair
}) => {
  return (
    <div className="h-full flex flex-col">
      <OrderBook selectedPair={selectedPair} />
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
        id: 'order-book',
        name: 'Order Book',
        description: 'Displays real-time order book data for trading pairs',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'orders', 'market-depth'],
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
      selectedPair: props.selectedPair
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
        selectedPair={this.componentState.selectedPair}
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
        selectedPair={this.componentState.selectedPair}
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
    if (settings.symbol && this.componentState.selectedPair) {
      // Parse the symbol to create a new trading pair
      const [baseAsset, quoteAsset] = settings.symbol.split('/');
      if (baseAsset && quoteAsset) {
        this.componentState.selectedPair = {
          ...this.componentState.selectedPair,
          symbol: settings.symbol,
          baseAsset,
          quoteAsset
        };
        this.onUpdate();
      }
    }
  }
  
  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return OrderBookComponentReact;
  }
}
