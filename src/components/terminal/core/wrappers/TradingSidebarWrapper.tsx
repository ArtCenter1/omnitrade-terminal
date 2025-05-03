/**
 * Trading Sidebar Wrapper
 * 
 * A wrapper for the existing TradingSidebar component that implements the IComponent interface.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { TradingSidebar } from '@/components/terminal/TradingSidebar';
import { TradingPair } from '@/components/terminal/TradingPairSelector';

/**
 * Trading Sidebar Component Props
 */
interface TradingSidebarComponentProps extends BaseTerminalComponentProps {
  selectedPair?: TradingPair;
  onOrderPlaced?: () => void;
}

/**
 * Trading Sidebar Component State
 */
interface TradingSidebarComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
  refreshTrigger: number;
}

/**
 * Trading Sidebar Component React Implementation
 */
const TradingSidebarComponentReact: React.FC<TradingSidebarComponentProps> = ({ 
  id, 
  selectedPair,
  onOrderPlaced
}) => {
  return (
    <div className="h-full flex flex-col">
      <TradingSidebar 
        selectedPair={selectedPair}
        onOrderPlaced={onOrderPlaced}
      />
    </div>
  );
};

/**
 * Trading Sidebar Component Class
 */
export class TradingSidebarComponent extends BaseTerminalComponent<TradingSidebarComponentProps, TradingSidebarComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: TradingSidebarComponentProps = { id: 'trading-sidebar' }) {
    super(
      {
        id: 'trading-sidebar',
        name: 'Trading Sidebar',
        description: 'Provides trading functionality and account information',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'orders', 'account'],
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
      selectedPair: props.selectedPair,
      refreshTrigger: 0
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
      <TradingSidebarComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        onOrderPlaced={this.handleOrderPlaced}
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
      <TradingSidebarComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        onOrderPlaced={this.handleOrderPlaced}
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
   * Handle order placed event
   */
  private handleOrderPlaced = (): void => {
    // Increment the refresh trigger to cause a refresh
    this.componentState.refreshTrigger += 1;
    
    // Call the onOrderPlaced prop if provided
    if (this.props.onOrderPlaced) {
      this.props.onOrderPlaced();
    }
  };
  
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
    return TradingSidebarComponentReact;
  }
}
