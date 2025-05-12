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
  IComponent,
} from '@/lib/component-registry';
import {
  BaseTerminalComponent,
  BaseTerminalComponentProps,
} from '../BaseTerminalComponent';
import { TradingViewContainer } from '@/components/shared/TradingViewContainer';
import { TradingPair } from '@/types/trading';
import { SafeTabModule } from '@/components/ui/error-boundary/SafeTabModule';
import { TabData } from '@/components/terminal/VSCodeTabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';

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
 * Shared TradingView Component Content
 * This is the actual content that will be displayed inside the tab
 */
const SharedTradingViewContent: React.FC<{
  id: string;
  selectedPair?: TradingPair;
  interval?: string;
}> = ({ id, selectedPair, interval = 'D' }) => {
  return (
    <div className="h-full w-full">
      <TradingViewContainer selectedPair={selectedPair} interval={interval} />
    </div>
  );
};

/**
 * Shared TradingView Component React Implementation
 */
const SharedTradingViewComponentReact: React.FC<
  SharedTradingViewComponentProps
> = ({ id, symbol, interval = 'D' }) => {
  // Get the selectedPair from the component state
  const selectedPair = symbol
    ? {
        symbol,
        baseAsset: symbol.split('/')[0],
        quoteAsset: symbol.split('/')[1],
        exchangeId: 'binance',
        priceDecimals: 2,
        quantityDecimals: 8,
        price: '0',
        change24h: '0%',
        volume24h: '0',
        isFavorite: false,
      }
    : undefined;

  return (
    <SharedTradingViewContent
      id={id}
      selectedPair={selectedPair}
      interval={interval}
    />
  );
};

/**
 * Shared TradingView Component Class
 */
export class SharedTradingViewComponent
  extends BaseTerminalComponent<
    SharedTradingViewComponentProps,
    SharedTradingViewComponentState
  >
  implements IComponent
{
  private root: any = null;

  constructor(
    props: SharedTradingViewComponentProps = { id: 'shared-tradingview' },
  ) {
    super(
      {
        id: 'shared-tradingview',
        name: 'TradingView Chart',
        description:
          'Displays TradingView chart using the shared component from Terminal page',
        version: '1.0.0',
        category: 'charts',
        tags: ['trading', 'price', 'analysis', 'chart'],
        settings: [
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTC/USDT)',
            defaultValue: 'BTC/USDT',
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
              { label: '1 month', value: 'M' },
            ],
          },
        ],
      },
      props,
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
          exchangeId: 'binance', // Default exchange ID
          priceDecimals: 2, // Default price decimals
          quantityDecimals: 8, // Default quantity decimals
          price: '0',
          change24h: '0%',
          volume24h: '0',
          isFavorite: false,
        };
      }
    }

    this.componentState = {
      isLoading: true,
      error: null,
      selectedPair,
      interval: props.interval || 'D',
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
      <SharedTradingViewComponentReact
        id={this.props.id}
        symbol={this.componentState.selectedPair?.symbol}
        interval={this.componentState.interval}
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
        title: this.metadata.name || 'TradingView Chart',
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
        title: this.metadata.name || 'TradingView Chart',
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
    if (settings.symbol) {
      // Parse the symbol to create a trading pair
      const [baseAsset, quoteAsset] = settings.symbol.split('/');
      if (baseAsset && quoteAsset) {
        this.componentState.selectedPair = {
          symbol: settings.symbol,
          baseAsset,
          quoteAsset,
          exchangeId: 'binance', // Default exchange ID
          priceDecimals: 2, // Default price decimals
          quantityDecimals: 8, // Default quantity decimals
          price: '0',
          change24h: '0%',
          volume24h: '0',
          isFavorite: false,
        };
      }
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
    return SharedTradingViewComponentReact;
  }
}
