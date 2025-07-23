// ABOUTME: Test to verify that the infinite loop issue is fixed
// by ensuring the component doesn't cause "Maximum update depth exceeded" errors.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas'
import { ReactFlowProvider } from '@xyflow/react'
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

describe('Infinite Loop Fix', () => {
  const mockWorkflow: UIWorkflowData = {
    id: 'test-workflow',
    entityId: 'test-entity',
    configuration: {
      version: '1.0',
      name: 'Test Workflow',
      initialState: 'start',
      states: {
        'start': {
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
      updatedAt: new Date().toISOString(),
      states: [
        { id: 'start', position: { x: 100, y: 100 } },
        { id: 'end', position: { x: 300, y: 100 } }
      ],
      transitions: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  it('should render without infinite loop errors', () => {
    // Spy on console.error to catch "Maximum update depth exceeded" errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={mockWorkflow}
          onWorkflowUpdate={vi.fn()}
          onStateEdit={vi.fn()}
          onTransitionEdit={vi.fn()}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Verify the component renders
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()

    // Check for infinite loop errors
    const infiniteLoopErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && (
          arg.includes('Maximum update depth exceeded') ||
          arg.includes('infinite loop') ||
          arg.includes('nested updates')
        )
      )
    )
    
    if (infiniteLoopErrors.length > 0) {
      console.log('Infinite loop errors found:')
      infiniteLoopErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error)
      })
    }
    
    expect(infiniteLoopErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  it('should handle workflow updates without causing infinite loops', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockOnWorkflowUpdate = vi.fn()

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

    // Update the workflow with new positions (simulating auto-layout)
    const updatedWorkflow = {
      ...mockWorkflow,
      layout: {
        ...mockWorkflow.layout,
        updatedAt: new Date().toISOString(),
        states: [
          { id: 'start', position: { x: 150, y: 150 } },
          { id: 'end', position: { x: 350, y: 150 } }
        ]
      },
      updatedAt: new Date().toISOString()
    }

    // Re-render with updated workflow
    rerender(
      <ReactFlowProvider>
        <WorkflowCanvas
          workflow={updatedWorkflow}
          onWorkflowUpdate={mockOnWorkflowUpdate}
          onStateEdit={vi.fn()}
          onTransitionEdit={vi.fn()}
          darkMode={false}
        />
      </ReactFlowProvider>
    )

    // Verify no infinite loop errors occurred during the update
    const infiniteLoopErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && (
          arg.includes('Maximum update depth exceeded') ||
          arg.includes('infinite loop') ||
          arg.includes('nested updates')
        )
      )
    )
    
    expect(infiniteLoopErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })
})
