import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// ABOUTME: This test focuses on the core issue - workflow data not being rendered
// as React Flow nodes and edges, which prevents the save functionality from working.

// Mock React Flow with detailed logging
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-provider">{children}</div>,
  ReactFlow: ({ children, nodes, edges }: any) => {
    console.log('=== ReactFlow Component Called ===')
    console.log('Nodes received:', nodes)
    console.log('Edges received:', edges)
    console.log('Nodes length:', nodes?.length || 0)
    console.log('Edges length:', edges?.length || 0)
    
    if (nodes && nodes.length > 0) {
      console.log('First node:', nodes[0])
    }
    if (edges && edges.length > 0) {
      console.log('First edge:', edges[0])
    }
    
    return (
      <div data-testid="react-flow">
        {children}
        <div data-testid="react-flow-nodes" data-node-count={nodes?.length || 0}>
          {nodes?.map((node: any) => (
            <div key={node.id} data-testid={`node-${node.id}`} data-node-label={node.data?.label}>
              <span data-testid={`node-${node.id}-label`}>{node.data?.label || node.id}</span>
            </div>
          ))}
        </div>
        <div data-testid="react-flow-edges" data-edge-count={edges?.length || 0}>
          {edges?.map((edge: any) => (
            <div key={edge.id} data-testid={`edge-${edge.id}`} data-edge-label={edge.label}>
              <span data-testid={`edge-${edge.id}-label`}>{edge.label || edge.id}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
  Background: () => <div data-testid="react-flow-background" />,
  Controls: () => <div data-testid="react-flow-controls" />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-panel">{children}</div>,
  Handle: () => <div data-testid="react-flow-handle" />,
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  ConnectionMode: { Loose: 'loose' },
  useNodesState: (initialNodes: any) => {
    const [nodes, setNodes] = React.useState(initialNodes || []);
    console.log('useNodesState called with initial nodes:', initialNodes);
    return [nodes, setNodes, () => {}];
  },
  useEdgesState: (initialEdges: any) => {
    const [edges, setEdges] = React.useState(initialEdges || []);
    console.log('useEdgesState called with initial edges:', initialEdges);
    return [edges, setEdges, () => {}];
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

describe('Workflow Loading Bug Investigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Capture console output
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      // Let the logs through so we can see them in test output
      console.info('[TEST LOG]', ...args)
    })
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      console.info('[TEST ERROR]', ...args)
    })
  })

  it('should investigate why workflow nodes and edges are not being rendered', async () => {
    console.log('=== Starting workflow loading test ===')
    
    const user = userEvent.setup()
    render(<App />)

    // Step 1: Load entity
    console.log('=== Step 1: Loading entity ===')
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    await user.click(screen.getByText('User'))

    // Step 2: Load workflow
    console.log('=== Step 2: Loading workflow ===')
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    await user.click(screen.getByText('User Registration'))

    // Step 3: Wait for React Flow to render
    console.log('=== Step 3: Waiting for React Flow ===')
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Step 4: Check if nodes container exists and has content
    console.log('=== Step 4: Checking nodes container ===')
    const nodesContainer = screen.getByTestId('react-flow-nodes')
    const edgesContainer = screen.getByTestId('react-flow-edges')
    
    console.log('Nodes container found:', !!nodesContainer)
    console.log('Edges container found:', !!edgesContainer)
    console.log('Nodes container node count attribute:', nodesContainer.getAttribute('data-node-count'))
    console.log('Edges container edge count attribute:', edgesContainer.getAttribute('data-edge-count'))
    console.log('Nodes container children count:', nodesContainer.children.length)
    console.log('Edges container children count:', edgesContainer.children.length)

    // Step 5: Check if workflow info panel shows data was loaded
    console.log('=== Step 5: Checking workflow info panel ===')
    const workflowNameElements = screen.queryAllByText('User Registration')
    const stateCountElements = screen.queryAllByText(/\d+ states/)
    const transitionCountElements = screen.queryAllByText(/\d+ transitions/)
    
    console.log('Workflow name elements found:', workflowNameElements.length)
    console.log('State count elements found:', stateCountElements.length)
    console.log('Transition count elements found:', transitionCountElements.length)

    if (stateCountElements.length > 0) {
      console.log('State count text:', stateCountElements[0].textContent)
    }
    if (transitionCountElements.length > 0) {
      console.log('Transition count text:', transitionCountElements[0].textContent)
    }

    // Step 6: The core issue - nodes and edges should be rendered but aren't
    console.log('=== Step 6: Core issue verification ===')
    
    // If workflow data is loaded (as shown by info panel), but nodes/edges aren't rendered,
    // then there's a bug in the data flow from workflow data to React Flow nodes/edges
    
    const nodeCount = parseInt(nodesContainer.getAttribute('data-node-count') || '0')
    const edgeCount = parseInt(edgesContainer.getAttribute('data-edge-count') || '0')
    
    console.log('Final node count:', nodeCount)
    console.log('Final edge count:', edgeCount)
    
    // This test documents the bug: workflow data loads but nodes/edges don't render
    expect(nodeCount).toBeGreaterThan(0) // This should fail, proving the bug exists
    expect(edgeCount).toBeGreaterThan(0) // This should fail, proving the bug exists
  })

  it('should check if the issue is in the WorkflowCanvas component', async () => {
    console.log('=== Testing WorkflowCanvas component specifically ===')
    
    const user = userEvent.setup()
    render(<App />)

    // Load workflow
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    await user.click(screen.getByText('User Registration'))

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Check if there are any error messages or loading states
    const errorMessages = screen.queryAllByText(/error/i)
    const loadingMessages = screen.queryAllByText(/loading/i)
    
    console.log('Error messages found:', errorMessages.length)
    console.log('Loading messages found:', loadingMessages.length)
    
    errorMessages.forEach((msg, i) => {
      console.log(`Error message ${i}:`, msg.textContent)
    })
    
    loadingMessages.forEach((msg, i) => {
      console.log(`Loading message ${i}:`, msg.textContent)
    })

    // The issue might be that the WorkflowCanvas is stuck in a loading state
    // or there's an error preventing nodes/edges from being created
  })
})
