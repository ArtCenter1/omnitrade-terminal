# VS Code-Like Tab Behavior

This document explains how the VS Code-like tab behavior is implemented in the OmniTrade Terminal.

## Overview

The OmniTrade Terminal implements a tab system similar to Visual Studio Code, where:

1. Tabs can be dragged and reordered within the same tab group
2. Tabs can be moved to another tab group
3. Tabs can be dragged to the edge of a panel to create a split view (horizontal or vertical)
4. Empty containers can accept tab drops to create new tab groups

This provides a highly flexible and customizable interface that allows users to arrange their workspace exactly as they prefer.

## Key Features

### Tab Reordering

Users can reorder tabs within the same tab group by dragging a tab to a new position. The tab will be inserted at the position where it's dropped.

### Tab Moving

Users can move tabs between different tab groups by dragging a tab from one group and dropping it onto another group. The tab will be added to the target group.

### Split View Creation

Users can create split views by dragging a tab to the edge of a panel:

- Dragging to the left edge creates a new panel to the left
- Dragging to the right edge creates a new panel to the right
- Dragging to the top edge creates a new panel above
- Dragging to the bottom edge creates a new panel below

This allows for complex layouts with multiple panels arranged horizontally and vertically.

### Empty Container Drops

Users can drop tabs onto empty containers to create new tab groups in those containers. This is useful for filling in empty spaces in the layout.

## Implementation Details

### Drag and Drop Mechanism

The drag and drop mechanism is implemented using the HTML5 Drag and Drop API. When a tab is dragged, the following information is stored in the drag data:

- The tab ID
- The source stack ID
- The component ID
- The tab title
- The component state

This information is used to recreate the tab in its new location.

### Drop Zones

When a tab is dragged over a container, drop zones are created at the edges of the container:

- Left edge: 20% of the container width from the left
- Right edge: 20% of the container width from the right
- Top edge: 20% of the container height from the top
- Bottom edge: 20% of the container height from the bottom

When the tab is dropped in one of these zones, a new panel is created in the corresponding direction.

### Visual Feedback

Visual feedback is provided during the drag operation:

- The dragged tab is shown with reduced opacity
- Drop zones are highlighted when the tab is dragged over them
- The drop position (left, right, top, bottom) is indicated visually

### Layout Updates

When a tab is dropped, the layout is updated as follows:

1. If the tab is dropped within the same tab group, the tabs are reordered
2. If the tab is dropped on another tab group, the tab is moved to that group
3. If the tab is dropped on a container edge, a new panel is created:
   - If the container already has the right direction (horizontal for left/right, vertical for top/bottom), a new tab group is added to the container
   - If the container has a different direction, a new nested container is created with the right direction

### Component Persistence

When a tab is moved, its component state is preserved, ensuring that the component continues to function as expected in its new location.

## Usage

### Reordering Tabs

To reorder tabs within the same group:

1. Click and hold on a tab
2. Drag the tab to a new position within the same tab group
3. Release the mouse button

### Moving Tabs Between Groups

To move a tab to another group:

1. Click and hold on a tab
2. Drag the tab to another tab group
3. Release the mouse button when the drop indicator appears

### Creating Split Views

To create a split view:

1. Click and hold on a tab
2. Drag the tab to the edge of a panel (left, right, top, or bottom)
3. Release the mouse button when the drop zone is highlighted

### Filling Empty Containers

To fill an empty container:

1. Click and hold on a tab
2. Drag the tab to an empty container
3. Release the mouse button

## Future Enhancements

Planned enhancements to the VS Code-like tab behavior include:

1. **Tab Detaching**: Allowing tabs to be detached into separate windows
2. **Tab Closing**: Adding close buttons to tabs
3. **Tab Context Menu**: Adding a context menu with options like "Close", "Close Others", "Close All", etc.
4. **Tab Pinning**: Allowing tabs to be pinned so they always appear first
5. **Tab Groups**: Adding the ability to color-code tab groups
6. **Tab Search**: Adding a search function to quickly find and switch to specific tabs
7. **Keyboard Shortcuts**: Adding keyboard shortcuts for tab navigation and management
