---
type: "agent_requested"
description: "Example description"
---
# React Flow Canvas Rules

**Rule Type**: Auto  
**Description**: Guidelines for React Flow canvas functionality, diagramming, node-based interfaces, workflow visualization, and interactive canvas operations.

## React Flow Library Usage

- **Primary Library**: Use React Flow (@xyflow/react) for all diagramming and canvas functionality
- **Built-in Types**: Use React Flow's built-in types for canvas operations:
  - `Node` - For workflow states and canvas nodes
  - `Edge` - For workflow transitions and connections
  - `Connection` - For handling new connections between nodes
- **Best Practices**: Leverage React Flow's zoom/pan, node/edge types, and interactive editing capabilities

## Canvas Operations

- **Node Management**: 
  - Create nodes using React Flow's node structure with proper `id`, `type`, `position`, and `data` properties
  - Implement custom node types for workflow states with appropriate styling and interaction handlers
  - Handle node selection, dragging, and positioning through React Flow's built-in mechanisms

- **Edge Management**:
  - Create edges using React Flow's edge structure with `id`, `source`, `target`, and optional styling
  - Implement custom edge types for workflow transitions with labels and conditional styling
  - Handle edge creation through React Flow's connection handlers

## Integration with Workflow Model

- **State Mapping**: Map `WorkflowState` objects to React Flow `Node` objects with consistent data transformation
- **Transition Mapping**: Map `WorkflowTransition` objects to React Flow `Edge` objects with proper source/target references
- **Data Synchronization**: Maintain bidirectional sync between React Flow canvas state and workflow data model

## Canvas Interaction Patterns

- **Selection Handling**: Implement proper selection state management for nodes and edges
- **Context Menus**: Use React Flow's event system for right-click context menus and node/edge actions
- **Drag and Drop**: Leverage React Flow's built-in drag and drop for node positioning and canvas interactions
- **Viewport Control**: Use React Flow's viewport controls for zoom, pan, and fit-to-screen functionality
