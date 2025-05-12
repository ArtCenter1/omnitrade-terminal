/**
 * Error Boundary Components
 *
 * This file exports all error boundary related components for easier importing.
 */

// Re-export components from their source files
// Using direct import/export to avoid circular dependencies
import { ErrorBoundary as ErrorBoundaryComponent } from '@/components/ui/error-boundary.tsx';

// Export the ErrorBoundary component
export const ErrorBoundary = ErrorBoundaryComponent;

// Export the SafeTabModule component
export { SafeTabModule } from './SafeTabModule';

// Export the WorkspaceContextProvider components
export * from './WorkspaceContextProvider';
