/**
 * Plugin System
 * 
 * This module provides the core functionality for the plugin system,
 * which allows for extending the terminal with custom plugins.
 */

export * from './types';
export * from './manifest-validator';
export * from './plugin-sandbox';
export * from './plugin-manager';

// Export singleton instance of plugin manager
import { PluginManager } from './plugin-manager';
export const pluginManager = PluginManager.getInstance();
