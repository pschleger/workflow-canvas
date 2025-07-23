import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { TransitionEdge } from '../components/Canvas/TransitionEdge'
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

describe('Transition Styling Verification', () => {
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

  it('should apply correct inline styles for manual transitions', () => {
    const manualTransition = createMockTransition(true)
    const props = createMockEdgeProps(manualTransition)

    render(
      <ReactFlowProvider>
        <TransitionEdge {...props} />
      </ReactFlowProvider>
    )

    const baseEdge = screen.getByTestId('base-edge')
    
    // Check that manual transitions have green color and thin stroke
    expect(baseEdge).toHaveClass('stroke-green-500')
    expect(baseEdge).toHaveStyle({ strokeWidth: '1.5' })
  })

  it('should apply correct inline styles for automated transitions', () => {
    const automatedTransition = createMockTransition(false)
    const props = createMockEdgeProps(automatedTransition)

    render(
      <ReactFlowProvider>
        <TransitionEdge {...props} />
      </ReactFlowProvider>
    )

    const baseEdge = screen.getByTestId('base-edge')
    
    // Check that automated transitions have amber color and thick stroke
    expect(baseEdge).toHaveClass('stroke-amber-500')
    expect(baseEdge).toHaveStyle({ strokeWidth: '3' })
  })

  it('should apply correct inline styles for selected transitions', () => {
    const transition = createMockTransition(false)
    const props = { ...createMockEdgeProps(transition), selected: true }

    render(
      <ReactFlowProvider>
        <TransitionEdge {...props} />
      </ReactFlowProvider>
    )

    const baseEdge = screen.getByTestId('base-edge')
    
    // Check that selected transitions have blue color and medium stroke
    expect(baseEdge).toHaveClass('stroke-blue-500')
    expect(baseEdge).toHaveStyle({ strokeWidth: '2' })
  })

  it('should treat undefined manual as automated', () => {
    const undefinedTransition = createMockTransition(undefined)
    const props = createMockEdgeProps(undefinedTransition)

    render(
      <ReactFlowProvider>
        <TransitionEdge {...props} />
      </ReactFlowProvider>
    )

    const baseEdge = screen.getByTestId('base-edge')
    
    // Check that undefined manual is treated as automated (amber + thick)
    expect(baseEdge).toHaveClass('stroke-amber-500')
    expect(baseEdge).toHaveStyle({ strokeWidth: '3' })
  })
})
