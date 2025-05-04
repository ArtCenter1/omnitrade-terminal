/**
 * Trading Form Component
 *
 * A simple component for trading form.
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ComponentLifecycleState,
  ComponentMetadata,
  IComponent
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from './BaseTerminalComponent';

/**
 * Trading Form Component Props
 */
interface TradingFormComponentProps extends BaseTerminalComponentProps {
  symbol?: string;
}

/**
 * Trading Form Component State
 */
interface TradingFormComponentState {
  isLoading: boolean;
  error: Error | null;
  symbol: string;
  orderType: 'market' | 'limit';
  side: 'buy' | 'sell';
  amount: string;
  price: string;
}

/**
 * Trading Form Component React Implementation
 */
const TradingFormComponentReact: React.FC<TradingFormComponentProps & {
  orderType: 'market' | 'limit';
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  onOrderTypeChange: (type: 'market' | 'limit') => void;
  onSideChange: (side: 'buy' | 'sell') => void;
  onAmountChange: (amount: string) => void;
  onPriceChange: (price: string) => void;
  onSubmit: () => void;
}> = ({
  id,
  symbol = 'BTC/USDT',
  orderType,
  side,
  amount,
  price,
  onOrderTypeChange,
  onSideChange,
  onAmountChange,
  onPriceChange,
  onSubmit
}) => {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)] p-4">
      <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Trade {symbol}</h3>

      <div className="mb-4">
        <div className="flex mb-2">
          <button
            className={`flex-1 py-2 rounded-l ${side === 'buy' ? 'bg-crypto-green text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            onClick={() => onSideChange('buy')}
          >
            Buy
          </button>
          <button
            className={`flex-1 py-2 rounded-r ${side === 'sell' ? 'bg-crypto-red text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            onClick={() => onSideChange('sell')}
          >
            Sell
          </button>
        </div>

        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 rounded-l ${orderType === 'limit' ? 'bg-[var(--button-primary)] text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            onClick={() => onOrderTypeChange('limit')}
          >
            Limit
          </button>
          <button
            className={`flex-1 py-2 rounded-r ${orderType === 'market' ? 'bg-[var(--button-primary)] text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            onClick={() => onOrderTypeChange('market')}
          >
            Market
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Amount</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded py-2 px-3 text-[var(--text-primary)]"
          placeholder="0.00"
        />
      </div>

      {orderType === 'limit' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Price</label>
          <input
            type="text"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded py-2 px-3 text-[var(--text-primary)]"
            placeholder="0.00"
          />
        </div>
      )}

      <button
        className={`py-3 rounded font-medium ${side === 'buy' ? 'bg-crypto-green hover:bg-crypto-green/90' : 'bg-crypto-red hover:bg-crypto-red/90'} text-[var(--text-primary)] mt-auto`}
        onClick={onSubmit}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {symbol.split('/')[0]}
      </button>
    </div>
  );
};

/**
 * Trading Form Component Class
 */
export class TradingFormComponent extends BaseTerminalComponent<TradingFormComponentProps, TradingFormComponentState> implements IComponent {
  private root: any = null;

  constructor(props: TradingFormComponentProps = { id: 'trading-form' }) {
    super(
      {
        id: 'trading-form-component',
        name: 'Trading Form Component',
        description: 'Trading form for placing orders',
        version: '1.0.0',
        category: 'trading',
        tags: ['trading', 'form'],
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
      symbol: props.symbol || 'BTC/USDT',
      orderType: 'limit',
      side: 'buy',
      amount: '',
      price: ''
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
    this.renderComponent();
  }

  /**
   * Update the component
   */
  protected onUpdate(): void {
    if (!this.root || !this.container) return;

    // Update the React component
    this.renderComponent();
  }

  /**
   * Render the React component
   */
  private renderComponent(): void {
    this.root.render(
      <TradingFormComponentReact
        id={this.props.id}
        symbol={this.componentState.symbol}
        orderType={this.componentState.orderType}
        side={this.componentState.side}
        amount={this.componentState.amount}
        price={this.componentState.price}
        onOrderTypeChange={this.handleOrderTypeChange}
        onSideChange={this.handleSideChange}
        onAmountChange={this.handleAmountChange}
        onPriceChange={this.handlePriceChange}
        onSubmit={this.handleSubmit}
      />
    );
  }

  /**
   * Handle order type change
   */
  private handleOrderTypeChange = (type: 'market' | 'limit'): void => {
    this.componentState.orderType = type;
    this.onUpdate();
  };

  /**
   * Handle side change
   */
  private handleSideChange = (side: 'buy' | 'sell'): void => {
    this.componentState.side = side;
    this.onUpdate();
  };

  /**
   * Handle amount change
   */
  private handleAmountChange = (amount: string): void => {
    this.componentState.amount = amount;
    this.onUpdate();
  };

  /**
   * Handle price change
   */
  private handlePriceChange = (price: string): void => {
    this.componentState.price = price;
    this.onUpdate();
  };

  /**
   * Handle form submission
   */
  private handleSubmit = (): void => {
    console.log('Order submitted:', {
      symbol: this.componentState.symbol,
      type: this.componentState.orderType,
      side: this.componentState.side,
      amount: this.componentState.amount,
      price: this.componentState.price
    });

    // Reset form
    this.componentState.amount = '';
    this.componentState.price = '';
    this.onUpdate();
  };

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
      this.componentState.symbol = settings.symbol;
      this.onUpdate();
    }
  }

  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return TradingFormComponentReact;
  }
}
