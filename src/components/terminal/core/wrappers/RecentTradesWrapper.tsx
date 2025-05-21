/**
 * Recent Trades Wrapper
 *
 * A wrapper for the Recent Trades component that implements the IComponent interface.
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ComponentLifecycleState,
  ComponentMetadata,
  IComponent,
} from '@/lib/component-registry';
import {
  BaseTerminalComponent,
  BaseTerminalComponentProps,
} from '../BaseTerminalComponent';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TradingPair } from '@/types/trading';
import { SafeTabModule } from '../../../ui/error-boundary/SafeTabModule';
import { TabData } from '@/components/terminal/VSCodeTabs';
import {
  BinanceTestnetMarketDataService,
  MarketDataEvent,
} from '@/services/exchange/binanceTestnetMarketDataService';

/**
 * Recent Trades Component Props
 */
interface RecentTradesComponentProps extends BaseTerminalComponentProps {
  id: string; // <-- Add id as required prop
  selectedPair?: TradingPair;
}

/**
 * Recent Trades Component State
 */
interface RecentTradesComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
  recentTrades: any[];
}

/**
 * Simple Recent Trades Component
 * This is a placeholder implementation until a real recent trades component is implemented
 */
const SimpleRecentTrades: React.FC<{
  selectedPair?: TradingPair;
  recentTrades: any[];
}> = ({ selectedPair, recentTrades }) => {
  const symbol = selectedPair?.symbol || 'BTC/USDT';

  return (
    <div className="h-full p-2 overflow-y-auto">
      <div className="mb-2">
        <h3 className="text-sm font-medium">Recent Trades: {symbol}</h3>
      </div>

      <div className="text-xs">
        <div className="grid grid-cols-4 gap-2 py-1 border-b border-gray-800 text-gray-400">
          <div>Price</div>
          <div>Amount</div>
          <div>Value</div>
          <div>Time</div>
        </div>

        {recentTrades.map((trade, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-2 py-1 border-b border-gray-800"
          >
            <div
              className={trade.isBuyerMaker ? 'text-red-500' : 'text-green-500'}
            >
              {trade.price}
            </div>
            <div>{trade.qty}</div>
            <div>
              {(parseFloat(trade.price) * parseFloat(trade.qty)).toFixed(2)}
            </div>
            <div className="text-gray-400">
              {new Date(trade.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Recent Trades Component Content
 * This is the actual content that will be displayed inside the tab
 */
const RecentTradesContent: React.FC<
  RecentTradesComponentProps & { recentTrades: any[] }
> = ({ id, selectedPair, recentTrades }) => {
  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary>
        <SimpleRecentTrades
          selectedPair={selectedPair}
          recentTrades={recentTrades}
        />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Recent Trades Component React Implementation
 */
const RecentTradesComponentReact: React.FC<RecentTradesComponentProps> = ({
  id,
  selectedPair,
}) => {
  const [recentTrades, setRecentTrades] = useState([]);
  const marketDataService = BinanceTestnetMarketDataService.getInstance();

  useEffect(() => {
    let eventListenerUnsubscribeFn: (() => void) | undefined;

    const setupTradesSubscription = async () => {
      await marketDataService.initialize(); // Ensure service is initialized
      if (selectedPair) {
        // 1. Inform the service we are interested in trades for this symbol.
        // This call ensures the WebSocket stream for trades is active for selectedPair.symbol
        // and that data is cached and events are emitted by the service.
        marketDataService.subscribeTrades(selectedPair.symbol);

        // 2. Subscribe to the marketDataService's general event emitter to receive trade data.
        eventListenerUnsubscribeFn = marketDataService.subscribe(
          (event: MarketDataEvent) => {
            if (
              event.type === 'trades' &&
              event.symbol === selectedPair.symbol &&
              Array.isArray(event.data)
            ) {
              setRecentTrades(event.data);
            }
          },
        );

        // 3. Populate initial trades from cache if available
        const initialTrades = marketDataService.getCachedTrades(
          selectedPair.symbol,
        );
        if (initialTrades) {
          setRecentTrades(initialTrades);
        }
      }
    };

    setupTradesSubscription();

    return () => {
      if (eventListenerUnsubscribeFn) {
        eventListenerUnsubscribeFn(); // Detach this component's callback from the event emitter.
      }
      // Note: The lifecycle of the underlying WebSocket stream for selectedPair.symbol
      // is managed by BinanceTestnetMarketDataService and BinanceTestnetWebSocketService.
      // They should handle stopping the stream when no listeners are interested (e.g., via reference counting).
    };
  }, [selectedPair, marketDataService]); // Added marketDataService to dependency array

  return (
    <RecentTradesContent
      id={id}
      selectedPair={selectedPair}
      recentTrades={recentTrades}
    />
  );
};

export class RecentTradesComponent
  extends BaseTerminalComponent<
    RecentTradesComponentProps,
    RecentTradesComponentState
  >
  implements IComponent
{
  private root: any = null;

  constructor(props: RecentTradesComponentProps = { id: 'recent-trades' }) {
    super(
      {
        id: 'recent-trades',
        name: 'Recent Trades',
        description: 'Displays recent trades for a trading pair',
        version: '1.0.0',
        category: 'market',
        // Add the load function for dynamic import
        load: () =>
          import('./RecentTradesWrapper').then((m) => m.RecentTradesComponent),
        tags: ['trades', 'market', 'history'],
        settings: [
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTC/USDT)',
            defaultValue: 'BTC/USDT',
          },
        ],
      },
      props,
    );

    this.componentState = {
      isLoading: true,
      error: null,
      selectedPair: props.selectedPair,
      recentTrades: [],
    };
  }

  /**
   * Initialize the component
   */
  protected async onInitialize(): Promise<void> {
    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.componentState.isLoading = false;
  }

  /**
   * Render the content of the component (to be used inside the tab)
   */
  protected renderContent(): React.ReactNode {
    return (
      <RecentTradesContent
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        recentTrades={this.componentState.recentTrades}
      />
    );
  }

  /**
   * Render the component
   */
  protected onRender(): void {
    if (!this.container) return;

    // Create a root for React rendering
    this.root = createRoot(this.container);

    // Create a tab with the component's content
    const tabs = [
      {
        id: `${this.props.id}-tab`,
        title: this.metadata.name || 'Recent Trades',
        content: this.renderContent(),
        closable: false,
      },
    ];

    // Render the TabModule with the component's content
    this.root.render(
      <ErrorBoundary>
        <SafeTabModule
          moduleId={`${this.props.id}-module`}
          initialTabs={tabs}
          className="h-full"
        />
      </ErrorBoundary>,
    );
  }

  /**
   * Update the component
   */
  protected onUpdate(): void {
    if (!this.root || !this.container) return;

    // Create a tab with the updated component's content
    const tabs = [
      {
        id: `${this.props.id}-tab`,
        title: this.metadata.name || 'Recent Trades',
        content: this.renderContent(),
        closable: false,
      },
    ];

    // Update the TabModule with the component's content
    this.root.render(
      <ErrorBoundary>
        <SafeTabModule
          moduleId={`${this.props.id}-module`}
          initialTabs={tabs}
          className="h-full"
        />
      </ErrorBoundary>,
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
          quoteAsset,
        };
        this.onUpdate();
      }
    }
  }

  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return RecentTradesComponentReact;
  }
}
