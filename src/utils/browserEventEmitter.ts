/**
 * A simple EventEmitter implementation for browser environments.
 * This provides a similar API to Node.js's EventEmitter but works in browsers.
 */
export class BrowserEventEmitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  /**
   * Add a listener for the specified event.
   * @param event The event name
   * @param listener The callback function
   * @returns This instance for chaining
   */
  public on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * Add a one-time listener for the specified event.
   * @param event The event name
   * @param listener The callback function
   * @returns This instance for chaining
   */
  public once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Remove a listener for the specified event.
   * @param event The event name
   * @param listener The callback function to remove
   * @returns This instance for chaining
   */
  public off(event: string, listener: (...args: any[]) => void): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    }
    return this;
  }

  /**
   * Remove all listeners for the specified event, or all events if no event is specified.
   * @param event Optional event name
   * @returns This instance for chaining
   */
  public removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  /**
   * Emit an event with the specified arguments.
   * @param event The event name
   * @param args The arguments to pass to the listeners
   * @returns true if the event had listeners, false otherwise
   */
  public emit(event: string, ...args: any[]): boolean {
    if (this.events[event]) {
      // Create a copy of the listeners array to avoid issues if listeners are added/removed during emission
      const listeners = [...this.events[event]];
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Get the number of listeners for the specified event.
   * @param event The event name
   * @returns The number of listeners
   */
  public listenerCount(event: string): number {
    return this.events[event]?.length || 0;
  }

  /**
   * Get all listeners for the specified event.
   * @param event The event name
   * @returns An array of listeners
   */
  public listeners(event: string): Array<(...args: any[]) => void> {
    return this.events[event] ? [...this.events[event]] : [];
  }
}
