/**
 * Chart Section Wrapper
 * 
 * A wrapper for the existing ChartSection component that implements the IComponent interface.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { ChartSection } from '@/components/terminal/ChartSection';
import { TradingPair } from '@/components/terminal/TradingPairSelector';

/**
 * Chart Section Component Props
 */
interface ChartSectionComponentProps extends BaseTerminalComponentProps {
  selectedPair?: TradingPair;
  onPairSelect?: (pair: TradingPair) => void;
}

/**
 * Chart Section Component State
 */
interface ChartSectionComponentState {
  isLoading: boolean;
  error: Error | null;
  selectedPair?: TradingPair;
}

/**
 * Chart Section Component React Implementation
 */
const ChartSectionComponentReact: React.FC<ChartSectionComponentProps> = ({ 
  id, 
  selectedPair,
  onPairSelect
}) => {
  return (
    <div className="h-full flex flex-col">
      <ChartSection 
        selectedPair={selectedPair}
        onPairSelect={onPairSelect}
      />
    </div>
  );
};

/**
 * Chart Section Component Class
 */
export class ChartSectionComponent extends BaseTerminalComponent<ChartSectionComponentProps, ChartSectionComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: ChartSectionComponentProps = { id: 'chart-section' }) {
    super(
      {
        id: 'chart-section',
        name: 'Chart Section',
        description: 'Displays price charts with TradingView integration',
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
          }
        ]
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null,
      selectedPair: props.selectedPair
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
      <ChartSectionComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        onPairSelect={this.handlePairSelect}
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
      <ChartSectionComponentReact
        id={this.props.id}
        selectedPair={this.componentState.selectedPair}
        onPairSelect={this.handlePairSelect}
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
   * Handle pair selection
   */
  private handlePairSelect = (pair: TradingPair): void => {
    this.componentState.selectedPair = pair;
    this.onUpdate();
    
    // Call the onPairSelect prop if provided
    if (this.props.onPairSelect) {
      this.props.onPairSelect(pair);
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
          quoteAsset
        };
        this.onUpdate();
      }
    }
  }
  
  /**
   * Get the React component
   */
  protected getReactComponent(): React.ComponentType<any> {
    return ChartSectionComponentReact;
  }
}
