/**
 * Market Watchlist Wrapper
 * 
 * A wrapper for the Market Watchlist component that implements the IComponent interface.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Market Watchlist Component Props
 */
interface MarketWatchlistComponentProps extends BaseTerminalComponentProps {
  favorites?: boolean;
}

/**
 * Market Watchlist Component State
 */
interface MarketWatchlistComponentState {
  isLoading: boolean;
  error: Error | null;
  favorites: boolean;
}

/**
 * Simple Market Watchlist Component
 * This is a placeholder implementation until a real market watchlist is implemented
 */
const SimpleMarketWatchlist: React.FC<{favorites?: boolean}> = ({ favorites = false }) => {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <h3 className="text-lg font-medium mb-4">{favorites ? 'Favorite Markets' : 'All Markets'}</h3>
      <div className="space-y-2">
        {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'].map((pair) => (
          <div 
            key={pair} 
            className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
          >
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-700 mr-2"></div>
              <span>{pair}</span>
            </div>
            <div className="text-green-500">+2.45%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Market Watchlist Component React Implementation
 */
const MarketWatchlistComponentReact: React.FC<MarketWatchlistComponentProps> = ({ 
  id, 
  favorites = false
}) => {
  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary>
        <SimpleMarketWatchlist favorites={favorites} />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Market Watchlist Component Class
 */
export class MarketWatchlistComponent extends BaseTerminalComponent<MarketWatchlistComponentProps, MarketWatchlistComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: MarketWatchlistComponentProps = { id: 'market-watchlist' }) {
    super(
      {
        id: 'market-watchlist',
        name: 'Market Watchlist',
        description: 'Displays a list of trading pairs and their price changes',
        version: '1.0.0',
        category: 'market',
        tags: ['market', 'watchlist', 'pairs'],
        settings: [
          {
            key: 'favorites',
            type: 'boolean',
            label: 'Show Favorites',
            description: 'Show only favorite trading pairs',
            defaultValue: false
          }
        ]
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null,
      favorites: props.favorites || false
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
      <MarketWatchlistComponentReact
        id={this.props.id}
        favorites={this.componentState.favorites}
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
      <MarketWatchlistComponentReact
        id={this.props.id}
        favorites={this.componentState.favorites}
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
    if (settings.favorites !== undefined) {
      this.componentState.favorites = settings.favorites;
      this.onUpdate();
    }
  }
  
  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return MarketWatchlistComponentReact;
  }
}
