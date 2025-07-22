# Editing Features

## Description
Comprehensive editing capabilities for workflow states and transitions, including deletion with safety measures and undo/redo functionality.

## Core Features

### State Deletion
- **Description**: Multiple ways to delete states with appropriate safety measures
- **Methods**:
  - Delete button on state edit panel/popup
  - Keyboard shortcut (Backspace key) when state is selected
- **Behavior**:
  - Removes state from workflow configuration
  - Removes state from layout data
  - Cleans up transitions referencing the deleted state
  - Updates initial state if deleted state was initial
  - Maintains workflow consistency

### Deletion Warnings
- **Description**: Safety confirmation before deleting workflow elements
- **Behavior**:
  - Warning dialog appears before deletion (both button and keyboard)
  - Shows impact of deletion (e.g., "This will also remove 3 transitions")
  - Confirmation options: "Delete" button or "Cancel"
  - Keyboard shortcut (Backspace) also triggers warning dialog
  - No accidental deletions without explicit confirmation

### Session-based History
- **Description**: Track all configuration changes during user session
- **Scope**: All workflow component changes including:
  - State additions, deletions, modifications
  - Transition additions, deletions, modifications
  - Property changes (names, positions, configurations)
  - Initial state changes
  - Positioning changes
- **Storage**: Session-based storage (sessionStorage)
- **Behavior**:
  - Automatic tracking of all changes
  - Maintains change history throughout session
  - Clears history when session ends
  - Preserves history across workflow switches within session

### Undo/Redo Functionality
- **Description**: Ability to undo and redo workflow changes
- **Undo Button**: 
  - Visible undo button on canvas toolbar
  - Shows number of available undo operations
  - Disabled when no operations to undo
- **Keyboard Support**:
  - Cmd+Z (Mac) / Ctrl+Z (Windows/Linux) for undo
  - Cmd+Shift+Z (Mac) / Ctrl+Y (Windows/Linux) for redo
- **Behavior**:
  - Steps through history in reverse chronological order
  - Restores complete workflow state for each step
  - Maintains redo stack when undoing
  - Clears redo stack when new changes are made
  - Visual feedback showing current position in history

### State and Transition Editing
- **Description**: Comprehensive editing interfaces for workflow components
- **State Editing**:
  - Edit state names and properties
  - Modify state-specific configuration
  - JSON editor for advanced properties
- **Transition Editing**:
  - Edit transition names and conditions
  - Modify transition properties and actions
  - Configure transition behavior (manual, disabled, etc.)

## Technical Implementation

### History Management
- Use sessionStorage for persistence
- JSON serialization of workflow states
- Efficient diff-based storage to minimize memory usage
- Maximum history depth configuration (e.g., 50 operations)

### Keyboard Event Handling
- Global keyboard event listeners
- Proper event propagation and prevention
- Context-aware shortcuts (only when canvas is focused)
- Cross-platform key combination support

### Warning Dialog System
- Modal dialog component for confirmations
- Customizable warning messages based on deletion impact
- Accessible dialog with proper focus management
- Keyboard navigation support (Tab, Enter, Escape)

### Undo/Redo Architecture
- Command pattern for reversible operations
- State snapshots for complex operations
- Efficient state restoration mechanisms
- Integration with existing workflow update system
