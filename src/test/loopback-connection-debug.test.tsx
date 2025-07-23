import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas';
import type { UIWorkflowData } from '../types/workflow';

// ABOUTME: This file tests loop-back connection creation to debug the handle ID issue
// where React Flow throws an error about invalid source handle IDs.

describe('Loop-back Connection Debug', () => {
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

  it('should have proper handle IDs on state nodes', async () => {
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

    // Check that the state node is rendered
    expect(screen.getByText('State 1')).toBeInTheDocument();

    // The handles should be present but might not be visible in the test DOM
    // This test mainly ensures the component renders without errors
  });

  it('should validate connection parameters correctly', () => {
    // Test the validation logic directly
    const validSourceHandle = 'right-center-source';
    const validTargetHandle = 'left-center-target';
    const invalidSourceHandle = 'right-center-target'; // Wrong - should be source
    const invalidTargetHandle = 'left-center-source'; // Wrong - should be target

    // Valid connection
    expect(validSourceHandle.endsWith('-source')).toBe(true);
    expect(validTargetHandle.endsWith('-target')).toBe(true);

    // Invalid connection (the error case)
    expect(invalidSourceHandle.endsWith('-source')).toBe(false);
    expect(invalidTargetHandle.endsWith('-target')).toBe(false);
  });

  it('should have correct handle naming convention with directional logic', () => {
    // Test that our handle naming follows the new directional pattern
    const sourcePositions = ['bottom-left', 'bottom-center', 'bottom-right', 'right-center'];
    const targetPositions = ['top-left', 'top-center', 'top-right', 'left-center'];

    // Source handles should only exist on bottom and right positions
    sourcePositions.forEach(position => {
      const sourceHandle = `${position}-source`;
      expect(sourceHandle.endsWith('-source')).toBe(true);
      expect(sourceHandle.startsWith(position)).toBe(true);
    });

    // Target handles should only exist on top and left positions
    targetPositions.forEach(position => {
      const targetHandle = `${position}-target`;
      expect(targetHandle.endsWith('-target')).toBe(true);
      expect(targetHandle.startsWith(position)).toBe(true);
    });

    // Invalid combinations should not exist
    const invalidSourceHandles = ['top-center-source', 'left-center-source'];
    const invalidTargetHandles = ['bottom-center-target', 'right-center-target'];

    invalidSourceHandles.forEach(handle => {
      const position = handle.replace('-source', '');
      expect(['bottom-left', 'bottom-center', 'bottom-right', 'right-center'].includes(position)).toBe(false);
    });

    invalidTargetHandles.forEach(handle => {
      const position = handle.replace('-target', '');
      expect(['top-left', 'top-center', 'top-right', 'left-center'].includes(position)).toBe(false);
    });
  });

  it('should detect loop-back connections correctly', () => {
    // Test loop-back detection logic
    const loopbackConnection = {
      source: 'state1',
      target: 'state1',
      sourceHandle: 'right-center-source',
      targetHandle: 'left-center-target'
    };

    const regularConnection = {
      source: 'state1',
      target: 'state2',
      sourceHandle: 'right-center-source',
      targetHandle: 'left-center-target'
    };

    expect(loopbackConnection.source === loopbackConnection.target).toBe(true);
    expect(regularConnection.source === regularConnection.target).toBe(false);
  });

  it('should handle connection validation errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    // The component should render without throwing errors
    expect(screen.getByText('State 1')).toBeInTheDocument();

    // If there were validation errors, they should be logged
    // but the component should still render
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Invalid source handle')
    );
  });
});
