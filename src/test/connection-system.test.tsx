import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StateNode } from '../components/Canvas/StateNode';
import { LoopbackEdge } from '../components/Canvas/LoopbackEdge';
import type { UIStateData, UITransitionData } from '../types/workflow';

// ABOUTME: This file contains tests for the enhanced connection system with 8 anchor points
// and loop-back transition support to ensure proper functionality and visual behavior.

// Mock React Flow components
vi.mock('@xyflow/react', () => ({
  Handle: ({ id, type, position, className, style }: any) => (
    <div 
      data-testid={`handle-${type}-${id || position}`}
      data-type={type}
      data-position={position}
      className={className}
      style={style}
    />
  ),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right'
  },
  EdgeLabelRenderer: ({ children }: any) => <div data-testid="edge-label-renderer">{children}</div>,
  BaseEdge: ({ id, path, className }: any) => (
    <path data-testid={`edge-${id}`} d={path} className={className} />
  ),
}));

describe('Connection System', () => {
  const mockState: UIStateData = {
    id: 'test-state',
    name: 'Test State',
    definition: {
      name: 'Test State',
      transitions: []
    },
    position: { x: 100, y: 100 },
    isInitial: false,
    isFinal: false
  };

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StateNode with 8 Anchor Points', () => {
    it('should render all 8 anchor points', () => {
      render(
        <StateNode 
          data={{ state: mockState, onEdit: mockOnEdit }} 
          selected={false}
          id="test-node"
          type="stateNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          zIndex={1}
        />
      );

      // Check for all 8 anchor points (each has both source and target handles)
      const anchorPoints = [
        'top-left', 'top-center', 'top-right',
        'left-center', 'right-center',
        'bottom-left', 'bottom-center', 'bottom-right'
      ];

      anchorPoints.forEach(anchor => {
        expect(screen.getByTestId(`handle-source-${anchor}-source`)).toBeInTheDocument();
        expect(screen.getByTestId(`handle-target-${anchor}-target`)).toBeInTheDocument();
      });
    });

    it('should have proper positioning for anchor points', () => {
      render(
        <StateNode 
          data={{ state: mockState, onEdit: mockOnEdit }} 
          selected={false}
          id="test-node"
          type="stateNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          zIndex={1}
        />
      );

      // Check top-center handle positioning
      const topCenterHandle = screen.getByTestId('handle-source-top-center-source');
      expect(topCenterHandle).toHaveStyle({ left: '50%', top: '-6px' });

      // Check left-center handle positioning  
      const leftCenterHandle = screen.getByTestId('handle-source-left-center-source');
      expect(leftCenterHandle).toHaveStyle({ left: '-6px', top: '50%' });
    });

    it('should show handles with visible opacity and hover effects', () => {
      render(
        <StateNode
          data={{ state: mockState, onEdit: mockOnEdit }}
          selected={false}
          id="test-node"
          type="stateNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          zIndex={1}
        />
      );

      const handle = screen.getByTestId('handle-source-top-center-source');
      expect(handle).toHaveClass('opacity-60', 'hover:opacity-100', 'hover:scale-110', 'transition-all');
    });

    it('should distinguish source and target handles by color', () => {
      render(
        <StateNode 
          data={{ state: mockState, onEdit: mockOnEdit }} 
          selected={false}
          id="test-node"
          type="stateNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          zIndex={1}
        />
      );

      const sourceHandle = screen.getByTestId('handle-source-top-center-source');
      const targetHandle = screen.getByTestId('handle-target-top-center-target');

      expect(sourceHandle).toHaveClass('!bg-blue-500');
      expect(targetHandle).toHaveClass('!bg-green-500');
    });
  });

  describe('LoopbackEdge Component', () => {
    const mockTransition: UITransitionData = {
      id: 'test-transition',
      sourceStateId: 'test-state',
      targetStateId: 'test-state', // Same as source for loop-back
      definition: {
        name: 'Loop-back Transition',
        next: 'test-state',
        manual: false,
        disabled: false
      },
      labelPosition: { x: 0, y: -60 }
    };

    const mockOnTransitionEdit = vi.fn();
    const mockOnTransitionUpdate = vi.fn();

    it('should render loop-back edge with curved path', () => {
      render(
        <LoopbackEdge
          id="test-edge"
          sourceX={100}
          sourceY={100}
          targetX={100}
          targetY={100}
          data={{
            transition: mockTransition,
            onEdit: mockOnTransitionEdit,
            onUpdate: mockOnTransitionUpdate,
            isLoopback: true
          }}
          selected={false}
        />
      );

      const edge = screen.getByTestId('edge-test-edge');
      expect(edge).toBeInTheDocument();
      expect(edge).toHaveClass('stroke-purple-400');
    });

    it('should show loop-back specific styling', () => {
      render(
        <LoopbackEdge
          id="test-edge"
          sourceX={100}
          sourceY={100}
          targetX={100}
          targetY={100}
          data={{
            transition: mockTransition,
            onEdit: mockOnTransitionEdit,
            onUpdate: mockOnTransitionUpdate,
            isLoopback: true
          }}
          selected={false}
        />
      );

      const edgeLabel = screen.getByText('Loop-back Transition');
      expect(edgeLabel).toBeInTheDocument();

      // Should have purple styling for loop-back - check the outer container
      const labelContainer = screen.getByTestId('edge-label-renderer').firstChild as HTMLElement;
      const purpleContainer = labelContainer.querySelector('.bg-purple-50');
      expect(purpleContainer).toBeInTheDocument();
    });

    it('should handle label dragging for repositioning', async () => {
      render(
        <LoopbackEdge
          id="test-edge"
          sourceX={100}
          sourceY={100}
          targetX={100}
          targetY={100}
          data={{
            transition: mockTransition,
            onEdit: mockOnTransitionEdit,
            onUpdate: mockOnTransitionUpdate,
            isLoopback: true
          }}
          selected={false}
        />
      );

      const labelContainer = screen.getByTestId('edge-label-renderer').firstChild as HTMLElement;
      
      // Simulate drag start
      fireEvent.mouseDown(labelContainer, { clientX: 100, clientY: 100 });
      
      // Simulate drag move
      fireEvent.mouseMove(document, { clientX: 150, clientY: 120 });
      
      // Simulate drag end
      fireEvent.mouseUp(document);

      await waitFor(() => {
        expect(mockOnTransitionUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            labelPosition: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number)
            })
          })
        );
      });
    });

    it('should call edit handler on double-click', () => {
      render(
        <LoopbackEdge
          id="test-edge"
          sourceX={100}
          sourceY={100}
          targetX={100}
          targetY={100}
          data={{
            transition: mockTransition,
            onEdit: mockOnTransitionEdit,
            onUpdate: mockOnTransitionUpdate,
            isLoopback: true
          }}
          selected={false}
        />
      );

      const labelContainer = screen.getByTestId('edge-label-renderer').firstChild as HTMLElement;
      fireEvent.doubleClick(labelContainer);

      expect(mockOnTransitionEdit).toHaveBeenCalledWith('test-transition');
    });
  });

  describe('Connection System Integration', () => {
    it('should support bidirectional connections on all anchor points', () => {
      render(
        <StateNode
          data={{ state: mockState, onEdit: mockOnEdit }}
          selected={false}
          id="test-node"
          type="stateNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          zIndex={1}
        />
      );

      // Each anchor point should have both source and target handles
      const anchorPoints = [
        'top-left', 'top-center', 'top-right',
        'left-center', 'right-center',
        'bottom-left', 'bottom-center', 'bottom-right'
      ];

      anchorPoints.forEach(anchor => {
        expect(screen.getByTestId(`handle-source-${anchor}-source`)).toBeInTheDocument();
        expect(screen.getByTestId(`handle-target-${anchor}-target`)).toBeInTheDocument();
      });
    });

    it('should have visible handles for easy connection', () => {
      render(
        <StateNode
          data={{ state: mockState, onEdit: mockOnEdit }}
          selected={false}
          id="test-node"
          type="stateNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          zIndex={1}
        />
      );

      // Handles should be visible (not hidden) for easy connection
      const sourceHandle = screen.getByTestId('handle-source-top-center-source');
      const targetHandle = screen.getByTestId('handle-target-top-center-target');

      expect(sourceHandle).toHaveClass('opacity-60'); // Visible by default
      expect(targetHandle).toHaveClass('opacity-60'); // Visible by default

      // Should have hover effects for better UX
      expect(sourceHandle).toHaveClass('hover:opacity-100', 'hover:scale-110');
      expect(targetHandle).toHaveClass('hover:opacity-100', 'hover:scale-110');
    });

    it('should support edge reconnection through React Flow', () => {
      // This test verifies that the handles are properly configured for reconnection
      // The actual reconnection logic is tested in WorkflowCanvas integration tests
      render(
        <StateNode
          data={{ state: mockState, onEdit: mockOnEdit }}
          selected={false}
          id="test-node"
          type="stateNode"
          position={{ x: 0, y: 0 }}
          dragging={false}
          zIndex={1}
        />
      );

      // Verify handles have proper IDs for reconnection
      const sourceHandle = screen.getByTestId('handle-source-top-center-source');
      const targetHandle = screen.getByTestId('handle-target-top-center-target');

      expect(sourceHandle).toHaveAttribute('data-type', 'source');
      expect(targetHandle).toHaveAttribute('data-type', 'target');
    });
  });
});
