import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntityWorkflowSelector } from '../../components/Sidebar/EntityWorkflowSelector'
import { MockApiService } from '../../services/mockApi'

vi.mock('../../services/mockApi')

describe('EntityWorkflowSelector', () => {
  const mockProps = {
    selectedEntityId: null,
    selectedWorkflowId: null,
    onEntitySelect: vi.fn(),
    onWorkflowSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(MockApiService.getEntities).mockResolvedValue({
      data: [
        { id: 'user-entity', name: 'User', description: 'User workflows', workflowCount: 2 },
        { id: 'order-entity', name: 'Order', description: 'Order workflows', workflowCount: 1 }
      ],
      success: true,
      message: 'Success'
    })
    
    vi.mocked(MockApiService.getWorkflows).mockResolvedValue({
      data: [
        { 
          id: 'user-registration', 
          name: 'User Registration', 
          description: 'User registration workflow',
          stateCount: 4,
          transitionCount: 5,
          updatedAt: '2024-01-15T10:30:00Z'
        }
      ],
      success: true,
      message: 'Success'
    })
  })

  it('renders the component with title', () => {
    render(<EntityWorkflowSelector {...mockProps} />)
    
    expect(screen.getByText('Entities & Workflows')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<EntityWorkflowSelector {...mockProps} />)
    
    // Should show loading animation
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
  })

  it('loads and displays entities', async () => {
    render(<EntityWorkflowSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Order')).toBeInTheDocument()
    })
    
    expect(MockApiService.getEntities).toHaveBeenCalledOnce()
  })

  it('shows entity workflow count', async () => {
    render(<EntityWorkflowSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('2 workflows')).toBeInTheDocument()
      expect(screen.getByText('1 workflow')).toBeInTheDocument()
    })
  })

  it('expands entity and loads workflows when clicked', async () => {
    const user = userEvent.setup()
    render(<EntityWorkflowSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    expect(mockProps.onEntitySelect).toHaveBeenCalledWith('user-entity')
    
    await waitFor(() => {
      expect(MockApiService.getWorkflows).toHaveBeenCalledWith('user-entity')
    })
  })

  it('displays workflows after entity expansion', async () => {
    const user = userEvent.setup()
    render(<EntityWorkflowSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
  })

  it('calls onWorkflowSelect when workflow is clicked', async () => {
    const user = userEvent.setup()
    render(<EntityWorkflowSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User Registration'))
    
    expect(mockProps.onWorkflowSelect).toHaveBeenCalledWith('user-entity', 'user-registration')
  })

  it('highlights selected entity', async () => {
    const propsWithSelection = {
      ...mockProps,
      selectedEntityId: 'user-entity'
    }
    
    render(<EntityWorkflowSelector {...propsWithSelection} />)
    
    await waitFor(() => {
      const userButton = screen.getByText('User').closest('button')
      expect(userButton).toHaveClass('bg-blue-50')
    })
  })

  it('highlights selected workflow', async () => {
    const user = userEvent.setup()
    const propsWithSelection = {
      ...mockProps,
      selectedEntityId: 'user-entity',
      selectedWorkflowId: 'user-registration'
    }
    
    render(<EntityWorkflowSelector {...propsWithSelection} />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      const workflowButton = screen.getByText('User Registration').closest('button')
      expect(workflowButton).toHaveClass('bg-blue-100')
    })
  })

  it('shows workflow metadata', async () => {
    const user = userEvent.setup()
    render(<EntityWorkflowSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('4 states')).toBeInTheDocument()
      expect(screen.getByText('5 transitions')).toBeInTheDocument()
    })
  })
})
