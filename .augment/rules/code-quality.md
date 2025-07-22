---
type: "always_apply"
---

# Code Quality Rules

Detailed code quality standards, documentation requirements, and best practices for maintaining high-quality, maintainable code.

## TypeScript Quality Standards

- **Detailed Type Annotations**: Provide comprehensive TypeScript type annotations for all functions, variables, and data structures
- **Interface Relationships**: Explain TypeScript interfaces and their relationships in detail when introducing new types
- **Type Safety**: Ensure complete type coverage with no `any` types unless absolutely necessary
- **Generic Types**: Use generic types appropriately to create reusable, type-safe components and functions

## Documentation Requirements

- **JSDoc Comments**: Include comprehensive JSDoc comments for complex functions, including:
  - Parameter descriptions with types
  - Return value descriptions
  - Usage examples where helpful
  - Error conditions and exceptions
- **Code Comments**: Add inline comments for complex business logic or non-obvious implementation details
- **README Updates**: Update relevant documentation when adding new features or changing existing functionality

## Naming Conventions

- **Descriptive Names**: Use meaningful variable and function names that clearly describe their purpose
- **Consistent Patterns**: Follow established naming patterns within the codebase
- **Avoid Abbreviations**: Prefer full words over abbreviations unless they are widely understood
- **Boolean Naming**: Use clear boolean naming patterns (is*, has*, can*, should*)

## Code Organization

- **Single Responsibility**: Each function and component should have a single, well-defined responsibility
- **DRY Principle**: Avoid code duplication by extracting common functionality into reusable utilities
- **Modular Structure**: Organize code into logical modules with clear boundaries and interfaces
- **Import Organization**: Group and order imports logically (external libraries, internal modules, relative imports)

## Error Handling & Validation

- **Comprehensive Error Boundaries**: Implement proper error boundaries at appropriate component levels
- **Input Validation**: Validate all user inputs and external data with clear error messages
- **Graceful Degradation**: Handle edge cases and error states gracefully with user-friendly feedback
- **Logging**: Include appropriate logging for debugging and monitoring purposes

## Performance Considerations

- **React Optimization**: Use React.memo, useMemo, and useCallback appropriately to prevent unnecessary re-renders
- **Bundle Size**: Consider the impact of new dependencies on bundle size
- **Lazy Loading**: Implement code splitting and lazy loading for large components or features
- **Memory Management**: Ensure proper cleanup of event listeners, subscriptions, and timers
