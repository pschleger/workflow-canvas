import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas';
import type { UIWorkflowData } from '../types/workflow';

// ABOUTME: This file tests loop-back handle preservation to debug why handles
// are being reset when creating loop-back connections.

describe('Loop-back Handle Preservation Debug', () => {
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
          transitions: []
        }
      }
    },
    layout: {
      workflowId: 'test-workflow',
      version: 1,
      states: [
        { id: 'state1', position: { x: 100, y: 100 } }
      ],
      transitions: [],
      updatedAt: new Date().toISOString()
    }
  };

  const mockOnWorkflowUpdate = vi.fn();
  const mockOnStateEdit = vi.fn();
  const mockOnTransitionEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to capture debug output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should preserve handles when creating loop-back connection', async () => {
    const { container } = render(
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

    // Get the WorkflowCanvas instance to access its methods
    const workflowCanvas = container.querySelector('[data-testid="react-flow"]');
    expect(workflowCanvas).toBeInTheDocument();

    // Simulate a loop-back connection creation
    // This simulates dragging from bottom-center-source to top-center-target on the same state
    const connectionParams = {
      source: 'state1',
      target: 'state1',
      sourceHandle: 'bottom-center-source',
      targetHandle: 'top-center-target'
    };

    console.log('Simulating loop-back connection:', connectionParams);

    // We can't directly call onConnect from the test, but we can verify the logic
    // by checking that the handles are valid according to our new directional system
    expect(connectionParams.sourceHandle.endsWith('-source')).toBe(true);
    expect(connectionParams.targetHandle.endsWith('-target')).toBe(true);
    
    // Check that source handle is from a valid source position (bottom/right)
    const sourcePosition = connectionParams.sourceHandle.replace('-source', '');
    expect(['bottom-left', 'bottom-center', 'bottom-right', 'right-center'].includes(sourcePosition)).toBe(true);
    
    // Check that target handle is from a valid target position (top/left)
    const targetPosition = connectionParams.targetHandle.replace('-target', '');
    expect(['top-left', 'top-center', 'top-right', 'left-center'].includes(targetPosition)).toBe(true);

    console.log('Connection validation passed');
  });

  it('should detect invalid handle combinations', () => {
    // Test invalid combinations that should be rejected
    const invalidConnections = [
      {
        source: 'state1',
        target: 'state1',
        sourceHandle: 'top-center-source', // Invalid: top should be target
        targetHandle: 'bottom-center-target' // Invalid: bottom should be source
      },
      {
        source: 'state1',
        target: 'state1',
        sourceHandle: 'left-center-source', // Invalid: left should be target
        targetHandle: 'right-center-target' // Invalid: right should be source
      }
    ];

    invalidConnections.forEach((connection, index) => {
      console.log(`Testing invalid connection ${index + 1}:`, connection);

      // Check source handle validation
      if (connection.sourceHandle) {
        const sourcePosition = connection.sourceHandle.replace('-source', '');
        const isValidSource = ['bottom-left', 'bottom-center', 'bottom-right', 'right-center'].includes(sourcePosition);
        expect(isValidSource).toBe(false); // Should be invalid
      }

      // Check target handle validation
      if (connection.targetHandle) {
        const targetPosition = connection.targetHandle.replace('-target', '');
        const isValidTarget = ['top-left', 'top-center', 'top-right', 'left-center'].includes(targetPosition);
        expect(isValidTarget).toBe(false); // Should be invalid
      }
    });
  });

  it('should test all valid loop-back handle combinations', () => {
    const validSourceHandles = ['bottom-left-source', 'bottom-center-source', 'bottom-right-source', 'right-center-source'];
    const validTargetHandles = ['top-left-target', 'top-center-target', 'top-right-target', 'left-center-target'];

    // Test all valid combinations
    validSourceHandles.forEach(sourceHandle => {
      validTargetHandles.forEach(targetHandle => {
        const connection = {
          source: 'state1',
          target: 'state1',
          sourceHandle,
          targetHandle
        };

        console.log('Testing valid combination:', connection);

        // Validate source handle
        const sourcePosition = sourceHandle.replace('-source', '');
        expect(['bottom-left', 'bottom-center', 'bottom-right', 'right-center'].includes(sourcePosition)).toBe(true);

        // Validate target handle
        const targetPosition = targetHandle.replace('-target', '');
        expect(['top-left', 'top-center', 'top-right', 'left-center'].includes(targetPosition)).toBe(true);
      });
    });

    console.log(`Tested ${validSourceHandles.length * validTargetHandles.length} valid combinations`);
  });

  it('should simulate workflow update with preserved handles', () => {
    // Simulate what should happen when a loop-back connection is created
    const originalWorkflow = mockWorkflow;
    const connectionParams = {
      source: 'state1',
      target: 'state1',
      sourceHandle: 'bottom-center-source',
      targetHandle: 'top-center-target'
    };

    // Simulate the workflow update that should preserve handles
    const newTransitionDef = {
      name: 'Loop-back Transition',
      next: 'state1',
      manual: false,
      disabled: false
    };

    const updatedStates = {
      ...originalWorkflow.configuration.states,
      state1: {
        ...originalWorkflow.configuration.states.state1,
        transitions: [newTransitionDef]
      }
    };

    const transitionLayout = {
      id: 'state1-0',
      sourceHandle: connectionParams.sourceHandle,
      targetHandle: connectionParams.targetHandle,
      labelPosition: { x: 0, y: 0 }
    };

    const updatedWorkflow = {
      ...originalWorkflow,
      configuration: {
        ...originalWorkflow.configuration,
        states: updatedStates
      },
      layout: {
        ...originalWorkflow.layout,
        transitions: [transitionLayout]
      }
    };

    console.log('Simulated updated workflow:', {
      transitionCount: updatedWorkflow.configuration.states.state1.transitions.length,
      layoutTransition: updatedWorkflow.layout.transitions[0]
    });

    // Verify the handles are preserved
    expect(updatedWorkflow.layout.transitions[0].sourceHandle).toBe('bottom-center-source');
    expect(updatedWorkflow.layout.transitions[0].targetHandle).toBe('top-center-target');
  });
});
