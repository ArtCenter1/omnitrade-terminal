/**
 * Component Registry Initialization
 *
 * This module initializes the component registry with default components.
 */

import { componentRegistry } from './index';
import { ChartComponent } from '@/components/terminal/core/ChartComponent';
import { DemoComponent } from '@/components/terminal/core/DemoComponent';
import { OrdersComponent } from '@/components/terminal/core/OrdersComponent';
import { OrderBookComponent as OrderBookComponentCore } from '@/components/terminal/core/OrderBookComponent';
import { TradingFormComponent } from '@/components/terminal/core/TradingFormComponent';

// Import wrapper components
import { ChartSectionComponent } from '@/components/terminal/core/wrappers/ChartSectionWrapper';
import { OrderBookComponent } from '@/components/terminal/core/wrappers/OrderBookWrapper';
import { TradingSidebarComponent } from '@/components/terminal/core/wrappers/TradingSidebarWrapper';
import { TerminalTabsComponent } from '@/components/terminal/core/wrappers/TerminalTabsWrapper';
import { TradesComponent } from '@/components/terminal/core/wrappers/TradesWrapper';
import { PositionsComponent } from '@/components/terminal/core/wrappers/PositionsWrapper';
import { TradingTabsComponent } from '@/components/terminal/core/wrappers/TradingTabsWrapper';
import { MarketWatchlistComponent } from '@/components/terminal/core/wrappers/MarketWatchlistWrapper';
import { AlertsPanelComponent } from '@/components/terminal/core/wrappers/AlertsPanelWrapper';
import { RecentTradesComponent } from '@/components/terminal/core/wrappers/RecentTradesWrapper';

/**
 * Initialize the component registry with default components
 */
export function initializeComponentRegistry(): void {
  console.log('Initializing component registry...');

  // Register the sample chart component
  componentRegistry.register(ChartComponent);

  // Register the demo component
  componentRegistry.register(DemoComponent);

  // Register core trading components
  componentRegistry.register(OrdersComponent);
  componentRegistry.register(OrderBookComponentCore);
  componentRegistry.register(TradingFormComponent);

  // Register wrapper components for existing terminal components
  componentRegistry.register(ChartSectionComponent);
  componentRegistry.register(OrderBookComponent);
  componentRegistry.register(TradingSidebarComponent);
  componentRegistry.register(TerminalTabsComponent);
  componentRegistry.register(TradesComponent);
  componentRegistry.register(PositionsComponent);
  componentRegistry.register(TradingTabsComponent);
  componentRegistry.register(MarketWatchlistComponent);
  componentRegistry.register(AlertsPanelComponent);
  componentRegistry.register(RecentTradesComponent);

  // Log the registered components
  const components = componentRegistry.getComponents();
  console.log(`Registered ${components.length} components:`);
  components.forEach(component => {
    console.log(`- ${component.name} (${component.id})`);
  });
}
