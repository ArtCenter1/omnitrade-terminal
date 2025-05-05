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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModuleSelector } from '@/components/workspace/ModuleSelector';

/**
 * Workspace Controls Component
 */
const WorkspaceControls: React.FC<{
  onOpenModuleSelector: (e: React.MouseEvent<HTMLButtonElement>) => void;
}> = ({ onOpenModuleSelector }) => {
  const { state, currentWorkspace, createWorkspace, setCurrentWorkspace, deleteWorkspace } = useWorkspace();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Set simplified workspace as default when component mounts
  useEffect(() => {
    // Find the simplified workspace if it exists
    const simplifiedWorkspace = state.workspaces.find(workspace =>
      workspace.name.includes('Default Workspace') || workspace.id.includes('simplified'));

    if (simplifiedWorkspace && (!currentWorkspace || currentWorkspace.name === 'Default Workspace')) {
      // Set it as the current workspace
      setCurrentWorkspace(simplifiedWorkspace.id);
      console.log(`Set current workspace to simplified default: ${simplifiedWorkspace.name}`);
    }
  }, [state.workspaces, currentWorkspace, setCurrentWorkspace]);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName) return;

    const workspace = createWorkspace(newWorkspaceName, newWorkspaceDescription);
    setCurrentWorkspace(workspace.id);
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setIsCreateDialogOpen(false);
  };

  // Find the default workspace
  const defaultWorkspace = state.workspaces.find(workspace =>
    workspace.name === 'Default Workspace' || workspace.id.includes('simplified'));

  // Get user-created workspaces (all workspaces except the default one)
  const userWorkspaces = state.workspaces.filter(workspace =>
    workspace.id !== defaultWorkspace?.id);

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
              className={currentWorkspace?.id === defaultWorkspace.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
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
              {userWorkspaces.map(workspace => (
                <DropdownMenuItem
                  key={workspace.id}
                  className={currentWorkspace?.id === workspace.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
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
                        if (confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
                          // Delete the workspace
                          deleteWorkspace(workspace.id);

                          // If the deleted workspace was the current one, switch to the default
                          if (currentWorkspace?.id === workspace.id && defaultWorkspace) {
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
        onClick={(e) => onOpenModuleSelector(e)}
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
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                placeholder="My Workspace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newWorkspaceDescription}
                onChange={e => setNewWorkspaceDescription(e.target.value)}
                placeholder="Description of this workspace"
              />
            </div>
            <Button onClick={handleCreateWorkspace} disabled={!newWorkspaceName}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Terminal Workspace Page Component
 */
export default function TerminalWorkspace() {
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  const [moduleSelectorPosition, setModuleSelectorPosition] = useState<{ top: number; left: number } | undefined>();

  // Function to open the module selector with position
  const handleOpenModuleSelector = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Get the button's position
    const buttonRect = e.currentTarget.getBoundingClientRect();

    // Set the position for the module selector
    setModuleSelectorPosition({
      top: buttonRect.bottom + window.scrollY + 5, // 5px below the button
      left: buttonRect.left + window.scrollX
    });

    // Open the module selector
    setIsModuleSelectorOpen(true);
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
            <WorkspaceControls onOpenModuleSelector={handleOpenModuleSelector} />
            <div className="flex-1 relative">
              <TerminalContainer className="h-full" />
            </div>

            {/* Module Selector - positioned as a floating window */}
            {isModuleSelectorOpen && (
              <>
                {/* Semi-transparent backdrop */}
                <div
                  className="fixed inset-0 bg-black/20 z-[9998] pointer-events-auto"
                  onClick={() => setIsModuleSelectorOpen(false)}
                />

                <ModuleSelector
                  onClose={() => setIsModuleSelectorOpen(false)}
                  anchorPosition={moduleSelectorPosition}
                />
              </>
            )}
          </div>
        </WorkspaceProvider>
      </ErrorBoundary>
    </div>
  );
}
