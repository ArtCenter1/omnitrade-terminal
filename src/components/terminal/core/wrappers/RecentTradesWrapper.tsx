/**
 * Recent Trades Wrapper
 *
 * A wrapper for the Recent Trades component that implements the IComponent interface.
 */

import React from 'react';
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

/**
 * Recent Trades Component Props
 */
interface RecentTradesComponentProps extends BaseTerminalComponentProps {
  selectedPair?: TradingPair;
}

/**
 * Recent Trades Component State
 */
interface RecentTradesComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
}

/**
 * Simple Recent Trades Component
 * This is a placeholder implementation until a real recent trades component is implemented
 */
const SimpleRecentTrades: React.FC<{ selectedPair?: TradingPair }> = ({
  selectedPair,
}) => {
  const symbol = selectedPair?.symbol || 'BTC/USDT';

  // Generate some mock trades
  const mockTrades = [
    {
      id: 1,
      price: '64,235.50',
      amount: '0.0125',
      side: 'buy',
      time: '12:45:32',
    },
    {
      id: 2,
      price: '64,230.25',
      amount: '0.0532',
      side: 'sell',
      time: '12:45:28',
    },
    {
      id: 3,
      price: '64,228.75',
      amount: '0.0210',
      side: 'sell',
      time: '12:45:15',
    },
    {
      id: 4,
      price: '64,240.00',
      amount: '0.0075',
      side: 'buy',
      time: '12:45:10',
    },
    {
      id: 5,
      price: '64,238.50',
      amount: '0.0350',
      side: 'buy',
      time: '12:45:05',
    },
    {
      id: 6,
      price: '64,225.00',
      amount: '0.0420',
      side: 'sell',
      time: '12:44:58',
    },
    {
      id: 7,
      price: '64,222.75',
      amount: '0.0180',
      side: 'sell',
      time: '12:44:45',
    },
    {
      id: 8,
      price: '64,245.25',
      amount: '0.0095',
      side: 'buy',
      time: '12:44:32',
    },
  ];

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

        {mockTrades.map((trade) => (
          <div
            key={trade.id}
            className="grid grid-cols-4 gap-2 py-1 border-b border-gray-800"
          >
            <div
              className={
                trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
              }
            >
              {trade.price}
            </div>
            <div>{trade.amount}</div>
            <div>
              {(
                parseFloat(trade.price.replace(',', '')) *
                parseFloat(trade.amount)
              ).toFixed(2)}
            </div>
            <div className="text-gray-400">{trade.time}</div>
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
const RecentTradesContent: React.FC<RecentTradesComponentProps> = ({
  id,
  selectedPair,
}) => {
  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary>
        <SimpleRecentTrades selectedPair={selectedPair} />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Recent Trades Component React Implementation
 */
const RecentTradesComponentReact: React.FC<RecentTradesComponentProps> = (
  props,
) => {
  return <RecentTradesContent {...props} />;
};

/**
 * Recent Trades Component Class
 */
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
