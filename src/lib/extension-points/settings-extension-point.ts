/**
 * Settings Extension Point
 * 
 * Allows plugins to register new settings with the terminal.
 */

import { IExtensionPoint, ISettingsExtension } from './types';

/**
 * Settings Extension Point implementation
 */
export class SettingsExtensionPoint implements IExtensionPoint<ISettingsExtension> {
  private static instance: SettingsExtensionPoint;
  private extensions: Map<string, ISettingsExtension> = new Map();
  
  public readonly id = 'settings-extension-point';
  public readonly name = 'Settings Extension Point';
  public readonly description = 'Allows plugins to register new settings with the terminal';
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the SettingsExtensionPoint
   */
  public static getInstance(): SettingsExtensionPoint {
    if (!SettingsExtensionPoint.instance) {
      SettingsExtensionPoint.instance = new SettingsExtensionPoint();
    }
    return SettingsExtensionPoint.instance;
  }
  
  /**
   * Register a settings extension
   * 
   * @param extension The settings extension to register
   * @returns True if registration was successful
   */
  public register(extension: ISettingsExtension): boolean {
    try {
      // Check if extension with this ID already exists
      if (this.extensions.has(extension.id)) {
        console.warn(`Settings extension with ID ${extension.id} is already registered.`);
        return false;
      }
      
      // Store the extension
      this.extensions.set(extension.id, extension);
      
      console.log(`Settings extension registered: ${extension.id} (${extension.category})`);
      return true;
    } catch (error) {
      console.error('Failed to register settings extension:', error);
      return false;
    }
  }
  
  /**
   * Unregister a settings extension
   * 
   * @param id The ID of the extension to unregister
   * @returns True if unregistration was successful
   */
  public unregister(id: string): boolean {
    // Check if extension exists
    if (!this.extensions.has(id)) {
      console.warn(`Settings extension with ID ${id} is not registered.`);
      return false;
    }
    
    // Remove from registry
    this.extensions.delete(id);
    
    console.log(`Settings extension unregistered: ${id}`);
    return true;
  }
  
  /**
   * Get all registered settings extensions
   * 
   * @returns Array of registered settings extensions
   */
  public getExtensions(): ISettingsExtension[] {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Get settings extensions by category
   * 
   * @param category The category to filter by
   * @returns Array of matching settings extensions
   */
  public getExtensionsByCategory(category: string): ISettingsExtension[] {
    return Array.from(this.extensions.values()).filter(
      extension => extension.category === category
    );
  }
  
  /**
   * Get all settings categories
   * 
   * @returns Array of unique category names
   */
  public getCategories(): string[] {
    const categories = new Set<string>();
    
    for (const extension of this.extensions.values()) {
      categories.add(extension.category);
    }
    
    return Array.from(categories).sort();
  }
  
  /**
   * Get all settings for a specific category
   * 
   * @param category The category to get settings for
   * @returns Object containing all settings for the category
   */
  public getCategorySettings(category: string): Record<string, any> {
    const extensions = this.getExtensionsByCategory(category);
    const settings: Record<string, any> = {};
    
    for (const extension of extensions) {
      const extensionSettings = extension.getValues();
      Object.assign(settings, extensionSettings);
    }
    
    return settings;
  }
  
  /**
   * Update settings for a specific category
   * 
   * @param category The category to update settings for
   * @param values The new values to set
   */
  public updateCategorySettings(category: string, values: Record<string, any>): void {
    const extensions = this.getExtensionsByCategory(category);
    
    for (const extension of extensions) {
      // Filter values that belong to this extension
      const extensionValues: Record<string, any> = {};
      let hasValues = false;
      
      for (const setting of extension.settings) {
        if (values.hasOwnProperty(setting.key)) {
          extensionValues[setting.key] = values[setting.key];
          hasValues = true;
        }
      }
      
      // Update extension settings if there are values for it
      if (hasValues) {
        extension.setValues(extensionValues);
      }
    }
  }
}
