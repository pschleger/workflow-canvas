# State Management Features

## Description
Backend data management features that ensure consistency between the visual canvas and the underlying workflow configuration.

## Core Features

### Unique State ID Generation
- **Description**: Automatically generates unique identifiers for new states
- **Behavior**:
  - Default pattern: 'new-state', 'new-state-1', 'new-state-2', etc.
  - Checks both configuration states and layout states for conflicts
  - Ensures no duplicate IDs across the entire workflow

### Position Calculation
- **Description**: Accurate positioning of new states on the canvas
- **Behavior**:
  - Converts screen coordinates to flow coordinates
  - Accounts for zoom level and pan offset
  - Centers states at the intended position
  - Typical state node dimensions: ~150x50px

### State Cleanup and Consistency
- **Description**: Maintains synchronization between configuration and layout data
- **Behavior**:
  - Removes orphaned layout states (exist in layout but not configuration)
  - Removes orphaned layout transitions
  - Cleans up references to deleted states
  - Runs automatically during workflow operations

### Configuration-Layout Sync
- **Description**: Ensures visual layout stays in sync with workflow configuration
- **Behavior**:
  - Configuration states are the source of truth
  - Layout provides positioning and visual properties
  - Automatic cleanup removes inconsistencies
  - Updates trigger re-rendering of canvas

### Transition Management
- **Description**: Manages transitions between states in both configuration and layout
- **Behavior**:
  - Transitions stored in source state configuration
  - Layout transitions store visual properties (label positions)
  - Automatic cleanup of transitions referencing deleted states
  - Transition IDs follow pattern: sourceStateId-transitionIndex

## Technical Implementation
- Uses UIWorkflowData interface for type safety
- Cleanup functions run on workflow updates
- Memoized data transformations for performance
- Ref-based current value access to avoid closure issues
