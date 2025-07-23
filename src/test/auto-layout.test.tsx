// ABOUTME: Tests for the auto-layout functionality including the layout algorithm,
// button interactions, and integration with the undo/redo system.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import { calculateAutoLayout, applyLayoutToWorkflow, autoLayoutWorkflow, canAutoLayout } from '../utils/autoLayout'
import type { UIWorkflowData, WorkflowConfiguration, WorkflowLayout } from '../types/workflow'

// Mock React Flow components to avoid complexities
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ children, ...props }: any) => (
      <div
        data-testid="react-flow"
        className="react-flow"
        {...props}
      >
        {children}
      </div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="controls">{children}</div>
    ),
    ControlButton: ({ children, onClick, disabled, title }: any) => (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        data-testid="control-button"
      >
        {children}
      </button>
    ),
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children, position }: { children: React.ReactNode; position: string }) => (
      <div data-testid={`panel-${position}`}>{children}</div>
    ),
    useNodesState: () => [[], vi.fn(), vi.fn()],
    useEdgesState: () => [[], vi.fn(), vi.fn()],
    useReactFlow: () => ({
      screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 75, y: pos.y - 25 }))
    }),
    ConnectionMode: { Loose: 'loose' }
  }
})

describe('Auto-Layout Functionality', () => {
  let mockOnWorkflowUpdate: ReturnType<typeof vi.fn>
  let mockOnStateEdit: ReturnType<typeof vi.fn>
  let mockOnTransitionEdit: ReturnType<typeof vi.fn>
  let mockWorkflow: UIWorkflowData

  beforeEach(() => {
    mockOnWorkflowUpdate = vi.fn()
    mockOnStateEdit = vi.fn()
    mockOnTransitionEdit = vi.fn()

    const configuration: WorkflowConfiguration = {
      name: 'Test Workflow',
      initialState: 'state1',
      states: {
        state1: {
          name: 'Initial State',
          transitions: [
            { name: 'To State 2', next: 'state2', manual: false, disabled: false }
          ]
        },
        state2: {
          name: 'Middle State',
          transitions: [
            { name: 'To State 3', next: 'state3', manual: false, disabled: false }
          ]
        },
        state3: {
          name: 'Final State',
          transitions: []
        }
      },
      transitions: [
        { from: 'state1', to: 'state2' },
        { from: 'state2', to: 'state3' }
      ]
    }

    const layout: WorkflowLayout = {
      states: [
        { id: 'state1', position: { x: 100, y: 100 } },
        { id: 'state2', position: { x: 200, y: 200 } },
        { id: 'state3', position: { x: 300, y: 300 } }
      ],
      transitions: [],
      updatedAt: new Date().toISOString()
    }

    mockWorkflow = {
      id: 'test-workflow',
      entityId: 'test-entity',
      configuration,
      layout,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })

  describe('Layout Algorithm', () => {
    it('should calculate layout positions for states', () => {
      const result = calculateAutoLayout(mockWorkflow)
      
      expect(result.states).toHaveLength(3)
      expect(result.states.every(state => 
        typeof state.position.x === 'number' && typeof state.position.y === 'number'
      )).toBe(true)
      
      // Check that all states are included
      const stateIds = result.states.map(s => s.id).sort()
      expect(stateIds).toEqual(['state1', 'state2', 'state3'])
    })

    it('should apply layout to workflow', () => {
      const layoutResult = calculateAutoLayout(mockWorkflow)
      const updatedWorkflow = applyLayoutToWorkflow(mockWorkflow, layoutResult)

      expect(updatedWorkflow.layout.states).toHaveLength(3)
      // Check that updatedAt is a valid ISO string (it gets updated in the function)
      expect(updatedWorkflow.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

      // Verify positions were updated to the calculated layout positions
      layoutResult.states.forEach(({ id, position }) => {
        const layoutState = updatedWorkflow.layout.states.find(s => s.id === id)
        expect(layoutState?.position).toEqual(position)
      })

      // Verify that at least some positions changed from the original
      const originalPositions = mockWorkflow.layout.states.map(s => s.position)
      const newPositions = updatedWorkflow.layout.states.map(s => s.position)
      const hasChanges = newPositions.some((pos, index) =>
        pos.x !== originalPositions[index].x || pos.y !== originalPositions[index].y
      )
      expect(hasChanges).toBe(true)
    })

    it('should handle workflows with custom layout options', () => {
      const options = {
        nodeWidth: 150,
        nodeHeight: 100,
        direction: 'LR' as const
      }
      
      const result = calculateAutoLayout(mockWorkflow, options)
      expect(result.states).toHaveLength(3)
      
      // With LR direction, x positions should generally increase
      const xPositions = result.states.map(s => s.position.x).sort((a, b) => a - b)
      expect(xPositions[0]).toBeLessThan(xPositions[2])
    })
  })

  describe('Validation', () => {
    it('should validate workflow can be auto-laid out', () => {
      expect(canAutoLayout(mockWorkflow)).toBe(true)
    })

    it('should reject null workflow', () => {
      expect(canAutoLayout(null)).toBe(false)
    })

    it('should reject workflow with no states', () => {
      const emptyWorkflow = {
        ...mockWorkflow,
        configuration: {
          ...mockWorkflow.configuration,
          states: {}
        },
        layout: {
          ...mockWorkflow.layout,
          states: []
        }
      }
      
      expect(canAutoLayout(emptyWorkflow)).toBe(false)
    })

    it('should reject workflow with missing layout data', () => {
      const incompleteWorkflow = {
        ...mockWorkflow,
        layout: {
          ...mockWorkflow.layout,
          states: [
            { id: 'state1', position: { x: 100, y: 100 } }
            // Missing state2 and state3 layout data
          ]
        }
      }
      
      expect(canAutoLayout(incompleteWorkflow)).toBe(false)
    })
  })

  describe('Canvas Integration', () => {
    const renderWorkflowCanvas = (workflow: UIWorkflowData = mockWorkflow) => {
      return render(
        <ReactFlowProvider>
          <WorkflowCanvas
            workflow={workflow}
            onWorkflowUpdate={mockOnWorkflowUpdate}
            onStateEdit={mockOnStateEdit}
            onTransitionEdit={mockOnTransitionEdit}
            darkMode={false}
          />
        </ReactFlowProvider>
      )
    }

    it('should render auto-layout button', () => {
      renderWorkflowCanvas()

      const autoLayoutButton = screen.getByTestId('control-button')
      expect(autoLayoutButton).toBeInTheDocument()
      expect(autoLayoutButton).not.toBeDisabled()
    })

    it('should disable auto-layout button for invalid workflows', () => {
      const invalidWorkflow = {
        ...mockWorkflow,
        configuration: { ...mockWorkflow.configuration, states: {} },
        layout: { ...mockWorkflow.layout, states: [] }
      }

      renderWorkflowCanvas(invalidWorkflow)

      const autoLayoutButton = screen.getByTestId('control-button')
      expect(autoLayoutButton).toBeDisabled()
    })

    it('should call onWorkflowUpdate when auto-layout button is clicked', () => {
      renderWorkflowCanvas()

      const autoLayoutButton = screen.getByTestId('control-button')
      fireEvent.click(autoLayoutButton)

      expect(mockOnWorkflowUpdate).toHaveBeenCalledTimes(1)
      expect(mockOnWorkflowUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockWorkflow.id,
          layout: expect.objectContaining({
            states: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                position: expect.objectContaining({
                  x: expect.any(Number),
                  y: expect.any(Number)
                })
              })
            ])
          })
        }),
        'Applied auto-layout'
      )
    })

    it('should immediately update canvas when auto-layout is applied', () => {
      // This test verifies that the canvas updates immediately when auto-layout is applied
      // by checking that the workflow update callback is called with new positions
      renderWorkflowCanvas()

      const autoLayoutButton = screen.getByTestId('control-button')
      fireEvent.click(autoLayoutButton)

      // Verify that onWorkflowUpdate was called with updated positions
      expect(mockOnWorkflowUpdate).toHaveBeenCalledTimes(1)

      const updatedWorkflow = mockOnWorkflowUpdate.mock.calls[0][0]
      const originalPositions = mockWorkflow.layout.states.map(s => s.position)
      const newPositions = updatedWorkflow.layout.states.map((s: any) => s.position)

      // Verify that positions have actually changed (auto-layout applied)
      expect(newPositions).not.toEqual(originalPositions)

      // Verify that updatedAt timestamp was updated
      expect(updatedWorkflow.updatedAt).not.toBe(mockWorkflow.updatedAt)
    })

    it('should include auto-layout instruction in Quick Help panel', () => {
      renderWorkflowCanvas()

      expect(screen.getByText(/Use layout button to auto-arrange states/)).toBeInTheDocument()
    })
  })

  describe('Convenience Functions', () => {
    it('should auto-layout workflow in one step', () => {
      const result = autoLayoutWorkflow(mockWorkflow)

      expect(result.layout.states).toHaveLength(3)
      // Check that updatedAt is a valid ISO string (it gets updated in the function)
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      // Check that layout.updatedAt is also updated
      expect(result.layout.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

      // Verify all states have new positions
      result.layout.states.forEach(state => {
        expect(typeof state.position.x).toBe('number')
        expect(typeof state.position.y).toBe('number')
      })
    })
  })
})
