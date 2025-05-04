/**
 * Menu Extension Point
 * 
 * Allows plugins to register new menu items with the terminal.
 */

import { IExtensionPoint, IMenuExtension } from './types';

/**
 * Menu Extension Point implementation
 */
export class MenuExtensionPoint implements IExtensionPoint<IMenuExtension> {
  private static instance: MenuExtensionPoint;
  private extensions: Map<string, IMenuExtension> = new Map();
  
  public readonly id = 'menu-extension-point';
  public readonly name = 'Menu Extension Point';
  public readonly description = 'Allows plugins to register new menu items with the terminal';
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the MenuExtensionPoint
   */
  public static getInstance(): MenuExtensionPoint {
    if (!MenuExtensionPoint.instance) {
      MenuExtensionPoint.instance = new MenuExtensionPoint();
    }
    return MenuExtensionPoint.instance;
  }
  
  /**
   * Register a menu extension
   * 
   * @param extension The menu extension to register
   * @returns True if registration was successful
   */
  public register(extension: IMenuExtension): boolean {
    try {
      // Check if extension with this ID already exists
      if (this.extensions.has(extension.id)) {
        console.warn(`Menu extension with ID ${extension.id} is already registered.`);
        return false;
      }
      
      // Store the extension
      this.extensions.set(extension.id, extension);
      
      console.log(`Menu extension registered: ${extension.id} (${extension.path})`);
      return true;
    } catch (error) {
      console.error('Failed to register menu extension:', error);
      return false;
    }
  }
  
  /**
   * Unregister a menu extension
   * 
   * @param id The ID of the extension to unregister
   * @returns True if unregistration was successful
   */
  public unregister(id: string): boolean {
    // Check if extension exists
    if (!this.extensions.has(id)) {
      console.warn(`Menu extension with ID ${id} is not registered.`);
      return false;
    }
    
    // Remove from registry
    this.extensions.delete(id);
    
    console.log(`Menu extension unregistered: ${id}`);
    return true;
  }
  
  /**
   * Get all registered menu extensions
   * 
   * @returns Array of registered menu extensions
   */
  public getExtensions(): IMenuExtension[] {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Get menu extensions by path
   * 
   * @param path The menu path to filter by (e.g., "File", "Edit/Find")
   * @returns Array of matching menu extensions
   */
  public getExtensionsByPath(path: string): IMenuExtension[] {
    return Array.from(this.extensions.values())
      .filter(extension => {
        // Exact match or parent path
        return extension.path === path || extension.path.startsWith(`${path}/`);
      })
      .sort((a, b) => {
        // Sort by order if specified
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) {
          return -1;
        }
        if (b.order !== undefined) {
          return 1;
        }
        // Otherwise sort by label
        return a.label.localeCompare(b.label);
      });
  }
  
  /**
   * Get the menu structure for a specific path
   * 
   * @param path The menu path to get the structure for
   * @returns An object representing the menu structure
   */
  public getMenuStructure(path: string = ''): any {
    const result: any = {
      items: [],
      submenus: {}
    };
    
    // Get all extensions for this path and its subpaths
    const extensions = this.getExtensionsByPath(path);
    
    for (const extension of extensions) {
      // Skip if not visible
      if (extension.isVisible && !extension.isVisible()) {
        continue;
      }
      
      // Get the relative path from the current path
      const relativePath = path === '' 
        ? extension.path 
        : extension.path.substring(path.length + 1);
      
      // If this is a direct child of the current path
      if (!relativePath.includes('/')) {
        // Add to items if it's a direct match
        if (extension.path === path) {
          result.items.push({
            id: extension.id,
            label: extension.label,
            icon: extension.icon,
            enabled: extension.isEnabled ? extension.isEnabled() : true,
            action: extension.action
          });
        } 
        // Otherwise it's a submenu
        else {
          const submenuName = relativePath;
          if (!result.submenus[submenuName]) {
            result.submenus[submenuName] = {
              label: submenuName,
              items: []
            };
          }
        }
      }
      // If this is a descendant of the current path
      else {
        const submenuName = relativePath.split('/')[0];
        if (!result.submenus[submenuName]) {
          result.submenus[submenuName] = {
            label: submenuName,
            items: []
          };
        }
      }
    }
    
    // Convert submenus object to array
    result.submenus = Object.entries(result.submenus).map(([_, value]) => value);
    
    return result;
  }
}
