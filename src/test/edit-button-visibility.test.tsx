import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// ABOUTME: This test checks if edit buttons are visible and clickable in the real application.
// This will help identify if the save bug is caused by missing or non-functional edit buttons.

// Mock React Flow with detailed button rendering
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-provider">{children}</div>,
  ReactFlow: ({ children, nodes, edges, nodeTypes, edgeTypes }: any) => {
    console.log('=== ReactFlow rendering nodes and edges ===')
    console.log('Node types available:', Object.keys(nodeTypes || {}))
    console.log('Edge types available:', Object.keys(edgeTypes || {}))
    
    return (
      <div data-testid="react-flow">
        {children}
        <div data-testid="react-flow-nodes">
          {nodes?.map((node: any) => {
            const NodeComponent = nodeTypes?.[node.type];
            if (NodeComponent) {
              console.log(`Rendering node ${node.id} with component ${node.type}`)
              return <NodeComponent key={node.id} {...node} />
            }
            console.log(`No component found for node type: ${node.type}`)
            return (
              <div key={node.id} data-testid={`fallback-node-${node.id}`}>
                Fallback node: {node.id}
              </div>
            );
          })}
        </div>
        <div data-testid="react-flow-edges">
          {edges?.map((edge: any) => {
            const EdgeComponent = edgeTypes?.[edge.type];
            if (EdgeComponent) {
              console.log(`Rendering edge ${edge.id} with component ${edge.type}`)
              return <EdgeComponent key={edge.id} {...edge} />
            }
            console.log(`No component found for edge type: ${edge.type}`)
            return (
              <div key={edge.id} data-testid={`fallback-edge-${edge.id}`}>
                Fallback edge: {edge.id}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
  Background: () => <div data-testid="react-flow-background" />,
  Controls: ({ children }: { children?: React.ReactNode }) => <div data-testid="react-flow-controls">{children}</div>,
  ControlButton: ({ children, onClick, disabled, title }: any) => (
    <button onClick={onClick} disabled={disabled} title={title} data-testid="control-button">
      {children}
    </button>
  ),
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-panel">{children}</div>,
  Handle: ({ type, position, className }: any) => (
    <div data-testid={`handle-${type}-${position}`} className={className} />
  ),
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  ConnectionMode: { Loose: 'loose' },
  useNodesState: (initialNodes: any) => {
    const [nodes, setNodes] = React.useState(initialNodes || []);
    return [nodes, setNodes, () => {}];
  },
  useEdgesState: (initialEdges: any) => {
    const [edges, setEdges] = React.useState(initialEdges || []);
    return [edges, setEdges, () => {}];
  },
  useReactFlow: () => ({
    screenToFlowPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    setViewport: vi.fn(),
    getViewport: vi.fn().mockReturnValue({ x: 0, y: 0, zoom: 1 }),
  }),
  getBezierPath: () => ['M 0 0 L 100 100', 50, 50],
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <div data-testid="edge-label-renderer">{children}</div>,
  BaseEdge: ({ id, path }: any) => <path data-testid={`base-edge-${id}`} d={path} />,
}))

describe('Edit Button Visibility Investigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      console.info('[TEST LOG]', ...args)
    })
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      console.info('[TEST ERROR]', ...args)
    })
  })

  it('should check if StateNode edit buttons are rendered and clickable', async () => {
    console.log('=== Testing StateNode edit button visibility ===')
    
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

    // Check if StateNode components are rendered
    console.log('=== Checking for StateNode components ===')
    
    // Look for edit buttons using various selectors
    const editButtons = screen.queryAllByTitle('Edit state')
    const editIcons = screen.queryAllByTestId(/edit/i)
    const allButtons = screen.queryAllByRole('button')
    
    console.log('Edit buttons found by title "Edit state":', editButtons.length)
    console.log('Edit icons found by testid:', editIcons.length)
    console.log('Total buttons found:', allButtons.length)
    
    // Log all buttons for debugging
    allButtons.forEach((button, i) => {
      console.log(`Button ${i}:`, {
        title: button.getAttribute('title'),
        textContent: button.textContent,
        className: button.className,
        testId: button.getAttribute('data-testid')
      })
    })

    // Check if any state nodes are rendered at all
    const stateNodes = screen.queryAllByTestId(/node-/i)
    const fallbackNodes = screen.queryAllByTestId(/fallback-node/i)
    
    console.log('State nodes found:', stateNodes.length)
    console.log('Fallback nodes found:', fallbackNodes.length)
    
    // The test should find edit buttons if StateNode components are properly rendered
    expect(editButtons.length).toBeGreaterThan(0)
  })

  it('should check if TransitionEdge edit buttons are rendered and clickable', async () => {
    console.log('=== Testing TransitionEdge edit button visibility ===')
    
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

    // Check if TransitionEdge components are rendered
    console.log('=== Checking for TransitionEdge components ===')
    
    // Look for transition edit buttons
    const transitionEditButtons = screen.queryAllByTitle('Edit transition')
    const edgeLabelRenderers = screen.queryAllByTestId('edge-label-renderer')
    const baseEdges = screen.queryAllByTestId(/base-edge/i)
    const fallbackEdges = screen.queryAllByTestId(/fallback-edge/i)
    
    console.log('Transition edit buttons found:', transitionEditButtons.length)
    console.log('Edge label renderers found:', edgeLabelRenderers.length)
    console.log('Base edges found:', baseEdges.length)
    console.log('Fallback edges found:', fallbackEdges.length)
    
    // The test should find transition edit buttons if TransitionEdge components are properly rendered
    expect(transitionEditButtons.length).toBeGreaterThan(0)
  })

  it('should test clicking edit buttons to see if editors open', async () => {
    console.log('=== Testing edit button functionality ===')
    
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

    // Try to click a state edit button
    const stateEditButtons = screen.queryAllByTitle('Edit state')
    if (stateEditButtons.length > 0) {
      console.log('Clicking first state edit button...')
      await user.click(stateEditButtons[0])
      
      // Check if state editor opens
      await waitFor(() => {
        const stateEditor = screen.queryByText(/Edit State/i)
        console.log('State editor opened:', !!stateEditor)
        expect(stateEditor).toBeInTheDocument()
      }, { timeout: 2000 })
    } else {
      console.log('No state edit buttons found to click')
      throw new Error('No state edit buttons found')
    }
  })
})
