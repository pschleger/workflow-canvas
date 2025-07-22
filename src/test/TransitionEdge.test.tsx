import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransitionEdge } from '../components/Canvas/TransitionEdge'
import type { EdgeProps } from '@xyflow/react'
import type { WorkflowTransition } from '../types/workflow'

// Mock the @xyflow/react components
vi.mock('@xyflow/react', () => ({
  getBezierPath: () => ['M 0 0 L 100 100', 50, 50],
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="edge-label-renderer">{children}</div>,
  BaseEdge: ({ id, path }: { id: string; path: string }) => 
    <path data-testid="base-edge" id={id} d={path} />,
}))

describe('TransitionEdge', () => {
  const mockTransition: WorkflowTransition = {
    id: 'test-transition',
    sourceStateId: 'source',
    targetStateId: 'target',
    name: 'Test Transition',
    description: 'Test transition description',
    conditions: [
      { field: 'status', operator: 'equals', value: 'active' }
    ],
    actions: [
      { type: 'send_notification', parameters: { message: 'Hello' } }
    ]
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
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransition)
  })

  it('calls onEdit when transition label is double-clicked', async () => {
    const user = userEvent.setup()
    render(<TransitionEdge {...defaultProps} />)
    
    const transitionLabel = screen.getByText('Test Transition').closest('div')
    expect(transitionLabel).toBeInTheDocument()
    
    // Double-click the transition label container
    await user.dblClick(transitionLabel!)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransition)
  })

  it('shows condition and action indicators', () => {
    render(<TransitionEdge {...defaultProps} />)
    
    // Should show condition indicator with count
    expect(screen.getByText('1')).toBeInTheDocument() // condition count
    
    // Should show action indicator with count  
    const actionCounts = screen.getAllByText('1')
    expect(actionCounts).toHaveLength(2) // one for conditions, one for actions
  })

  it('handles transition without conditions or actions', () => {
    const transitionWithoutConditionsActions: WorkflowTransition = {
      ...mockTransition,
      conditions: undefined,
      actions: undefined,
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
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransition)
  })

  it('shows selected state styling', () => {
    const selectedProps = {
      ...defaultProps,
      selected: true,
    }

    render(<TransitionEdge {...selectedProps} />)
    
    const baseEdge = screen.getByTestId('base-edge')
    expect(baseEdge).toHaveClass('stroke-blue-500', 'stroke-2')
  })
})
