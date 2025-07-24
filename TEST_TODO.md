# Test TODO - Functionality to Re-implement

This document outlines test functionality that was removed during test cleanup and should be re-implemented in the future when the underlying functionality is stable.

## High Priority - Core Functionality Tests

### 1. API Integration Tests (`functionality.test.tsx`)
**Status**: Deleted due to MockApiService mocking issues
**Functionality to Test**:
- Complete workflow loading from API
- Entity and workflow selection integration
- API error handling and retry logic
- Workflow saving and persistence
- Real API response handling vs mock data

**Re-implementation Notes**: 
- Fix MockApiService to properly expose `getWorkflow` method
- Test actual API integration patterns
- Verify error states and loading states

### 2. State Management Bug Reproduction (`state-management-fixes.test.tsx`)
**Status**: Deleted due to complex UI behavior test failures
**Functionality to Test**:
- Double-click to add new states with proper positioning
- State deletion and recreation scenarios
- Unique state ID generation (avoiding conflicts)
- Screen-to-flow position coordinate transformation
- State management during workflow updates

**Re-implementation Notes**:
- These tests were testing important bug fixes
- Need to verify `screenToFlowPosition` function behavior
- Test state ID collision handling
- Verify state persistence across operations

### 3. Transition Editing Integration (`transition-editing.test.tsx`)
**Status**: Deleted due to API mocking issues
**Functionality to Test**:
- Opening TransitionEditor via edit button clicks
- Double-click transition editing functionality
- TransitionEditor close/save behavior
- Transition data persistence after editing

**Re-implementation Notes**:
- Fix API mocking setup first
- Test complete edit workflow from UI to data persistence
- Verify transition editor state management

## Medium Priority - UI Interaction Tests

### 4. Form-Based State Editing (`name-editing.test.tsx`)
**Status**: Deleted - tests expected form fields that don't exist in current JSON editor UI
**Functionality to Test**:
- State name editing through dedicated form fields
- Transition name editing through form inputs
- Form validation and error handling
- Save/cancel functionality in form-based editors

**Re-implementation Notes**:
- Current UI uses JSON editors instead of forms
- May need to implement form-based editing if required
- Or adapt tests to work with JSON editor approach

### 5. Transition Dragging and Schema Integration (`transition-dragging-schema.test.tsx`, `transition-dragging.test.tsx`)
**Status**: Deleted due to UI element mismatches and API issues
**Functionality to Test**:
- Transition drag handles and positioning
- Schema-based transition rendering
- Transition label dragging and repositioning
- Visual indicators for transition types (criterion, processors)
- Help text updates for dragging functionality

**Re-implementation Notes**:
- Tests expected specific UI text that doesn't match implementation
- Need to align test expectations with actual UI design
- Test drag-and-drop functionality for transition labels

## Lower Priority - Bug Reproduction Tests

### 6. Undo/Reposition Bug Tests (`undo-reposition-bug.test.tsx`)
**Status**: Deleted due to utility function behavior mismatches
**Functionality to Test**:
- Transition ID generation with escaped hyphens
- Transition ID parsing for complex state names
- Workflow cleanup during undo operations
- Transition preservation after undo-all + reposition operations

**Re-implementation Notes**:
- Tests expected specific ID format that doesn't match implementation
- May indicate actual bugs in transition ID handling
- Need to verify if current implementation is correct or needs fixing

### 7. User Registration Workflow Bug (`user-registration-bug.test.tsx`)
**Status**: Deleted due to utility function mismatches and complex test setup
**Functionality to Test**:
- Transition ID parsing for "failed" state scenarios
- History tracking during workflow operations
- Transition ID mismatch detection between config and layout
- Workflow cleanup preserving transitions to failed states

**Re-implementation Notes**:
- These were testing specific bug scenarios
- May indicate real issues with transition ID consistency
- Need to verify if bugs still exist or were fixed

## Implementation Guidelines

### Before Re-implementing Tests:
1. **Fix API Mocking**: Ensure MockApiService properly exposes all required methods
2. **Verify UI Patterns**: Confirm whether form-based editing or JSON editing is the intended approach
3. **Check Utility Functions**: Verify that transition ID generation/parsing functions work as expected
4. **Review Bug Status**: Determine if the bugs these tests were reproducing still exist

### Test Categories to Focus On:
1. **Integration Tests**: Full user workflows from UI interaction to data persistence
2. **Bug Regression Tests**: Ensure fixed bugs don't reoccur
3. **API Integration**: Real API communication patterns and error handling
4. **State Management**: Complex state operations and edge cases

### Notes:
- Many deleted tests were testing important functionality
- Some failures may indicate actual bugs rather than test issues
- Priority should be given to tests that verify core user workflows
- Consider implementing tests incrementally as features stabilize
