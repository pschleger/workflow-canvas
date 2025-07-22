# State Machine Workflow Editor

A web-based application for configuring, visualizing, and editing state machine workflows using a drag-and-drop interface, built with React, TypeScript, and React Flow.

## Features

### ✅ Implemented Features

- **Visual Canvas**: Interactive node-based diagrams with pan, zoom, and selection
- **Entity & Workflow Management**: Sidebar for discovering entities and their workflows
- **State Management**: Create, edit, and delete workflow states with properties
- **Transition Management**: Define transitions with conditions and actions
- **Drag & Drop**: Rearrange states and create connections visually
- **Import/Export**: JSON-based workflow import/export functionality
- **Dark Mode**: Toggle between light and dark themes with persistence
- **Real-time Editing**: Live updates with mock backend integration

### 🎯 Core Functionality

- **States**: Initial states, final states, and regular states with custom properties
- **Transitions**: Conditional transitions with multiple operators and actions
- **Visual Feedback**: Color-coded states, animated transitions, and hover effects
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7.0
- **Styling**: Tailwind CSS v4
- **Diagramming**: React Flow (@xyflow/react)
- **Icons**: Lucide React
- **UI Components**: Headless UI

## Getting Started

### Prerequisites

- Node.js 20.19.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd statemachine-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Usage Guide

### Creating Workflows

1. **Select an Entity**: Choose an entity from the sidebar to view its workflows
2. **Select a Workflow**: Click on a workflow to load it in the canvas
3. **Add States**: Double-click on the canvas to create new states
4. **Connect States**: Drag from state handles to create transitions
5. **Edit Properties**: Click the edit icon on states/transitions to modify them

### State Properties

- **Name**: Display name of the state
- **Description**: Optional description
- **Type**: Mark as initial state, final state, or regular state
- **Properties**: Custom JSON properties for additional metadata

### Transition Properties

- **Name**: Display name of the transition
- **Description**: Optional description
- **Conditions**: Rules that must be met for the transition to fire
- **Actions**: Operations to perform when the transition occurs

### Import/Export

- **Export**: Click the Export button to download the current workflow as JSON
- **Import**: Click the Import button to upload and load a workflow JSON file

## API Integration

The application uses a mock API service that simulates backend calls:

- `GET /api/entities` - Retrieve all entities
- `GET /api/workflow/{entity}` - Get workflows for an entity
- `GET /api/workflow/{entity}/{workflowId}` - Get specific workflow
- `PUT /api/workflow/{entity}` - Update workflow

### Replacing the Mock Backend

To integrate with a real backend:

1. Update `src/services/mockApi.ts` or create a new service
2. Implement the same interface with real HTTP calls
3. Update the service import in `src/App.tsx`

## Project Structure

```
src/
├── components/
│   ├── Canvas/           # React Flow canvas and node/edge components
│   ├── Editors/          # Modal editors for states and transitions
│   ├── Layout/           # Main application layout
│   └── Sidebar/          # Entity and workflow selector
├── services/             # API services and mock data
├── types/                # TypeScript type definitions
└── App.tsx              # Main application component
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Key Components

- **WorkflowCanvas**: Main React Flow canvas component
- **StateNode**: Custom node component for workflow states
- **TransitionEdge**: Custom edge component for transitions
- **StateEditor**: Modal for editing state properties
- **TransitionEditor**: Modal for editing transition properties

## License

This project is licensed under the MIT License.
