/**
 * Simple event emitter implementation
 * 
 * Allows subscribing to events and emitting events to subscribers.
 */
export class EventEmitter<T> {
  private subscribers: Set<(event: T) => void> = new Set();

  /**
   * Subscribe to events
   * @param callback The callback function to call when an event is emitted
   * @returns A function to unsubscribe
   */
  public subscribe(callback: (event: T) => void): () => void {
    this.subscribers.add(callback);
    
    // Return an unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Emit an event to all subscribers
   * @param event The event to emit
   */
  public emit(event: T): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Error in event subscriber:', error);
      }
    }
  }

  /**
   * Get the number of subscribers
   * @returns The number of subscribers
   */
  public getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Clear all subscribers
   */
  public clear(): void {
    this.subscribers.clear();
  }
}
