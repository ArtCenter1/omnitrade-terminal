/**
 * Base Terminal Component
 *
 * A base class for all terminal components that implements the IComponent interface.
 */

import React from 'react';
import {
  ComponentLifecycleState,
  ComponentMetadata,
  IComponent
} from '@/lib/component-registry';

/**
 * Base Terminal Component Props
 */
export interface BaseTerminalComponentProps {
  id: string;
  width?: number;
  height?: number;
  settings?: Record<string, any>;
  onResize?: (width: number, height: number) => void;
}

/**
 * Base Terminal Component State
 */
export interface BaseTerminalComponentState {
  isLoading: boolean;
  error: Error | null;
}

/**
 * Base Terminal Component
 *
 * A base class for all terminal components that implements the IComponent interface.
 */
export abstract class BaseTerminalComponent<
  P extends BaseTerminalComponentProps = BaseTerminalComponentProps,
  S extends BaseTerminalComponentState = BaseTerminalComponentState
> implements IComponent {

  public metadata: ComponentMetadata;
  public state: ComponentLifecycleState = ComponentLifecycleState.REGISTERED;

  protected container: HTMLElement | null = null;
  protected props: P;
  protected componentState: S;

  /**
   * Constructor
   *
   * @param metadata Component metadata
   * @param props Component props
   */
  constructor(metadata: ComponentMetadata, props: P) {
    this.metadata = metadata;
    this.props = props;
    this.componentState = {
      isLoading: true,
      error: null
    } as S;
  }

  /**
   * Initialize the component
   */
  public async initialize(): Promise<void> {
    try {
      this.state = ComponentLifecycleState.INITIALIZING;
      await this.onInitialize();
      this.state = ComponentLifecycleState.READY;
      this.componentState.isLoading = false;
    } catch (error) {
      this.state = ComponentLifecycleState.ERROR;
      this.componentState.error = error as Error;
      throw error;
    }
  }

  /**
   * Render the component into the container
   *
   * @param container The HTML element to render into
   */
  public render(container: HTMLElement): void {
    this.container = container;
    this.onRender();
  }

  /**
   * Update the component with new props
   *
   * @param props New component props
   */
  public update(props: Partial<P>): void {
    this.props = { ...this.props, ...props };
    this.onUpdate();
  }

  /**
   * Dispose the component
   */
  public dispose(): void {
    try {
      // Only dispose if not already disposed
      if (this.state !== ComponentLifecycleState.DISPOSED) {
        this.onDispose();
        this.container = null;
        this.state = ComponentLifecycleState.DISPOSED;
      }
    } catch (error) {
      console.error(`Error disposing component ${this.metadata.id}:`, error);
      // Ensure we still mark as disposed even if there was an error
      this.container = null;
      this.state = ComponentLifecycleState.DISPOSED;
    }
  }

  /**
   * Handle resize events
   *
   * @param width New width
   * @param height New height
   */
  public onResize(width: number, height: number): void {
    if (this.props.onResize) {
      this.props.onResize(width, height);
    }
  }

  /**
   * Handle settings changes
   *
   * @param settings New settings
   */
  public onSettingsChanged(settings: Record<string, any>): void {
    this.props.settings = settings;
    this.onUpdate();
  }

  /**
   * Handle theme changes
   *
   * @param theme New theme
   */
  public onThemeChanged(theme: 'light' | 'dark'): void {
    // Override in subclasses if needed
  }

  /**
   * Called during initialization
   * Override in subclasses
   */
  protected async onInitialize(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Called during rendering
   * Override in subclasses
   */
  protected onRender(): void {
    // Override in subclasses
  }

  /**
   * Called during updates
   * Override in subclasses
   */
  protected onUpdate(): void {
    // Override in subclasses
  }

  /**
   * Called during disposal
   * Override in subclasses
   */
  protected onDispose(): void {
    // Override in subclasses
  }

  /**
   * Get the React component for this terminal component
   * Override in subclasses
   */
  protected abstract getReactComponent(): React.ComponentType<any>;
}
