// ABOUTME: Test to verify that auto-layout immediately updates the canvas
// by checking that setNodes is called immediately after the button click.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import type { UIWorkflowData } from '../types/workflow'

// Mock React Flow components with setNodes tracking
let mockSetNodes: ReturnType<typeof vi.fn>
let mockSetEdges: ReturnType<typeof vi.fn>

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
    useNodesState: () => {
      mockSetNodes = vi.fn()
      mockSetEdges = vi.fn()
      return [[], mockSetNodes, vi.fn()]
    },
    useEdgesState: () => [[], mockSetEdges, vi.fn()],
    useReactFlow: () => ({
      screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 75, y: pos.y - 25 }))
    }),
    ConnectionMode: { Loose: 'loose' }
  }
})

describe('Auto-Layout Immediate Update', () => {
  let mockOnWorkflowUpdate: ReturnType<typeof vi.fn>
  let mockOnStateEdit: ReturnType<typeof vi.fn>
  let mockOnTransitionEdit: ReturnType<typeof vi.fn>
  let mockWorkflow: UIWorkflowData

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockOnWorkflowUpdate = vi.fn()
    mockOnStateEdit = vi.fn()
    mockOnTransitionEdit = vi.fn()

    // Create a simple workflow with 3 states at the same position (to ensure layout changes them)
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

  it('should immediately call setNodes when auto-layout button is clicked', async () => {
    renderWorkflowCanvas()

    // Clear any initial setNodes calls
    mockSetNodes.mockClear()

    const autoLayoutButton = screen.getByTestId('control-button')
    
    // Click the auto-layout button
    await act(async () => {
      fireEvent.click(autoLayoutButton)
      
      // Wait for the setTimeout in handleAutoLayout to execute
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    // Verify that onWorkflowUpdate was called
    expect(mockOnWorkflowUpdate).toHaveBeenCalledTimes(1)
    
    // The key test: setNodes should have been called immediately due to the setTimeout force update
    expect(mockSetNodes).toHaveBeenCalled()
    
    // Verify that the nodes have different positions (auto-layout applied)
    const setNodesCall = mockSetNodes.mock.calls[mockSetNodes.mock.calls.length - 1]
    const newNodes = setNodesCall[0]
    
    expect(newNodes).toHaveLength(3)
    
    // Check that at least some nodes have non-zero positions (layout was applied)
    const hasNonZeroPositions = newNodes.some((node: any) => 
      node.position.x !== 0 || node.position.y !== 0
    )
    expect(hasNonZeroPositions).toBe(true)
  })
})
