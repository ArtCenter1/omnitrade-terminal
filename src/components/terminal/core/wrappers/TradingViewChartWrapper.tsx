/**
 * TradingView Chart Wrapper
 * 
 * A standalone TradingView chart component that implements the IComponent interface.
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
 * TradingView Chart Component Props
 */
interface TradingViewChartComponentProps extends BaseTerminalComponentProps {
  symbol?: string;
  interval?: string;
}

/**
 * TradingView Chart Component State
 */
interface TradingViewChartComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
  interval: string;
}

/**
 * TradingView Chart Component React Implementation
 */
const TradingViewChartComponentReact: React.FC<TradingViewChartComponentProps & { selectedPair?: TradingPair, interval: string }> = ({ 
  id, 
  selectedPair,
  interval
}) => {
  return (
    <div className="h-full flex flex-col">
      <TradingViewContainer 
        selectedPair={selectedPair}
        interval={interval}
      />
    </div>
  );
};

/**
 * TradingView Chart Component Class
 */
export class TradingViewChartComponent extends BaseTerminalComponent<TradingViewChartComponentProps, TradingViewChartComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: TradingViewChartComponentProps = { id: 'tradingview-chart' }) {
    super(
      {
        id: 'tradingview-chart',
        name: 'TradingView Chart',
        description: 'Standalone TradingView chart widget',
        version: '1.0.0',
        category: 'charts',
        tags: ['trading', 'price', 'analysis'],
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
            type: 'string',
            label: 'Interval',
            description: 'Chart timeframe (e.g., D, 1h, 15m)',
            defaultValue: 'D'
          }
        ]
      },
      props
    );
    
    // Parse the symbol to create a trading pair
    let selectedPair: TradingPair | undefined;
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
          exchangeId: 'binance',
          priceDecimals: 2,
          quantityDecimals: 8
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
      <TradingViewChartComponentReact
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
      <TradingViewChartComponentReact
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
    let shouldUpdate = false;
    
    if (settings.interval && settings.interval !== this.componentState.interval) {
      this.componentState.interval = settings.interval;
      shouldUpdate = true;
    }
    
    if (settings.symbol) {
      // Parse the symbol to create a new trading pair
      const [baseAsset, quoteAsset] = settings.symbol.split('/');
      if (baseAsset && quoteAsset) {
        this.componentState.selectedPair = {
          symbol: settings.symbol,
          baseAsset,
          quoteAsset,
          price: '0',
          change24h: '0%',
          volume24h: '0',
          exchangeId: 'binance',
          priceDecimals: 2,
          quantityDecimals: 8
        };
        shouldUpdate = true;
      }
    }
    
    if (shouldUpdate) {
      this.onUpdate();
    }
  }
  
  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return TradingViewChartComponentReact;
  }
}
