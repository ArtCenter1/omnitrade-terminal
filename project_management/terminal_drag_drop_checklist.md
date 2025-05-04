# OmniTrade Terminal Drag and Drop Implementation Checklist

This checklist tracks the progress of implementing the TabTrader-like drag and drop functionality for the OmniTrade Terminal.

## Phase 1: Module Selector Component

- [ ] Create `src/components/workspace/ModuleSelector.tsx`
  - [ ] Implement basic component structure
  - [ ] Add header with title and close button
  - [ ] Create module item layout with title, description, and preview
  - [ ] Add usage count indicator
  - [ ] Implement drag start functionality
  - [ ] Style the component to match TabTrader's design
  
- [ ] Update `src/pages/TerminalWorkspace.tsx`
  - [ ] Add state for showing/hiding module selector
  - [ ] Add button to open module selector
  - [ ] Integrate module selector component

## Phase 2: Enhanced Container Drop Handling

- [ ] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [ ] Enhance `handleContainerDragOver` function
  - [ ] Improve drop position detection (left, right, top, bottom, center)
  - [ ] Update `handleContainerDrop` function to handle module drops
  - [ ] Create function to add items to containers based on drop position
  - [ ] Test drop handling with different container configurations

## Phase 3: Visual Drop Indicators

- [ ] Create `src/components/workspace/DropIndicator.tsx`
  - [ ] Implement indicator component for different positions
  - [ ] Add styling for indicators
  - [ ] Add animations for smooth transitions

- [ ] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [ ] Add drop indicator rendering logic
  - [ ] Integrate indicators with drag over events
  - [ ] Test visual feedback during drag operations

## Phase 4: Enhanced Tab Drag and Drop

- [ ] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [ ] Enhance tab `handleDragOver` function
  - [ ] Improve tab drop position detection (left, right)
  - [ ] Update tab `handleDrop` function for better placement
  - [ ] Implement tab reordering within stacks
  - [ ] Add support for moving tabs between stacks
  - [ ] Test tab drag and drop with different configurations

## Phase 5: Container Splitting Logic

- [ ] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [ ] Implement `addItemToContainer` function
  - [ ] Add logic for determining split direction
  - [ ] Handle nested container creation
  - [ ] Implement proper sizing of containers after splitting
  - [ ] Test container splitting with different drop positions

- [ ] Update `src/lib/workspace/workspace-manager.ts` (if needed)
  - [ ] Add helper functions for container manipulation
  - [ ] Ensure workspace state is properly updated after changes

## Phase 6: Default Layout Template

- [ ] Update `src/lib/workspace/tabtrader-template.ts`
  - [ ] Create TabTrader-inspired layout template
  - [ ] Add watchlist component with default symbols
  - [ ] Add chart component with default settings
  - [ ] Add order book component
  - [ ] Add last trades component
  - [ ] Configure components to use mock data when appropriate

- [ ] Update `src/lib/workspace/init.ts`
  - [ ] Set TabTrader template as default for new users
  - [ ] Ensure template is applied correctly on first load

## Phase 7: Empty Workspace State

- [ ] Create `src/components/workspace/EmptyWorkspaceState.tsx`
  - [ ] Implement component with guidance text
  - [ ] Add arrow/line indicator
  - [ ] Add button to open module selector
  - [ ] Style to match TabTrader's design

- [ ] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [ ] Add condition to show empty state when workspace is empty
  - [ ] Integrate empty state component
  - [ ] Test empty state functionality

## Phase 8: Mock Data Service

- [ ] Create `src/services/mock-data-service.ts`
  - [ ] Implement mock order book data generation
  - [ ] Implement mock recent trades data generation
  - [ ] Implement mock watchlist data generation
  - [ ] Add periodic updates to simulate real-time data
  - [ ] Test mock data with components

## Integration and Testing

- [ ] Integrate all components
  - [ ] Ensure all components work together seamlessly
  - [ ] Test full workflow from empty workspace to complex layout

- [ ] Perform user testing
  - [ ] Get feedback on usability
  - [ ] Identify and fix any issues

- [ ] Final polish
  - [ ] Ensure consistent styling
  - [ ] Add any missing features
  - [ ] Optimize performance
  - [ ] Document the implementation

## Deployment

- [ ] Replace old Terminal page with new implementation
  - [ ] Ensure backward compatibility where needed
  - [ ] Migrate existing user layouts if applicable
  - [ ] Monitor for any issues after deployment
