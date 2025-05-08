/**
 * Shared TradingView Wrapper
 * 
 * A wrapper for the shared TradingViewContainer component that implements the IComponent interface.
 * This reuses the existing TradingView widget from the Terminal page to avoid duplication.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { TradingViewContainer } from '@/components/shared/TradingViewContainer';
import { TradingPair } from '@/types/trading';

/**
 * Shared TradingView Component Props
 */
interface SharedTradingViewComponentProps extends BaseTerminalComponentProps {
  symbol?: string;
  interval?: string;
}

/**
 * Shared TradingView Component State
 */
interface SharedTradingViewComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
  interval: string;
}

/**
 * Shared TradingView Component React Implementation
 */
const SharedTradingViewComponentReact: React.FC<{
  id: string;
  selectedPair?: TradingPair;
  interval?: string;
}> = ({ 
  id, 
  selectedPair,
  interval = 'D'
}) => {
  return (
    <div className="h-full w-full">
      <TradingViewContainer 
        selectedPair={selectedPair}
        interval={interval}
      />
    </div>
  );
};

/**
 * Shared TradingView Component Class
 */
export class SharedTradingViewComponent extends BaseTerminalComponent<SharedTradingViewComponentProps, SharedTradingViewComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: SharedTradingViewComponentProps = { id: 'shared-tradingview' }) {
    super(
      {
        id: 'shared-tradingview',
        name: 'TradingView Chart',
        description: 'Displays TradingView chart using the shared component from Terminal page',
        version: '1.0.0',
        category: 'charts',
        tags: ['trading', 'price', 'analysis', 'chart'],
        settings: [
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTC/USDT)',
            defaultValue: 'BTC/USDT'
          },
          {
            key: 'interval',
            type: 'select',
            label: 'Interval',
            description: 'Chart time interval',
            defaultValue: 'D',
            options: [
              { label: '1 minute', value: '1' },
              { label: '5 minutes', value: '5' },
              { label: '15 minutes', value: '15' },
              { label: '30 minutes', value: '30' },
              { label: '1 hour', value: '60' },
              { label: '4 hours', value: '240' },
              { label: '1 day', value: 'D' },
              { label: '1 week', value: 'W' },
              { label: '1 month', value: 'M' }
            ]
          }
        ]
      },
      props
    );
    
    // Parse the symbol to create a trading pair
    let selectedPair: TradingPair | undefined = undefined;
    if (props.symbol) {
      const [baseAsset, quoteAsset] = props.symbol.split('/');
      if (baseAsset && quoteAsset) {
        selectedPair = {
          symbol: props.symbol,
          baseAsset,
          quoteAsset,
          price: '0',
          change24h: '0%',
          volume24h: '0',
          isFavorite: false
        };
      }
    }
    
    this.componentState = {
      isLoading: true,
      error: null,
      selectedPair,
      interval: props.interval || 'D'
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
      <SharedTradingViewComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        interval={this.componentState.interval}
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
      <SharedTradingViewComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        interval={this.componentState.interval}
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
      // Parse the symbol to create a trading pair
      const [baseAsset, quoteAsset] = settings.symbol.split('/');
      if (baseAsset && quoteAsset) {
        this.componentState.selectedPair = {
          symbol: settings.symbol,
          baseAsset,
          quoteAsset,
          price: '0',
          change24h: '0%',
          volume24h: '0',
          isFavorite: false
        };
      }
    }
    
    if (settings.interval) {
      this.componentState.interval = settings.interval;
    }
    
    this.onUpdate();
  }
}
