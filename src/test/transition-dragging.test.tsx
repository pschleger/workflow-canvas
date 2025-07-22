import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'

// Mock the API service
vi.mock('../services/mockApi')

describe('Transition Dragging Tests', () => {
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
          },
          {
            id: 'completed',
            name: 'Completed',
            description: 'Registration completed',
            position: { x: 300, y: 100 },
            isFinal: true,
            properties: { color: '#10b981' }
          }
        ],
        transitions: [
          {
            id: 'pending-to-completed',
            sourceStateId: 'pending',
            targetStateId: 'completed',
            name: 'Complete Registration',
            conditions: [
              { field: 'email_verified', operator: 'equals', value: true }
            ]
          }
        ]
      },
      success: true,
      message: 'Success'
    })
    
    vi.mocked(MockApiService.updateWorkflow).mockResolvedValue({
      data: {} as any,
      success: true,
      message: 'Updated'
    })
  })

  it('loads workflow with transitions correctly', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Load a workflow with transitions
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })

    await user.click(screen.getByText('User'))

    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })

    await user.click(screen.getByText('User Registration'))

    // Wait for the workflow to load
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Verify workflow stats show transitions
    await waitFor(() => {
      expect(screen.getByText('1 transitions')).toBeInTheDocument()
    })
  })

  it('shows updated help text about dragging transitions', async () => {
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
    
    // Check for the updated help text
    await waitFor(() => {
      expect(screen.getByText('• Drag transition labels to reposition')).toBeInTheDocument()
    })
  })

  it('verifies API calls are made correctly for transitions', async () => {
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

    // Verify the workflow was loaded with transitions
    await waitFor(() => {
      expect(MockApiService.getWorkflow).toHaveBeenCalledWith('user-entity', 'user-registration')
    })

    // Verify the workflow data includes transitions
    const mockCall = vi.mocked(MockApiService.getWorkflow).mock.calls[0]
    expect(mockCall[0]).toBe('user-entity')
    expect(mockCall[1]).toBe('user-registration')
  })
})
