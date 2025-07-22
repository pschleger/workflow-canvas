---
type: "always_apply"
---

# Requirements Alignment Rules

**Rule Type**: Always
**Description**: Ensures all code changes and feature implementations align with the project requirements and keeps both the REQUIREMENTS.md file and features directory current.

## Requirements Compliance

- **Mandatory Alignment**: All code changes, new features, and modifications must align with the content and objectives defined in `REQUIREMENTS.md` and the detailed specifications in the `features/` directory
- **Feature Scope**: Only implement features that are explicitly mentioned in the requirements or are necessary supporting functionality
- **Tech Stack Adherence**: Follow the recommended tech stack specified in REQUIREMENTS.md:
  - React with TypeScript
  - Vite for development
  - React Flow for diagramming
  - Tailwind CSS for styling
  - REST-based backend integration

## Requirements Documentation Maintenance

- **Live Updates**: When new requirements are discussed or agreed upon during a chat or agent session, immediately update both `REQUIREMENTS.md` and the relevant files in the `features/` directory
- **Dual Documentation System**: Maintain consistency between:
  - `REQUIREMENTS.md` - High-level overview with links to detailed specifications
  - `features/` directory - Detailed feature specifications and implementation guidance
- **Version Control**: Treat both `REQUIREMENTS.md` and the `features/` directory as living documentation that evolves with the project
- **Change Documentation**: When updating requirements, clearly document:
  - What was added or modified
  - Why the change was necessary
  - How it impacts existing features or implementation

## Features Directory Management

- **Always Update Features Directory**: When adding new features or modifying existing ones, create or update the corresponding file in the `features/` directory
- **Feature File Structure**: Each feature file should contain:
  - Description and overview
  - Core features and behaviors
  - Technical implementation details
  - User stories and requirements
- **Cross-Reference Maintenance**: Ensure `REQUIREMENTS.md` properly references feature files and vice versa
- **Index Updates**: Update `features/README.md` when adding new feature files

## Implementation Validation

- **Pre-Implementation Check**: Before implementing any feature, verify it aligns with:
  - The stated objective of building a "State Machine Workflow Editor"
  - The target audience needs (backend developers, architects, DevOps engineers)
  - The core features listed (Visual Canvas, Entity Selector, State Editing, Import/Export, Backend Integration, Theming)
- **Non-Goals Respect**: Do not implement features explicitly listed in the "Non-Goals" section:
  - No real-time collaboration
  - No multi-user authentication  
  - No workflow execution engine (view/edit only)

## Architecture Consistency

- **Modular Design**: Maintain the architecture principle of "modular, testable components with clean separation between layout and logic"
- **Developer Usability**: Prioritize developer usability and rapid iteration as specified in the requirements
- **JSON Compatibility**: Ensure all workflow data structures remain JSON-compatible as required

## Requirements Review Process

- **Regular Validation**: Periodically review implemented features against requirements to ensure continued alignment
- **Gap Identification**: Identify and document any gaps between current implementation and stated requirements
- **Stakeholder Communication**: When requirements need clarification or modification, document the discussion and update the requirements file accordingly
