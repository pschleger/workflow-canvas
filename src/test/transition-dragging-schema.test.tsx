import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { TransitionEdge } from '../components/Canvas/TransitionEdge'
import type { UITransitionData, TransitionDefinition } from '../types/workflow'

// Mock the EdgeLabelRenderer to avoid React Flow complexities
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <div data-testid="edge-label-renderer">{children}</div>,
    BaseEdge: ({ id }: { id: string }) => <path data-testid={`base-edge-${id}`} />
  }
})

describe('Transition Dragging with Schema', () => {
  let mockOnEdit: ReturnType<typeof vi.fn>
  let mockOnUpdate: ReturnType<typeof vi.fn>
  let mockTransition: UITransitionData

  beforeEach(() => {
    mockOnEdit = vi.fn()
    mockOnUpdate = vi.fn()
    
    const transitionDefinition: TransitionDefinition = {
      name: 'Test Transition',
      next: 'target-state',
      manual: false,
      disabled: false,
      criterion: {
        type: 'simple',
        field: 'status',
        operator: 'equals',
        value: 'active'
      },
      processors: [
        {
          name: 'test-processor',
          executionMode: 'SYNC',
          config: {
            attachEntity: true
          }
        }
      ]
    }

    mockTransition = {
      id: 'test-transition',
      sourceStateId: 'source-state',
      targetStateId: 'target-state',
      definition: transitionDefinition,
      labelPosition: { x: 0, y: 0 }
    }
  })

  const renderTransitionEdge = (transition: UITransitionData = mockTransition) => {
    const mockEdgeProps = {
      id: 'test-edge',
      sourceX: 100,
      sourceY: 100,
      targetX: 300,
      targetY: 200,
      sourcePosition: 'right' as const,
      targetPosition: 'left' as const,
      data: {
        transition,
        onEdit: mockOnEdit,
        onUpdate: mockOnUpdate,
      },
      selected: false,
    }

    return render(
      <ReactFlowProvider>
        <TransitionEdge {...mockEdgeProps} />
      </ReactFlowProvider>
    )
  }

  it('should render transition with drag handle', () => {
    renderTransitionEdge()
    
    // Should show the transition name
    expect(screen.getByText('Test Transition')).toBeInTheDocument()
    
    // Should show drag handle (Move icon)
    expect(screen.getByTestId('edge-label-renderer')).toBeInTheDocument()
    
    // Should show criterion indicator
    expect(screen.getByText('Criterion')).toBeInTheDocument()
    
    // Should show processor indicator
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should handle mouse down and start dragging', () => {
    renderTransitionEdge()
    
    const labelContainer = screen.getByTestId('edge-label-renderer').firstChild as HTMLElement
    
    // Simulate mouse down to start dragging
    fireEvent.mouseDown(labelContainer, {
      clientX: 200,
      clientY: 150,
      button: 0
    })
    
    // Should not call onEdit immediately (dragging, not editing)
    expect(mockOnEdit).not.toHaveBeenCalled()
  })

  it('should update position during drag and call onUpdate on mouse up', () => {
    renderTransitionEdge()
    
    const labelContainer = screen.getByTestId('edge-label-renderer').firstChild as HTMLElement
    
    // Start dragging
    fireEvent.mouseDown(labelContainer, {
      clientX: 200,
      clientY: 150,
      button: 0
    })
    
    // Simulate mouse move
    fireEvent.mouseMove(document, {
      clientX: 250,
      clientY: 200
    })
    
    // Simulate mouse up
    fireEvent.mouseUp(document, {
      clientX: 250,
      clientY: 200
    })
    
    // Should call onUpdate with new position
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-transition',
        labelPosition: expect.objectContaining({
          x: 50, // 250 - 200 (start position)
          y: 50  // 200 - 150 (start position)
        })
      })
    )
  })

  it('should show reset button when label is moved significantly', () => {
    const movedTransition = {
      ...mockTransition,
      labelPosition: { x: 100, y: 100 } // Moved significantly
    }
    
    renderTransitionEdge(movedTransition)
    
    // Should show reset button when moved significantly
    const resetButton = screen.getByTitle('Reset label position')
    expect(resetButton).toBeInTheDocument()
  })

  it('should reset position when reset button is clicked', () => {
    const movedTransition = {
      ...mockTransition,
      labelPosition: { x: 100, y: 100 } // Moved significantly
    }
    
    renderTransitionEdge(movedTransition)
    
    const resetButton = screen.getByTitle('Reset label position')
    fireEvent.click(resetButton)
    
    // Should call onUpdate with undefined labelPosition
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-transition',
        labelPosition: undefined
      })
    )
  })

  it('should call onEdit when edit button is clicked', () => {
    renderTransitionEdge()
    
    const editButton = screen.getByTitle('Edit transition')
    fireEvent.click(editButton)
    
    expect(mockOnEdit).toHaveBeenCalledWith('test-transition')
  })

  it('should call onEdit when double-clicked', () => {
    renderTransitionEdge()
    
    const labelContainer = screen.getByTestId('edge-label-renderer').firstChild as HTMLElement
    fireEvent.doubleClick(labelContainer)
    
    expect(mockOnEdit).toHaveBeenCalledWith('test-transition')
  })
})
