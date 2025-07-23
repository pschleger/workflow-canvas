import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// ABOUTME: This test replicates the actual save functionality bug where changes
// made in editors are not reflected in the canvas after saving.

// Mock React Flow with proper state management
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-provider">{children}</div>,
  ReactFlow: ({ children, nodes, edges, nodeTypes, edgeTypes }: any) => {
    // Log the nodes and edges being passed to ReactFlow for debugging
    console.log('ReactFlow received nodes:', nodes?.map((n: any) => ({ id: n.id, label: n.data?.label })))
    console.log('ReactFlow received edges:', edges?.map((e: any) => ({ id: e.id, label: e.label })))
    
    return (
      <div data-testid="react-flow">
        {children}
        <div data-testid="react-flow-nodes">
          {nodes?.map((node: any) => {
            // Try to render using nodeTypes first, then fallback
            const NodeComponent = nodeTypes?.[node.type];
            if (NodeComponent) {
              return <NodeComponent key={node.id} {...node} />
            }
            return (
              <div key={node.id} data-testid={`node-${node.id}`} data-node-label={node.data?.label}>
                <span data-testid={`node-${node.id}-label`}>{node.data?.label || node.id}</span>
                <button data-testid={`edit-${node.id}`} onClick={() => node.data?.onEdit?.(node.id)}>
                  Edit
                </button>
              </div>
            );
          })}
        </div>
        <div data-testid="react-flow-edges">
          {edges?.map((edge: any) => {
            const EdgeComponent = edgeTypes?.[edge.type];
            if (EdgeComponent) {
              return <EdgeComponent key={edge.id} {...edge} />
            }
            return (
              <div key={edge.id} data-testid={`edge-${edge.id}`} data-edge-label={edge.label}>
                <span data-testid={`edge-${edge.id}-label`}>{edge.label || edge.id}</span>
                <button data-testid={`edit-edge-${edge.id}`} onClick={() => edge.data?.onEdit?.(edge.id)}>
                  Edit Transition
                </button>
              </div>
            );
          })}
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
    const onNodesChange = (changes: any) => {
      console.log('Nodes changed:', changes);
    };
    return [nodes, setNodes, onNodesChange];
  },
  useEdgesState: (initialEdges: any) => {
    const [edges, setEdges] = React.useState(initialEdges || []);
    const onEdgesChange = (changes: any) => {
      console.log('Edges changed:', changes);
    };
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

describe('Actual Save Bug Reproduction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Spy on console to capture any errors
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should reproduce the save bug: changes not reflected in canvas', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Step 1: Load a workflow
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    await user.click(screen.getByText('User Registration'))

    // Step 2: Wait for workflow to load and verify initial state
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Step 3: Verify initial state names are displayed
    console.log('=== STEP 3: Checking initial state ===')
    await waitFor(() => {
      const pendingStateLabel = screen.queryByTestId('node-pending-label')
      const emailSentStateLabel = screen.queryByTestId('node-email-sent-label')
      console.log('Pending state label element:', pendingStateLabel?.textContent)
      console.log('Email-sent state label element:', emailSentStateLabel?.textContent)

      // This should show "pending" initially (since there's no name property in the config)
      expect(pendingStateLabel).toBeInTheDocument()
      expect(pendingStateLabel).toHaveTextContent('pending')
    })

    // Step 4: Click edit button for pending state
    console.log('=== STEP 4: Opening state editor ===')
    const editButton = screen.getByTestId('edit-pending')
    await user.click(editButton)

    // Step 5: Wait for state editor to open
    await waitFor(() => {
      expect(screen.getByText(/Edit State/)).toBeInTheDocument()
    })

    // Step 6: Modify the state name in the JSON editor
    console.log('=== STEP 6: Modifying state name ===')
    const jsonTextarea = screen.getByRole('textbox')
    const modifiedStateDefinition = {
      name: 'MODIFIED Pending State',
      transitions: [
        { name: 'Send Verification Email', next: 'email-sent', manual: false, disabled: false },
        { name: 'Invalid Email', next: 'failed', manual: false, disabled: false }
      ]
    }
    
    await user.clear(jsonTextarea)
    await user.type(jsonTextarea, JSON.stringify(modifiedStateDefinition, null, 2))

    // Step 7: Save the changes
    console.log('=== STEP 7: Saving changes ===')
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)

    // Step 8: Wait for editor to close
    await waitFor(() => {
      expect(screen.queryByText(/Edit State/)).not.toBeInTheDocument()
    })

    // Step 9: THE BUG - Check if changes are reflected in canvas
    console.log('=== STEP 9: Checking if changes are reflected ===')

    // This is where the bug should manifest - the canvas should show the new name
    // but it might still show the old name
    await waitFor(() => {
      const pendingStateLabel = screen.queryByTestId('node-pending-label')
      console.log('After save - Pending state label:', pendingStateLabel?.textContent)

      // This assertion should FAIL if the bug exists
      // The canvas should show "MODIFIED Pending State" but might still show "pending"
      expect(pendingStateLabel).toHaveTextContent('MODIFIED Pending State')
    }, { timeout: 5000 })

    console.log('=== TEST COMPLETED ===')
  })

  it('should also test transition editing to see if the same bug exists', async () => {
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

    // Check initial transition name
    await waitFor(() => {
      const transitionLabel = screen.queryByTestId('edge-pending-0-label')
      console.log('Initial transition label:', transitionLabel?.textContent)
      expect(transitionLabel).toHaveTextContent('Send Verification Email')
    })

    // Edit transition
    const editTransitionButton = screen.getByTestId('edit-edge-pending-0')
    await user.click(editTransitionButton)

    await waitFor(() => {
      expect(screen.getByText(/Edit Transition/)).toBeInTheDocument()
    })

    // Modify transition name
    const jsonTextarea = screen.getByRole('textbox')
    const modifiedTransition = {
      name: 'MODIFIED Send Verification Email',
      next: 'email-sent',
      manual: false,
      disabled: false
    }
    
    await user.clear(jsonTextarea)
    await user.type(jsonTextarea, JSON.stringify(modifiedTransition, null, 2))

    // Save
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.queryByText(/Edit Transition/)).not.toBeInTheDocument()
    })

    // Check if transition name changed in canvas
    await waitFor(() => {
      const transitionLabel = screen.queryByTestId('edge-pending-0-label')
      console.log('After save - Transition label:', transitionLabel?.textContent)

      // This should show the modified name
      expect(transitionLabel).toHaveTextContent('MODIFIED Send Verification Email')
    }, { timeout: 5000 })
  })
})
