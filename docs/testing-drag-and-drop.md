# Testing Drag and Drop Functionality in OmniTrade Terminal

This guide explains how to test the drag-and-drop functionality in the OmniTrade Terminal.

## Setup

1. Start the application
2. Navigate to the `/terminal-workspace` route
3. The Demo Workspace should be loaded by default

## Demo Workspace

The Demo Workspace includes multiple instances of a Demo Component arranged in a grid:

- **Top Left**: Contains Purple, Blue, and Green Demo components
- **Bottom Left**: Contains Orange and Pink Demo components
- **Top Right**: Contains Cyan and Deep Orange Demo components
- **Bottom Right**: Contains a Deep Purple Demo component

Each Demo Component displays:
- A colored circle with a counter
- The component title
- The component ID
- An "Increment Counter" button
- Instructions for dragging the tab

## Testing Tab Reordering

To test tab reordering within the same group:

1. Go to the "Top Left" panel, which contains three tabs (Purple, Blue, Green)
2. Click and hold on the "Blue Demo" tab
3. Drag it to the left of the "Purple Demo" tab
4. Release the mouse button
5. The tabs should now be in the order: Blue, Purple, Green
6. Verify that the Blue Demo component still works by clicking the "Increment Counter" button

## Testing Tab Moving

To test moving tabs between groups:

1. Click and hold on the "Green Demo" tab in the "Top Left" panel
2. Drag it to the "Bottom Left" panel
3. Release the mouse button over the tab bar
4. The "Green Demo" tab should now be in the "Bottom Left" panel
5. Verify that the Green Demo component still works by clicking the "Increment Counter" button

## Testing Split View Creation

To test creating split views:

1. Click and hold on the "Orange Demo" tab in the "Bottom Left" panel
2. Drag it to the right edge of the panel
3. When the right edge is highlighted, release the mouse button
4. A new panel should be created to the right of the "Bottom Left" panel
5. The "Orange Demo" tab should be in this new panel
6. Verify that the Orange Demo component still works by clicking the "Increment Counter" button

You can also try:
- Dragging to the left edge to create a panel on the left
- Dragging to the top edge to create a panel above
- Dragging to the bottom edge to create a panel below

## Testing Empty Container Drops

To test dropping tabs on empty containers:

1. First, create an empty container by moving all tabs out of a panel
2. Click and hold on any tab from another panel
3. Drag it to the empty container
4. Release the mouse button
5. The tab should be moved to the empty container
6. Verify that the component still works by clicking the "Increment Counter" button

## Testing Component State Preservation

To test that component state is preserved when moving tabs:

1. Click the "Increment Counter" button on the "Purple Demo" tab several times
2. Note the counter value
3. Move the "Purple Demo" tab to another panel
4. Verify that the counter value is preserved

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages
2. Refresh the page to reset the workspace
3. Try using different tabs or panels
4. Try different drop positions

## Next Steps

After testing the basic functionality, try creating more complex layouts:

1. Create a 3x3 grid of panels
2. Create nested panels with different orientations
3. Create a layout with multiple levels of nesting

This will help you understand the full capabilities of the drag-and-drop functionality.
