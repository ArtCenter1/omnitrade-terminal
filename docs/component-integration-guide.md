# Component Integration Guide

This guide explains how to integrate existing terminal components with the new component registry and workspace layout system.

## Overview

The OmniTrade Terminal uses a component registry system that allows components to be dynamically registered, discovered, and instantiated. To use existing components with this system, we need to create wrapper components that implement the `IComponent` interface.

## Step 1: Create a Wrapper Component

Create a new file in `src/components/terminal/core/wrappers` for your wrapper component. The wrapper should:

1. Extend `BaseTerminalComponent`
2. Implement the `IComponent` interface
3. Define component metadata
4. Implement lifecycle methods

Here's a template:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ComponentLifecycleState, 
  ComponentMetadata, 
  IComponent 
} from '@/lib/component-registry';
import { BaseTerminalComponent, BaseTerminalComponentProps } from '../BaseTerminalComponent';
import { YourExistingComponent } from '@/components/terminal/YourExistingComponent';

interface YourComponentProps extends BaseTerminalComponentProps {
  // Add your component-specific props here
}

interface YourComponentState {
  isLoading: boolean;
  error: Error | null;
  // Add your component-specific state here
}

const YourComponentReact: React.FC<YourComponentProps> = (props) => {
  return (
    <div className="h-full flex flex-col">
      <YourExistingComponent {...props} />
    </div>
  );
};

export class YourComponent extends BaseTerminalComponent<YourComponentProps, YourComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: YourComponentProps = { id: 'your-component' }) {
    super(
      {
        id: 'your-component',
        name: 'Your Component',
        description: 'Description of your component',
        version: '1.0.0',
        category: 'your-category',
        tags: ['tag1', 'tag2'],
        settings: [
          // Define component settings here
        ]
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null,
      // Initialize your component state here
    };
  }
  
  protected async onInitialize(): Promise<void> {
    // Initialize your component
    this.componentState.isLoading = false;
  }
  
  protected onRender(): void {
    if (!this.container) return;
    
    this.root = createRoot(this.container);
    this.root.render(
      <YourComponentReact {...this.props} />
    );
  }
  
  protected onUpdate(): void {
    if (!this.root || !this.container) return;
    
    this.root.render(
      <YourComponentReact {...this.props} />
    );
  }
  
  protected onDispose(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
  
  protected getReactComponent(): React.ComponentType<any> {
    return YourComponentReact;
  }
}
```

## Step 2: Register the Component

Register your component in `src/lib/component-registry/init.ts`:

```typescript
import { YourComponent } from '@/components/terminal/core/wrappers/YourComponentWrapper';

export function initializeComponentRegistry(): void {
  // ... existing code ...
  
  // Register your component
  componentRegistry.register(YourComponent);
  
  // ... existing code ...
}
```

## Step 3: Use the Component in Workspace Layouts

Now you can use your component in workspace layouts:

```typescript
const layout = {
  id: 'root',
  type: LayoutItemType.CONTAINER,
  direction: SplitDirection.HORIZONTAL,
  children: [
    {
      id: 'your-component-instance',
      type: LayoutItemType.COMPONENT,
      componentId: 'your-component',
      componentState: {
        // Component-specific state
      },
      title: 'Your Component'
    }
  ]
};
```

## Step 4: Create a Template (Optional)

You can create a workspace template that includes your component:

```typescript
export const yourTemplate: WorkspaceTemplate = {
  id: 'your-template',
  name: 'Your Template',
  description: 'Description of your template',
  category: 'your-category',
  tags: ['tag1', 'tag2'],
  root: {
    // Layout definition including your component
  }
};
```

## Example: Integrating the ChartSection Component

Here's an example of how we integrated the existing `ChartSection` component:

```typescript
export class ChartSectionComponent extends BaseTerminalComponent<ChartSectionComponentProps, ChartSectionComponentState> implements IComponent {
  private root: any = null;
  
  constructor(props: ChartSectionComponentProps = { id: 'chart-section' }) {
    super(
      {
        id: 'chart-section',
        name: 'Chart Section',
        description: 'Displays price charts with TradingView integration',
        version: '1.0.0',
        category: 'charts',
        tags: ['trading', 'price', 'analysis'],
        settings: [
          {
            key: 'symbol',
            type: 'string',
            label: 'Symbol',
            description: 'Trading pair symbol (e.g., BTC/USDT)',
            defaultValue: 'BTC/USDT'
          }
        ]
      },
      props
    );
    
    this.componentState = {
      isLoading: true,
      error: null,
      selectedPair: props.selectedPair
    };
  }
  
  // ... lifecycle methods ...
}
```

## Best Practices

1. **Keep the wrapper thin**: The wrapper should only handle the integration with the component registry system. The actual functionality should remain in the existing component.

2. **Handle component state**: Make sure to properly handle component state and props in the wrapper.

3. **Implement settings**: Define settings that can be changed through the component registry.

4. **Clean up resources**: Make sure to clean up resources in the `onDispose` method.

5. **Document your component**: Add documentation to explain how to use your component.

## Troubleshooting

- **Component not rendering**: Make sure the container element is available and the component is properly registered.

- **Component not updating**: Check that the `onUpdate` method is properly implemented and that the component state is being updated.

- **Component not disposing**: Make sure the `onDispose` method is properly implemented and that all resources are being cleaned up.

- **Component settings not working**: Check that the settings are properly defined and that the `onSettingsChanged` method is properly implemented.
