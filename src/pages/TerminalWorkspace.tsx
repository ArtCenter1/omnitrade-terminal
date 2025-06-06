/**
 * Terminal Workspace Page
 *
 * This is the new terminal page that uses the workspace management system.
 * It will eventually replace the current Terminal.tsx page.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, LayoutGrid, Save, Settings, Plus } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { TerminalContainer } from '@/components/terminal/core/TerminalContainer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModuleSelector } from '@/components/workspace/ModuleSelector';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';

/**
 * Workspace Controls Component
 */
const WorkspaceControls: React.FC<{
  onOpenModuleSelector: () => void; // Changed: no event argument
}> = ({ onOpenModuleSelector }) => {
  const { state, currentWorkspace, setCurrentWorkspace, deleteWorkspace } =
    useWorkspace();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Clean up duplicate workspaces and set default workspace when component mounts
  useEffect(() => {
    // Find all default workspaces (there might be duplicates)
    const defaultWorkspaces = state.workspaces.filter(
      (workspace) =>
        workspace.name === 'Default Workspace' ||
        workspace.id.includes('simplified'),
    );

    // If we have more than one default workspace, keep only the first one
    if (defaultWorkspaces.length > 1) {
      console.log(
        `Found ${defaultWorkspaces.length} default workspaces, cleaning up duplicates...`,
      );

      // Keep the first one
      const workspaceToKeep = defaultWorkspaces[0];

      // Delete all others
      for (let i = 1; i < defaultWorkspaces.length; i++) {
        console.log(
          `Deleting duplicate default workspace: ${defaultWorkspaces[i].id}`,
        );
        deleteWorkspace(defaultWorkspaces[i].id);
      }

      // Set the remaining workspace as current if needed
      if (!currentWorkspace || currentWorkspace.name === 'Default Workspace') {
        setCurrentWorkspace(workspaceToKeep.id);
        console.log(
          `Set current workspace to default: ${workspaceToKeep.name}`,
        );
      }
    } else if (defaultWorkspaces.length === 1) {
      // We have exactly one default workspace
      const simplifiedWorkspace = defaultWorkspaces[0];

      if (!currentWorkspace || currentWorkspace.name === 'Default Workspace') {
        // Set it as the current workspace
        setCurrentWorkspace(simplifiedWorkspace.id);
        console.log(
          `Set current workspace to default: ${simplifiedWorkspace.name}`,
        );
      }
    }
  }, [
    state.workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    deleteWorkspace,
  ]);

  // No longer need handleCreateWorkspace as it's handled in the CreateWorkspaceDialog component

  // Find all default workspaces (there might be duplicates)
  const defaultWorkspaces = state.workspaces.filter(
    (workspace) =>
      workspace.name === 'Default Workspace' ||
      workspace.id.includes('simplified'),
  );

  // Use only the first default workspace
  const defaultWorkspace =
    defaultWorkspaces.length > 0 ? defaultWorkspaces[0] : null;

  // Get user-created workspaces (all workspaces except the default ones)
  const userWorkspaces = state.workspaces.filter(
    (workspace) => !defaultWorkspaces.some((dw) => dw.id === workspace.id),
  );

  return (
    <div className="flex items-center space-x-2 p-2 bg-theme-tertiary border-b border-theme-border theme-transition">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Workspace
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {/* Default Workspace */}
          {defaultWorkspace && (
            <DropdownMenuItem
              key={defaultWorkspace.id}
              onClick={() => setCurrentWorkspace(defaultWorkspace.id)}
              className={
                currentWorkspace?.id === defaultWorkspace.id
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : ''
              }
            >
              <div className="flex items-center justify-between w-full">
                <span>{defaultWorkspace.name}</span>
                {/* No delete button for default workspace */}
              </div>
            </DropdownMenuItem>
          )}

          {/* User-created workspaces */}
          {userWorkspaces.length > 0 && (
            <>
              {userWorkspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  className={
                    currentWorkspace?.id === workspace.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : ''
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="flex-grow cursor-pointer"
                      onClick={() => setCurrentWorkspace(workspace.id)}
                    >
                      {workspace.name}
                    </span>
                    <button
                      className="ml-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full focus:outline-none"
                      title="Delete workspace"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Are you sure you want to delete "${workspace.name}"?`,
                          )
                        ) {
                          // Delete the workspace
                          deleteWorkspace(workspace.id);

                          // If the deleted workspace was the current one, switch to the default
                          if (
                            currentWorkspace?.id === workspace.id &&
                            defaultWorkspace
                          ) {
                            setCurrentWorkspace(defaultWorkspace.id);
                          }
                        }
                      }}
                    >
                      <span className="text-sm font-bold leading-none">−</span>
                    </button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Add Workspace option */}
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Module button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={onOpenModuleSelector} // Changed: no event argument
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Module
      </Button>

      {/* Save Layout button */}
      <Button variant="outline" size="sm" className="h-8">
        <Save className="h-4 w-4 mr-2" />
        Save Layout
      </Button>

      {/* Settings button */}
      <Button variant="outline" size="sm" className="h-8">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

/**
 * Terminal Workspace Page Component
 */
export default function TerminalWorkspace() {
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  // Removed moduleSelectorPosition state

  // Function to open the module selector (now uses default top position)
  const handleOpenModuleSelector = () => {
    // Changed: no event argument
    console.log(
      '[TerminalWorkspace] Opening Module Selector (default top position)',
    );
    // No longer setting moduleSelectorPosition
    setIsModuleSelectorOpen(true);
  };

  const handleCloseModuleSelector = () => {
    console.log('[TerminalWorkspace] Closing Module Selector');
    setIsModuleSelectorOpen(false);
  };

  return (
    <div className="bg-theme-primary min-h-screen theme-transition">
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-screen bg-theme-secondary text-theme-primary theme-transition">
            <AlertTriangle className="w-16 h-16 text-warning-color mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-theme-secondary mb-4">
              There was an error loading the terminal
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-button-primary text-white rounded hover:bg-button-primary-hover"
            >
              Reload page
            </Button>
          </div>
        }
      >
        <WorkspaceProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <WorkspaceControls
              onOpenModuleSelector={handleOpenModuleSelector}
            />
            <div className="flex-1 relative">
              <TerminalContainer
                className="h-full"
                onOpenModuleSelector={handleOpenModuleSelector}
              />
            </div>

            {/* Module Selector - positioned as a floating window */}
            {isModuleSelectorOpen && (
              <>
                {/* Semi-transparent backdrop */}
                <div
                  className="fixed inset-0 bg-black/20 z-[9998] pointer-events-auto"
                  onClick={handleCloseModuleSelector}
                />

                <ModuleSelector
                  onClose={handleCloseModuleSelector}
                  // Removed anchorPosition prop, ModuleSelector will use its defaults
                />
              </>
            )}
          </div>
        </WorkspaceProvider>
      </ErrorBoundary>
    </div>
  );
}
