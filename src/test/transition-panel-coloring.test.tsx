import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { TransitionEdge } from '../components/Canvas/TransitionEdge'
import { LoopbackEdge } from '../components/Canvas/LoopbackEdge'
import type { UITransitionData, TransitionDefinition } from '../types/workflow'

// Mock the React Flow components
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <div data-testid="edge-label-renderer">{children}</div>,
    BaseEdge: (props: any) => <path data-testid="base-edge" {...props} />,
    getBezierPath: () => ['M 0 0 L 100 100', 50, 50],
  }
})

describe('Transition Panel Coloring', () => {
  const createMockTransition = (manual: boolean | undefined): UITransitionData => ({
    id: 'test-transition',
    sourceStateId: 'source',
    targetStateId: 'target',
    definition: {
      name: 'Test Transition',
      next: 'target',
      manual,
      disabled: false
    },
    labelPosition: { x: 0, y: 0 }
  })

  const createMockEdgeProps = (transition: UITransitionData) => ({
    id: 'test-edge',
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: 'right' as const,
    targetPosition: 'left' as const,
    data: {
      transition,
      onEdit: vi.fn(),
      onUpdate: vi.fn()
    },
    selected: false
  })

  describe('TransitionEdge Panel Colors', () => {
    it('should show blue panel for manual transitions', () => {
      const manualTransition = createMockTransition(true)
      const props = createMockEdgeProps(manualTransition)

      render(
        <ReactFlowProvider>
          <TransitionEdge {...props} />
        </ReactFlowProvider>
      )

      // Find the panel div that contains the transition name and has background styling
      const panel = screen.getByText('Test Transition').closest('div[class*="bg-"]')
      expect(panel).toHaveClass('bg-blue-50')
    })

    it('should show green panel for automated transitions', () => {
      const automatedTransition = createMockTransition(false)
      const props = createMockEdgeProps(automatedTransition)

      render(
        <ReactFlowProvider>
          <TransitionEdge {...props} />
        </ReactFlowProvider>
      )

      const panel = screen.getByText('Test Transition').closest('div[class*="bg-"]')
      expect(panel).toHaveClass('bg-green-50')
    })

    it('should treat undefined manual as automated (green panel)', () => {
      const undefinedTransition = createMockTransition(undefined)
      const props = createMockEdgeProps(undefinedTransition)

      render(
        <ReactFlowProvider>
          <TransitionEdge {...props} />
        </ReactFlowProvider>
      )

      const panel = screen.getByText('Test Transition').closest('div[class*="bg-"]')
      expect(panel).toHaveClass('bg-green-50')
    })
  })

  describe('LoopbackEdge Panel Colors', () => {
    const createLoopbackProps = (transition: UITransitionData) => ({
      ...createMockEdgeProps(transition),
      data: {
        transition,
        onEdit: vi.fn(),
        onUpdate: vi.fn(),
        isLoopback: true
      }
    })

    it('should show purple panel for manual loopback transitions', () => {
      const manualTransition = createMockTransition(true)
      const props = createLoopbackProps(manualTransition)

      render(
        <ReactFlowProvider>
          <LoopbackEdge {...props} />
        </ReactFlowProvider>
      )

      const panel = screen.getByText('Test Transition').closest('div[class*="bg-"]')
      expect(panel).toHaveClass('bg-purple-50')
    })

    it('should show green panel for automated loopback transitions', () => {
      const automatedTransition = createMockTransition(false)
      const props = createLoopbackProps(automatedTransition)

      render(
        <ReactFlowProvider>
          <LoopbackEdge {...props} />
        </ReactFlowProvider>
      )

      const panel = screen.getByText('Test Transition').closest('div[class*="bg-"]')
      expect(panel).toHaveClass('bg-green-50')
    })
  })
})
