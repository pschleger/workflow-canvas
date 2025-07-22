import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import type { UIWorkflowData, WorkflowConfiguration, CanvasLayout } from '../types/workflow'

// Mock React Flow components to avoid complexities
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ onPaneClick, children, ...props }: any) => (
      <div
        data-testid="react-flow-pane"
        className="react-flow"
        onClick={onPaneClick}
        {...props}
      >
        {children}
      </div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
    useNodesState: () => [[], vi.fn(), vi.fn()],
    useEdgesState: () => [[], vi.fn(), vi.fn()],
    useReactFlow: () => ({
      screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 75, y: pos.y - 25 })) // Mock transform
    }),
    ConnectionMode: { Loose: 'loose' }
  }
})

describe('Canvas Double-Click to Add State', () => {
  let mockOnWorkflowUpdate: ReturnType<typeof vi.fn>
  let mockOnStateEdit: ReturnType<typeof vi.fn>
  let mockOnTransitionEdit: ReturnType<typeof vi.fn>
  let mockWorkflow: UIWorkflowData

  beforeEach(() => {
    mockOnWorkflowUpdate = vi.fn()
    mockOnStateEdit = vi.fn()
    mockOnTransitionEdit = vi.fn()

    const configuration: WorkflowConfiguration = {
      version: '1.0',
      name: 'Test Workflow',
      desc: 'Test workflow for double-click functionality',
      initialState: 'initial',
      active: true,
      states: {
        'initial': {
          transitions: [
            {
              name: 'Go to Final',
              next: 'final',
              manual: false,
              disabled: false
            }
          ]
        },
        'final': {
          transitions: []
        }
      }
    }

    const layout: CanvasLayout = {
      workflowId: 'test-workflow',
      version: 1,
      updatedAt: new Date().toISOString(),
      states: [
        {
          id: 'initial',
          position: { x: 100, y: 100 },
          properties: {}
        },
        {
          id: 'final',
          position: { x: 300, y: 100 },
          properties: {}
        }
      ],
      transitions: []
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

  it('should render workflow canvas with existing states', () => {
    renderWorkflowCanvas()
    
    expect(screen.getByTestId('react-flow-pane')).toBeInTheDocument()
    expect(screen.getByText('Test Workflow')).toBeInTheDocument()
    expect(screen.getByText('2 states')).toBeInTheDocument()
    expect(screen.getByText('1 transitions')).toBeInTheDocument()
  })

  it('should add new state when double-clicking on canvas', () => {
    renderWorkflowCanvas()

    const reactFlowPane = screen.getByTestId('react-flow-pane')

    // Mock getBoundingClientRect for the react-flow element
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: vi.fn()
    }))

    reactFlowPane.getBoundingClientRect = mockGetBoundingClientRect

    // Simulate double-click by clicking twice quickly at the same position
    fireEvent.click(reactFlowPane, {
      clientX: 200,
      clientY: 150
    })

    // Second click within 500ms at same position should trigger double-click
    fireEvent.click(reactFlowPane, {
      clientX: 200,
      clientY: 150
    })
    
    // Should call onWorkflowUpdate with new state
    expect(mockOnWorkflowUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: expect.objectContaining({
          states: expect.objectContaining({
            'initial': expect.any(Object),
            'final': expect.any(Object),
            'new-state': expect.objectContaining({
              transitions: []
            })
          })
        }),
        layout: expect.objectContaining({
          states: expect.arrayContaining([
            expect.objectContaining({
              id: 'new-state',
              position: { x: 50, y: 100 }, // 200 - 75 - 75 = 50, 150 - 25 - 25 = 100
              properties: {}
            })
          ])
        })
      })
    )
  })

  it('should generate unique state IDs when adding multiple states', () => {
    // Add a workflow that already has 'new-state'
    const workflowWithNewState = {
      ...mockWorkflow,
      configuration: {
        ...mockWorkflow.configuration,
        states: {
          ...mockWorkflow.configuration.states,
          'new-state': { transitions: [] }
        }
      }
    }
    
    renderWorkflowCanvas(workflowWithNewState)
    
    const reactFlowPane = screen.getByTestId('react-flow-pane')
    reactFlowPane.getBoundingClientRect = vi.fn(() => ({
      left: 0, top: 0, right: 800, bottom: 600,
      width: 800, height: 600, x: 0, y: 0, toJSON: vi.fn()
    }))
    
    // Simulate double-click by clicking twice quickly at the same position
    fireEvent.click(reactFlowPane, {
      clientX: 200,
      clientY: 150
    })

    // Second click within 500ms at same position should trigger double-click
    fireEvent.click(reactFlowPane, {
      clientX: 200,
      clientY: 150
    })
    
    // Should create 'new-state-1' since 'new-state' already exists
    expect(mockOnWorkflowUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: expect.objectContaining({
          states: expect.objectContaining({
            'new-state-1': expect.objectContaining({
              transitions: []
            })
          })
        })
      })
    )
  })

  it('should not add state when workflow is null', () => {
    renderWorkflowCanvas(null as any)

    // When workflow is null, the component shows "No Workflow Selected" message
    // and doesn't render the ReactFlow component, so there's no pane to click
    expect(screen.getByText('No Workflow Selected')).toBeInTheDocument()
    expect(mockOnWorkflowUpdate).not.toHaveBeenCalled()
  })
})
