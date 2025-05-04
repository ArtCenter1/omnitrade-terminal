/**
 * Positions Component Wrapper
 *
 * A wrapper for the existing PositionsList component that implements the IComponent interface.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ComponentLifecycleState,
  ComponentMetadata,
  IComponent
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { PositionsList } from '@/components/positions';

/**
 * Positions Component Props
 */
interface PositionsComponentProps extends BaseTerminalComponentProps {
  exchangeId?: string;
  apiKeyId?: string;
  symbol?: string;
  showClosed?: boolean;
}

/**
 * Positions Component State
 */
interface PositionsComponentState {
  isLoading: boolean;
  error: Error | null;
  exchangeId?: string;
  apiKeyId?: string;
  symbol?: string;
  showClosed: boolean;
}

/**
 * Positions Component React Implementation
 */
const PositionsComponentReact: React.FC<PositionsComponentProps> = ({
  id,
  exchangeId,
  apiKeyId,
  symbol,
  showClosed
}) => {
  return (
    <div className="h-full flex flex-col">
      <PositionsList
        exchangeId={exchangeId}
        apiKeyId={apiKeyId}
        symbol={symbol}
        showClosed={showClosed}
      />
    </div>
  );
};

/**
 * Positions Component Class
 */
export class PositionsComponent extends BaseTerminalComponent<PositionsComponentProps, PositionsComponentState> implements IComponent {
  private root: any = null;

  constructor(props: PositionsComponentProps = { id: 'positions-component' }) {
    super(
      {
        id: 'positions-component',
        name: 'Positions',
        description: 'Displays and manages trading positions',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'positions', 'portfolio'],
        settings: [
          {
            key: 'exchangeId',
            type: 'string',
            label: 'Exchange',
            description: 'Exchange ID',
            defaultValue: ''
          },
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTC/USDT)',
            defaultValue: ''
          },
          {
            key: 'showClosed',
            type: 'boolean',
            label: 'Show Closed',
            description: 'Show closed positions',
            defaultValue: false
          }
        ]
      },
      props
    );

    this.componentState = {
      isLoading: true,
      error: null,
      exchangeId: props.exchangeId,
      apiKeyId: props.apiKeyId || 'default',
      symbol: props.symbol,
      showClosed: props.showClosed || false
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
      <PositionsComponentReact
        id={this.props.id}
        exchangeId={this.componentState.exchangeId}
        apiKeyId={this.componentState.apiKeyId}
        symbol={this.componentState.symbol}
        showClosed={this.componentState.showClosed}
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
      <PositionsComponentReact
        id={this.props.id}
        exchangeId={this.componentState.exchangeId}
        apiKeyId={this.componentState.apiKeyId}
        symbol={this.componentState.symbol}
        showClosed={this.componentState.showClosed}
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
          console.warn(`Error unmounting PositionsComponent:`, error);
        }
        this.root = null;
      }
    } catch (error) {
      console.error(`Error in PositionsComponent.onDispose:`, error);
    }
  }

  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return PositionsComponentReact;
  }
}
