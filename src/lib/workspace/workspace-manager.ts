/**
 * Workspace Manager
 *
 * Manages workspaces, layouts, and their persistence.
 */

import {
  WorkspaceLayout,
  WorkspaceState,
  WorkspaceTemplate,
  LayoutItem,
  LayoutItemType,
  ContainerLayoutItem,
  SplitDirection
} from './types';

// Local storage key for workspace data
const WORKSPACE_STORAGE_KEY = 'omnitrade-terminal-workspaces';

/**
 * Default empty workspace layout
 */
const createDefaultWorkspace = (): WorkspaceLayout => {
  const now = new Date().toISOString();
  return {
    id: 'default',
    name: 'Default Workspace',
    description: 'Default workspace layout',
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    root: {
      id: 'root',
      type: LayoutItemType.CONTAINER,
      direction: SplitDirection.HORIZONTAL,
      children: []
    }
  };
};

/**
 * Workspace Manager class
 */
export class WorkspaceManager {
  private static instance: WorkspaceManager;
  private state: WorkspaceState;
  private listeners: Array<(state: WorkspaceState) => void> = [];

  private constructor() {
    // Initialize with default state
    this.state = {
      currentWorkspaceId: null,
      workspaces: [],
      templates: []
    };

    // Load from local storage
    this.loadFromStorage();

    // If no workspaces, create default
    if (this.state.workspaces.length === 0) {
      const defaultWorkspace = createDefaultWorkspace();
      this.state.workspaces.push(defaultWorkspace);
      this.state.currentWorkspaceId = defaultWorkspace.id;
      this.saveToStorage();
    }
  }

  /**
   * Get the singleton instance of the WorkspaceManager
   */
  public static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager();
    }
    return WorkspaceManager.instance;
  }

  /**
   * Load workspace state from local storage
   */
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (storedData) {
        this.state = JSON.parse(storedData);
        console.log('Workspaces loaded from storage:', this.state.workspaces.length);
      }
    } catch (error) {
      console.error('Failed to load workspaces from storage:', error);
    }
  }

  /**
   * Save workspace state to local storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(this.state));
      console.log('Workspaces saved to storage');
    } catch (error) {
      console.error('Failed to save workspaces to storage:', error);
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Get the current workspace state
   */
  public getState(): WorkspaceState {
    return { ...this.state };
  }

  /**
   * Get the current active workspace
   */
  public getCurrentWorkspace(): WorkspaceLayout | null {
    if (!this.state.currentWorkspaceId) {
      return null;
    }

    return this.state.workspaces.find(w => w.id === this.state.currentWorkspaceId) || null;
  }

  /**
   * Get all workspaces
   */
  public getWorkspaces(): WorkspaceLayout[] {
    return [...this.state.workspaces];
  }

  /**
   * Get a workspace by ID
   */
  public getWorkspaceById(id: string): WorkspaceLayout | null {
    return this.state.workspaces.find(w => w.id === id) || null;
  }

  /**
   * Create a new workspace
   */
  public createWorkspace(name: string, description?: string): WorkspaceLayout {
    const now = new Date().toISOString();
    const id = `workspace-${Date.now()}`;

    const newWorkspace: WorkspaceLayout = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      root: {
        id: 'root',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.HORIZONTAL,
        children: []
      }
    };

    this.state.workspaces.push(newWorkspace);
    this.saveToStorage();
    this.notifyListeners();

    return newWorkspace;
  }

  /**
   * Update an existing workspace
   */
  public updateWorkspace(workspace: WorkspaceLayout): boolean {
    const index = this.state.workspaces.findIndex(w => w.id === workspace.id);
    if (index === -1) {
      return false;
    }

    // Update the workspace
    const updatedWorkspace = {
      ...workspace,
      updatedAt: new Date().toISOString()
    };

    this.state.workspaces[index] = updatedWorkspace;
    this.saveToStorage();
    this.notifyListeners();

    return true;
  }

  /**
   * Delete a workspace
   */
  public deleteWorkspace(id: string): boolean {
    const index = this.state.workspaces.findIndex(w => w.id === id);
    if (index === -1) {
      return false;
    }

    // Cannot delete the default workspace
    if (this.state.workspaces[index].isDefault) {
      console.warn('Cannot delete the default workspace');
      return false;
    }

    // Remove the workspace
    this.state.workspaces.splice(index, 1);

    // If the deleted workspace was the current one, switch to the default
    if (this.state.currentWorkspaceId === id) {
      const defaultWorkspace = this.state.workspaces.find(w => w.isDefault);
      this.state.currentWorkspaceId = defaultWorkspace ? defaultWorkspace.id : null;
    }

    this.saveToStorage();
    this.notifyListeners();

    return true;
  }

  /**
   * Set the current active workspace
   */
  public setCurrentWorkspace(id: string): boolean {
    const workspace = this.state.workspaces.find(w => w.id === id);
    if (!workspace) {
      return false;
    }

    this.state.currentWorkspaceId = id;
    this.saveToStorage();
    this.notifyListeners();

    return true;
  }

  /**
   * Add a listener for state changes
   */
  public addListener(listener: (state: WorkspaceState) => void): () => void {
    this.listeners.push(listener);

    // Return a function to remove the listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Export a workspace to JSON
   */
  public exportWorkspace(id: string): string {
    const workspace = this.getWorkspaceById(id);
    if (!workspace) {
      throw new Error(`Workspace with ID ${id} not found`);
    }

    return JSON.stringify(workspace);
  }

  /**
   * Import a workspace from JSON
   */
  public importWorkspace(json: string): WorkspaceLayout {
    try {
      const workspace = JSON.parse(json) as WorkspaceLayout;

      // Validate the workspace structure
      if (!workspace.id || !workspace.name || !workspace.root) {
        throw new Error('Invalid workspace format');
      }

      // Check if a workspace with this ID already exists
      if (this.getWorkspaceById(workspace.id)) {
        // Generate a new ID
        workspace.id = `workspace-${Date.now()}`;
      }

      // Update timestamps
      const now = new Date().toISOString();
      workspace.createdAt = now;
      workspace.updatedAt = now;

      // Add to workspaces
      this.state.workspaces.push(workspace);
      this.saveToStorage();
      this.notifyListeners();

      return workspace;
    } catch (error) {
      console.error('Failed to import workspace:', error);
      throw new Error('Failed to import workspace');
    }
  }

  /**
   * Create a workspace from a template
   */
  public createFromTemplate(templateId: string, name?: string): WorkspaceLayout | null {
    const template = this.state.templates.find(t => t.id === templateId);
    if (!template) {
      return null;
    }

    const now = new Date().toISOString();
    const id = `workspace-${Date.now()}`;

    const newWorkspace: WorkspaceLayout = {
      id,
      name: name || `${template.name} Copy`,
      description: template.description,
      createdAt: now,
      updatedAt: now,
      root: { ...template.root }
    };

    this.state.workspaces.push(newWorkspace);
    this.saveToStorage();
    this.notifyListeners();

    return newWorkspace;
  }

  /**
   * Get all available templates
   */
  public getTemplates(): WorkspaceTemplate[] {
    return [...this.state.templates];
  }

  /**
   * Clear workspace state from local storage
   * This is useful for resetting the workspace state if it gets out of sync
   */
  public clearStorage(): void {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    console.log('Cleared workspace state from local storage');

    // Reset to default state
    this.state = {
      currentWorkspaceId: null,
      workspaces: [],
      templates: this.state.templates // Keep the templates
    };

    // Create default workspace
    const defaultWorkspace = createDefaultWorkspace();
    this.state.workspaces.push(defaultWorkspace);
    this.state.currentWorkspaceId = defaultWorkspace.id;

    this.notifyListeners();
  }

  /**
   * Add a template
   */
  public addTemplate(template: WorkspaceTemplate): void {
    this.state.templates.push(template);
    this.saveToStorage();
    this.notifyListeners();
  }
}
