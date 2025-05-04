# OmniTrade Terminal Architecture

This directory contains the core architecture components for the OmniTrade Terminal. The terminal is designed with a modular, extensible architecture that allows for dynamic component registration, workspace management, and plugin support.

## Core Systems

### Component Registry System

The Component Registry System allows for dynamic registration, discovery, and instantiation of components throughout the terminal application.

- **Location**: `src/lib/component-registry/`
- **Key Files**:
  - `types.ts` - Core interfaces and types
  - `registry.ts` - Component registry implementation
  - `init.ts` - Registry initialization

The Component Registry provides:
- Component registration and unregistration
- Component discovery and lookup
- Component instantiation
- Component dependency resolution

### Workspace Layout Management

The Workspace Layout Management system allows for flexible, configurable layouts of components within the terminal.

- **Location**: `src/lib/workspace/`
- **Key Files**:
  - `types.ts` - Core interfaces and types
  - `workspace-manager.ts` - Workspace manager implementation
  - `templates.ts` - Default workspace templates
  - `init.ts` - Workspace manager initialization

The Workspace Manager provides:
- Workspace creation and management
- Layout serialization/deserialization
- Layout persistence (local storage)
- Workspace templates

### Extension Point System

The Extension Point System allows for plugins to extend the functionality of the terminal.

- **Location**: `src/lib/extension-points/`
- **Key Files**:
  - `types.ts` - Core interfaces and types
  - `component-extension-point.ts` - Component extension point implementation

The Extension Point System provides:
- Extension point registration
- Extension registration and discovery
- Extension lifecycle management

## Terminal Components

The terminal components are built on top of the core systems and provide the actual UI elements for the terminal.

- **Location**: `src/components/terminal/core/`
- **Key Files**:
  - `BaseTerminalComponent.tsx` - Base class for terminal components
  - `TerminalContainer.tsx` - Main container for the terminal
  - `ChartComponent.tsx` - Sample chart component

## Usage

### Component Registration

To register a new component with the terminal:

```typescript
import { componentRegistry } from '@/lib/component-registry';
import { MyComponent } from './MyComponent';

// Register the component
componentRegistry.register(MyComponent);
```

### Workspace Management

To create and manage workspaces:

```typescript
import { workspaceManager } from '@/lib/workspace';

// Create a new workspace
const workspace = workspaceManager.createWorkspace('My Workspace');

// Set as current workspace
workspaceManager.setCurrentWorkspace(workspace.id);
```

### Extension Points

To register an extension with an extension point:

```typescript
import { componentExtensionPoint } from '@/lib/extension-points';
import { MyComponentExtension } from './MyComponentExtension';

// Register the extension
componentExtensionPoint.register(new MyComponentExtension());
```

## Terminal Initialization

The terminal is initialized in `src/lib/terminal-init.ts`, which sets up the component registry, workspace manager, and default components and templates.

## Future Enhancements

- Plugin System Architecture
- Data Service Layer
- Command Extension Point
- Menu Extension Point
- Settings Extension Point
