# Canvas Interaction Features

## Description
Interactive features that allow users to manipulate the workflow canvas directly through mouse and keyboard interactions.

## Core Features

### Double-click to Add State
- **Description**: Users can double-click anywhere on the canvas to create a new state at that position
- **Behavior**: 
  - Double-click detection within 500ms and 5px tolerance
  - Automatically generates unique state IDs (new-state, new-state-1, etc.)
  - Centers new state at click position
  - Disables React Flow's default double-click zoom behavior

### Drag and Drop
- **Description**: States can be dragged around the canvas to rearrange workflow layout
- **Behavior**:
  - Real-time position updates during drag
  - Position changes are persisted to workflow layout
  - Smooth visual feedback during drag operations

### Connection Creation
- **Description**: Users can drag from state handles to create transitions between states
- **Behavior**:
  - Drag from source state handle to target state handle
  - Automatically creates new transition definition
  - Adds transition to source state's configuration

### Visual State Indicators
- **Description**: States are visually distinguished by their role in the workflow
- **Behavior**:
  - Initial states: Green border and background (defined by initialState attribute)
  - Final states: Red border and background (states with no outgoing transitions)
  - Regular states: Gray border with hover effects

### Zoom and Pan Support
- **Description**: Canvas supports zooming and panning for large workflows
- **Behavior**:
  - Mouse wheel zoom
  - Pan by dragging canvas background
  - Zoom controls in toolbar
  - Minimap for navigation

### Automatic Layout
- **Description**: Button to automatically reposition all states using a layout algorithm for better organization
- **Behavior**:
  - Layout button in canvas toolbar or controls panel
  - Applies hierarchical layout algorithm (e.g., Dagre) to arrange states
  - Preserves logical flow from initial state through transitions
  - Maintains reasonable spacing between states and transitions
  - Animates states to new positions for smooth visual transition
  - Can be undone using standard undo functionality
  - Works with workflows of any size and complexity

### Quick Help Panel
- **Description**: On-screen help panel showing available interactions
- **Content**:
  - Double-click canvas to add state
  - Double-click transitions to edit
  - Drag from state handles to connect
  - Drag transition labels to reposition
  - Click edit icons to modify
  - Drag states to rearrange
  - Use layout button to auto-arrange states

## Technical Implementation
- Uses React Flow library for canvas functionality
- Custom double-click detection logic
- Screen-to-flow coordinate transformation
- Real-time workflow data updates
