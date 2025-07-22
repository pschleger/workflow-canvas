# Features Directory

This directory contains detailed specifications for individual features of the State Machine Workflow Editor.

Each feature is documented in its own file with comprehensive requirements, user stories, and implementation details.

## Feature Files

- [Canvas Interaction](./canvas-interaction.md) - Double-click to add states, drag and drop, zoom/pan
- [State Management](./state-management.md) - Unique ID generation, position calculation, cleanup
- [User Interface](./user-interface.md) - Dark mode, responsive design, real-time updates
- [Editing](./editing.md) - State/transition editing, deletion with warnings, undo/redo functionality

## Adding New Features

When adding new features:
1. Create a new `.md` file in this directory
2. Follow the existing format with sections for description, requirements, and user stories
3. Update this README.md to include the new feature
4. Reference the feature file in the main REQUIREMENTS.md
