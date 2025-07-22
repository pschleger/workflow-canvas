---
type: "always_apply"
---

# Core Development Rules

**Rule Type**: Always  
**Description**: Fundamental development patterns and standards that apply to all code changes in this project.

## Code Style & Language Standards

- **TypeScript First**: Use TypeScript for all new code with strict type checking enabled
- **Functional Components**: Prefer functional components with hooks over class components
- **State Management**: Implement state management with React hooks (useState, useReducer) rather than external libraries
- **Styling**: Use Tailwind CSS for styling with dark mode support via the `dark:` prefix

## Architecture Fundamentals

- **Separation of Concerns**: Maintain clear separation between UI components and business logic
- **Directory Structure**: Follow the established structure:
  - `Canvas/` - Canvas and diagramming components
  - `Editors/` - Form and editing components  
  - `Layout/` - Layout and navigation components
  - `Sidebar/` - Sidebar and panel components
  - `services/` - API services with clear interfaces
  - `types/` - TypeScript interfaces and type definitions

## Data Model Consistency

- **Workflow Model**: Follow the established workflow data model structure:
  - `Workflow` - Top-level workflow definition
  - `WorkflowState` - Individual state nodes
  - `WorkflowTransition` - Connections between states
- **Type Safety**: Provide detailed TypeScript type annotations for all data structures
- **Interface Definitions**: Implement proper TypeScript interfaces in the `types/` directory

## Integration Patterns

- **API Integration**: Use the existing mock API pattern for backend integration
- **Error Handling**: Implement proper error boundaries and validation throughout the application
