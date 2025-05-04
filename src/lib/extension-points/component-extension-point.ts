/**
 * Component Extension Point
 * 
 * Allows plugins to register new components with the terminal.
 */

import { IComponentExtension, IExtensionPoint } from './types';
import { componentRegistry } from '../component-registry';

/**
 * Component Extension Point implementation
 */
export class ComponentExtensionPoint implements IExtensionPoint<IComponentExtension> {
  private static instance: ComponentExtensionPoint;
  private extensions: Map<string, IComponentExtension> = new Map();
  
  public readonly id = 'component-extension-point';
  public readonly name = 'Component Extension Point';
  public readonly description = 'Allows plugins to register new components with the terminal';
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the ComponentExtensionPoint
   */
  public static getInstance(): ComponentExtensionPoint {
    if (!ComponentExtensionPoint.instance) {
      ComponentExtensionPoint.instance = new ComponentExtensionPoint();
    }
    return ComponentExtensionPoint.instance;
  }
  
  /**
   * Register a component extension
   * 
   * @param extension The component extension to register
   * @returns True if registration was successful
   */
  public register(extension: IComponentExtension): boolean {
    try {
      // Check if extension with this ID already exists
      if (this.extensions.has(extension.id)) {
        console.warn(`Component extension with ID ${extension.id} is already registered.`);
        return false;
      }
      
      // Initialize the extension
      extension.initialize()
        .then(() => {
          console.log(`Component extension initialized: ${extension.id}`);
          
          // Get the component implementation
          const component = extension.getComponent();
          if (!component) {
            console.error(`Component extension ${extension.id} returned null component.`);
            return;
          }
          
          // Register the component with the registry
          componentRegistry.register(component);
        })
        .catch(error => {
          console.error(`Failed to initialize component extension ${extension.id}:`, error);
        });
      
      // Store the extension
      this.extensions.set(extension.id, extension);
      
      console.log(`Component extension registered: ${extension.id}`);
      return true;
    } catch (error) {
      console.error('Failed to register component extension:', error);
      return false;
    }
  }
  
  /**
   * Unregister a component extension
   * 
   * @param id The ID of the extension to unregister
   * @returns True if unregistration was successful
   */
  public unregister(id: string): boolean {
    // Check if extension exists
    if (!this.extensions.has(id)) {
      console.warn(`Component extension with ID ${id} is not registered.`);
      return false;
    }
    
    // Remove from registry
    this.extensions.delete(id);
    
    console.log(`Component extension unregistered: ${id}`);
    return true;
  }
  
  /**
   * Get all registered component extensions
   * 
   * @returns Array of registered component extensions
   */
  public getExtensions(): IComponentExtension[] {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Get a component extension by ID
   * 
   * @param id The ID of the extension to get
   * @returns The component extension or null if not found
   */
  public getExtension(id: string): IComponentExtension | null {
    return this.extensions.get(id) || null;
  }
}
