/**
 * Workspace Context
 *
 * Provides access to the workspace manager throughout the application.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  workspaceManager,
  WorkspaceLayout,
  WorkspaceState,
} from '@/lib/workspace';

// Create the context
interface WorkspaceContextType {
  state: WorkspaceState;
  currentWorkspace: WorkspaceLayout | null;
  createWorkspace: (name: string, description?: string) => WorkspaceLayout;
  createFromTemplate: (
    templateId: string,
    name?: string,
  ) => WorkspaceLayout | null;
  getTemplates: () => import('@/lib/workspace').WorkspaceTemplate[];
  updateWorkspace: (workspace: WorkspaceLayout) => boolean;
  deleteWorkspace: (id: string) => boolean;
  setCurrentWorkspace: (id: string) => boolean;
  exportWorkspace: (id: string) => string;
  importWorkspace: (json: string) => WorkspaceLayout;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

/**
 * Workspace Provider component
 */
export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<WorkspaceState>(
    workspaceManager.getState(),
  );
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceLayout | null>(workspaceManager.getCurrentWorkspace());

  // Listen for changes to the workspace state
  useEffect(() => {
    const unsubscribe = workspaceManager.addListener((newState) => {
      setState(newState);
      setCurrentWorkspace(workspaceManager.getCurrentWorkspace());
    });

    return unsubscribe;
  }, []);

  // Context value
  const value: WorkspaceContextType = {
    state,
    currentWorkspace,
    createWorkspace: workspaceManager.createWorkspace.bind(workspaceManager),
    createFromTemplate:
      workspaceManager.createFromTemplate.bind(workspaceManager),
    getTemplates: workspaceManager.getTemplates.bind(workspaceManager),
    updateWorkspace: workspaceManager.updateWorkspace.bind(workspaceManager),
    deleteWorkspace: workspaceManager.deleteWorkspace.bind(workspaceManager),
    setCurrentWorkspace:
      workspaceManager.setCurrentWorkspace.bind(workspaceManager),
    exportWorkspace: workspaceManager.exportWorkspace.bind(workspaceManager),
    importWorkspace: workspaceManager.importWorkspace.bind(workspaceManager),
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

/**
 * Hook to use the workspace context
 */
export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
