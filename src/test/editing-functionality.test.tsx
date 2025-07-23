import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import { StateNode } from '../components/Canvas/StateNode'
import { TransitionEdge } from '../components/Canvas/TransitionEdge'
import type { UIWorkflowData, UIStateData, UITransitionData } from '../types/workflow'

// ABOUTME: This file tests the editing functionality for states and transitions,
// including double-click editing, edit buttons, and state name support.

// Mock React Flow components
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ children, onPaneClick, nodeTypes, edgeTypes, nodes, edges }: any) => (
      <div data-testid="react-flow" onClick={onPaneClick}>
        {children}
        <div data-testid="react-flow-pane" onClick={onPaneClick}>
          {nodes?.map((node: any) => {
            const NodeComponent = nodeTypes[node.type]
            return NodeComponent ? (
              <NodeComponent key={node.id} {...node} />
            ) : (
              <div key={node.id} data-testid={`node-${node.id}`}>
                {node.data.label}
              </div>
            )
          })}
          {edges?.map((edge: any) => {
            const EdgeComponent = edgeTypes[edge.type]
            return EdgeComponent ? (
              <EdgeComponent key={edge.id} {...edge} />
            ) : (
              <div key={edge.id} data-testid={`edge-${edge.id}`}>
                {edge.data?.transition?.definition?.name || 'Transition'}
              </div>
            )
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

describe('Editing Functionality Tests', () => {
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
      description: 'Test workflow for editing',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      configuration: {
        version: '1.0',
        initialState: 'initial',
        states: {
          'initial': { 
            name: 'Initial State',
            transitions: [{ name: 'Go to Final', next: 'final', manual: false, disabled: false }] 
          },
          'final': { 
            name: 'Final State',
            transitions: [] 
          }
        }
      },
      layout: {
        states: [
          { id: 'initial', position: { x: 100, y: 100 }, properties: {} },
          { id: 'final', position: { x: 300, y: 100 }, properties: {} }
        ],
        transitions: [
          { id: 'initial-0' }
        ],
        updatedAt: '2024-01-01T00:00:00Z'
      }
    }
  })

  describe('State Node Editing', () => {
    it('should call onStateEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      
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

      // Find and click the edit button for the initial state
      const editButton = screen.getByTitle('Edit state')
      await user.click(editButton)

      expect(mockOnStateEdit).toHaveBeenCalledWith('initial')
    })

    it('should call onStateEdit when state node is double-clicked', async () => {
      const user = userEvent.setup()
      
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

      // Find the state node and double-click it
      const stateNode = screen.getByText('Initial State').closest('div')
      expect(stateNode).toBeInTheDocument()
      
      await user.dblClick(stateNode!)

      expect(mockOnStateEdit).toHaveBeenCalledWith('initial')
    })

    it('should display state name from definition when available', () => {
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

      // Should display the custom name from the state definition
      expect(screen.getByText('Initial State')).toBeInTheDocument()
      expect(screen.getByText('Final State')).toBeInTheDocument()
    })

    it('should fall back to state ID when no name is defined', () => {
      const workflowWithoutNames = {
        ...mockWorkflow,
        configuration: {
          ...mockWorkflow.configuration,
          states: {
            'initial': { transitions: [] },
            'final': { transitions: [] }
          }
        }
      }

      render(
        <ReactFlowProvider>
          <WorkflowCanvas
            workflow={workflowWithoutNames}
            onWorkflowUpdate={mockOnWorkflowUpdate}
            onStateEdit={mockOnStateEdit}
            onTransitionEdit={mockOnTransitionEdit}
            darkMode={false}
          />
        </ReactFlowProvider>
      )

      // Should display the state IDs as fallback names
      expect(screen.getByText('initial')).toBeInTheDocument()
      expect(screen.getByText('final')).toBeInTheDocument()
    })
  })

  describe('Transition Editing', () => {
    it('should call onTransitionEdit when transition is double-clicked', async () => {
      const user = userEvent.setup()
      
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
      const transitionLabel = screen.getByText('Go to Final')
      await user.dblClick(transitionLabel)

      expect(mockOnTransitionEdit).toHaveBeenCalledWith('initial-0')
    })

    it('should display transition name from definition', () => {
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

      // Should display the transition name
      expect(screen.getByText('Go to Final')).toBeInTheDocument()
    })
  })
})
