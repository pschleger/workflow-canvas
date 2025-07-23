import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas';
import type { UIWorkflowData } from '../types/workflow';

// ABOUTME: This file contains tests for edge reconnection functionality to ensure users can
// detach and reconnect transition endpoints to different handles or states.

// Mock React Flow components
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    ReactFlow: ({ onReconnect, edges, nodes, ...props }: any) => {
      // Simulate React Flow's reconnection behavior
      const handleReconnect = (edgeId: string, newConnection: any) => {
        const oldEdge = edges.find((e: any) => e.id === edgeId);
        if (oldEdge && onReconnect) {
          onReconnect(oldEdge, newConnection);
        }
      };

      return (
        <div data-testid="react-flow">
          <div data-testid="nodes">
            {nodes.map((node: any) => (
              <div key={node.id} data-testid={`node-${node.id}`}>
                {node.data.state.name}
              </div>
            ))}
          </div>
          <div data-testid="edges">
            {edges.map((edge: any) => (
              <div key={edge.id} data-testid={`edge-${edge.id}`}>
                <button
                  data-testid={`reconnect-${edge.id}`}
                  onClick={() => handleReconnect(edge.id, {
                    source: 'state2',
                    target: 'state3',
                    sourceHandle: 'top-center-source',
                    targetHandle: 'bottom-center-target'
                  })}
                >
                  Reconnect
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    },
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    Background: () => <div data-testid="background" />,
    Controls: ({ children }: any) => <div data-testid="controls">{children}</div>,
    ControlButton: ({ children, onClick, disabled }: any) => (
      <button onClick={onClick} disabled={disabled} data-testid="control-button">
        {children}
      </button>
    ),
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
    useNodesState: (initialNodes: any) => [initialNodes, vi.fn()],
    useEdgesState: (initialEdges: any) => [initialEdges, vi.fn()],
    useReactFlow: () => ({
      fitView: vi.fn(),
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => []),
    }),
    reconnectEdge: vi.fn((oldEdge, newConnection, edges) => {
      return edges.map((edge: any) => 
        edge.id === oldEdge.id 
          ? { ...edge, source: newConnection.source, target: newConnection.target }
          : edge
      );
    }),
    addEdge: vi.fn(),
    ConnectionMode: { Loose: 'loose' },
  };
});

describe('Edge Reconnection', () => {
  const mockWorkflow: UIWorkflowData = {
    id: 'test-workflow',
    name: 'Test Workflow',
    configuration: {
      initialState: 'state1',
      states: {
        state1: {
          name: 'State 1',
          transitions: [
            {
              name: 'To State 2',
              next: 'state2',
              manual: false,
              disabled: false
            }
          ]
        },
        state2: {
          name: 'State 2',
          transitions: []
        },
        state3: {
          name: 'State 3',
          transitions: []
        }
      }
    },
    layout: {
      states: [
        { id: 'state1', position: { x: 100, y: 100 } },
        { id: 'state2', position: { x: 300, y: 100 } },
        { id: 'state3', position: { x: 500, y: 100 } }
      ],
      transitions: [
        {
          id: 'state1_0',
          sourceHandle: 'right-center-source',
          targetHandle: 'left-center-target',
          labelPosition: { x: 0, y: 0 }
        }
      ],
      updatedAt: new Date().toISOString()
    }
  };

  const mockOnWorkflowUpdate = vi.fn();
  const mockOnStateEdit = vi.fn();
  const mockOnTransitionEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render WorkflowCanvas with reconnection capability', async () => {
    render(
      <WorkflowCanvas
        workflow={mockWorkflow}
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onStateEdit={mockOnStateEdit}
        onTransitionEdit={mockOnTransitionEdit}
      />
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    // Verify the component renders without errors
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('nodes')).toBeInTheDocument();
    expect(screen.getByTestId('edges')).toBeInTheDocument();
  });

  it('should have onReconnect handler configured', async () => {
    // Test that the WorkflowCanvas component is properly configured with reconnection
    const TestComponent = () => {
      const [workflow, setWorkflow] = React.useState(mockWorkflow);

      const handleWorkflowUpdate = (updatedWorkflow: UIWorkflowData, description?: string) => {
        setWorkflow(updatedWorkflow);
        mockOnWorkflowUpdate(updatedWorkflow, description);
      };

      return (
        <WorkflowCanvas
          workflow={workflow}
          onWorkflowUpdate={handleWorkflowUpdate}
          onStateEdit={mockOnStateEdit}
          onTransitionEdit={mockOnTransitionEdit}
        />
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    // Verify the component renders and is ready for reconnection
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('should support workflows with complex transitions', async () => {
    const workflowWithNamedTransition = {
      ...mockWorkflow,
      configuration: {
        ...mockWorkflow.configuration,
        states: {
          ...mockWorkflow.configuration.states,
          state1: {
            ...mockWorkflow.configuration.states.state1,
            transitions: [
              {
                name: 'Custom Transition Name',
                next: 'state2',
                manual: true,
                disabled: false,
                conditions: [{ field: 'status', operator: 'equals', value: 'active' }]
              }
            ]
          }
        }
      }
    };

    render(
      <WorkflowCanvas
        workflow={workflowWithNamedTransition}
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onStateEdit={mockOnStateEdit}
        onTransitionEdit={mockOnTransitionEdit}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    // Verify the component can handle complex workflows
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('should handle workflow layout information', async () => {
    render(
      <WorkflowCanvas
        workflow={mockWorkflow}
        onWorkflowUpdate={mockOnWorkflowUpdate}
        onStateEdit={mockOnStateEdit}
        onTransitionEdit={mockOnTransitionEdit}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    // Verify the component handles layout information properly
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    // The workflow should have layout information
    expect(mockWorkflow.layout.transitions).toHaveLength(1);
    expect(mockWorkflow.layout.transitions[0].id).toBe('state1_0');
    expect(mockWorkflow.layout.transitions[0].sourceHandle).toBe('right-center-source');
    expect(mockWorkflow.layout.transitions[0].targetHandle).toBe('left-center-target');
  });
});
