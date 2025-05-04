/**
 * Command Extension Point
 * 
 * Allows plugins to register new commands with the terminal.
 */

import { ICommandExtension, IExtensionPoint } from './types';

/**
 * Command Extension Point implementation
 */
export class CommandExtensionPoint implements IExtensionPoint<ICommandExtension> {
  private static instance: CommandExtensionPoint;
  private extensions: Map<string, ICommandExtension> = new Map();
  
  public readonly id = 'command-extension-point';
  public readonly name = 'Command Extension Point';
  public readonly description = 'Allows plugins to register new commands with the terminal';
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the CommandExtensionPoint
   */
  public static getInstance(): CommandExtensionPoint {
    if (!CommandExtensionPoint.instance) {
      CommandExtensionPoint.instance = new CommandExtensionPoint();
    }
    return CommandExtensionPoint.instance;
  }
  
  /**
   * Register a command extension
   * 
   * @param extension The command extension to register
   * @returns True if registration was successful
   */
  public register(extension: ICommandExtension): boolean {
    try {
      // Check if extension with this ID already exists
      if (this.extensions.has(extension.id)) {
        console.warn(`Command extension with ID ${extension.id} is already registered.`);
        return false;
      }
      
      // Store the extension
      this.extensions.set(extension.id, extension);
      
      console.log(`Command extension registered: ${extension.id} (${extension.command})`);
      return true;
    } catch (error) {
      console.error('Failed to register command extension:', error);
      return false;
    }
  }
  
  /**
   * Unregister a command extension
   * 
   * @param id The ID of the extension to unregister
   * @returns True if unregistration was successful
   */
  public unregister(id: string): boolean {
    // Check if extension exists
    if (!this.extensions.has(id)) {
      console.warn(`Command extension with ID ${id} is not registered.`);
      return false;
    }
    
    // Remove from registry
    this.extensions.delete(id);
    
    console.log(`Command extension unregistered: ${id}`);
    return true;
  }
  
  /**
   * Get all registered command extensions
   * 
   * @returns Array of registered command extensions
   */
  public getExtensions(): ICommandExtension[] {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Get a command extension by ID
   * 
   * @param id The ID of the extension to get
   * @returns The extension or undefined if not found
   */
  public getExtension(id: string): ICommandExtension | undefined {
    return this.extensions.get(id);
  }
  
  /**
   * Get a command extension by command name
   * 
   * @param command The command name to look for
   * @returns The extension or undefined if not found
   */
  public getExtensionByCommand(command: string): ICommandExtension | undefined {
    return Array.from(this.extensions.values()).find(
      extension => extension.command === command
    );
  }
  
  /**
   * Get command extensions by category
   * 
   * @param category The category to filter by
   * @returns Array of matching command extensions
   */
  public getExtensionsByCategory(category: string): ICommandExtension[] {
    return Array.from(this.extensions.values()).filter(
      extension => extension.category === category
    );
  }
  
  /**
   * Execute a command
   * 
   * @param command The command to execute
   * @param args Arguments to pass to the command
   * @returns The result of the command execution
   */
  public async executeCommand(command: string, args?: any): Promise<any> {
    const extension = this.getExtensionByCommand(command);
    
    if (!extension) {
      throw new Error(`Command not found: ${command}`);
    }
    
    if (!extension.isEnabled()) {
      throw new Error(`Command is disabled: ${command}`);
    }
    
    return extension.execute(args);
  }
}
