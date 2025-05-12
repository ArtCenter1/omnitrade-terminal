/**
 * Trading Tabs Wrapper
 *
 * A wrapper for the TradingTabs component that implements the IComponent interface.
 */

import React, { useState } from 'react';
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
import { TradingTabs } from '@/components/terminal/TradingTabs';
import { TradingPair } from '@/types/trading';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Trading Tabs Component Props
 */
interface TradingTabsComponentProps extends BaseTerminalComponentProps {
  selectedPair?: TradingPair;
  onOrderPlaced?: () => void;
}

/**
 * Trading Tabs Component State
 */
interface TradingTabsComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
  refreshTrigger: number;
}

/**
 * Trading Tabs Component React Implementation
 */
const TradingTabsComponentReact: React.FC<TradingTabsComponentProps> = ({
  id,
  selectedPair,
  onOrderPlaced,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOrderPlaced = () => {
    setRefreshTrigger((prev) => prev + 1);
    if (onOrderPlaced) {
      onOrderPlaced();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary>
        <TradingTabs
          selectedPair={selectedPair}
          onOrderPlaced={handleOrderPlaced}
          refreshTrigger={refreshTrigger}
        />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Trading Tabs Component Class
 */
export class TradingTabsComponent
  extends BaseTerminalComponent<
    TradingTabsComponentProps,
    TradingTabsComponentState
  >
  implements IComponent
{
  private root: any = null;

  constructor(props: TradingTabsComponentProps = { id: 'terminal-tabs' }) {
    super(
      {
        id: 'terminal-tabs',
        name: 'Trading Tabs',
        description: 'Provides trading form and order management',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'orders', 'form'],
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
      refreshTrigger: 0,
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
   * Render the component
   */
  protected onRender(): void {
    if (!this.container) return;

    // Create a root for React rendering
    this.root = createRoot(this.container);

    // Render the React component
    this.root.render(
      <TradingTabsComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        onOrderPlaced={this.handleOrderPlaced}
      />,
    );
  }

  /**
   * Update the component
   */
  protected onUpdate(): void {
    if (!this.root || !this.container) return;

    // Update the React component
    this.root.render(
      <TradingTabsComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        onOrderPlaced={this.handleOrderPlaced}
      />,
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
    return TradingTabsComponentReact;
  }
}
