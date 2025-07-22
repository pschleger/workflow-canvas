import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'

// Mock the API service
vi.mock('../services/mockApi')

describe('Workflow Switching Tests', () => {
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
        },
        { 
          id: 'user-verification', 
          name: 'User Verification', 
          description: 'User verification workflow',
          stateCount: 3,
          transitionCount: 4,
          updatedAt: '2024-01-14T15:45:00Z'
        }
      ],
      success: true,
      message: 'Success'
    })
    
    // Mock different workflow responses
    vi.mocked(MockApiService.getWorkflow).mockImplementation(async (entityId, workflowId) => {
      if (workflowId === 'user-registration') {
        return {
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
        }
      } else if (workflowId === 'user-verification') {
        return {
          data: {
            id: 'user-verification',
            entityId: 'user-entity',
            name: 'User Verification',
            description: 'User verification workflow',
            version: 1,
            createdAt: '2024-01-12T08:00:00Z',
            updatedAt: '2024-01-14T15:45:00Z',
            states: [
              {
                id: 'unverified',
                name: 'Unverified',
                description: 'User account created but not verified',
                position: { x: 100, y: 100 },
                isInitial: true,
                properties: { color: '#f59e0b' }
              }
            ],
            transitions: []
          },
          success: true,
          message: 'Success'
        }
      }
      
      return {
        data: {} as any,
        success: false,
        message: 'Workflow not found'
      }
    })
  })

  it('switches between different workflows correctly', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Wait for entities to load and expand User entity
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
      expect(screen.getByText('User Verification')).toBeInTheDocument()
    })
    
    // Click on User Registration first
    await user.click(screen.getByText('User Registration'))
    
    // Wait for workflow to load and verify it's displayed
    await waitFor(() => {
      expect(MockApiService.getWorkflow).toHaveBeenCalledWith('user-entity', 'user-registration')
    })
    
    // Now click on User Verification
    await user.click(screen.getByText('User Verification'))
    
    // Verify the new workflow is loaded
    await waitFor(() => {
      expect(MockApiService.getWorkflow).toHaveBeenCalledWith('user-entity', 'user-verification')
    })
    
    // Verify that getWorkflow was called twice (once for each workflow)
    expect(MockApiService.getWorkflow).toHaveBeenCalledTimes(2)
  })

  it('displays different workflow names in the canvas panel', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Load User Registration workflow
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User'))
    
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('User Registration'))
    
    // Wait for the workflow to load in the canvas
    await waitFor(() => {
      // Should show User Registration in the canvas panel
      const canvasElements = screen.getAllByText('User Registration')
      expect(canvasElements.length).toBeGreaterThan(1) // One in sidebar, one in canvas
    })
    
    // Now switch to User Verification
    await user.click(screen.getByText('User Verification'))
    
    // Wait for the new workflow to load
    await waitFor(() => {
      // Should now show User Verification in the canvas panel
      const canvasElements = screen.getAllByText('User Verification')
      expect(canvasElements.length).toBeGreaterThan(1) // One in sidebar, one in canvas
    })
  })
})
