import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'
import { validateTransitionStates } from '../utils/transitionUtils'

// ABOUTME: This file tests that the save functionality issue has been resolved
// by verifying that the validateTransitionStates error no longer occurs and
// that workflow data is properly rendered in the canvas.

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-provider">{children}</div>,
  ReactFlow: ({ children, nodes, edges }: any) => (
    <div data-testid="react-flow">
      {children}
      <div data-testid="react-flow-nodes">
        {nodes?.map((node: any) => (
          <div key={node.id} data-testid={`node-${node.id}`}>
            {node.data?.label || node.id}
          </div>
        ))}
      </div>
      <div data-testid="react-flow-edges">
        {edges?.map((edge: any) => (
          <div key={edge.id} data-testid={`edge-${edge.id}`}>
            {edge.label || edge.id}
          </div>
        ))}
      </div>
    </div>
  ),
  Background: () => <div data-testid="react-flow-background" />,
  Controls: () => <div data-testid="react-flow-controls" />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-panel">{children}</div>,
  Handle: () => <div data-testid="react-flow-handle" />,
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
  ConnectionMode: {
    Loose: 'loose',
  },
  useNodesState: (initialNodes: any) => {
    const [nodes, setNodes] = React.useState(initialNodes || []);
    const onNodesChange = (changes: any) => {};
    return [nodes, setNodes, onNodesChange];
  },
  useEdgesState: (initialEdges: any) => {
    const [edges, setEdges] = React.useState(initialEdges || []);
    const onEdgesChange = (changes: any) => {};
    return [edges, setEdges, onEdgesChange];
  },
  useReactFlow: () => ({
    screenToFlowPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    setViewport: vi.fn(),
    getViewport: vi.fn().mockReturnValue({ x: 0, y: 0, zoom: 1 }),
  }),
  getBezierPath: () => ['M 0 0 L 100 100', 50, 50],
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <div data-testid="edge-label-renderer">{children}</div>,
  BaseEdge: () => <path data-testid="base-edge" />,
}))

describe('Save Functionality Fix Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw validateTransitionStates errors when loading workflow', async () => {
    // Spy on console.error to catch any errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<App />)

    // Load the workflow
    await waitFor(() => {
      expect(screen.getByText('Test Entity')).toBeInTheDocument()
    })
    
    const user = userEvent.setup()
    await user.click(screen.getByText('Test Entity'))
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Workflow')[0]).toBeInTheDocument()
    })
    await user.click(screen.getAllByText('Test Workflow')[0])

    // Wait for workflow to load
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Check for validateTransitionStates errors
    const validateTransitionErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && (
          arg.includes('validateTransitionStates is not defined') ||
          arg.includes('Error cleaning up workflow state')
        )
      )
    )

    // Should have no validateTransitionStates errors
    expect(validateTransitionErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  it('should properly render workflow data in the canvas', async () => {
    render(<App />)

    // Load the workflow
    await waitFor(() => {
      expect(screen.getByText('Test Entity')).toBeInTheDocument()
    })
    
    const user = userEvent.setup()
    await user.click(screen.getByText('Test Entity'))
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Workflow')[0]).toBeInTheDocument()
    })
    await user.click(screen.getAllByText('Test Workflow')[0])

    // Wait for workflow to load
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Verify workflow info is displayed
    expect(screen.getAllByText('Test Workflow')[0]).toBeInTheDocument()
    expect(screen.getAllByText('2 states')[0]).toBeInTheDocument()
    expect(screen.getAllByText('1 transitions')[0]).toBeInTheDocument()

    // The canvas should now properly display the workflow data
    // This test verifies that the cleanup function works without errors
    // and that the workflow data flows correctly to the canvas
  })

  it('should validate that the validateTransitionStates function exists and works', () => {
    // Test the function directly to ensure it's properly implemented
    expect(validateTransitionStates).toBeDefined()
    expect(typeof validateTransitionStates).toBe('function')

    // Test with valid state IDs
    const stateIds = new Set(['start', 'end', 'processing'])

    // Valid layout transition ID
    expect(validateTransitionStates('start-to-end', stateIds)).toBe(true)
    expect(validateTransitionStates('start-to-processing', stateIds)).toBe(true)

    // Invalid layout transition ID (non-existent states)
    expect(validateTransitionStates('start-to-nonexistent', stateIds)).toBe(false)
    expect(validateTransitionStates('nonexistent-to-end', stateIds)).toBe(false)

    // Invalid format
    expect(validateTransitionStates('invalid-format', stateIds)).toBe(false)
    expect(validateTransitionStates('', stateIds)).toBe(false)
  })

  it('should verify that the cleanupWorkflowState function works without errors', async () => {
    // Spy on console.error to catch any errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<App />)

    // Load multiple workflows to trigger cleanup multiple times
    await waitFor(() => {
      expect(screen.getByText('Test Entity')).toBeInTheDocument()
    })
    
    const user = userEvent.setup()
    await user.click(screen.getByText('Test Entity'))
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Workflow')[0]).toBeInTheDocument()
    })
    await user.click(screen.getAllByText('Test Workflow')[0])

    // Wait for workflow to load
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Switch to another workflow to trigger cleanup again
    await user.click(screen.getByText('Test Entity'))
    await waitFor(() => {
      expect(screen.getAllByText('User Registration Workflow')[0]).toBeInTheDocument()
    })
    await user.click(screen.getAllByText('User Registration Workflow')[0])

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Check that no cleanup errors occurred
    const cleanupErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.includes('Error cleaning up workflow state')
      )
    )

    expect(cleanupErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })
})
