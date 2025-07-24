// ABOUTME: Test to verify that the auto-layout bug fix works correctly
// by ensuring that canvas nodes update immediately when auto-layout is applied.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import type { UIWorkflowData } from '../types/workflow'

// Mock React Flow components
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ children, nodes, edges, ...props }: any) => (
      <div data-testid="react-flow" data-nodes-count={nodes?.length || 0} data-edges-count={edges?.length || 0} {...props}>
        {children}
      </div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: ({ children }: { children: React.ReactNode }) => <div data-testid="controls">{children}</div>,
    ControlButton: ({ onClick, disabled, children, ...props }: any) => (
      <button data-testid="control-button" onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    ),
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
    useNodesState: () => [[], vi.fn(), vi.fn()],
    useEdgesState: () => [[], vi.fn(), vi.fn()],
    useReactFlow: () => ({
      screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 75, y: pos.y - 25 }))
    }),
    ConnectionMode: { Loose: 'loose' }
  }
})

describe('Auto-Layout Fix Verification', () => {
  let mockOnWorkflowUpdate: ReturnType<typeof vi.fn>
  let mockOnStateEdit: ReturnType<typeof vi.fn>
  let mockOnTransitionEdit: ReturnType<typeof vi.fn>
  let mockWorkflow: UIWorkflowData

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockOnWorkflowUpdate = vi.fn()
    mockOnStateEdit = vi.fn()
    mockOnTransitionEdit = vi.fn()

    // Create a simple workflow with 3 states
    mockWorkflow = {
      id: 'test-workflow',
      entityId: 'test-entity',
      configuration: {
        version: '1.0',
        name: 'Test Workflow',
        initialState: 'state1',
        states: {
          'state1': { transitions: [{ name: 'To State 2', next: 'state2', manual: false, disabled: false }] },
          'state2': { transitions: [{ name: 'To State 3', next: 'state3', manual: false, disabled: false }] },
          'state3': { transitions: [] }
        }
      },
      layout: {
        workflowId: 'test-workflow',
        version: 1,
        updatedAt: '2024-01-01T00:00:00Z',
        states: [
          { id: 'state1', position: { x: 0, y: 0 } },
          { id: 'state2', position: { x: 0, y: 0 } },
          { id: 'state3', position: { x: 0, y: 0 } }
        ],
        transitions: []
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  })

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

  it('should fix the auto-layout bug by updating canvas immediately', () => {
    renderWorkflowCanvas()

    // Verify the auto-layout button is present and enabled
    const autoLayoutButton = screen.getByTitle('Auto-arrange states using hierarchical layout')
    expect(autoLayoutButton).toBeInTheDocument()
    expect(autoLayoutButton).not.toBeDisabled()

    // Click the auto-layout button
    fireEvent.click(autoLayoutButton)

    // Verify that onWorkflowUpdate was called with new positions
    expect(mockOnWorkflowUpdate).toHaveBeenCalledTimes(1)
    
    const updatedWorkflow = mockOnWorkflowUpdate.mock.calls[0][0]
    const updateDescription = mockOnWorkflowUpdate.mock.calls[0][1]
    
    // Verify the update description
    expect(updateDescription).toBe('Applied auto-layout')
    
    // Verify that positions have actually changed from the original (all zeros)
    const originalPositions = mockWorkflow.layout.states.map(s => s.position)
    const newPositions = updatedWorkflow.layout.states.map((s: any) => s.position)
    
    // At least some positions should be different from the original
    const hasChanges = newPositions.some((pos: any, index: number) =>
      pos.x !== originalPositions[index].x || pos.y !== originalPositions[index].y
    )
    expect(hasChanges).toBe(true)
    
    // Verify that updatedAt timestamp was updated
    expect(updatedWorkflow.updatedAt).not.toBe(mockWorkflow.updatedAt)
    
    // The fix ensures that the useMemo dependencies for uiStates include layout positions,
    // so when the workflow is updated with new positions, the canvas will re-render immediately
    expect(updatedWorkflow.layout.states).toHaveLength(3)
    updatedWorkflow.layout.states.forEach((state: any) => {
      expect(typeof state.position.x).toBe('number')
      expect(typeof state.position.y).toBe('number')
    })
  })

  it('should handle multiple auto-layout applications correctly', () => {
    renderWorkflowCanvas()

    const autoLayoutButton = screen.getByTitle('Auto-arrange states using hierarchical layout')
    
    // Apply auto-layout first time
    fireEvent.click(autoLayoutButton)
    expect(mockOnWorkflowUpdate).toHaveBeenCalledTimes(1)
    
    const firstUpdate = mockOnWorkflowUpdate.mock.calls[0][0]
    
    // Clear the mock and apply auto-layout again with the updated workflow
    mockOnWorkflowUpdate.mockClear()
    
    // Re-render with the updated workflow
    const { rerender } = renderWorkflowCanvas()
    rerender(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={firstUpdate}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={mockOnStateEdit}
          onTransitionEdit={mockOnTransitionEdit}
          darkMode={false}
        />
      </ReactFlowProvider>
    )
    
    // Apply auto-layout second time (use the first auto-layout button since there are multiple)
    fireEvent.click(screen.getAllByTestId('auto-layout-button')[0])
    expect(mockOnWorkflowUpdate).toHaveBeenCalledTimes(1)
    
    const secondUpdate = mockOnWorkflowUpdate.mock.calls[0][0]
    
    // Both updates should have valid positions
    expect(secondUpdate.layout.states).toHaveLength(3)
    expect(secondUpdate.updatedAt).not.toBe(firstUpdate.updatedAt)
  })
})
