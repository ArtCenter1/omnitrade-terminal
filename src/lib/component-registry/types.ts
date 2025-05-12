/**
 * Component Registry System Types
 *
 * This file defines the core interfaces and types for the component registry system.
 * The component registry allows for dynamic registration, discovery, and instantiation
 * of components throughout the terminal application.
 */

/**
 * Component lifecycle states
 */
export enum ComponentLifecycleState {
  REGISTERED = 'registered',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed',
}

/**
 * Component metadata interface
 * Describes the properties and capabilities of a component
 */
export interface ComponentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  category?: string;
  tags?: string[];
  icon?: string;
  dependencies?: string[];
  load?: () => Promise<
    { default: ComponentConstructor } | ComponentConstructor
  >; // Function for lazy loading
  settings?: ComponentSettingsDefinition[];
}

/**
 * Component settings definition
 */
export interface ComponentSettingsDefinition {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color';
  label: string;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  options?: { label: string; value: any }[]; // For select type
}

/**
 * Component instance interface
 * Defines the methods that all components must implement
 */
export interface IComponent {
  metadata: ComponentMetadata;
  state: ComponentLifecycleState;

  // Lifecycle methods
  initialize(): Promise<void>;
  render(container: HTMLElement): void;
  update(props: any): void;
  dispose(): void;

  // Optional methods
  onResize?(width: number, height: number): void;
  onSettingsChanged?(settings: Record<string, any>): void;
  onThemeChanged?(theme: 'light' | 'dark'): void;
}

/**
 * Component constructor type
 */
export type ComponentConstructor = new () => IComponent;

/**
 * Component registration options
 */
export interface ComponentRegistrationOptions {
  override?: boolean; // Whether to override an existing component with the same ID
}

/**
 * Component lookup options
 */
export interface ComponentLookupOptions {
  category?: string;
  tags?: string[];
}
