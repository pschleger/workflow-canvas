import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas';
import { LoopbackEdge } from '../components/Canvas/LoopbackEdge';
import type { UIWorkflowData, UITransitionData } from '../types/workflow';

// ABOUTME: This file tests loop-back transition editing functionality to ensure
// that self-connecting transitions can be properly edited through the transition editor.

describe('Loop-back Transition Editing', () => {
  const mockWorkflow: UIWorkflowData = {
    id: 'test-workflow',
    entityId: 'test-entity',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    configuration: {
      version: '1.0',
      name: 'Test Workflow',
      initialState: 'state1',
      states: {
        state1: {
          name: 'State 1',
          transitions: [
            {
              name: 'Loop Back',
              next: 'state1', // Loop-back transition
              manual: true,
              disabled: false
            },
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
        }
      }
    },
    layout: {
      workflowId: 'test-workflow',
      version: 1,
      states: [
        { id: 'state1', position: { x: 100, y: 100 } },
        { id: 'state2', position: { x: 300, y: 100 } }
      ],
      transitions: [
        {
          id: 'state1-0', // Loop-back transition
          sourceHandle: 'top-center-source',
          targetHandle: 'bottom-center-target',
          labelPosition: { x: 0, y: -60 }
        },
        {
          id: 'state1-1', // Regular transition
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

  describe('LoopbackEdge Component', () => {
    const mockLoopbackTransition: UITransitionData = {
      id: 'state1-0',
      sourceStateId: 'state1',
      targetStateId: 'state1',
      definition: {
        name: 'Loop Back',
        next: 'state1',
        manual: true,
        disabled: false
      },
      labelPosition: { x: 0, y: -60 },
      sourceHandle: 'top-center-source',
      targetHandle: 'bottom-center-target'
    };

    it('should render loop-back transition with edit button', () => {
      render(
        <LoopbackEdge
          id="state1-0"
          sourceX={100}
          sourceY={100}
          targetX={100}
          targetY={100}
          data={{
            transition: mockLoopbackTransition,
            onEdit: mockOnTransitionEdit,
            onUpdate: vi.fn(),
            isLoopback: true
          }}
          selected={false}
        />
      );

      // Should render the loop-back transition label
      expect(screen.getByText('Loop Back')).toBeInTheDocument();
      
      // Should have an edit button
      expect(screen.getByTitle('Edit transition')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      render(
        <LoopbackEdge
          id="state1-0"
          sourceX={100}
          sourceY={100}
          targetX={100}
          targetY={100}
          data={{
            transition: mockLoopbackTransition,
            onEdit: mockOnTransitionEdit,
            onUpdate: vi.fn(),
            isLoopback: true
          }}
          selected={false}
        />
      );

      // Click the edit button
      const editButton = screen.getByTitle('Edit transition');
      fireEvent.click(editButton);

      // Should call onEdit with the correct transition ID
      expect(mockOnTransitionEdit).toHaveBeenCalledWith('state1-0');
    });

    it('should call onEdit when double-clicked', () => {
      render(
        <LoopbackEdge
          id="state1-0"
          sourceX={100}
          sourceY={100}
          targetX={100}
          targetY={100}
          data={{
            transition: mockLoopbackTransition,
            onEdit: mockOnTransitionEdit,
            onUpdate: vi.fn(),
            isLoopback: true
          }}
          selected={false}
        />
      );

      // Double-click the transition label
      const transitionLabel = screen.getByText('Loop Back');
      fireEvent.doubleClick(transitionLabel);

      // Should call onEdit with the correct transition ID
      expect(mockOnTransitionEdit).toHaveBeenCalledWith('state1-0');
    });
  });

  describe('WorkflowCanvas Integration', () => {
    it('should render loop-back transitions with LoopbackEdge component', async () => {
      render(
        <ReactFlowProvider>
          <WorkflowCanvas
            workflow={mockWorkflow}
            onWorkflowUpdate={mockOnWorkflowUpdate}
            onStateEdit={mockOnStateEdit}
            onTransitionEdit={mockOnTransitionEdit}
            darkMode={false}
          />
        </ReactFlowProvider>
      );

      // Wait for the workflow to render
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Should render the loop-back transition
      expect(screen.getByText('Loop Back')).toBeInTheDocument();
      
      // Should render the regular transition
      expect(screen.getByText('To State 2')).toBeInTheDocument();
    });

    it('should call onTransitionEdit when loop-back transition edit button is clicked', async () => {
      render(
        <ReactFlowProvider>
          <WorkflowCanvas
            workflow={mockWorkflow}
            onWorkflowUpdate={mockOnWorkflowUpdate}
            onStateEdit={mockOnStateEdit}
            onTransitionEdit={mockOnTransitionEdit}
            darkMode={false}
          />
        </ReactFlowProvider>
      );

      // Wait for the workflow to render
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Find and click the edit button for the loop-back transition
      const editButtons = screen.getAllByTitle('Edit transition');
      expect(editButtons.length).toBeGreaterThan(0);
      
      // Click the first edit button (should be the loop-back transition)
      fireEvent.click(editButtons[0]);

      // Should call onTransitionEdit with the loop-back transition ID
      expect(mockOnTransitionEdit).toHaveBeenCalledWith('state1-0');
    });

    it('should call onTransitionEdit when loop-back transition is double-clicked', async () => {
      render(
        <ReactFlowProvider>
          <WorkflowCanvas
            workflow={mockWorkflow}
            onWorkflowUpdate={mockOnWorkflowUpdate}
            onStateEdit={mockOnStateEdit}
            onTransitionEdit={mockOnTransitionEdit}
            darkMode={false}
          />
        </ReactFlowProvider>
      );

      // Wait for the workflow to render
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Double-click the loop-back transition label
      const loopbackLabel = screen.getByText('Loop Back');
      fireEvent.doubleClick(loopbackLabel);

      // Should call onTransitionEdit with the loop-back transition ID
      expect(mockOnTransitionEdit).toHaveBeenCalledWith('state1-0');
    });
  });

  describe('Transition ID Handling', () => {
    it('should generate correct transition IDs for loop-back transitions', () => {
      // Loop-back transition should have ID format: sourceState-transitionIndex
      // For state1's first transition (index 0) that loops back to state1
      const expectedId = 'state1-0';
      
      // Verify the mock data has the correct structure
      expect(mockWorkflow.configuration.states.state1.transitions[0].next).toBe('state1');
      expect(mockWorkflow.layout.transitions[0].id).toBe(expectedId);
    });

    it('should distinguish between loop-back and regular transitions', () => {
      const loopbackTransition = mockWorkflow.configuration.states.state1.transitions[0];
      const regularTransition = mockWorkflow.configuration.states.state1.transitions[1];
      
      // Loop-back: source === target
      expect(loopbackTransition.next).toBe('state1'); // same as source
      
      // Regular: source !== target
      expect(regularTransition.next).toBe('state2'); // different from source
    });
  });
});
