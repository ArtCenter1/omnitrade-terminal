/**
 * WorkspaceContextProvider
 *
 * A component that provides a fallback WorkspaceContext when one is not available.
 * This is useful for components that use the WorkspaceContext but may be rendered
 * outside of a WorkspaceProvider.
 */

import React, { createContext, useContext } from 'react';
import {
  WorkspaceLayout,
  WorkspaceState,
  WorkspaceTemplate,
  LayoutItemType,
  SplitDirection,
} from '@/lib/workspace';

// Create a mock workspace context type that matches the real one
interface WorkspaceContextType {
  state: WorkspaceState;
  currentWorkspace: WorkspaceLayout | null;
  createWorkspace: (name: string, description?: string) => WorkspaceLayout;
  createFromTemplate: (
    templateId: string,
    name?: string,
  ) => WorkspaceLayout | null;
  getTemplates: () => WorkspaceTemplate[];
  updateWorkspace: (workspace: WorkspaceLayout) => boolean;
  deleteWorkspace: (id: string) => boolean;
  setCurrentWorkspace: (id: string) => boolean;
  exportWorkspace: (id: string) => string;
  importWorkspace: (json: string) => WorkspaceLayout;
}

// Create a mock context with no-op functions
const mockWorkspaceContext: WorkspaceContextType = {
  state: { workspaces: [], currentWorkspaceId: null, templates: [] },
  currentWorkspace: null,
  createWorkspace: () => ({
    id: 'mock',
    name: 'Mock',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    root: {
      type: LayoutItemType.CONTAINER,
      id: 'mock',
      direction: SplitDirection.HORIZONTAL,
      children: [],
    },
  }),
  createFromTemplate: () => null,
  getTemplates: () => [],
  updateWorkspace: () => false,
  deleteWorkspace: () => false,
  setCurrentWorkspace: () => false,
  exportWorkspace: () => '',
  importWorkspace: () => ({
    id: 'mock',
    name: 'Mock',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    root: {
      type: LayoutItemType.CONTAINER,
      id: 'mock',
      direction: SplitDirection.HORIZONTAL,
      children: [],
    },
  }),
};

// Create a context for the mock workspace
const MockWorkspaceContext =
  createContext<WorkspaceContextType>(mockWorkspaceContext);

/**
 * Hook to use the workspace context safely
 * This will try to use the real WorkspaceContext if available,
 * and fall back to the mock if not
 */
export const useSafeWorkspace = (): WorkspaceContextType => {
  // Try to use the real context first (imported from the actual context file)
  try {
    // We need to dynamically import this to avoid circular dependencies
    const { useWorkspace } = require('@/contexts/WorkspaceContext');
    try {
      return useWorkspace();
    } catch (error) {
      // If useWorkspace throws an error (not within provider), use our mock
      return useContext(MockWorkspaceContext);
    }
  } catch (error) {
    // If we can't even import the real context, use our mock
    return useContext(MockWorkspaceContext);
  }
};

/**
 * A component that provides the mock workspace context
 */
export const MockWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <MockWorkspaceContext.Provider value={mockWorkspaceContext}>
      {children}
    </MockWorkspaceContext.Provider>
  );
};

/**
 * A component that tries to detect if we're in a real WorkspaceProvider
 * and falls back to the mock if not
 */
export const SafeWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Try to use the real context first
  try {
    const { WorkspaceProvider } = require('@/contexts/WorkspaceContext');
    return <WorkspaceProvider>{children}</WorkspaceProvider>;
  } catch (error) {
    // If we can't import the real provider, use our mock
    return <MockWorkspaceProvider>{children}</MockWorkspaceProvider>;
  }
};
