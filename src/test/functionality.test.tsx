import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'

// Mock the API service
vi.mock('../services/mockApi')

describe('App Functionality Tests', () => {
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

  it('renders the application without crashing', () => {
    render(<App />)
    expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument()
  })

  it('has functional import and export buttons', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Import button should be clickable
    const importButton = screen.getByText('Import')
    expect(importButton).toBeInTheDocument()
    await user.click(importButton)
    
    // Export button should be clickable
    const exportButton = screen.getByText('Export')
    expect(exportButton).toBeInTheDocument()
    await user.click(exportButton)
  })

  it('dark mode toggle works', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const darkModeButton = screen.getByLabelText('Toggle dark mode')
    expect(darkModeButton).toBeInTheDocument()
    
    // Should be able to click without errors
    await user.click(darkModeButton)
  })

  it('loads entities and workflows correctly', async () => {
    render(<App />)
    
    // Should load entities
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    expect(MockApiService.getEntities).toHaveBeenCalledOnce()
  })

  it('entity expansion and workflow selection works', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Wait for entities to load
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    // Click on User entity
    await user.click(screen.getByText('User'))
    
    // Should load workflows
    await waitFor(() => {
      expect(MockApiService.getWorkflows).toHaveBeenCalledWith('user-entity')
    })
    
    // Should show workflow
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    
    // Click on workflow
    await user.click(screen.getByText('User Registration'))
    
    // Should load workflow details
    await waitFor(() => {
      expect(MockApiService.getWorkflow).toHaveBeenCalledWith('user-entity', 'user-registration')
    })
  })

  it('shows React Flow canvas when workflow is loaded', async () => {
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

  it('displays workflow information correctly', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User Registration'))
    
    // Should show workflow details in the canvas panel
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
  })
})
