/**
 * Terminal Tabs Wrapper
 *
 * A wrapper for the existing TerminalTabs component that implements the IComponent interface.
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
import { TerminalTabs } from '@/components/terminal/TerminalTabs';
import { TradingPair } from '@/types/trading';

/**
 * Terminal Tabs Component Props
 */
interface TerminalTabsComponentProps extends BaseTerminalComponentProps {
  selectedPair?: TradingPair;
  refreshTrigger?: number;
}

/**
 * Terminal Tabs Component State
 */
interface TerminalTabsComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
  refreshTrigger: number;
}

/**
 * Terminal Tabs Component React Implementation
 */
const TerminalTabsComponentReact: React.FC<TerminalTabsComponentProps> = ({
  id,
  selectedPair,
  refreshTrigger = 0,
}) => {
  return (
    <div className="h-full flex flex-col">
      <TerminalTabs
        selectedPair={selectedPair}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

/**
 * Terminal Tabs Component Class
 */
export class TerminalTabsComponent
  extends BaseTerminalComponent<
    TerminalTabsComponentProps,
    TerminalTabsComponentState
  >
  implements IComponent
{
  private root: any = null;

  constructor(props: TerminalTabsComponentProps = { id: 'terminal-tabs' }) {
    super(
      {
        id: 'terminal-tabs',
        name: 'Terminal Tabs',
        description:
          'Displays orders, positions, and other trading information',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'orders', 'positions', 'trades'],
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
      refreshTrigger: props.refreshTrigger || 0,
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
      <TerminalTabsComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        refreshTrigger={this.componentState.refreshTrigger}
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
      <TerminalTabsComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        refreshTrigger={this.componentState.refreshTrigger}
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
   * Trigger a refresh
   */
  public triggerRefresh(): void {
    this.componentState.refreshTrigger += 1;
    this.onUpdate();
  }

  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return TerminalTabsComponentReact;
  }
}
