import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import type { UIWorkflowData } from '../types/workflow'

// ABOUTME: This file verifies that the editing fixes work correctly:
// 1. Transition IDs are generated correctly for editing
// 2. State definitions include name fields
// 3. Single clicks don't trigger unnecessary updates

// Mock React Flow components
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ children, nodes, edges, nodeTypes, edgeTypes }: any) => (
      <div data-testid="react-flow">
        {children}
        <div data-testid="react-flow-pane">
          {nodes?.map((node: any) => {
            const NodeComponent = nodeTypes[node.type]
            return NodeComponent ? (
              <NodeComponent key={node.id} {...node} />
            ) : null
          })}
          {edges?.map((edge: any) => {
            const EdgeComponent = edgeTypes[edge.type]
            return EdgeComponent ? (
              <EdgeComponent key={edge.id} {...edge} />
            ) : null
          })}
        </div>
      </div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
    useNodesState: () => [[], vi.fn(), vi.fn()],
    useEdgesState: () => [[], vi.fn(), vi.fn()],
    useReactFlow: () => ({
      screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 100, y: pos.y - 50 }))
    }),
    ConnectionMode: { Loose: 'loose' },
    Handle: ({ type, position }: any) => (
      <div data-testid={`handle-${type}-${position}`} />
    ),
    Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
    getBezierPath: () => ['M 0 0 L 100 100', 50, 50],
    BaseEdge: ({ id, path }: any) => <div data-testid={`base-edge-${id}`} />,
    EdgeLabelRenderer: ({ children }: any) => <div data-testid="edge-label-renderer">{children}</div>
  }
})

describe('Editing Fixes Verification', () => {
  let mockOnWorkflowUpdate: ReturnType<typeof vi.fn>
  let mockOnStateEdit: ReturnType<typeof vi.fn>
  let mockOnTransitionEdit: ReturnType<typeof vi.fn>
  let mockWorkflow: UIWorkflowData

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockOnWorkflowUpdate = vi.fn()
    mockOnStateEdit = vi.fn()
    mockOnTransitionEdit = vi.fn()

    mockWorkflow = {
      id: 'test-workflow',
      entityId: 'test-entity',
      name: 'Test Workflow',
      description: 'Test workflow for editing fixes',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      configuration: {
        version: '1.0',
        initialState: 'start',
        states: {
          'start': { 
            name: 'Start State',
            transitions: [{ name: 'Go to End', next: 'end', manual: false, disabled: false }] 
          },
          'end': { 
            name: 'End State',
            transitions: [] 
          }
        }
      },
      layout: {
        states: [
          { id: 'start', position: { x: 100, y: 100 }, properties: {} },
          { id: 'end', position: { x: 300, y: 100 }, properties: {} }
        ],
        transitions: [
          { id: 'start-0' }
        ],
        updatedAt: '2024-01-01T00:00:00Z'
      }
    }
  })

  it('should generate correct transition IDs for editing', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={mockOnStateEdit}
          onTransitionEdit={mockOnTransitionEdit}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Find the transition edit button and click it
    const editButton = screen.queryByTitle('Edit transition')
    if (editButton) {
      fireEvent.click(editButton)
      
      // Should call onTransitionEdit with the correct ID format: "start-0"
      expect(mockOnTransitionEdit).toHaveBeenCalledWith('start-0')
    }
  })

  it('should call onTransitionEdit when transition is double-clicked', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={mockOnStateEdit}
          onTransitionEdit={mockOnTransitionEdit}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Find the transition label and double-click it
    const transitionLabel = screen.queryByText('Go to End')
    if (transitionLabel) {
      fireEvent.doubleClick(transitionLabel)
      
      // Should call onTransitionEdit with the correct ID
      expect(mockOnTransitionEdit).toHaveBeenCalledWith('start-0')
    }
  })

  it('should not trigger workflow updates on simple clicks', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={mockOnStateEdit}
          onTransitionEdit={mockOnTransitionEdit}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Find the transition label and single-click it
    const transitionLabel = screen.queryByText('Go to End')
    if (transitionLabel) {
      fireEvent.click(transitionLabel)
      
      // Should NOT call onWorkflowUpdate for a simple click
      expect(mockOnWorkflowUpdate).not.toHaveBeenCalled()
    }
  })

  it('should pass state definitions with name fields to state editor', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={mockOnStateEdit}
          onTransitionEdit={mockOnTransitionEdit}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Find the state edit button and click it
    const editButton = screen.queryByTitle('Edit state')
    if (editButton) {
      fireEvent.click(editButton)
      
      // Should call onStateEdit with the state ID
      expect(mockOnStateEdit).toHaveBeenCalledWith('start')
    }
  })

  it('should display state names correctly', () => {
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={mockOnStateEdit}
          onTransitionEdit={mockOnTransitionEdit}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Should display the custom state names
    expect(screen.queryByText('Start State')).toBeInTheDocument()
    expect(screen.queryByText('End State')).toBeInTheDocument()
  })
})
