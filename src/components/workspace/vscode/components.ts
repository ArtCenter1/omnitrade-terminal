/**
 * VS Code-like components for the workspace system
 */

import { IComponent, ComponentMetadata } from '@/lib/component-registry/types';
import VSCodeSidebar from './VSCodeSidebar';
import VSCodeSecondaryBar from './VSCodeSecondaryBar';
import VSCodePanel from './VSCodePanel';
import VSCodeEditor from './VSCodeEditor';

/**
 * VS Code Sidebar Component
 */
export class VSCodeSidebarComponent implements IComponent {
  public metadata: ComponentMetadata = {
    id: 'vscode-sidebar',
    name: 'VS Code Sidebar',
    description: 'Primary sidebar component for VS Code-like layout',
    category: 'vscode',
    tags: ['vscode', 'sidebar', 'explorer'],
    icon: 'folder',
  };

  private element: HTMLElement | null = null;

  public async initialize(): Promise<void> {
    // No initialization needed
    return Promise.resolve();
  }

  public render(container: HTMLElement, props: any): void {
    this.element = container;

    // Create a React root and render the component
    const root = document.createElement('div');
    root.className = 'h-full';
    container.appendChild(root);

    // Render the component
    const ReactDOM = require('react-dom/client');
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(React.createElement(VSCodeSidebar, props));
  }

  public update(props: any): void {
    // Re-render with new props
    if (this.element) {
      this.render(this.element, props);
    }
  }

  public dispose(): void {
    // Clean up
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}

/**
 * VS Code Secondary Sidebar Component
 */
export class VSCodeSecondaryBarComponent implements IComponent {
  public metadata: ComponentMetadata = {
    id: 'vscode-secondary-sidebar',
    name: 'VS Code Secondary Sidebar',
    description: 'Secondary sidebar component for VS Code-like layout',
    category: 'vscode',
    tags: ['vscode', 'sidebar', 'outline'],
    icon: 'list',
  };

  private element: HTMLElement | null = null;

  public async initialize(): Promise<void> {
    // No initialization needed
    return Promise.resolve();
  }

  public render(container: HTMLElement, props: any): void {
    this.element = container;

    // Create a React root and render the component
    const root = document.createElement('div');
    root.className = 'h-full';
    container.appendChild(root);

    // Render the component
    const ReactDOM = require('react-dom/client');
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(React.createElement(VSCodeSecondaryBar, props));
  }

  public update(props: any): void {
    // Re-render with new props
    if (this.element) {
      this.render(this.element, props);
    }
  }

  public dispose(): void {
    // Clean up
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}

/**
 * VS Code Panel Component
 */
export class VSCodePanelComponent implements IComponent {
  public metadata: ComponentMetadata = {
    id: 'vscode-panel',
    name: 'VS Code Panel',
    description: 'Panel component for VS Code-like layout',
    category: 'vscode',
    tags: ['vscode', 'panel', 'terminal'],
    icon: 'terminal',
  };

  private element: HTMLElement | null = null;

  public async initialize(): Promise<void> {
    // No initialization needed
    return Promise.resolve();
  }

  public render(container: HTMLElement, props: any): void {
    this.element = container;

    // Create a React root and render the component
    const root = document.createElement('div');
    root.className = 'h-full';
    container.appendChild(root);

    // Render the component
    const ReactDOM = require('react-dom/client');
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(React.createElement(VSCodePanel, props));
  }

  public update(props: any): void {
    // Re-render with new props
    if (this.element) {
      this.render(this.element, props);
    }
  }

  public dispose(): void {
    // Clean up
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}

/**
 * VS Code Editor Component
 */
export class VSCodeEditorComponent implements IComponent {
  public metadata: ComponentMetadata = {
    id: 'vscode-editor',
    name: 'VS Code Editor',
    description: 'Editor component for VS Code-like layout',
    category: 'vscode',
    tags: ['vscode', 'editor', 'code'],
    icon: 'code',
  };

  private element: HTMLElement | null = null;

  public async initialize(): Promise<void> {
    // No initialization needed
    return Promise.resolve();
  }

  public render(container: HTMLElement, props: any): void {
    this.element = container;

    // Create a React root and render the component
    const root = document.createElement('div');
    root.className = 'h-full';
    container.appendChild(root);

    // Render the component
    const ReactDOM = require('react-dom/client');
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(React.createElement(VSCodeEditor, props));
  }

  public update(props: any): void {
    // Re-render with new props
    if (this.element) {
      this.render(this.element, props);
    }
  }

  public dispose(): void {
    // Clean up
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}

// Import React at the top level to avoid issues with the render methods
import React from 'react';
