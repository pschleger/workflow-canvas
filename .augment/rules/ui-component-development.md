---
type: "agent_requested"
description: "Example description"
---
# Component Development Rules

Guidelines for React component development, UI consistency, theming, component patterns, and user interface implementation.

## Component Structure & Patterns

- **Props Interface**: Components should accept a `darkMode` prop for theme consistency across the application
- **Communication Patterns**: Use callback patterns for parent-child communication:
  - `onSave` - For save operations
  - `onDelete` - For delete operations  
  - `onCancel` - For cancel operations
  - `onChange` - For data changes
- **State Management**: Implement proper loading states and error handling in all interactive components

## Theme & Styling Implementation

- **Dark Mode Support**: 
  - Always implement dark mode variants using Tailwind's `dark:` prefix
  - Ensure proper contrast and accessibility in both light and dark themes
  - Test components in both theme modes during development
- **Tailwind CSS**: Use Tailwind CSS classes for all styling, avoiding custom CSS when possible
- **Consistent Spacing**: Follow established spacing patterns using Tailwind's spacing scale

## Component Integration

- **Existing Patterns**: Reference existing components and patterns when suggesting modifications
- **Canvas Integration**: Show how new components integrate with the existing React Flow canvas
- **State Management**: Provide context about how components fit into the overall state management patterns

## UI/UX Guidelines

- **Loading States**: Implement proper loading indicators for async operations
- **Error Handling**: Display user-friendly error messages with clear recovery actions
- **Accessibility**: Ensure components are keyboard navigable and screen reader friendly
- **Responsive Design**: Components should work across different screen sizes and orientations

## Component Documentation

- **Props Documentation**: Document all component props with TypeScript interfaces
- **Usage Examples**: Provide clear examples of how components should be used
- **Integration Context**: Explain how components fit into the larger application architecture
