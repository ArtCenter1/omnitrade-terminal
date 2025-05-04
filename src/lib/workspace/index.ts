/**
 * Workspace Layout Management System
 * 
 * This module provides the core functionality for managing workspaces,
 * layouts, and their persistence in the OmniTrade Terminal.
 */

export * from './types';
export * from './workspace-manager';

// Export a singleton instance of the workspace manager
import { WorkspaceManager } from './workspace-manager';
export const workspaceManager = WorkspaceManager.getInstance();
