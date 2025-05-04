/**
 * Plugin Manager
 * 
 * Manages the lifecycle of plugins in the terminal.
 */

import { Plugin, PluginManifest, PluginState } from './types';
import { validateManifest } from './manifest-validator';
import { PluginSandboxImpl } from './plugin-sandbox';
import semver from 'semver';

/**
 * Plugin Manager implementation
 */
export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, Plugin> = new Map();
  private terminalVersion: string = '1.0.0'; // Should be dynamically determined
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the PluginManager
   */
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }
  
  /**
   * Register a plugin with the manager
   * 
   * @param manifest The plugin manifest
   * @returns True if registration was successful
   */
  public register(manifest: any): boolean {
    try {
      // Validate the manifest
      const validatedManifest = validateManifest(manifest);
      
      // Check if plugin with this ID already exists
      if (this.plugins.has(validatedManifest.id)) {
        console.warn(`Plugin with ID ${validatedManifest.id} is already registered.`);
        return false;
      }
      
      // Check terminal compatibility
      if (validatedManifest.compatibility?.terminal) {
        if (!semver.satisfies(this.terminalVersion, validatedManifest.compatibility.terminal)) {
          console.error(
            `Plugin ${validatedManifest.id} requires terminal version ${validatedManifest.compatibility.terminal}, but current version is ${this.terminalVersion}`
          );
          return false;
        }
      }
      
      // Create plugin object
      const plugin: Plugin = {
        manifest: validatedManifest,
        instance: null,
        state: PluginState.REGISTERED
      };
      
      // Store the plugin
      this.plugins.set(validatedManifest.id, plugin);
      
      console.log(`Plugin registered: ${validatedManifest.id} (${validatedManifest.name} v${validatedManifest.version})`);
      return true;
    } catch (error) {
      console.error('Failed to register plugin:', error);
      return false;
    }
  }
  
  /**
   * Unregister a plugin
   * 
   * @param pluginId The ID of the plugin to unregister
   * @returns True if unregistration was successful
   */
  public unregister(pluginId: string): boolean {
    // Check if plugin exists
    if (!this.plugins.has(pluginId)) {
      console.warn(`Plugin with ID ${pluginId} is not registered.`);
      return false;
    }
    
    // Get the plugin
    const plugin = this.plugins.get(pluginId)!;
    
    // Deactivate the plugin if it's activated
    if (plugin.state === PluginState.ACTIVATED) {
      this.deactivatePlugin(pluginId);
    }
    
    // Remove from registry
    this.plugins.delete(pluginId);
    
    console.log(`Plugin unregistered: ${pluginId}`);
    return true;
  }
  
  /**
   * Get a plugin by ID
   * 
   * @param pluginId The ID of the plugin to get
   * @returns The plugin or undefined if not found
   */
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all registered plugins
   * 
   * @returns Array of registered plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Load a plugin
   * 
   * @param pluginId The ID of the plugin to load
   * @returns Promise that resolves when the plugin is loaded
   */
  public async loadPlugin(pluginId: string): Promise<void> {
    // Check if plugin exists
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin with ID ${pluginId} is not registered.`);
    }
    
    // Get the plugin
    const plugin = this.plugins.get(pluginId)!;
    
    // Check if plugin is already loaded
    if (plugin.state === PluginState.LOADED || plugin.state === PluginState.ACTIVATED) {
      console.warn(`Plugin ${pluginId} is already loaded.`);
      return;
    }
    
    try {
      // Check dependencies
      if (plugin.manifest.dependencies) {
        for (const [depId, versionReq] of Object.entries(plugin.manifest.dependencies)) {
          // Check if dependency is registered
          const dependency = this.plugins.get(depId);
          if (!dependency) {
            throw new Error(`Dependency ${depId} is not registered.`);
          }
          
          // Check if dependency version is compatible
          if (!semver.satisfies(dependency.manifest.version, versionReq)) {
            throw new Error(
              `Dependency ${depId} version ${dependency.manifest.version} does not satisfy requirement ${versionReq}.`
            );
          }
          
          // Load dependency if not already loaded
          if (dependency.state === PluginState.REGISTERED) {
            await this.loadPlugin(depId);
          }
        }
      }
      
      // Create sandbox
      const sandbox = new PluginSandboxImpl(
        plugin.manifest.id,
        plugin.manifest.permissions || []
      );
      
      // Load the plugin module
      const pluginModule = await sandbox.loadModule(plugin.manifest.main);
      
      // Store the plugin instance
      plugin.instance = {
        module: pluginModule,
        sandbox: sandbox,
        api: sandbox.createPluginAPI()
      };
      
      // Update plugin state
      plugin.state = PluginState.LOADED;
      
      console.log(`Plugin loaded: ${pluginId}`);
    } catch (error) {
      // Update plugin state to error
      plugin.state = PluginState.ERROR;
      plugin.error = error as Error;
      
      console.error(`Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * Activate a plugin
   * 
   * @param pluginId The ID of the plugin to activate
   * @returns Promise that resolves when the plugin is activated
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    // Check if plugin exists
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin with ID ${pluginId} is not registered.`);
    }
    
    // Get the plugin
    const plugin = this.plugins.get(pluginId)!;
    
    // Check if plugin is already activated
    if (plugin.state === PluginState.ACTIVATED) {
      console.warn(`Plugin ${pluginId} is already activated.`);
      return;
    }
    
    // Load the plugin if not already loaded
    if (plugin.state === PluginState.REGISTERED) {
      await this.loadPlugin(pluginId);
    }
    
    try {
      // Call the plugin's activate function if it exists
      if (plugin.instance.module.activate) {
        await plugin.instance.module.activate(plugin.instance.api);
      }
      
      // Update plugin state
      plugin.state = PluginState.ACTIVATED;
      
      console.log(`Plugin activated: ${pluginId}`);
    } catch (error) {
      // Update plugin state to error
      plugin.state = PluginState.ERROR;
      plugin.error = error as Error;
      
      console.error(`Failed to activate plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * Deactivate a plugin
   * 
   * @param pluginId The ID of the plugin to deactivate
   * @returns Promise that resolves when the plugin is deactivated
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    // Check if plugin exists
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin with ID ${pluginId} is not registered.`);
    }
    
    // Get the plugin
    const plugin = this.plugins.get(pluginId)!;
    
    // Check if plugin is activated
    if (plugin.state !== PluginState.ACTIVATED) {
      console.warn(`Plugin ${pluginId} is not activated.`);
      return;
    }
    
    try {
      // Call the plugin's deactivate function if it exists
      if (plugin.instance.module.deactivate) {
        await plugin.instance.module.deactivate();
      }
      
      // Update plugin state
      plugin.state = PluginState.LOADED;
      
      console.log(`Plugin deactivated: ${pluginId}`);
    } catch (error) {
      // Update plugin state to error
      plugin.state = PluginState.ERROR;
      plugin.error = error as Error;
      
      console.error(`Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * Unload a plugin
   * 
   * @param pluginId The ID of the plugin to unload
   * @returns Promise that resolves when the plugin is unloaded
   */
  public async unloadPlugin(pluginId: string): Promise<void> {
    // Check if plugin exists
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin with ID ${pluginId} is not registered.`);
    }
    
    // Get the plugin
    const plugin = this.plugins.get(pluginId)!;
    
    // Check if plugin is loaded
    if (plugin.state !== PluginState.LOADED && plugin.state !== PluginState.ACTIVATED) {
      console.warn(`Plugin ${pluginId} is not loaded.`);
      return;
    }
    
    // Deactivate the plugin if it's activated
    if (plugin.state === PluginState.ACTIVATED) {
      await this.deactivatePlugin(pluginId);
    }
    
    try {
      // Dispose of the sandbox
      plugin.instance.sandbox.dispose();
      
      // Clear the plugin instance
      plugin.instance = null;
      
      // Update plugin state
      plugin.state = PluginState.REGISTERED;
      
      console.log(`Plugin unloaded: ${pluginId}`);
    } catch (error) {
      // Update plugin state to error
      plugin.state = PluginState.ERROR;
      plugin.error = error as Error;
      
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * Resolve plugin dependencies
   * 
   * @param pluginId The ID of the plugin to resolve dependencies for
   * @returns Array of plugin IDs in dependency order
   */
  public resolveDependencies(pluginId: string): string[] {
    // Check if plugin exists
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin with ID ${pluginId} is not registered.`);
    }
    
    const result: string[] = [];
    const visited = new Set<string>();
    
    // Recursive function to visit dependencies
    const visit = (id: string) => {
      // Skip if already visited
      if (visited.has(id)) {
        return;
      }
      
      // Mark as visited
      visited.add(id);
      
      // Get the plugin
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin with ID ${id} is not registered.`);
      }
      
      // Visit dependencies
      if (plugin.manifest.dependencies) {
        for (const depId of Object.keys(plugin.manifest.dependencies)) {
          visit(depId);
        }
      }
      
      // Add to result
      result.push(id);
    };
    
    // Start visiting from the requested plugin
    visit(pluginId);
    
    return result;
  }
  
  /**
   * Check if a plugin's dependencies are satisfied
   * 
   * @param pluginId The ID of the plugin to check
   * @returns True if all dependencies are satisfied
   */
  public checkDependencies(pluginId: string): boolean {
    // Check if plugin exists
    if (!this.plugins.has(pluginId)) {
      return false;
    }
    
    // Get the plugin
    const plugin = this.plugins.get(pluginId)!;
    
    // Check dependencies
    if (plugin.manifest.dependencies) {
      for (const [depId, versionReq] of Object.entries(plugin.manifest.dependencies)) {
        // Check if dependency is registered
        const dependency = this.plugins.get(depId);
        if (!dependency) {
          return false;
        }
        
        // Check if dependency version is compatible
        if (!semver.satisfies(dependency.manifest.version, versionReq)) {
          return false;
        }
      }
    }
    
    return true;
  }
}
