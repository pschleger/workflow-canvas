import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntityWorkflowSelector } from '../../components/Sidebar/EntityWorkflowSelector'

describe('EntityWorkflowSelector', () => {
  const mockProps = {
    selectedEntityId: null,
    selectedWorkflowId: null,
    onEntitySelect: vi.fn(),
    onWorkflowSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component with title', async () => {
    render(<EntityWorkflowSelector {...mockProps} />)

    // Wait for loading to complete and title to appear
    await waitFor(() => {
      expect(screen.getByText('Entities & Workflows')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<EntityWorkflowSelector {...mockProps} />)

    // Should show loading animation - check for the loading container
    const loadingContainer = document.querySelector('.animate-pulse')
    expect(loadingContainer).toBeInTheDocument()
  })

  it('loads and displays entities', async () => {
    render(<EntityWorkflowSelector {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Order')).toBeInTheDocument()
      expect(screen.getByText('Payment')).toBeInTheDocument()
    })
  })

  it('shows entity workflow count', async () => {
    render(<EntityWorkflowSelector {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('2 workflows')).toBeInTheDocument() // User entity
      expect(screen.getAllByText('1 workflow')).toHaveLength(2)  // Order and Payment entities
    })
  })

  it('expands entity and loads workflows when clicked', async () => {
    const user = userEvent.setup()
    render(<EntityWorkflowSelector {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })

    await user.click(screen.getByText('User'))

    await waitFor(() => {
      expect(mockProps.onEntitySelect).toHaveBeenCalledWith('user-entity')
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
      expect(screen.getByText('User Verification')).toBeInTheDocument()
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
      expect(screen.getByText('4 states')).toBeInTheDocument()  // User Registration workflow
      expect(screen.getByText('5 transitions')).toBeInTheDocument()
      expect(screen.getByText('3 states')).toBeInTheDocument()  // User Verification workflow
      expect(screen.getByText('4 transitions')).toBeInTheDocument()
    })
  })
})
