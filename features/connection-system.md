# Connection System Features

## Description
Advanced connection system that provides multiple anchor points per state and supports various connection patterns including loop-back transitions. This system has been fully debugged and optimized for production use.

## ✅ Recent Bug Fixes & Improvements
- **Data Architecture Fixed**: Eliminated data duplication between states and transitions
- **Performance Optimized**: Resolved excessive undo events (34+ on initialization)
- **Save Functionality Restored**: All state and transition editing now saves correctly
- **Loop-back Support Enhanced**: Full support for editing self-connecting transitions
- **Handle Visibility Improved**: Always-visible handles with professional hover effects

## Core Features

### Multiple Anchor Points (8-Point System)
- **Description**: Each state provides 8 strategically positioned anchor points for maximum connection flexibility
- **Layout**:
  - **Top Edge**: 3 anchor points (left, center, right)
  - **Bottom Edge**: 3 anchor points (left, center, right)
  - **Left Edge**: 1 anchor point (center)
  - **Right Edge**: 1 anchor point (center)
- **Benefits**:
  - Reduces edge crossings in complex workflows
  - Provides more natural connection paths
  - Enables professional diagram layouts
  - Supports various workflow patterns

### Bidirectional Anchor Points
- **Description**: Each anchor point can accept both incoming and outgoing connections
- **Behavior**:
  - Any anchor point can be a source for outgoing transitions
  - Any anchor point can be a target for incoming transitions
  - Multiple transitions can connect to the same anchor point
  - Visual feedback shows available connection points during drag operations

### Loop-back Transitions
- **Description**: States can have transitions that loop back to themselves
- **Use Cases**:
  - Self-validation states
  - Retry mechanisms
  - Conditional loops
  - State persistence patterns
- **Behavior**:
  - Drag from any anchor point back to any anchor point on the same state
  - Creates curved edge that loops around the state
  - Maintains clear visual distinction from other transitions
  - Supports all standard transition properties (conditions, actions, etc.)

### Smart Edge Routing
- **Description**: Automatic edge routing that creates clean, professional-looking connections
- **Features**:
  - Bezier curves for smooth connections
  - Automatic collision avoidance
  - Optimal path calculation between anchor points
  - Special handling for loop-back transitions
  - Maintains readability even with complex connection patterns

### Visual Connection Feedback
- **Description**: Clear visual indicators for connection creation and management
- **Behavior**:
  - Anchor points are always visible with 60% opacity for easy discovery
  - Hover effects increase opacity to 100% and scale handles slightly
  - Show connection preview during drag operation
  - Visual confirmation when valid connection target is reached
  - Different styling for loop-back vs. regular connections

### Edge Reconnection
- **Description**: Ability to detach and reconnect existing transition endpoints
- **Features**:
  - Drag existing edge endpoints to different anchor points
  - Reconnect to different handles on the same state
  - Reconnect to different states entirely
  - Automatic loop-back detection when reconnecting to same state
  - Preserves transition properties during reconnection
- **User Experience**:
  - Hover over edge endpoints to see reconnection handles
  - Drag endpoints to new locations with visual feedback
  - Automatic workflow updates with proper undo/redo support

## Technical Implementation

### Handle Management
- Each anchor point has a unique identifier (e.g., "top-left", "bottom-center")
- Handle positions calculated relative to state node dimensions
- CSS positioning for precise anchor point placement
- Consistent styling across all anchor points

### Connection Data Structure
- Edge definitions include source and target handle IDs
- Preserves specific anchor point information for layout persistence
- Supports serialization/deserialization of handle-specific connections
- Maintains backward compatibility with existing workflows

### Loop-back Handling
- Special edge type for self-connections
- Custom path calculation for loop-back edges
- Configurable loop size and positioning
- Prevents visual overlap with state content

## User Experience

### Connection Creation Workflow
1. User hovers over state to see available anchor points
2. User drags from desired source anchor point
3. System shows connection preview and highlights valid targets
4. User drops on target anchor point (same or different state)
5. System creates transition with preserved handle information

### Visual Design
- Anchor points are always visible with subtle transparency
- Consistent sizing and styling across all states
- Clear visual hierarchy (handles vs. state content)
- Responsive to theme changes (light/dark mode)
- Hover effects provide clear interaction feedback

## Integration Points

### State Editor Integration
- Transition editor shows source and target anchor point information
- Option to modify connection points after creation
- Visual representation of connection points in editing interface

### Layout Algorithm Integration
- Auto-layout algorithms consider anchor point preferences
- Optimal anchor point selection for generated layouts
- Preservation of manual anchor point choices

### Export/Import Integration
- Connection point information included in workflow exports
- Proper handling of legacy workflows without anchor point data
- Migration support for existing workflows
