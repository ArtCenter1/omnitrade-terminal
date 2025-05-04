/**
 * Data Provider Extension Point
 * 
 * Allows plugins to register new data providers with the terminal.
 */

import { IDataProviderExtension, IExtensionPoint } from './types';

/**
 * Data Provider Extension Point implementation
 */
export class DataProviderExtensionPoint implements IExtensionPoint<IDataProviderExtension> {
  private static instance: DataProviderExtensionPoint;
  private extensions: Map<string, IDataProviderExtension> = new Map();
  
  public readonly id = 'data-provider-extension-point';
  public readonly name = 'Data Provider Extension Point';
  public readonly description = 'Allows plugins to register new data providers with the terminal';
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the DataProviderExtensionPoint
   */
  public static getInstance(): DataProviderExtensionPoint {
    if (!DataProviderExtensionPoint.instance) {
      DataProviderExtensionPoint.instance = new DataProviderExtensionPoint();
    }
    return DataProviderExtensionPoint.instance;
  }
  
  /**
   * Register a data provider extension
   * 
   * @param extension The data provider extension to register
   * @returns True if registration was successful
   */
  public register(extension: IDataProviderExtension): boolean {
    try {
      // Check if extension with this ID already exists
      if (this.extensions.has(extension.id)) {
        console.warn(`Data provider extension with ID ${extension.id} is already registered.`);
        return false;
      }
      
      // Initialize the extension
      extension.connect()
        .then(() => {
          console.log(`Data provider extension connected: ${extension.id}`);
        })
        .catch(error => {
          console.error(`Failed to connect data provider extension ${extension.id}:`, error);
        });
      
      // Store the extension
      this.extensions.set(extension.id, extension);
      
      console.log(`Data provider extension registered: ${extension.id}`);
      return true;
    } catch (error) {
      console.error('Failed to register data provider extension:', error);
      return false;
    }
  }
  
  /**
   * Unregister a data provider extension
   * 
   * @param id The ID of the extension to unregister
   * @returns True if unregistration was successful
   */
  public unregister(id: string): boolean {
    try {
      // Check if extension exists
      if (!this.extensions.has(id)) {
        console.warn(`Data provider extension with ID ${id} is not registered.`);
        return false;
      }
      
      // Get the extension
      const extension = this.extensions.get(id);
      
      // Disconnect the extension
      if (extension) {
        extension.disconnect()
          .then(() => {
            console.log(`Data provider extension disconnected: ${id}`);
          })
          .catch(error => {
            console.error(`Failed to disconnect data provider extension ${id}:`, error);
          });
      }
      
      // Remove from registry
      this.extensions.delete(id);
      
      console.log(`Data provider extension unregistered: ${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to unregister data provider extension ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Get all registered data provider extensions
   * 
   * @returns Array of registered data provider extensions
   */
  public getExtensions(): IDataProviderExtension[] {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Get a data provider extension by ID
   * 
   * @param id The ID of the extension to get
   * @returns The extension or undefined if not found
   */
  public getExtension(id: string): IDataProviderExtension | undefined {
    return this.extensions.get(id);
  }
  
  /**
   * Get data provider extensions by data type
   * 
   * @param dataType The data type to filter by
   * @returns Array of matching data provider extensions
   */
  public getExtensionsByDataType(dataType: string): IDataProviderExtension[] {
    return Array.from(this.extensions.values()).filter(
      extension => extension.dataType === dataType
    );
  }
}
