/**
 * Component Registry System
 * 
 * This module provides the core functionality for registering, discovering,
 * and instantiating components in the OmniTrade Terminal.
 */

export * from './types';
export * from './registry';

// Export a singleton instance of the registry
import { ComponentRegistry } from './registry';
export const componentRegistry = ComponentRegistry.getInstance();
