# Import/Export Test Suite Summary

## Overview
This document summarizes the comprehensive test suite created for the import/export functionality using the `payment-request-workflow.json` fixture file. The implementation has been updated to use a composite identifier structure (modelName + modelVersion) instead of entityId, and includes a proper import dialog with metadata input.

## Test Coverage

### 1. WorkflowConfiguration Import (2 tests)
- **Fixture Validation**: Verifies the payment-request-workflow.json has the correct WorkflowConfiguration structure
- **State/Transition Validation**: Confirms all expected states (6) and transitions (13 total) are present

### 2. Canvas Layout Bootstrap (3 tests)
- **UIWorkflowData Creation**: Tests conversion from WorkflowConfiguration to UIWorkflowData with new composite identifier
- **Auto-Layout Application**: Verifies that auto-layout properly positions states from default (0,0) coordinates
- **Canvas Rendering**: Confirms the workflow renders correctly on the canvas with proper state information

### 3. Workflow ID Generation (1 test)
- **ID Generation**: Tests the new generateWorkflowId function that creates IDs from workflow name + model name + version

### 4. Import Process Integration (3 tests)
- **JSON Parsing**: Tests successful parsing of WorkflowConfiguration JSON
- **Error Handling**: Verifies graceful handling of invalid JSON
- **Validation Logic**: Tests both current (buggy) and proposed (fixed) validation approaches

### 5. Export Functionality (3 tests)
- **JSON Export**: Verifies UIWorkflowData exports correctly as JSON with new structure
- **Configuration Preservation**: Ensures workflow configuration survives import-export cycle
- **Layout Information**: Confirms layout data (positions, etc.) is maintained in exports

### 6. Import Bug Reproduction and Fix (3 tests)
- **Bug Reproduction**: Demonstrates the current import validation bug in App.tsx
- **Correct Validation**: Provides proper WorkflowConfiguration validation logic
- **Conversion Function**: Shows how to properly convert WorkflowConfiguration to UIWorkflowData

### 7. End-to-End Import/Export Consistency (2 tests)
- **Logical Equivalence**: Verifies complete import-export cycle maintains data integrity
- **Complex Properties**: Ensures complex transition properties (criteria, processors) are preserved

### 8. Integration with App Component (2 tests)
- **Workflow Fix Demonstration**: Shows the complete fix needed for the import functionality
- **Export Format Verification**: Confirms exported data matches expected UIWorkflowData structure

### 9. Export Bug Reproduction and Fix (4 tests)
- **Export Filename Bug**: Reproduces the `currentWorkflow.name is undefined` error (FIXED)
- **Correct Export Logic**: Provides the proper filename generation using new composite structure
- **Edge Case Handling**: Tests various workflow names and fallback scenarios
- **App.tsx Fix Verification**: Confirms the actual fix works in the export function

## Key Findings and Changes

### Architecture Changes
- **Composite Identifier**: Replaced `entityId` with `EntityModelIdentifier` containing `modelName` and `modelVersion`
- **Generated IDs**: Workflow IDs are now generated from workflow name + model name + version
- **Import Dialog**: Added `WorkflowImportDialog` component for metadata input during import
- **Layout Bootstrap**: Layout information is optional and auto-generated when missing

### Current Import Bug (Identified)
The current import validation in `App.tsx` is incorrect:
```typescript
// BUGGY - expects UIWorkflowData structure but gets WorkflowConfiguration
if (workflowData.id && workflowData.states && workflowData.transitions)
```

### Export Bug (FIXED)
The export filename generation was incorrect:
```typescript
// BUGGY - currentWorkflow.name is undefined
const exportFileDefaultName = `${currentWorkflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
```

### Implemented Fixes

#### Import Validation Fix
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

#### Export Fix Applied
```typescript
// FIXED - Use configuration.name with composite identifier
const workflowName = currentWorkflow.configuration.name || 'workflow';
const modelName = currentWorkflow.entityModel.modelName;
const modelVersion = currentWorkflow.entityModel.modelVersion;
const exportFileDefaultName = `${workflowName.replace(/\s+/g, '-').toLowerCase()}-${modelName.replace(/\s+/g, '-').toLowerCase()}-v${modelVersion}.json`;
```

#### Workflow ID Generation
```typescript
export function generateWorkflowId(workflowName: string, entityModel: EntityModelIdentifier): string {
  const sanitizedWorkflowName = workflowName.replace(/\s+/g, '-').toLowerCase();
  const sanitizedModelName = entityModel.modelName.replace(/\s+/g, '-').toLowerCase();
  return `${sanitizedWorkflowName}-${sanitizedModelName}-v${entityModel.modelVersion}`;
}
```

### Import Process (Updated)
1. User clicks Import button → Opens `WorkflowImportDialog`
2. User selects WorkflowConfiguration JSON file
3. User enters required metadata (modelName, modelVersion)
4. System validates WorkflowConfiguration structure
5. System generates workflow ID from name + model info
6. System creates UIWorkflowData with auto-layout positioning
7. System loads workflow into canvas

### Export Process (Updated)
1. User clicks Export button
2. System generates filename: `workflow-name-model-name-vversion.json`
3. System exports complete UIWorkflowData with timestamps
4. File includes configuration, layout, and metadata

## Test Results
- **Total Tests**: 23
- **Passing**: 23 (100%)
- **Coverage**: Complete import/export workflow with new architecture

## Files Created/Modified
- `src/components/Dialogs/WorkflowImportDialog.tsx` - **NEW** Import dialog with metadata input
- `src/types/workflow.ts` - **UPDATED** New composite identifier types and utility functions
- `src/App.tsx` - **UPDATED** Import/export handlers with new structure
- `src/test/import-export.test.tsx` - **UPDATED** Comprehensive test suite
- `src/test/fixtures/payment-request-workflow.json` - Test fixture (unchanged)

## Usage
Run the test suite with:
```bash
npm run test:run -- src/test/import-export.test.tsx
```

The implementation now properly handles WorkflowConfiguration import with metadata input and exports with the new composite identifier structure. All tests pass and validate the complete workflow.
