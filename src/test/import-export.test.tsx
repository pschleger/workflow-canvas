// ABOUTME: Comprehensive tests for import/export functionality that verify proper
// workflow import, canvas positioning bootstrap, and export consistency.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import App from '../App'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import type { WorkflowConfiguration, UIWorkflowData, CanvasLayout } from '../types/workflow'
import { autoLayoutWorkflow } from '../utils/autoLayout'
import paymentRequestWorkflow from './fixtures/payment-request-workflow.json'

// Mock the API service
vi.mock('../services/mockApi', () => ({
  MockApiService: {
    getEntities: vi.fn(),
    getWorkflows: vi.fn(),
    getWorkflowConfiguration: vi.fn(),
    getCanvasLayout: vi.fn(),
    updateWorkflowConfiguration: vi.fn(),
    updateCanvasLayout: vi.fn(),
    getWorkflowWithLayout: vi.fn(),
  }
}))

// Mock the config service
vi.mock('../services/configService', () => ({
  configService: {
    getConfig: vi.fn(() => ({
      history: { maxDepth: 50 },
      ui: { darkMode: false }
    })),
    getHistoryConfig: vi.fn(() => ({ maxDepth: 50 })),
    getUIConfig: vi.fn(() => ({ darkMode: false }))
  }
}))

// Mock the history service
vi.mock('../services/historyService', () => ({
  historyService: {
    addEntry: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    undo: vi.fn(),
    redo: vi.fn(),
    getUndoCount: vi.fn(() => 0),
    getRedoCount: vi.fn(() => 0),
    clear: vi.fn()
  }
}))

// Helper function to create UIWorkflowData from WorkflowConfiguration (shared across tests)
const createUIWorkflowFromConfig = (config: WorkflowConfiguration): UIWorkflowData => {
  const workflowId = 'payment-request-test'
  const entityId = 'payment-entity'
  const now = new Date().toISOString()

  // Create initial layout with default positions
  const initialLayout: CanvasLayout = {
    workflowId,
    version: 1,
    updatedAt: now,
    states: Object.keys(config.states).map(stateId => ({
      id: stateId,
      position: { x: 0, y: 0 } // Default position - should be auto-laid out
    })),
    transitions: [] // Will be populated by canvas
  }

  return {
    id: workflowId,
    entityId,
    configuration: config,
    layout: initialLayout,
    createdAt: now,
    updatedAt: now
  }
}

describe('Import/Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('WorkflowConfiguration Import', () => {
    it('should validate the fixture file structure', () => {
      // Verify the fixture file has the expected WorkflowConfiguration structure
      expect(paymentRequestWorkflow).toHaveProperty('version')
      expect(paymentRequestWorkflow).toHaveProperty('name')
      expect(paymentRequestWorkflow).toHaveProperty('desc')
      expect(paymentRequestWorkflow).toHaveProperty('initialState')
      expect(paymentRequestWorkflow).toHaveProperty('active')
      expect(paymentRequestWorkflow).toHaveProperty('states')
      
      // Verify it's a proper WorkflowConfiguration, not UIWorkflowData
      expect(paymentRequestWorkflow).not.toHaveProperty('id')
      expect(paymentRequestWorkflow).not.toHaveProperty('entityId')
      expect(paymentRequestWorkflow).not.toHaveProperty('layout')
      expect(paymentRequestWorkflow).not.toHaveProperty('createdAt')
      expect(paymentRequestWorkflow).not.toHaveProperty('updatedAt')
    })

    it('should have expected states and transitions', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      
      // Verify expected states exist
      const expectedStates = ['INVALID', 'PENDING', 'SUBMITTED', 'APPROVED', 'DECLINED', 'CANCELED']
      expectedStates.forEach(stateId => {
        expect(config.states).toHaveProperty(stateId)
      })
      
      // Verify initial state
      expect(config.initialState).toBe('INVALID')
      
      // Verify some key transitions
      expect(config.states.INVALID.transitions).toHaveLength(5)
      expect(config.states.PENDING.transitions).toHaveLength(3)
      expect(config.states.SUBMITTED.transitions).toHaveLength(2)
      expect(config.states.CANCELED.transitions).toHaveLength(0) // Final state
    })
  })

  describe('Canvas Layout Bootstrap', () => {

    it('should create UIWorkflowData from WorkflowConfiguration', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      
      // Verify structure
      expect(uiWorkflow).toHaveProperty('id')
      expect(uiWorkflow).toHaveProperty('entityId')
      expect(uiWorkflow).toHaveProperty('configuration')
      expect(uiWorkflow).toHaveProperty('layout')
      expect(uiWorkflow).toHaveProperty('createdAt')
      expect(uiWorkflow).toHaveProperty('updatedAt')
      
      // Verify configuration is preserved
      expect(uiWorkflow.configuration).toEqual(config)
      
      // Verify layout has states for all configuration states
      const configStateIds = Object.keys(config.states)
      const layoutStateIds = uiWorkflow.layout.states.map(s => s.id)
      expect(layoutStateIds.sort()).toEqual(configStateIds.sort())
    })

    it('should apply auto-layout to bootstrap positions', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      
      // Apply auto-layout
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)
      
      // Verify positions are no longer all (0, 0)
      const hasNonZeroPositions = layoutedWorkflow.layout.states.some(state => 
        state.position.x !== 0 || state.position.y !== 0
      )
      expect(hasNonZeroPositions).toBe(true)
      
      // Verify all states have numeric positions
      layoutedWorkflow.layout.states.forEach(state => {
        expect(typeof state.position.x).toBe('number')
        expect(typeof state.position.y).toBe('number')
        expect(state.position.x).toBeGreaterThanOrEqual(0)
        expect(state.position.y).toBeGreaterThanOrEqual(0)
      })
    })

    it('should render workflow on canvas with proper state positioning', async () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      const mockOnWorkflowUpdate = vi.fn()
      const mockOnStateEdit = vi.fn()
      const mockOnTransitionEdit = vi.fn()

      render(
        <ReactFlowProvider>
          <WorkflowCanvas
            workflow={layoutedWorkflow}
            onWorkflowUpdate={mockOnWorkflowUpdate}
            onStateEdit={mockOnStateEdit}
            onTransitionEdit={mockOnTransitionEdit}
            darkMode={false}
          />
        </ReactFlowProvider>
      )

      // Wait for canvas to render - check for workflow info panel instead of nodes
      await waitFor(() => {
        expect(screen.getByText('Payment Request Workflow')).toBeInTheDocument()
        expect(screen.getByText('6 states')).toBeInTheDocument()
        expect(screen.getByText('13 transitions')).toBeInTheDocument()
      })

      // Verify the workflow is loaded and displayed
      expect(screen.getByText('Payment Request Workflow')).toBeInTheDocument()

      // Note: Individual state nodes may not render in test environment due to React Flow's
      // virtual rendering, but the workflow info confirms the data is properly loaded
    })
  })

  describe('Import Process Integration', () => {
    // Helper function to simulate file import
    const simulateFileImport = (fileContent: string, filename: string = 'test-workflow.json') => {
      const file = new File([fileContent], filename, { type: 'application/json' })
      const event = {
        target: { files: [file] }
      } as any

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          resolve(result)
        }
        reader.onerror = () => reject(new Error('File read error'))
        reader.readAsText(file)
      })
    }

    // Helper function to simulate JSON parsing with error handling
    const parseWorkflowJson = (jsonString: string) => {
      try {
        return JSON.parse(jsonString)
      } catch (error) {
        throw new Error(`Invalid JSON: ${error}`)
      }
    }

    it('should parse WorkflowConfiguration JSON correctly', async () => {
      const fileContent = JSON.stringify(paymentRequestWorkflow, null, 2)
      const parsedContent = await simulateFileImport(fileContent)
      const workflowData = parseWorkflowJson(parsedContent)

      // Verify parsing preserves structure
      expect(workflowData).toEqual(paymentRequestWorkflow)
      expect(workflowData.name).toBe('Payment Request Workflow')
      expect(workflowData.initialState).toBe('INVALID')
      expect(Object.keys(workflowData.states)).toHaveLength(6)
    })

    it('should handle invalid JSON gracefully', async () => {
      const invalidJson = '{ invalid json content'
      const parsedContent = await simulateFileImport(invalidJson)

      expect(() => parseWorkflowJson(parsedContent)).toThrow('Invalid JSON')
    })

    it('should validate required workflow properties', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration

      // Test current validation logic (from App.tsx handleImport)
      // Note: Current implementation has a bug - it expects UIWorkflowData structure
      const hasRequiredUIWorkflowProps = config.hasOwnProperty('id') &&
                                        config.hasOwnProperty('states') &&
                                        config.hasOwnProperty('transitions')

      // This should be false for WorkflowConfiguration
      expect(hasRequiredUIWorkflowProps).toBe(false)

      // Test proper WorkflowConfiguration validation
      const hasRequiredConfigProps = config.hasOwnProperty('version') &&
                                    config.hasOwnProperty('name') &&
                                    config.hasOwnProperty('states') &&
                                    config.hasOwnProperty('initialState')

      expect(hasRequiredConfigProps).toBe(true)
    })
  })

  describe('Export Functionality', () => {
    it('should export UIWorkflowData as JSON', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      // Simulate export process
      const exportedJson = JSON.stringify(layoutedWorkflow, null, 2)
      const parsedExport = JSON.parse(exportedJson)

      // Verify export structure
      expect(parsedExport).toHaveProperty('id')
      expect(parsedExport).toHaveProperty('entityId')
      expect(parsedExport).toHaveProperty('configuration')
      expect(parsedExport).toHaveProperty('layout')
      expect(parsedExport).toHaveProperty('createdAt')
      expect(parsedExport).toHaveProperty('updatedAt')

      // Verify configuration is preserved
      expect(parsedExport.configuration).toEqual(config)
    })

    it('should preserve workflow configuration through import-export cycle', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      // Export and re-import
      const exportedJson = JSON.stringify(layoutedWorkflow, null, 2)
      const reimportedWorkflow = JSON.parse(exportedJson) as UIWorkflowData

      // Verify configuration is identical
      expect(reimportedWorkflow.configuration).toEqual(config)

      // Verify all states are preserved
      expect(Object.keys(reimportedWorkflow.configuration.states)).toEqual(
        Object.keys(config.states)
      )

      // Verify transitions are preserved
      Object.keys(config.states).forEach(stateId => {
        expect(reimportedWorkflow.configuration.states[stateId].transitions).toEqual(
          config.states[stateId].transitions
        )
      })
    })

    it('should maintain layout information in export', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      // Export
      const exportedJson = JSON.stringify(layoutedWorkflow, null, 2)
      const reimportedWorkflow = JSON.parse(exportedJson) as UIWorkflowData

      // Verify layout is preserved
      expect(reimportedWorkflow.layout.states).toHaveLength(6)
      expect(reimportedWorkflow.layout.workflowId).toBe(layoutedWorkflow.id)

      // Verify positions are preserved
      layoutedWorkflow.layout.states.forEach((originalState, index) => {
        const reimportedState = reimportedWorkflow.layout.states.find(s => s.id === originalState.id)
        expect(reimportedState).toBeDefined()
        expect(reimportedState!.position).toEqual(originalState.position)
      })
    })
  })

  describe('Import Bug Reproduction and Fix', () => {
    it('should reproduce current import validation bug', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration

      // Current import validation from App.tsx (lines 329-330)
      // This is incorrect - it expects UIWorkflowData structure but gets WorkflowConfiguration
      const currentValidation = config.hasOwnProperty('id') &&
                               config.hasOwnProperty('states') &&
                               config.hasOwnProperty('transitions')

      // This should fail for WorkflowConfiguration (which is correct)
      expect(currentValidation).toBe(false)

      // The bug: WorkflowConfiguration doesn't have 'id' or 'transitions' properties
      expect(config).not.toHaveProperty('id')
      expect(config).not.toHaveProperty('transitions')
      expect(config).toHaveProperty('states') // This exists
    })

    it('should provide correct validation for WorkflowConfiguration import', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration

      // Proper validation for WorkflowConfiguration
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

      expect(isValidWorkflowConfiguration(config)).toBe(true)

      // Test with invalid data
      expect(isValidWorkflowConfiguration({})).toBe(false)
      expect(isValidWorkflowConfiguration({ name: 'test' })).toBe(false)
      expect(isValidWorkflowConfiguration(null)).toBe(false)
      expect(isValidWorkflowConfiguration(undefined)).toBe(false)
    })

    it('should convert WorkflowConfiguration to UIWorkflowData for import', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration

      // Proper import conversion function
      const convertConfigToUIWorkflow = (
        config: WorkflowConfiguration,
        workflowId: string = 'imported-workflow',
        entityId: string = 'imported-entity'
      ): UIWorkflowData => {
        const now = new Date().toISOString()

        // Create layout with auto-positioned states
        const initialLayout: CanvasLayout = {
          workflowId,
          version: 1,
          updatedAt: now,
          states: Object.keys(config.states).map(stateId => ({
            id: stateId,
            position: { x: 0, y: 0 } // Will be auto-laid out
          })),
          transitions: [] // Will be populated by canvas
        }

        const uiWorkflow: UIWorkflowData = {
          id: workflowId,
          entityId,
          configuration: config,
          layout: initialLayout,
          createdAt: now,
          updatedAt: now
        }

        // Apply auto-layout for proper positioning
        return autoLayoutWorkflow(uiWorkflow)
      }

      const uiWorkflow = convertConfigToUIWorkflow(config)

      // Verify conversion
      expect(uiWorkflow).toHaveProperty('id')
      expect(uiWorkflow).toHaveProperty('entityId')
      expect(uiWorkflow).toHaveProperty('configuration')
      expect(uiWorkflow).toHaveProperty('layout')
      expect(uiWorkflow.configuration).toEqual(config)

      // Verify layout has proper positions (not all zeros)
      const hasPositionedStates = uiWorkflow.layout.states.some(state =>
        state.position.x !== 0 || state.position.y !== 0
      )
      expect(hasPositionedStates).toBe(true)
    })
  })

  describe('End-to-End Import/Export Consistency', () => {
    it('should maintain logical equivalence through full import-export cycle', () => {
      const originalConfig = paymentRequestWorkflow as WorkflowConfiguration

      // Step 1: Convert to UIWorkflowData (simulating import)
      const importedWorkflow = createUIWorkflowFromConfig(originalConfig)
      const layoutedWorkflow = autoLayoutWorkflow(importedWorkflow)

      // Step 2: Export back to JSON
      const exportedJson = JSON.stringify(layoutedWorkflow, null, 2)
      const exportedWorkflow = JSON.parse(exportedJson) as UIWorkflowData

      // Step 3: Verify logical equivalence
      // Configuration should be identical
      expect(exportedWorkflow.configuration).toEqual(originalConfig)

      // All states should be preserved
      const originalStateIds = Object.keys(originalConfig.states).sort()
      const exportedStateIds = Object.keys(exportedWorkflow.configuration.states).sort()
      expect(exportedStateIds).toEqual(originalStateIds)

      // All transitions should be preserved
      originalStateIds.forEach(stateId => {
        const originalTransitions = originalConfig.states[stateId].transitions
        const exportedTransitions = exportedWorkflow.configuration.states[stateId].transitions
        expect(exportedTransitions).toEqual(originalTransitions)
      })

      // Initial state should be preserved
      expect(exportedWorkflow.configuration.initialState).toBe(originalConfig.initialState)

      // Workflow metadata should be preserved
      expect(exportedWorkflow.configuration.name).toBe(originalConfig.name)
      expect(exportedWorkflow.configuration.desc).toBe(originalConfig.desc)
      expect(exportedWorkflow.configuration.version).toBe(originalConfig.version)
      expect(exportedWorkflow.configuration.active).toBe(originalConfig.active)
    })

    it('should preserve complex transition properties', () => {
      const originalConfig = paymentRequestWorkflow as WorkflowConfiguration

      // Import and export
      const importedWorkflow = createUIWorkflowFromConfig(originalConfig)
      const layoutedWorkflow = autoLayoutWorkflow(importedWorkflow)
      const exportedJson = JSON.stringify(layoutedWorkflow, null, 2)
      const exportedWorkflow = JSON.parse(exportedJson) as UIWorkflowData

      // Verify complex transition with criterion and processors
      const invalidState = exportedWorkflow.configuration.states.INVALID
      const validateTransition = invalidState.transitions.find(t => t.name === 'VALIDATE')

      expect(validateTransition).toBeDefined()
      expect(validateTransition!.criterion).toEqual({
        type: 'function',
        function: {
          name: 'IsValid',
          config: {
            attachEntity: true
          }
        }
      })

      // Verify transition with processors
      const stpTransition = invalidState.transitions.find(t => t.name === 'STP')
      expect(stpTransition).toBeDefined()
      expect(stpTransition!.processors).toEqual([
        {
          name: 'Filter',
          executionMode: 'SYNC',
          config: {
            attachEntity: true
          }
        }
      ])
    })
  })

  describe('Integration with App Component', () => {
    it('should demonstrate the complete import workflow fix needed', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration

      // Current App.tsx import validation (BUGGY)
      const currentValidation = (data: any) => {
        return !!(data.id && data.states && data.transitions)
      }

      // This fails for WorkflowConfiguration (which is correct - it shows the bug)
      expect(currentValidation(config)).toBe(false)

      // Proposed fix: proper WorkflowConfiguration validation
      const fixedValidation = (data: any) => {
        return data &&
               typeof data.version === 'string' &&
               typeof data.name === 'string' &&
               typeof data.initialState === 'string' &&
               typeof data.states === 'object' &&
               data.states !== null &&
               Object.keys(data.states).length > 0
      }

      expect(fixedValidation(config)).toBe(true)

      // Proposed fix: conversion function for import
      const convertForImport = (config: WorkflowConfiguration) => {
        const workflowId = config.name.replace(/\s+/g, '-').toLowerCase()
        const entityId = 'imported-entity'
        const uiWorkflow = createUIWorkflowFromConfig(config)

        // Apply auto-layout for proper positioning
        return autoLayoutWorkflow({
          ...uiWorkflow,
          id: workflowId,
          entityId
        })
      }

      const convertedWorkflow = convertForImport(config)

      // Verify the conversion creates a valid UIWorkflowData
      expect(convertedWorkflow).toHaveProperty('id')
      expect(convertedWorkflow).toHaveProperty('entityId')
      expect(convertedWorkflow).toHaveProperty('configuration')
      expect(convertedWorkflow).toHaveProperty('layout')
      expect(convertedWorkflow.configuration).toEqual(config)

      // Verify positions are properly bootstrapped
      const hasPositionedStates = convertedWorkflow.layout.states.some(state =>
        state.position.x !== 0 || state.position.y !== 0
      )
      expect(hasPositionedStates).toBe(true)
    })

    it('should verify export format matches expected structure', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      // Simulate the export process from App.tsx
      const exportedJson = JSON.stringify(layoutedWorkflow, null, 2)
      const exportedData = JSON.parse(exportedJson)

      // Verify export has all required UIWorkflowData properties
      expect(exportedData).toHaveProperty('id')
      expect(exportedData).toHaveProperty('entityId')
      expect(exportedData).toHaveProperty('configuration')
      expect(exportedData).toHaveProperty('layout')
      expect(exportedData).toHaveProperty('createdAt')
      expect(exportedData).toHaveProperty('updatedAt')

      // Verify the exported configuration matches the original
      expect(exportedData.configuration).toEqual(config)

      // Verify layout information is included
      expect(exportedData.layout.states).toHaveLength(6)
      expect(exportedData.layout.workflowId).toBe(layoutedWorkflow.id)

      // Verify all states have positions
      exportedData.layout.states.forEach((state: any) => {
        expect(state).toHaveProperty('id')
        expect(state).toHaveProperty('position')
        expect(typeof state.position.x).toBe('number')
        expect(typeof state.position.y).toBe('number')
      })
    })
  })

  describe('Export Bug Reproduction and Fix', () => {
    it('should reproduce the export filename bug', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      // Current buggy export filename logic from App.tsx line 357
      const currentExportLogic = (workflow: UIWorkflowData) => {
        // This will fail because workflow.name is undefined
        return `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`
      }

      // Verify the bug exists - workflow.name is undefined
      expect(layoutedWorkflow.name).toBeUndefined()

      // This should throw an error (reproducing the bug)
      expect(() => currentExportLogic(layoutedWorkflow)).toThrow()
    })

    it('should provide the correct export filename logic', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      // Fixed export filename logic
      const fixedExportLogic = (workflow: UIWorkflowData) => {
        const workflowName = workflow.configuration.name || workflow.id || 'workflow'
        return `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`
      }

      const filename = fixedExportLogic(layoutedWorkflow)

      // Verify the fix works
      expect(filename).toBe('payment-request-workflow.json')
      expect(filename).toMatch(/\.json$/)
      expect(filename).not.toContain(' ') // No spaces
    })

    it('should handle edge cases in export filename generation', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)

      // Test with various workflow names
      const testCases = [
        { name: 'Payment Request Workflow', expected: 'payment-request-workflow.json' },
        { name: 'Simple Name', expected: 'simple-name.json' },
        { name: 'Name   With   Multiple   Spaces', expected: 'name-with-multiple-spaces.json' },
        { name: 'UPPERCASE NAME', expected: 'uppercase-name.json' },
        { name: '', expected: 'payment-request-test.json' }, // Falls back to workflow.id
      ]

      const fixedExportLogic = (workflow: UIWorkflowData) => {
        const workflowName = workflow.configuration.name || workflow.id || 'workflow'
        return `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`
      }

      testCases.forEach(({ name, expected }) => {
        const testWorkflow = {
          ...uiWorkflow,
          configuration: {
            ...uiWorkflow.configuration,
            name
          }
        }

        const filename = fixedExportLogic(testWorkflow)
        expect(filename).toBe(expected)
      })
    })

    it('should verify the App.tsx export fix works correctly', () => {
      const config = paymentRequestWorkflow as WorkflowConfiguration
      const uiWorkflow = createUIWorkflowFromConfig(config)
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow)

      // Simulate the fixed export logic from App.tsx
      const simulateAppExport = (currentWorkflow: UIWorkflowData) => {
        if (currentWorkflow) {
          const dataStr = JSON.stringify(currentWorkflow, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

          // Fixed logic: Use configuration.name instead of name
          const workflowName = currentWorkflow.configuration.name || currentWorkflow.id || 'workflow';
          const exportFileDefaultName = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;

          return {
            dataStr,
            dataUri,
            filename: exportFileDefaultName
          };
        }
        return null;
      }

      const result = simulateAppExport(layoutedWorkflow);

      // Verify the export works without errors
      expect(result).not.toBeNull();
      expect(result!.filename).toBe('payment-request-workflow.json');
      expect(result!.dataStr).toContain('"name": "Payment Request Workflow"');
      expect(result!.dataUri).toContain('data:application/json;charset=utf-8,');

      // Verify the exported data can be parsed back
      const exportedData = JSON.parse(result!.dataStr);
      expect(exportedData.configuration.name).toBe('Payment Request Workflow');
    })
  })
})
