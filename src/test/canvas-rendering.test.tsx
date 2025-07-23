import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import type { UIWorkflowData, WorkflowConfiguration, CanvasLayout } from '../types/workflow'

// ABOUTME: This file tests that the WorkflowCanvas renders properly without errors
// when loading valid workflow configurations, specifically testing the fix for
// the validateTransitionStates error.

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
    Controls: () => <div data-testid="controls" />,
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

describe('Canvas Rendering Tests', () => {
  let mockOnWorkflowUpdate: ReturnType<typeof vi.fn>
  let mockOnStateEdit: ReturnType<typeof vi.fn>
  let mockOnTransitionEdit: ReturnType<typeof vi.fn>
  let mockWorkflow: UIWorkflowData

  beforeEach(() => {
    mockOnWorkflowUpdate = vi.fn()
    mockOnStateEdit = vi.fn()
    mockOnTransitionEdit = vi.fn()

    // Create a valid workflow configuration
    const configuration: WorkflowConfiguration = {
      name: 'Test Workflow',
      desc: 'Test workflow for rendering',
      version: '1.0',
      active: true,
      initialState: 'start',
      states: {
        start: {
          name: 'Start State',
          transitions: [
            { name: 'Go to End', next: 'end', manual: false, disabled: false }
          ]
        },
        end: {
          name: 'End State',
          transitions: []
        }
      }
    }

    const layout: CanvasLayout = {
      workflowId: 'test-workflow',
      version: 1,
      updatedAt: new Date().toISOString(),
      states: [
        { id: 'start', position: { x: 100, y: 100 }, properties: {} },
        { id: 'end', position: { x: 300, y: 100 }, properties: {} }
      ],
      transitions: [
        { id: 'start-to-end', properties: {} }
      ]
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

  const renderWorkflowCanvas = (workflow: UIWorkflowData | null = mockWorkflow) => {
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

  it('should render workflow canvas without validateTransitionStates errors', () => {
    // Mock console.error to catch any errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWorkflowCanvas()

    // Verify the canvas renders
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    expect(screen.getByText('Test Workflow')).toBeInTheDocument()

    // Verify no validateTransitionStates errors were logged
    const validateTransitionErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.includes('validateTransitionStates')
      )
    )
    expect(validateTransitionErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  it('should handle workflow with layout transitions correctly', () => {
    // Create a workflow with layout transitions that might cause issues
    const workflowWithLayoutTransitions = {
      ...mockWorkflow,
      layout: {
        ...mockWorkflow.layout,
        transitions: [
          { id: 'start-to-end', properties: {} },
          { id: 'invalid-to-nonexistent', properties: {} }, // This should be filtered out
          { id: 'start-0', properties: {} } // Canonical format
        ]
      }
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWorkflowCanvas(workflowWithLayoutTransitions)

    // Verify the canvas renders without errors
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()

    // Verify no errors were logged during cleanup
    const cleanupErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.includes('Error cleaning up workflow state')
      )
    )
    expect(cleanupErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  it('should render empty state when workflow is null', () => {
    renderWorkflowCanvas(null)

    expect(screen.getByText('No Workflow Selected')).toBeInTheDocument()
    expect(screen.queryByTestId('react-flow')).not.toBeInTheDocument()
  })

  it('should handle workflow with missing layout gracefully', () => {
    const workflowWithoutLayout = {
      ...mockWorkflow,
      layout: {
        workflowId: 'test-workflow',
        version: 1,
        updatedAt: new Date().toISOString(),
        states: [],
        transitions: []
      }
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWorkflowCanvas(workflowWithoutLayout)

    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    expect(screen.getByText('Test Workflow')).toBeInTheDocument()

    // Should not have any cleanup errors
    const cleanupErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.includes('Error cleaning up workflow state')
      )
    )
    expect(cleanupErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })
})
