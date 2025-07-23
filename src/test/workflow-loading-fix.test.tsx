// ABOUTME: Test to verify that workflow loading works without blank screen issues
// after fixing the useStore import problem that was causing JavaScript errors.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock the API service to provide test data
vi.mock('../services/api', () => ({
  apiService: {
    getEntities: vi.fn().mockResolvedValue([
      { id: 'test-entity', name: 'Test Entity' }
    ]),
    getWorkflows: vi.fn().mockResolvedValue([
      { id: 'test-workflow', name: 'Test Workflow', entityId: 'test-entity' }
    ]),
    getWorkflow: vi.fn().mockResolvedValue({
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
    }),
    updateWorkflow: vi.fn().mockResolvedValue({}),
    createWorkflow: vi.fn().mockResolvedValue({})
  }
}))

// Mock React Flow components to avoid complexities but still test the component structure
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
        <div data-testid="nodes-info">Nodes: {nodes?.length || 0}</div>
        <div data-testid="edges-info">Edges: {edges?.length || 0}</div>
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

describe('Workflow Loading Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load workflow without blank screen (useStore import fix)', async () => {
    // Spy on console.error to catch any JavaScript errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const user = userEvent.setup()
    render(<App />)

    // Step 1: Load entity
    await waitFor(() => {
      expect(screen.getByText('Test Entity')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Entity'))

    // Step 2: Load workflow
    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Workflow'))

    // Step 3: Verify React Flow canvas renders without errors
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Step 4: Verify no JavaScript errors occurred
    const jsErrors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && (
          arg.includes('useStore') ||
          arg.includes('export') ||
          arg.includes('import') ||
          arg.includes('Error:')
        )
      )
    )
    
    if (jsErrors.length > 0) {
      console.log('JavaScript errors found:')
      jsErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error)
      })
    }
    
    expect(jsErrors).toHaveLength(0)

    // Step 5: Verify workflow components are present
    expect(screen.getByTestId('background')).toBeInTheDocument()
    expect(screen.getByTestId('controls')).toBeInTheDocument()
    expect(screen.getByTestId('control-button')).toBeInTheDocument()
    expect(screen.getByTestId('minimap')).toBeInTheDocument()
    expect(screen.getByTestId('panel')).toBeInTheDocument()

    // Step 6: Verify workflow data is displayed
    expect(screen.getByText('Test Workflow')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should render nodes and edges when workflow is loaded', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Load workflow
    await waitFor(() => {
      expect(screen.getByText('Test Entity')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Entity'))

    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Workflow'))

    // Wait for React Flow to render
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Verify that nodes and edges are being passed to React Flow
    const reactFlowElement = screen.getByTestId('react-flow')
    const nodesCount = parseInt(reactFlowElement.getAttribute('data-nodes-count') || '0')
    const edgesCount = parseInt(reactFlowElement.getAttribute('data-edges-count') || '0')

    // We should have 2 states (start, end) = 2 nodes
    expect(nodesCount).toBe(2)
    
    // We should have 1 transition (start -> end) = 1 edge
    expect(edgesCount).toBe(1)

    // Verify the info is displayed
    expect(screen.getByText('Nodes: 2')).toBeInTheDocument()
    expect(screen.getByText('Edges: 1')).toBeInTheDocument()
  })

  it('should handle auto-layout button without errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const user = userEvent.setup()
    render(<App />)

    // Load workflow
    await waitFor(() => {
      expect(screen.getByText('Test Entity')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Entity'))

    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Test Workflow'))

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Click the auto-layout button
    const autoLayoutButton = screen.getByTestId('control-button')
    expect(autoLayoutButton).toBeInTheDocument()
    expect(autoLayoutButton).not.toBeDisabled()

    await user.click(autoLayoutButton)

    // Verify no errors occurred
    const errors = consoleSpy.mock.calls.filter(call => 
      call.some(arg => typeof arg === 'string' && arg.includes('Error'))
    )
    expect(errors).toHaveLength(0)

    consoleSpy.mockRestore()
  })
})
