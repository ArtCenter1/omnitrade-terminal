/**
 * Extension Point Interfaces
 * 
 * This file defines the core interfaces for the extension point system.
 * Extension points allow for plugins to extend the functionality of the terminal.
 */

/**
 * Base extension point interface
 */
export interface IExtensionPoint<T> {
  id: string;
  name: string;
  description: string;
  
  /**
   * Register an extension with this extension point
   * @param extension The extension to register
   * @returns True if registration was successful
   */
  register(extension: T): boolean;
  
  /**
   * Unregister an extension from this extension point
   * @param id The ID of the extension to unregister
   * @returns True if unregistration was successful
   */
  unregister(id: string): boolean;
  
  /**
   * Get all registered extensions
   * @returns Array of registered extensions
   */
  getExtensions(): T[];
}

/**
 * Base extension interface
 */
export interface IExtension {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
}

/**
 * Component extension interface
 * Used for extending the terminal with new components
 */
export interface IComponentExtension extends IExtension {
  componentType: string;
  initialize(): Promise<void>;
  getComponent(): any; // The actual component implementation
}

/**
 * Data provider extension interface
 * Used for extending the terminal with new data sources
 */
export interface IDataProviderExtension extends IExtension {
  dataType: string;
  supportedOperations: string[];
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getData(params: any): Promise<any>;
}

/**
 * Command extension interface
 * Used for extending the terminal with new commands
 */
export interface ICommandExtension extends IExtension {
  command: string;
  category?: string;
  shortcut?: string;
  isEnabled(): boolean;
  execute(args?: any): Promise<any>;
}

/**
 * Menu extension interface
 * Used for extending the terminal with new menu items
 */
export interface IMenuExtension extends IExtension {
  path: string; // Menu path (e.g., "File/Export")
  label: string;
  icon?: string;
  order?: number;
  isVisible?: () => boolean;
  isEnabled?: () => boolean;
  action: () => void;
}

/**
 * Settings extension interface
 * Used for extending the terminal with new settings
 */
export interface ISettingsExtension extends IExtension {
  category: string;
  settings: {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'color';
    label: string;
    description?: string;
    defaultValue?: any;
    options?: { label: string; value: any }[]; // For select type
  }[];
  getValues(): Record<string, any>;
  setValues(values: Record<string, any>): void;
  onChange?: (key: string, value: any) => void;
}
