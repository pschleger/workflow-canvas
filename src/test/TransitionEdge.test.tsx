import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransitionEdge } from '../components/Canvas/TransitionEdge'
import type { EdgeProps } from '@xyflow/react'
import type { WorkflowTransition, UITransitionData, TransitionDefinition } from '../types/workflow'

// Create a mock function to track BaseEdge calls
const mockBaseEdge = vi.fn()

// Mock the @xyflow/react components
vi.mock('@xyflow/react', () => ({
  getBezierPath: () => ['M 0 0 L 100 100', 50, 50],
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="edge-label-renderer">{children}</div>,
  BaseEdge: (props: { id: string; path: string; className?: string; [key: string]: any }) => {
    mockBaseEdge(props)
    return <path data-testid="base-edge" id={props.id} d={props.path} className={props.className} {...props} />
  },
}))

describe('TransitionEdge', () => {
  const mockTransition: UITransitionData = {
    id: 'test-transition',
    sourceStateId: 'source',
    targetStateId: 'target',
    definition: {
      name: 'Test Transition',
      next: 'target',
      manual: true,
      criterion: { field: 'status', operator: 'equals', value: 'active' },
      processors: [
        { name: 'send_notification', config: { message: 'Hello' } }
      ]
    }
  }

  const mockOnEdit = vi.fn()
  const mockOnUpdate = vi.fn()

  const defaultProps: EdgeProps = {
    id: 'edge-1',
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: 'right' as any,
    targetPosition: 'left' as any,
    data: {
      transition: mockTransition,
      onEdit: mockOnEdit,
      onUpdate: mockOnUpdate,
    },
    selected: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders transition with name and indicators', () => {
    render(<TransitionEdge {...defaultProps} />)
    
    expect(screen.getByText('Test Transition')).toBeInTheDocument()
    expect(screen.getByTestId('base-edge')).toBeInTheDocument()
    expect(screen.getByTestId('edge-label-renderer')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<TransitionEdge {...defaultProps} />)

    const editButton = screen.getByTitle('Edit transition')
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockTransition.id)
  })

  it('calls onEdit when transition label is double-clicked', async () => {
    const user = userEvent.setup()
    render(<TransitionEdge {...defaultProps} />)
    
    const transitionLabel = screen.getByText('Test Transition').closest('div')
    expect(transitionLabel).toBeInTheDocument()
    
    // Double-click the transition label container
    await user.dblClick(transitionLabel!)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransition.id)
  })

  it('shows condition and action indicators', () => {
    render(<TransitionEdge {...defaultProps} />)

    // Should show processor count (the component only shows count for processors, not criterion)
    expect(screen.getByText('1')).toBeInTheDocument() // processor count

    // Should show both criterion icon and processor count
    const criterionIcon = screen.getByTitle('Has criterion')
    expect(criterionIcon).toBeInTheDocument()

    const processorInfo = screen.getByTitle('1 processors')
    expect(processorInfo).toBeInTheDocument()
  })

  it('handles transition without conditions or actions', () => {
    const transitionWithoutConditionsActions: UITransitionData = {
      ...mockTransition,
      definition: {
        ...mockTransition.definition,
        criterion: undefined,
        processors: undefined,
      }
    }

    const propsWithoutConditionsActions = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        transition: transitionWithoutConditionsActions,
      },
    }

    render(<TransitionEdge {...propsWithoutConditionsActions} />)

    expect(screen.getByText('Test Transition')).toBeInTheDocument()
    // Should not show condition/action indicators
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('prevents event propagation on double-click', async () => {
    const user = userEvent.setup()
    const mockStopPropagation = vi.fn()
    
    render(<TransitionEdge {...defaultProps} />)
    
    const transitionLabel = screen.getByText('Test Transition').closest('div')
    
    // Mock the event object
    const originalAddEventListener = transitionLabel!.addEventListener
    transitionLabel!.addEventListener = vi.fn((event, handler) => {
      if (event === 'dblclick') {
        const mockEvent = {
          stopPropagation: mockStopPropagation,
          preventDefault: vi.fn(),
        }
        ;(handler as any)(mockEvent)
      }
    })
    
    await user.dblClick(transitionLabel!)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransition.id)
  })

  it('shows selected state styling', () => {
    const selectedProps = {
      ...defaultProps,
      selected: true,
    }

    render(<TransitionEdge {...selectedProps} />)

    const baseEdge = screen.getByTestId('base-edge')
    expect(baseEdge).toHaveClass('stroke-blue-500')
    expect(baseEdge).toHaveStyle({ strokeWidth: '2' })
  })

  describe('Manual vs Automated Transition Styling', () => {
    const createMockTransition = (manual: boolean): UITransitionData => ({
      id: 'test-transition',
      sourceStateId: 'state1',
      targetStateId: 'state2',
      definition: {
        name: 'Test Transition',
        next: 'state2',
        manual: manual,
      } as TransitionDefinition,
    })

    const createMockEdgeProps = (transition: UITransitionData): EdgeProps => ({
      id: 'edge-1',
      sourceX: 100,
      sourceY: 100,
      targetX: 200,
      targetY: 200,
      sourcePosition: 'right' as any,
      targetPosition: 'left' as any,
      data: {
        transition,
        onEdit: vi.fn(),
        onUpdate: vi.fn(),
      },
      selected: false,
    })

    it('should apply different colors for manual vs automated transitions', () => {
      mockBaseEdge.mockClear()

      // Test manual transition (should have one color)
      const manualTransition = createMockTransition(true)
      const manualProps = createMockEdgeProps(manualTransition)

      const { rerender } = render(<TransitionEdge {...manualProps} />)

      // Get the className from the last mock call (in case there are multiple renders)
      const manualCall = mockBaseEdge.mock.calls[mockBaseEdge.mock.calls.length - 1]
      const manualClassName = manualCall[0].className

      // Test automated transition (should have different color)
      const automatedTransition = createMockTransition(false)
      const automatedProps = createMockEdgeProps(automatedTransition)

      rerender(<TransitionEdge {...automatedProps} />)

      // Get the className from the last mock call
      const automatedCall = mockBaseEdge.mock.calls[mockBaseEdge.mock.calls.length - 1]
      const automatedClassName = automatedCall[0].className

      // Colors should be different
      expect(manualClassName).not.toBe(automatedClassName)
      expect(manualClassName).toContain('green')
      expect(automatedClassName).toContain('amber')
    })

    it('should apply thicker stroke for automated transitions', () => {
      mockBaseEdge.mockClear()

      // Test manual transition (should have normal thickness)
      const manualTransition = createMockTransition(true)
      const manualProps = createMockEdgeProps(manualTransition)

      const { rerender } = render(<TransitionEdge {...manualProps} />)

      // Get the props from the last mock call
      const manualCall = mockBaseEdge.mock.calls[mockBaseEdge.mock.calls.length - 1]
      const manualStyle = manualCall[0].style || {}

      // Test automated transition (should have thicker stroke)
      const automatedTransition = createMockTransition(false)
      const automatedProps = createMockEdgeProps(automatedTransition)

      rerender(<TransitionEdge {...automatedProps} />)

      // Get the props from the last mock call
      const automatedCall = mockBaseEdge.mock.calls[mockBaseEdge.mock.calls.length - 1]
      const automatedStyle = automatedCall[0].style || {}

      // Manual transitions should have thinner stroke
      expect(manualStyle.strokeWidth).toBe(1.5)
      // Automated transitions should have thicker stroke
      expect(automatedStyle.strokeWidth).toBe(3)
    })

    it('should handle undefined manual attribute as automated (false)', () => {
      mockBaseEdge.mockClear()

      // Test transition with undefined manual attribute (should be treated as automated)
      const undefinedManualTransition: UITransitionData = {
        id: 'test-transition',
        sourceStateId: 'state1',
        targetStateId: 'state2',
        definition: {
          name: 'Test Transition',
          next: 'state2',
          // manual is undefined
        } as TransitionDefinition,
      }

      const props = createMockEdgeProps(undefinedManualTransition)
      render(<TransitionEdge {...props} />)

      // Get the props from the last mock call
      const call = mockBaseEdge.mock.calls[mockBaseEdge.mock.calls.length - 1]
      const style = call[0].style || {}

      // Should be treated as automated (thick stroke)
      expect(style.strokeWidth).toBe(3)
    })
  })
})
