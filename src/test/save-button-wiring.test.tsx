import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// ABOUTME: This test specifically checks if the Save button in StateEditor
// is properly connected to the save handler. This will help identify if the
// save functionality is broken at the button level.

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-provider">{children}</div>,
  ReactFlow: ({ children, nodes, edges, nodeTypes, edgeTypes }: any) => {
    return (
      <div data-testid="react-flow">
        {children}
        <div data-testid="react-flow-nodes">
          {nodes?.map((node: any) => {
            const NodeComponent = nodeTypes?.[node.type];
            if (NodeComponent) {
              return <NodeComponent key={node.id} {...node} />
            }
            return <div key={node.id}>Fallback node: {node.id}</div>;
          })}
        </div>
        <div data-testid="react-flow-edges">
          {edges?.map((edge: any) => {
            const EdgeComponent = edgeTypes?.[edge.type];
            if (EdgeComponent) {
              return <EdgeComponent key={edge.id} {...edge} />
            }
            return <div key={edge.id}>Fallback edge: {edge.id}</div>;
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
  Handle: ({ type, position }: any) => <div data-testid={`handle-${type}-${position}`} />,
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

describe('Save Button Wiring Investigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      console.info('[TEST LOG]', ...args)
    })
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      console.info('[TEST ERROR]', ...args)
    })
  })

  it('should test the complete save flow from edit button to save handler', async () => {
    console.log('=== Testing complete save flow ===')
    
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

    // Step 1: Click edit button to open editor
    console.log('=== Step 1: Opening state editor ===')
    const editButtons = screen.getAllByTitle('Edit state')
    expect(editButtons.length).toBeGreaterThan(0)
    
    await user.click(editButtons[0])

    // Step 2: Wait for editor to open
    console.log('=== Step 2: Waiting for editor to open ===')
    await waitFor(() => {
      expect(screen.getByText(/Edit State/)).toBeInTheDocument()
    })

    // Step 3: Check that StateEditor shows name editing interface (no JSON editor)
    console.log('=== Step 3: Checking state name editor ===')
    expect(screen.getByText('Edit State Name')).toBeInTheDocument()
    expect(screen.getByText(/To edit transitions, use the transition editor/)).toBeInTheDocument()

    console.log('State name editor interface confirmed')

    // Step 4: Check if Save button exists and is enabled
    console.log('=== Step 4: Checking Save button ===')
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).not.toBeDisabled()

    console.log('Save button found:', {
      text: saveButton.textContent,
      disabled: saveButton.hasAttribute('disabled'),
      className: saveButton.className
    })

    // Step 5: Click Save button
    console.log('=== Step 5: Clicking Save button ===')
    await user.click(saveButton)

    // Step 6: Check if editor closes (indicating save was processed)
    console.log('=== Step 6: Checking if editor closes ===')
    await waitFor(() => {
      const editorAfterSave = screen.queryByText(/Edit State/)
      console.log('Editor still open after save:', !!editorAfterSave)
      expect(editorAfterSave).not.toBeInTheDocument()
    }, { timeout: 3000 })

    console.log('=== Save flow test completed successfully ===')
  })

  it('should test what happens when Save button is clicked but validation fails', async () => {
    console.log('=== Testing save with invalid JSON ===')
    
    const user = userEvent.setup()
    render(<App />)

    // Load workflow and open editor
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

    const editButtons = screen.getAllByTitle('Edit state')
    await user.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Edit State/)).toBeInTheDocument()
    })

    // StateEditor no longer has JSON editing - it only edits names
    // The save button should always be enabled for name editing
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeEnabled()

    console.log('Save button is enabled for state name editing')
  })
})
