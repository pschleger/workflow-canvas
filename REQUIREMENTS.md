# Product Requirements Document (PRD)

## Title
State Machine Workflow Editor (Browser-based, Vexlio-style)

## Objective
Build a web-based application that allows users to configure, visualize, and edit state machine workflows using a drag-and-drop interface. The interface should resemble the user experience of Vexlio.com, supporting fluid interactions on a canvas, real-time editing of state transitions, and integration with a backend service for persistence.

## Target Audience
Backend developers, architects, and DevOps engineers managing entity-driven systems and workflows.

## Key Features

### 1. Visual Canvas (Core)
- Display workflows as node-based diagrams
- Nodes = states
- Edges = transitions (optionally with filters/processes)
- Support pan, zoom, and selection
- Editable node/edge labels and metadata
- Allow users to drag/drop to rearrange state layout

### 2. Entity & Workflow Selector (Sidebar)
- Discover entities that have workflows
- Display a list of workflows per entity
- Allow selecting one for editing

### 3. State and Transition Editing
- Sidebar or modal editor for:
  - State name and properties
  - Transition conditions
  - Filters or actions attached to transitions
- Support editing via forms with JSON mapping

### 4. Import/Export
- JSON-based import/export of complete workflows
- Buttons to upload/download current canvas state

### 5. Backend Integration
- Replaceable dummy data source
- Simulated call to:
  - `GET /api/entities`
  - `GET /api/workflow/{entity}`
  - `PUT /api/workflow/{entity}`

### 6. Theming
- Optional dark mode toggle

## Tech Stack
- React (with TypeScript)
- Vite for fast local dev
- React Flow for diagramming
- Tailwind CSS for styling
- Optional integration with REST backend

## AI Prompt Usage
This PRD is designed to be used with LLMs (e.g., ChatGPT, Claude, Copilot) to:
- Scaffold component implementations
- Generate or validate JSON schema for workflows
- Help define UI layout and form logic
- Provide suggestions for usability improvements

## Non-Goals
- No real-time collaboration
- No multi-user authentication
- No workflow execution engine (view/edit only)

## Deliverables
- A working web app running locally
- JSON-compatible workflow model
- Readme for replacing dummy backend with real API

## Features

This section provides an overview of the key features. For detailed specifications, see the individual feature files in the [features/](./features/) directory.

### Canvas Interaction Features
Interactive canvas features for direct workflow manipulation. See [features/canvas-interaction.md](./features/canvas-interaction.md) for details.

- **Double-click to Add State**: Create new states by double-clicking on the canvas
- **Drag and Drop**: Rearrange states by dragging them around the canvas
- **Connection Creation**: Create transitions by dragging between state handles
- **Visual State Indicators**: Color-coded states (green for initial, red for final)
- **Zoom and Pan**: Navigate large workflows with zoom and pan controls
- **Auto-Layout**: Automatically arrange states using hierarchical layout algorithm (Dagre)
- **Quick Help Panel**: On-screen guidance for available interactions

### State Management Features
Backend data consistency and state management. See [features/state-management.md](./features/state-management.md) for details.

- **Unique State ID Generation**: Automatic generation of unique state identifiers
- **State Cleanup**: Maintains synchronization between configuration and layout
- **Position Calculation**: Accurate positioning of new states on the canvas

### User Interface Features
Visual design and user experience features. See [features/user-interface.md](./features/user-interface.md) for details.

- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Adaptive interface for different screen sizes
- **Real-time Updates**: Immediate visual feedback for all operations

### Editing Features
Comprehensive editing capabilities with safety measures and history. See [features/editing.md](./features/editing.md) for details.

- **State Deletion**: Delete states via button or keyboard shortcut (Backspace)
- **Deletion Warnings**: Confirmation dialogs before deleting elements
- **Session History**: Track all configuration changes in session storage
- **Undo/Redo**: Undo button and keyboard shortcuts (Cmd+Z/Ctrl+Z) for change history

## Notes
Focus on developer usability and rapid iteration. Architecture should favor modular, testable components with clean separation between layout and logic.
## Recommended Tech Stack (Elaborated)

Based on prior architecture and tooling discussions, the following technologies are recommended:

### Frontend Framework
- **React**: Popular, component-driven UI framework with strong ecosystem support.
- **Vite**: Lightweight, fast development server and build tool ideal for modern React apps.
- **TypeScript**: Static typing for better code quality and developer experience.

### Diagramming and UI
- **React Flow**: Best-in-class library for building node-based diagrams. Supports zoom/pan, node/edge types, and interactive editing.
- **Tailwind CSS**: Utility-first CSS framework for clean, responsive UI design.
- **shadcn/ui or Headless UI**: For form controls, modals, and sidebar interactions.

### State Management
- **React useState/useReducer**: Local state for small apps.
- Optional: **Zustand** or **Redux Toolkit** for more complex state interactions (not required initially).

### Backend Integration
- REST-based API integration using `fetch` or `axios`.
- Dummy data scaffolding with clear hooks for replacement.
- OpenAPI definitions optional but beneficial for type safety.

### Optional Enhancements
- **Dark Mode** via Tailwind’s dark variant and React state toggle.
- **Jest + React Testing Library** for UI testing (optional but encouraged).

### Implemented Enhancements
- **Dagre layout engine** for automatic hierarchical layout of state diagrams - ✅ Implemented
- **Auto-layout button** in canvas controls for one-click state arrangement - ✅ Implemented

This stack is optimized for fast prototyping, clean separation of concerns, and easy onboarding of other frontend developers.