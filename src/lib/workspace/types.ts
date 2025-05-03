/**
 * Workspace Layout Management Types
 * 
 * This file defines the core interfaces and types for the workspace layout management system.
 * The workspace system allows for flexible, configurable layouts of components within the terminal.
 */

/**
 * Layout item types
 */
export enum LayoutItemType {
  CONTAINER = 'container',
  COMPONENT = 'component',
  STACK = 'stack'
}

/**
 * Layout split direction
 */
export enum SplitDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

/**
 * Base layout item interface
 */
export interface LayoutItemBase {
  id: string;
  type: LayoutItemType;
  title?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Container layout item
 * A container can hold multiple child items and splits them in a direction
 */
export interface ContainerLayoutItem extends LayoutItemBase {
  type: LayoutItemType.CONTAINER;
  direction: SplitDirection;
  children: LayoutItem[];
  sizes?: number[]; // Relative sizes of children (percentages)
}

/**
 * Component layout item
 * Represents a component instance in the layout
 */
export interface ComponentLayoutItem extends LayoutItemBase {
  type: LayoutItemType.COMPONENT;
  componentId: string;
  componentState?: Record<string, any>;
}

/**
 * Stack layout item
 * A stack contains multiple components that can be switched between (tabs)
 */
export interface StackLayoutItem extends LayoutItemBase {
  type: LayoutItemType.STACK;
  children: ComponentLayoutItem[];
  activeItemIndex: number;
}

/**
 * Union type for all layout item types
 */
export type LayoutItem = ContainerLayoutItem | ComponentLayoutItem | StackLayoutItem;

/**
 * Workspace layout interface
 */
export interface WorkspaceLayout {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  root: ContainerLayoutItem;
}

/**
 * Workspace template interface
 */
export interface WorkspaceTemplate extends Omit<WorkspaceLayout, 'id' | 'createdAt' | 'updatedAt'> {
  id: string;
  category: string;
  tags?: string[];
  thumbnail?: string;
}

/**
 * Workspace state interface
 */
export interface WorkspaceState {
  currentWorkspaceId: string | null;
  workspaces: WorkspaceLayout[];
  templates: WorkspaceTemplate[];
}
