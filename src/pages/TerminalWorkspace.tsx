/**
 * Terminal Workspace Page
 * 
 * This is the new terminal page that uses the workspace management system.
 * It will eventually replace the current Terminal.tsx page.
 */

import React, { useState } from 'react';
import { AlertTriangle, LayoutGrid, Save, Settings } from 'lucide-react';
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

/**
 * Workspace Controls Component
 */
const WorkspaceControls: React.FC = () => {
  const { state, currentWorkspace, createWorkspace, setCurrentWorkspace } = useWorkspace();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName) return;
    
    const workspace = createWorkspace(newWorkspaceName, newWorkspaceDescription);
    setCurrentWorkspace(workspace.id);
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-900 border-b border-gray-800">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <LayoutGrid className="h-4 w-4 mr-2" />
            {currentWorkspace?.name || 'Select Workspace'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {state.workspaces.map(workspace => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => setCurrentWorkspace(workspace.id)}
              className={currentWorkspace?.id === workspace.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
            >
              {workspace.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Create Workspace
          </Button>
        </DialogTrigger>
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

      <Button variant="outline" size="sm" className="h-8 ml-auto">
        <Save className="h-4 w-4 mr-2" />
        Save Layout
      </Button>
      <Button variant="outline" size="sm" className="h-8">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  );
};

/**
 * Terminal Workspace Page Component
 */
export default function TerminalWorkspace() {
  return (
    <div className="bg-black min-h-screen">
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-4">
              There was an error loading the terminal
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload page
            </Button>
          </div>
        }
      >
        <WorkspaceProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <WorkspaceControls />
            <div className="flex-1">
              <TerminalContainer className="h-full" />
            </div>
          </div>
        </WorkspaceProvider>
      </ErrorBoundary>
    </div>
  );
}
