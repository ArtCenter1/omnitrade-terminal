/**
 * Component Registry Initialization
 *
 * This module initializes the component registry with default components.
 */

import { componentRegistry } from './index';
import { ChartComponent } from '@/components/terminal/core/ChartComponent';

// Import wrapper components
import { ChartSectionComponent } from '@/components/terminal/core/wrappers/ChartSectionWrapper';
import { OrderBookComponent } from '@/components/terminal/core/wrappers/OrderBookWrapper';
import { TradingSidebarComponent } from '@/components/terminal/core/wrappers/TradingSidebarWrapper';
import { TerminalTabsComponent } from '@/components/terminal/core/wrappers/TerminalTabsWrapper';

/**
 * Initialize the component registry with default components
 */
export function initializeComponentRegistry(): void {
  console.log('Initializing component registry...');

  // Register the sample chart component
  componentRegistry.register(ChartComponent);

  // Register wrapper components for existing terminal components
  componentRegistry.register(ChartSectionComponent);
  componentRegistry.register(OrderBookComponent);
  componentRegistry.register(TradingSidebarComponent);
  componentRegistry.register(TerminalTabsComponent);

  // Log the registered components
  const components = componentRegistry.getComponents();
  console.log(`Registered ${components.length} components:`);
  components.forEach(component => {
    console.log(`- ${component.name} (${component.id})`);
  });
}
