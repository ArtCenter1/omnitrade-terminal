// Layout position types
export type SideBarPosition = 'left' | 'right';
export type PanelPosition =
  | 'bottom'
  | 'left'
  | 'right'
  | 'top'
  | 'within-editor';
export type ActivityBarPosition = 'default' | 'top' | 'bottom' | 'hidden';
export type PanelAlignment = 'center' | 'justify' | 'left' | 'right';
export type EditorTabsMode = 'multiple' | 'single' | 'none';
export type QuickInputPosition =
  | 'center-top'
  | 'center-center'
  | 'right-top'
  | 'right-center'
  | 'left-top'
  | 'left-center';

// Editor layout types
export type EditorGroupDirection = 'horizontal' | 'vertical';

export interface EditorGroupLayout {
  orientation: EditorGroupDirection;
  groups: Array<EditorGroupLayout | EditorLeafLayout>;
  size?: number;
}

export interface EditorLeafLayout {
  type: 'leaf';
  size?: number;
  active?: boolean;
}

// View types
export interface ViewDescriptor {
  id: string;
  name: string;
  icon?: string;
  order?: number;
  containerLocation: 'primary-sidebar' | 'secondary-sidebar' | 'panel';
  defaultLocation?: 'primary-sidebar' | 'secondary-sidebar' | 'panel';
  canMove?: boolean;
  canClose?: boolean;
}

// Component types for editor area
export interface EditorDescriptor {
  id: string;
  type: string;
  title: string;
  icon?: string;
  dirty?: boolean;
  pinned?: boolean;
  preview?: boolean;
  groupId?: string;
}

// Panel types
export interface PanelDescriptor {
  id: string;
  name: string;
  icon?: string;
  order?: number;
  defaultLocation?: 'panel';
  canMove?: boolean;
  canClose?: boolean;
}

// Activity bar item
export interface ActivityBarItem {
  id: string;
  name: string;
  icon: string;
  order?: number;
  target: 'view' | 'command';
  viewId?: string;
  command?: string;
  badge?: number | string;
  badgeColor?: string;
}

// Layout state for persistence
export interface LayoutState {
  primarySideBarVisible: boolean;
  primarySideBarPosition: SideBarPosition;
  secondarySideBarVisible: boolean;
  panelVisible: boolean;
  panelPosition: PanelPosition;
  panelAlignment: PanelAlignment;
  panelMaximized: boolean;
  activityBarVisible: boolean;
  activityBarPosition: ActivityBarPosition;
  statusBarVisible: boolean;
  editorTabsMode: EditorTabsMode;
  showEditorTabs: boolean;
  zenMode: boolean;
  fullScreen: boolean;
  centeredLayout: boolean;
  quickInputPosition: QuickInputPosition;
  editorLayout?: EditorGroupLayout;
  activeViews?: Record<string, boolean>;
  activePanels?: Record<string, boolean>;
}
