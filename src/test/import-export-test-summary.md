# Import/Export Test Suite Summary

## Overview
This document summarizes the comprehensive test suite created for the import/export functionality using the `payment-request-workflow.json` fixture file.

## Test Coverage

### 1. WorkflowConfiguration Import (2 tests)
- **Fixture Validation**: Verifies the payment-request-workflow.json has the correct WorkflowConfiguration structure
- **State/Transition Validation**: Confirms all expected states (6) and transitions (13 total) are present

### 2. Canvas Layout Bootstrap (3 tests)
- **UIWorkflowData Creation**: Tests conversion from WorkflowConfiguration to UIWorkflowData
- **Auto-Layout Application**: Verifies that auto-layout properly positions states from default (0,0) coordinates
- **Canvas Rendering**: Confirms the workflow renders correctly on the canvas with proper state information

### 3. Import Process Integration (3 tests)
- **JSON Parsing**: Tests successful parsing of WorkflowConfiguration JSON
- **Error Handling**: Verifies graceful handling of invalid JSON
- **Validation Logic**: Tests both current (buggy) and proposed (fixed) validation approaches

### 4. Export Functionality (3 tests)
- **JSON Export**: Verifies UIWorkflowData exports correctly as JSON
- **Configuration Preservation**: Ensures workflow configuration survives import-export cycle
- **Layout Information**: Confirms layout data (positions, etc.) is maintained in exports

### 5. Import Bug Reproduction and Fix (3 tests)
- **Bug Reproduction**: Demonstrates the current import validation bug in App.tsx
- **Correct Validation**: Provides proper WorkflowConfiguration validation logic
- **Conversion Function**: Shows how to properly convert WorkflowConfiguration to UIWorkflowData

### 6. End-to-End Import/Export Consistency (2 tests)
- **Logical Equivalence**: Verifies complete import-export cycle maintains data integrity
- **Complex Properties**: Ensures complex transition properties (criteria, processors) are preserved

### 7. Integration with App Component (2 tests)
- **Workflow Fix Demonstration**: Shows the complete fix needed for the import functionality
- **Export Format Verification**: Confirms exported data matches expected UIWorkflowData structure

### 8. Export Bug Reproduction and Fix (4 tests)
- **Export Filename Bug**: Reproduces the `currentWorkflow.name is undefined` error
- **Correct Export Logic**: Provides the proper filename generation using `configuration.name`
- **Edge Case Handling**: Tests various workflow names and fallback scenarios
- **App.tsx Fix Verification**: Confirms the actual fix works in the export function

## Key Findings

### Current Import Bug
The current import validation in `App.tsx` (lines 329-330) is incorrect:
```typescript
// BUGGY - expects UIWorkflowData structure
if (workflowData.id && workflowData.states && workflowData.transitions)
```

### Current Export Bug (FIXED)
The current export filename generation in `App.tsx` (line 357) was incorrect:
```typescript
// BUGGY - currentWorkflow.name is undefined
const exportFileDefaultName = `${currentWorkflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
```

### Proposed Fix
```typescript
// CORRECT - validates WorkflowConfiguration structure
const isValidWorkflowConfiguration = (data: any): data is WorkflowConfiguration => {
  return data !== null &&
         data !== undefined &&
         typeof data === 'object' &&
         typeof data.version === 'string' &&
         typeof data.name === 'string' &&
         typeof data.initialState === 'string' &&
         typeof data.states === 'object' &&
         data.states !== null &&
         Object.keys(data.states).length > 0
}
```

### Export Fix Applied
```typescript
// FIXED - Use configuration.name with fallback
const workflowName = currentWorkflow.configuration.name || currentWorkflow.id || 'workflow';
const exportFileDefaultName = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
```

### Import Conversion Process
1. Validate incoming JSON as WorkflowConfiguration
2. Create UIWorkflowData structure with default layout
3. Apply auto-layout to bootstrap proper state positioning
4. Set workflow in application state

## Test Results
- **Total Tests**: 22
- **Passing**: 22 (100%)
- **Coverage**: Complete import/export workflow with edge cases and bug fixes

## Files Tested
- `src/test/fixtures/payment-request-workflow.json` - Test fixture
- `src/App.tsx` - Import/export handlers (indirectly)
- `src/components/Canvas/WorkflowCanvas.tsx` - Canvas rendering
- `src/utils/autoLayout.ts` - Auto-layout functionality
- `src/types/workflow.ts` - Type definitions

## Usage
Run the test suite with:
```bash
npm run test:run -- src/test/import-export.test.tsx
```

The tests serve as both validation and documentation for the proper import/export implementation.
