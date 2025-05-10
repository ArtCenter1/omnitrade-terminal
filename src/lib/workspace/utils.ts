/**
 * Workspace Utilities
 *
 * This module provides utility functions for creating workspace layouts.
 */

import { LayoutItemType, SplitDirection, ComponentLayoutItem } from './types';

/**
 * Create a tab stack container with the specified components
 *
 * @param id The ID of the tab stack
 * @param title The title of the tab stack
 * @param tabs Array of tab configurations
 * @returns A container layout item with tabs
 */
export function createTabStack(
  id: string,
  title: string,
  tabs: Array<{
    id: string;
    componentId: string;
    title: string;
    componentState?: any;
  }>,
) {
  return {
    id,
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.STACKED,
    title,
    children: tabs.map(
      (tab) =>
        ({
          id: tab.id,
          type: LayoutItemType.COMPONENT,
          componentId: tab.componentId,
          title: tab.title,
          componentState: tab.componentState || {},
        }) as ComponentLayoutItem,
    ),
  };
}

/**
 * Create a demo component tab stack
 *
 * @param id The ID of the tab stack
 * @param title The title of the tab stack
 * @param tabs Array of demo tab configurations
 * @returns A container layout item with demo tabs
 */
export function createDemoStack(
  id: string,
  title: string,
  tabs: Array<{
    id: string;
    title: string;
    color: string;
  }>,
) {
  return createTabStack(
    id,
    title,
    tabs.map((tab) => ({
      id: tab.id,
      componentId: 'demo',
      title: tab.title,
      componentState: {
        color: tab.color,
      },
    })),
  );
}
