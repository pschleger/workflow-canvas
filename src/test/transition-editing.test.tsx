import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'

// Mock the API service
vi.mock('../services/mockApi')

describe('Transition Editing Tests', () => {
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
            description: 'Transition when user completes registration',
            conditions: [
              { field: 'email_verified', operator: 'equals', value: true }
            ],
            actions: [
              { type: 'send_notification', parameters: { message: 'Welcome!' } }
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

  it('should open TransitionEditor when edit button is clicked', async () => {
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

    // Find and click the edit button for the transition
    const editButton = screen.getByTitle('Edit transition')
    await user.click(editButton)

    // Verify the TransitionEditor opens
    await waitFor(() => {
      expect(screen.getByText('Edit Transition')).toBeInTheDocument()
    })

    // Verify the transition data is loaded in the editor
    expect(screen.getByDisplayValue('Complete Registration')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Transition when user completes registration')).toBeInTheDocument()
  })

  it('should NOT open TransitionEditor when double-clicking transition (demonstrating the bug)', async () => {
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

    // Find the transition label (this is what users would double-click)
    const transitionLabel = screen.getByText('Complete Registration')
    
    // Double-click the transition label
    await user.dblClick(transitionLabel)

    // Wait a moment to see if the editor opens
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify the TransitionEditor does NOT open (this demonstrates the bug)
    expect(screen.queryByText('Edit Transition')).not.toBeInTheDocument()
  })

  it('should open TransitionEditor when double-clicking transition (after fix)', async () => {
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

    // Find the transition label
    const transitionLabel = screen.getByText('Complete Registration')
    
    // Double-click the transition label
    await user.dblClick(transitionLabel)

    // Verify the TransitionEditor opens (this should work after the fix)
    await waitFor(() => {
      expect(screen.getByText('Edit Transition')).toBeInTheDocument()
    })

    // Verify the transition data is loaded in the editor
    expect(screen.getByDisplayValue('Complete Registration')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Transition when user completes registration')).toBeInTheDocument()
  })

  it('should close TransitionEditor when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Load a workflow and open the editor
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })

    await user.click(screen.getByText('User'))

    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })

    await user.click(screen.getByText('User Registration'))

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })

    // Open the editor using the edit button
    const editButton = screen.getByTitle('Edit transition')
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Transition')).toBeInTheDocument()
    })

    // Close the editor
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    // Verify the editor is closed
    await waitFor(() => {
      expect(screen.queryByText('Edit Transition')).not.toBeInTheDocument()
    })
  })
})
