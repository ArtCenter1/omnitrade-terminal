/**
 * Component Registry
 * 
 * The central registry for all components in the terminal application.
 * Handles registration, discovery, and instantiation of components.
 */

import { 
  ComponentConstructor, 
  ComponentLifecycleState, 
  ComponentLookupOptions, 
  ComponentMetadata, 
  ComponentRegistrationOptions, 
  IComponent 
} from './types';

/**
 * Component Registry class
 */
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<string, ComponentConstructor> = new Map();
  private metadata: Map<string, ComponentMetadata> = new Map();
  private instances: Map<string, IComponent> = new Map();

  /**
   * Get the singleton instance of the ComponentRegistry
   */
  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Register a component with the registry
   * 
   * @param componentClass The component constructor
   * @param options Registration options
   * @returns True if registration was successful
   */
  public register(
    componentClass: ComponentConstructor,
    options: ComponentRegistrationOptions = {}
  ): boolean {
    try {
      // Create a temporary instance to get metadata
      const tempInstance = new componentClass();
      const { id } = tempInstance.metadata;

      // Check if component with this ID already exists
      if (this.components.has(id) && !options.override) {
        console.warn(`Component with ID ${id} is already registered. Use override option to replace it.`);
        return false;
      }

      // Store the component constructor and metadata
      this.components.set(id, componentClass);
      this.metadata.set(id, tempInstance.metadata);
      
      console.log(`Component registered: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to register component:', error);
      return false;
    }
  }

  /**
   * Unregister a component from the registry
   * 
   * @param id The component ID
   * @returns True if unregistration was successful
   */
  public unregister(id: string): boolean {
    // Check if component exists
    if (!this.components.has(id)) {
      console.warn(`Component with ID ${id} is not registered.`);
      return false;
    }

    // Dispose any active instances
    if (this.instances.has(id)) {
      try {
        const instance = this.instances.get(id);
        if (instance) {
          instance.dispose();
        }
        this.instances.delete(id);
      } catch (error) {
        console.error(`Error disposing component instance ${id}:`, error);
      }
    }

    // Remove from registry
    this.components.delete(id);
    this.metadata.delete(id);
    
    console.log(`Component unregistered: ${id}`);
    return true;
  }

  /**
   * Create an instance of a component
   * 
   * @param id The component ID
   * @returns The component instance or null if creation failed
   */
  public createInstance(id: string): IComponent | null {
    // Check if component exists
    if (!this.components.has(id)) {
      console.warn(`Component with ID ${id} is not registered.`);
      return null;
    }

    try {
      // Get the component constructor
      const componentClass = this.components.get(id);
      if (!componentClass) {
        return null;
      }

      // Create a new instance
      const instance = new componentClass();
      instance.state = ComponentLifecycleState.INITIALIZING;
      
      // Initialize the component
      instance.initialize()
        .then(() => {
          instance.state = ComponentLifecycleState.READY;
        })
        .catch((error) => {
          console.error(`Error initializing component ${id}:`, error);
          instance.state = ComponentLifecycleState.ERROR;
        });

      // Store the instance
      const instanceId = `${id}-${Date.now()}`;
      this.instances.set(instanceId, instance);
      
      return instance;
    } catch (error) {
      console.error(`Error creating component instance ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all registered component metadata
   * 
   * @param options Lookup options for filtering components
   * @returns Array of component metadata
   */
  public getComponents(options?: ComponentLookupOptions): ComponentMetadata[] {
    const allMetadata = Array.from(this.metadata.values());
    
    if (!options) {
      return allMetadata;
    }

    // Filter by options
    return allMetadata.filter(metadata => {
      // Filter by category
      if (options.category && metadata.category !== options.category) {
        return false;
      }
      
      // Filter by tags
      if (options.tags && options.tags.length > 0) {
        if (!metadata.tags) {
          return false;
        }
        
        // Check if component has at least one of the requested tags
        return options.tags.some(tag => metadata.tags?.includes(tag));
      }
      
      return true;
    });
  }

  /**
   * Get component metadata by ID
   * 
   * @param id The component ID
   * @returns The component metadata or null if not found
   */
  public getComponentMetadata(id: string): ComponentMetadata | null {
    return this.metadata.get(id) || null;
  }

  /**
   * Check if a component with the given ID is registered
   * 
   * @param id The component ID
   * @returns True if the component is registered
   */
  public hasComponent(id: string): boolean {
    return this.components.has(id);
  }

  /**
   * Resolve component dependencies
   * 
   * @param id The component ID
   * @returns Array of dependency metadata or null if any dependency is missing
   */
  public resolveDependencies(id: string): ComponentMetadata[] | null {
    const metadata = this.metadata.get(id);
    if (!metadata) {
      return null;
    }

    // If no dependencies, return empty array
    if (!metadata.dependencies || metadata.dependencies.length === 0) {
      return [];
    }

    // Check if all dependencies are registered
    const dependencies: ComponentMetadata[] = [];
    for (const depId of metadata.dependencies) {
      const depMetadata = this.metadata.get(depId);
      if (!depMetadata) {
        console.warn(`Dependency ${depId} for component ${id} is not registered.`);
        return null;
      }
      dependencies.push(depMetadata);
    }

    return dependencies;
  }
}
