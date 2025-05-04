/**
 * Extension Point System
 *
 * This module provides the core functionality for extension points,
 * which allow plugins to extend the functionality of the terminal.
 */

export * from './types';
export * from './component-extension-point';
export * from './data-provider-extension-point';
export * from './command-extension-point';
export * from './menu-extension-point';
export * from './settings-extension-point';

// Export singleton instances of extension points
import { ComponentExtensionPoint } from './component-extension-point';
import { DataProviderExtensionPoint } from './data-provider-extension-point';
import { CommandExtensionPoint } from './command-extension-point';
import { MenuExtensionPoint } from './menu-extension-point';
import { SettingsExtensionPoint } from './settings-extension-point';

export const componentExtensionPoint = ComponentExtensionPoint.getInstance();
export const dataProviderExtensionPoint = DataProviderExtensionPoint.getInstance();
export const commandExtensionPoint = CommandExtensionPoint.getInstance();
export const menuExtensionPoint = MenuExtensionPoint.getInstance();
export const settingsExtensionPoint = SettingsExtensionPoint.getInstance();
