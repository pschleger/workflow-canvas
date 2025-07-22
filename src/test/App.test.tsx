import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'

// Mock the API service
vi.mock('../services/mockApi')

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock API responses
    vi.mocked(MockApiService.getEntities).mockResolvedValue({
      data: [
        { id: 'user-entity', name: 'User', description: 'User workflows', workflowCount: 2 }
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
    
    vi.mocked(MockApiService.getWorkflow).mockResolvedValue({
      data: {
        id: 'user-registration',
        entityId: 'user-entity',
        name: 'User Registration',
        description: 'User registration workflow',
        version: 1,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        states: [
          {
            id: 'pending',
            name: 'Pending',
            description: 'User has started registration',
            position: { x: 100, y: 100 },
            isInitial: true,
            properties: { color: '#fbbf24' }
          }
        ],
        transitions: []
      },
      success: true,
      message: 'Success'
    })
  })

  it('renders the main layout with header and sidebar', () => {
    render(<App />)
    
    // Check header elements
    expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument()
    expect(screen.getByText('Import')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
    
    // Check sidebar
    expect(screen.getByText('Entities & Workflows')).toBeInTheDocument()
  })

  it('loads and displays entities in the sidebar', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    expect(MockApiService.getEntities).toHaveBeenCalledOnce()
  })

  it('expands entity and loads workflows when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    // Click on User entity
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(MockApiService.getWorkflows).toHaveBeenCalledWith('user-entity')
    })
  })

  it('loads workflow when workflow is selected', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Wait for entities to load
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    // Click on User entity to expand
    await user.click(screen.getByText('User'))
    
    // Wait for workflows to load and click on workflow
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User Registration'))
    
    await waitFor(() => {
      expect(MockApiService.getWorkflow).toHaveBeenCalledWith('user-entity', 'user-registration')
    })
  })

  it('toggles dark mode when dark mode button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const darkModeButton = screen.getByLabelText('Toggle dark mode')
    await user.click(darkModeButton)
    
    // Check if dark class is applied to the root div
    const rootDiv = screen.getByText('State Machine Workflow Editor').closest('div')
    expect(rootDiv).toHaveClass('dark')
  })

  it('shows export button and handles export click', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const exportButton = screen.getByText('Export')
    expect(exportButton).toBeInTheDocument()
    
    // Should not crash when clicked without a workflow
    await user.click(exportButton)
  })

  it('shows import button and handles import click', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const importButton = screen.getByText('Import')
    expect(importButton).toBeInTheDocument()
    
    // Should trigger file input creation when clicked
    await user.click(importButton)
    
    expect(document.createElement).toHaveBeenCalledWith('input')
  })

  it('displays workflow canvas when workflow is loaded', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Load a workflow
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User Registration'))
    
    // Check if React Flow canvas is rendered
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })
  })

  it('shows empty state when no workflow is selected', () => {
    render(<App />)
    
    expect(screen.getByText('No Workflow Selected')).toBeInTheDocument()
    expect(screen.getByText('Select an entity and workflow from the sidebar to start editing')).toBeInTheDocument()
  })
})
