// ABOUTME: Test to verify that auto-layout immediately updates the canvas
// by ensuring the layout.updatedAt timestamp is properly updated to trigger useEffect.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import { autoLayoutWorkflow } from '../utils/autoLayout'
import type { UIWorkflowData } from '../types/workflow'

// Mock React Flow components
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ children, nodes, edges, ...props }: any) => (
      <div
        data-testid="react-flow"
        data-nodes-count={nodes?.length || 0}
        data-edges-count={edges?.length || 0}
        {...props}
      >
        {children}
        <div data-testid="nodes-debug">
          {nodes?.map((node: any) => (
            <div key={node.id} data-testid={`node-${node.id}`} data-position={`${node.position.x},${node.position.y}`}>
              {node.id}: ({node.position.x}, {node.position.y})
            </div>
          ))}
        </div>
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

describe('Auto-Layout Immediate Fix', () => {
  let mockOnWorkflowUpdate: ReturnType<typeof vi.fn>
  let mockWorkflow: UIWorkflowData

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockOnWorkflowUpdate = vi.fn()

    // Create a workflow with states at the same position (to ensure layout changes them)
    mockWorkflow = {
      id: 'test-workflow',
      entityId: 'test-entity',
      configuration: {
        version: '1.0',
        name: 'Test Workflow',
        initialState: 'start',
        states: {
          'start': {
            transitions: [
              { name: 'To Middle', next: 'middle', manual: false, disabled: false }
            ]
          },
          'middle': {
            transitions: [
              { name: 'To End', next: 'end', manual: false, disabled: false }
            ]
          },
          'end': {
            transitions: []
          }
        }
      },
      layout: {
        workflowId: 'test-workflow',
        version: 1,
        updatedAt: '2024-01-01T00:00:00.000Z',
        states: [
          { id: 'start', position: { x: 0, y: 0 } },
          { id: 'middle', position: { x: 0, y: 0 } },
          { id: 'end', position: { x: 0, y: 0 } }
        ],
        transitions: []
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  })

  it('should verify that autoLayoutWorkflow updates layout.updatedAt', () => {
    // Test the utility function directly
    const layoutedWorkflow = autoLayoutWorkflow(mockWorkflow)
    
    // Verify that layout.updatedAt was updated
    expect(layoutedWorkflow.layout.updatedAt).not.toBe(mockWorkflow.layout.updatedAt)
    expect(layoutedWorkflow.layout.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    
    // Verify that positions changed
    const originalPositions = mockWorkflow.layout.states.map(s => s.position)
    const newPositions = layoutedWorkflow.layout.states.map(s => s.position)
    
    const hasChanges = newPositions.some((pos, index) =>
      pos.x !== originalPositions[index].x || pos.y !== originalPositions[index].y
    )
    expect(hasChanges).toBe(true)
  })

  it('should trigger useEffect when layout.updatedAt changes', () => {
    const { rerender } = render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={vi.fn()}
          onTransitionEdit={vi.fn()}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Get initial node positions
    const initialNodes = screen.getAllByTestId(/^node-/)
    expect(initialNodes).toHaveLength(3)
    
    // All nodes should initially be at (0, 0)
    initialNodes.forEach(node => {
      expect(node.getAttribute('data-position')).toBe('0,0')
    })

    // Create an updated workflow with new layout.updatedAt (simulating auto-layout)
    const layoutedWorkflow = autoLayoutWorkflow(mockWorkflow)
    
    // Re-render with the updated workflow
    rerender(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={layoutedWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={vi.fn()}
          onTransitionEdit={vi.fn()}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Verify that nodes now have different positions
    const updatedNodes = screen.getAllByTestId(/^node-/)
    expect(updatedNodes).toHaveLength(3)
    
    // At least some nodes should have moved from (0, 0)
    const hasMovedNodes = updatedNodes.some(node => 
      node.getAttribute('data-position') !== '0,0'
    )
    expect(hasMovedNodes).toBe(true)
  })

  it('should update canvas immediately when auto-layout button is clicked', () => {
    // Mock the onWorkflowUpdate to simulate the workflow being updated
    mockOnWorkflowUpdate.mockImplementation((updatedWorkflow) => {
      // This simulates what happens in the real app - the parent component
      // receives the updated workflow and passes it back down as a prop
      // For this test, we'll verify that the update was called with correct data
    })

    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={vi.fn()}
          onTransitionEdit={vi.fn()}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Click the auto-layout button
    const autoLayoutButton = screen.getByTestId('control-button')
    fireEvent.click(autoLayoutButton)

    // Verify that onWorkflowUpdate was called
    expect(mockOnWorkflowUpdate).toHaveBeenCalledTimes(1)
    
    const updatedWorkflow = mockOnWorkflowUpdate.mock.calls[0][0]
    const updateDescription = mockOnWorkflowUpdate.mock.calls[0][1]
    
    // Verify the update description
    expect(updateDescription).toBe('Applied auto-layout')
    
    // Verify that layout.updatedAt was updated (this is the key fix)
    expect(updatedWorkflow.layout.updatedAt).not.toBe(mockWorkflow.layout.updatedAt)
    expect(updatedWorkflow.layout.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    
    // Verify that positions changed
    const originalPositions = mockWorkflow.layout.states.map(s => s.position)
    const newPositions = updatedWorkflow.layout.states.map((s: any) => s.position)
    
    const hasChanges = newPositions.some((pos: any, index: number) =>
      pos.x !== originalPositions[index].x || pos.y !== originalPositions[index].y
    )
    expect(hasChanges).toBe(true)
  })
})
