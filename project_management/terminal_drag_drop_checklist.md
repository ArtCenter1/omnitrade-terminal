# OmniTrade Terminal Drag and Drop Implementation Checklist

This checklist tracks the progress of implementing the TabTrader-like drag and drop functionality for the OmniTrade Terminal.

## Phase 1: Module Selector Component

- [x] Create `src/components/workspace/ModuleSelector.tsx`
  - [x] Implement basic component structure
  - [x] Add header with title and close button
  - [x] Create module item layout with title, description, and preview
  - [x] Add usage count indicator
  - [x] Implement drag start functionality
  - [x] Style the component to match TabTrader's design

- [x] Update `src/pages/TerminalWorkspace.tsx`
  - [x] Add state for showing/hiding module selector
  - [x] Add button to open module selector
  - [x] Integrate module selector component

## Phase 2: Enhanced Container Drop Handling

- [x] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [x] Enhance `handleContainerDragOver` function
  - [x] Improve drop position detection (left, right, top, bottom, center)
  - [x] Update `handleContainerDrop` function to handle module drops
  - [x] Create function to add items to containers based on drop position
  - [x] Test drop handling with different container configurations

## Phase 3: Visual Drop Indicators

- [x] ~~Create `src/components/workspace/DropIndicator.tsx`~~ (Implemented directly in TerminalContainer.tsx)
  - [x] Implement indicator component for different positions
  - [x] Add styling for indicators
  - [ ] Add animations for smooth transitions

- [x] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [x] Add drop indicator rendering logic
  - [x] Integrate indicators with drag over events
  - [x] Test visual feedback during drag operations

## Phase 4: Enhanced Tab Drag and Drop

- [x] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [x] Enhance tab `handleDragOver` function
  - [x] Improve tab drop position detection (left, right)
  - [x] Update tab `handleDrop` function for better placement
  - [x] Implement tab reordering within stacks
  - [x] Add support for moving tabs between stacks
  - [x] Test tab drag and drop with different configurations

## Phase 5: Container Splitting Logic

- [x] Update `src/components/terminal/core/TerminalContainer.tsx`
  - [x] Implement `addItemToContainer` function
  - [x] Add logic for determining split direction
  - [x] Handle nested container creation
  - [x] Implement proper sizing of containers after splitting
  - [x] Test container splitting with different drop positions

- [x] Update `src/lib/workspace/workspace-manager.ts` (if needed)
  - [x] Add helper functions for container manipulation (implemented directly in TerminalContainer.tsx)
  - [x] Ensure workspace state is properly updated after changes

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
