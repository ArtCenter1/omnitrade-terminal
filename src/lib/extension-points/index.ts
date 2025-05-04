/**
 * Extension Point System
 * 
 * This module provides the core functionality for extension points,
 * which allow plugins to extend the functionality of the terminal.
 */

export * from './types';
export * from './component-extension-point';

// Export singleton instances of extension points
import { ComponentExtensionPoint } from './component-extension-point';
export const componentExtensionPoint = ComponentExtensionPoint.getInstance();
