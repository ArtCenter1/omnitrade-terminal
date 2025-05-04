/**
 * Demo Tab Layout
 * 
 * A demo layout with multiple instances of the demo component to showcase
 * the VS Code-like tab behavior.
 */

import { 
  LayoutItemType, 
  SplitDirection, 
  WorkspaceTemplate,
  StackLayoutItem,
  ComponentLayoutItem
} from './types';

/**
 * Create a demo component
 * 
 * @param id The ID of the component
 * @param title The title of the component
 * @param color The color of the component (optional)
 * @returns A component layout item
 */
function createDemoComponent(
  id: string,
  title: string,
  color?: string
): ComponentLayoutItem {
  return {
    id: `demo-${id}`,
    type: LayoutItemType.COMPONENT,
    componentId: 'demo-component',
    title,
    componentState: {
      color,
      title
    }
  };
}

/**
 * Create a stack of demo components
 * 
 * @param id The ID of the stack
 * @param title The title of the stack
 * @param components Array of component configurations
 * @param activeItemIndex The index of the active component
 * @returns A stack layout item
 */
function createDemoStack(
  id: string,
  title: string,
  components: Array<{
    id: string;
    title: string;
    color?: string;
  }>,
  activeItemIndex: number = 0
): StackLayoutItem {
  return {
    id: `stack-${id}`,
    type: LayoutItemType.STACK,
    title,
    children: components.map(comp => createDemoComponent(comp.id, comp.title, comp.color)),
    activeItemIndex
  };
}

/**
 * Demo tab layout template
 */
export const demoTabLayout: WorkspaceTemplate = {
  id: 'demo-tab-layout',
  name: 'Demo Tab Layout',
  description: 'A demo layout with multiple instances of the demo component to showcase the VS Code-like tab behavior',
  category: 'demo',
  tags: ['demo', 'tabs'],
  root: {
    id: 'root',
    type: LayoutItemType.CONTAINER,
    direction: SplitDirection.HORIZONTAL,
    children: [
      {
        id: 'left-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          createDemoStack(
            'top-left',
            'Top Left',
            [
              { id: '1', title: 'Purple Demo', color: '#673ab7' },
              { id: '2', title: 'Blue Demo', color: '#2196f3' },
              { id: '3', title: 'Green Demo', color: '#4caf50' }
            ]
          ),
          createDemoStack(
            'bottom-left',
            'Bottom Left',
            [
              { id: '4', title: 'Orange Demo', color: '#ff9800' },
              { id: '5', title: 'Pink Demo', color: '#e91e63' }
            ]
          )
        ],
        sizes: [60, 40]
      },
      {
        id: 'right-panel',
        type: LayoutItemType.CONTAINER,
        direction: SplitDirection.VERTICAL,
        children: [
          createDemoStack(
            'top-right',
            'Top Right',
            [
              { id: '6', title: 'Cyan Demo', color: '#00bcd4' },
              { id: '7', title: 'Deep Orange Demo', color: '#ff5722' }
            ]
          ),
          createDemoStack(
            'bottom-right',
            'Bottom Right',
            [
              { id: '8', title: 'Deep Purple Demo', color: '#9c27b0' }
            ]
          )
        ],
        sizes: [50, 50]
      }
    ],
    sizes: [60, 40]
  }
};
