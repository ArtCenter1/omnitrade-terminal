/**
 * Plugin System Types
 * 
 * This file defines the core types for the plugin system.
 */

/**
 * Plugin manifest schema
 * Defines the metadata and requirements for a plugin
 */
export interface PluginManifest {
  /**
   * Unique identifier for the plugin
   */
  id: string;
  
  /**
   * Display name of the plugin
   */
  name: string;
  
  /**
   * Version of the plugin (semver format)
   */
  version: string;
  
  /**
   * Plugin description
   */
  description: string;
  
  /**
   * Plugin author information
   */
  author: string;
  
  /**
   * Main entry point file
   */
  main: string;
  
  /**
   * Plugin dependencies
   * Key is the plugin ID, value is the version requirement (semver format)
   */
  dependencies?: Record<string, string>;
  
  /**
   * Extension points implemented by this plugin
   */
  extensionPoints: string[];
  
  /**
   * Permissions required by this plugin
   */
  permissions: string[];
  
  /**
   * Plugin configuration
   */
  config?: Record<string, any>;
  
  /**
   * Terminal version compatibility
   * Semver format (e.g., "^1.0.0")
   */
  compatibility?: {
    terminal: string;
  };
}

/**
 * Plugin state enum
 */
export enum PluginState {
  REGISTERED = 'registered',
  LOADED = 'loaded',
  ACTIVATED = 'activated',
  DEACTIVATED = 'deactivated',
  ERROR = 'error'
}

/**
 * Plugin interface
 */
export interface Plugin {
  /**
   * Plugin manifest
   */
  manifest: PluginManifest;
  
  /**
   * Plugin instance (the loaded module)
   */
  instance: any;
  
  /**
   * Current plugin state
   */
  state: PluginState;
  
  /**
   * Error information (if state is ERROR)
   */
  error?: Error;
}

/**
 * Plugin API interface
 * Defines the API surface exposed to plugins
 */
export interface PluginAPI {
  /**
   * Register an extension with an extension point
   * @param extensionPointId The ID of the extension point
   * @param extension The extension to register
   */
  registerExtension(extensionPointId: string, extension: any): boolean;
  
  /**
   * Get the terminal API
   * @param apiName The name of the API to get
   */
  getTerminalAPI(apiName: string): any;
  
  /**
   * Log a message from the plugin
   * @param level Log level
   * @param message Message to log
   * @param args Additional arguments
   */
  log(level: 'info' | 'warn' | 'error', message: string, ...args: any[]): void;
}

/**
 * Plugin sandbox interface
 * Provides a restricted execution environment for plugins
 */
export interface PluginSandbox {
  /**
   * Plugin ID
   */
  pluginId: string;
  
  /**
   * Create the plugin API for this sandbox
   */
  createPluginAPI(): PluginAPI;
  
  /**
   * Load a module in the sandbox
   * @param modulePath Path to the module
   */
  loadModule(modulePath: string): Promise<any>;
  
  /**
   * Dispose of the sandbox
   */
  dispose(): void;
}
