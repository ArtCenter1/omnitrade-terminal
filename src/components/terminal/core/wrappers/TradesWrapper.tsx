/**
 * Trades Component Wrapper
 *
 * A wrapper for the existing RecentTradesTable component that implements the IComponent interface.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ComponentLifecycleState,
  ComponentMetadata,
  IComponent
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { RecentTradesTable } from '@/components/terminal/RecentTradesTable';

/**
 * Trades Component Props
 */
interface TradesComponentProps extends BaseTerminalComponentProps {
  symbol?: string;
  refreshTrigger?: number;
  limit?: number;
}

/**
 * Trades Component State
 */
interface TradesComponentState {
  isLoading: boolean;
  error: Error | null;
  symbol: string;
  refreshTrigger: number;
  limit: number;
}

/**
 * Trades Component React Implementation
 */
const TradesComponentReact: React.FC<TradesComponentProps> = ({
  id,
  symbol,
  refreshTrigger,
  limit
}) => {
  return (
    <div className="h-full flex flex-col">
      <RecentTradesTable
        selectedSymbol={symbol}
        refreshTrigger={refreshTrigger}
        limit={limit}
      />
    </div>
  );
};

/**
 * Trades Component Class
 */
export class TradesComponent extends BaseTerminalComponent<TradesComponentProps, TradesComponentState> implements IComponent {
  private root: any = null;

  constructor(props: TradesComponentProps = { id: 'trades-component' }) {
    super(
      {
        id: 'trades-component',
        name: 'Trades',
        description: 'Displays recent trades for a trading pair',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'trades', 'market-data'],
        settings: [
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTC/USDT)',
            defaultValue: 'BTC/USDT'
          },
          {
            key: 'limit',
            type: 'number',
            label: 'Limit',
            description: 'Maximum number of trades to display',
            defaultValue: 50
          }
        ]
      },
      props
    );

    this.componentState = {
      isLoading: true,
      error: null,
      symbol: props.symbol || 'BTC/USDT',
      refreshTrigger: props.refreshTrigger || 0,
      limit: props.limit || 50
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
      <TradesComponentReact
        id={this.props.id}
        symbol={this.componentState.symbol}
        refreshTrigger={this.componentState.refreshTrigger}
        limit={this.componentState.limit}
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
      <TradesComponentReact
        id={this.props.id}
        symbol={this.componentState.symbol}
        refreshTrigger={this.componentState.refreshTrigger}
        limit={this.componentState.limit}
      />
    );
  }

  /**
   * Dispose the component
   */
  protected onDispose(): void {
    try {
      if (this.root) {
        // Use a try-catch to handle potential React unmounting errors
        try {
          this.root.unmount();
        } catch (error) {
          console.warn(`Error unmounting TradesComponent:`, error);
        }
        this.root = null;
      }
    } catch (error) {
      console.error(`Error in TradesComponent.onDispose:`, error);
    }
  }

  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return TradesComponentReact;
  }
}
