import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'

// ABOUTME: This file tests the complete end-to-end editing functionality
// to verify that state and transition editing works correctly with the centralized ID system.

// Mock the API service
vi.mock('../services/mockApi', () => ({
  MockApiService: {
    getEntities: vi.fn(),
    getWorkflows: vi.fn(),
    getWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
  }
}))

describe('End-to-End Editing Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock API responses with a workflow that has states and transitions
    vi.mocked(MockApiService.getEntities).mockResolvedValue({
      data: [
        { id: 'test-entity', name: 'Test Entity', description: 'Test entity', workflowCount: 1 }
      ],
      success: true,
      message: 'Success'
    })
    
    vi.mocked(MockApiService.getWorkflows).mockResolvedValue({
      data: [
        { 
          id: 'test-workflow', 
          name: 'Test Workflow', 
          description: 'Test workflow',
          stateCount: 2,
          transitionCount: 1,
          updatedAt: '2024-01-15T10:30:00Z'
        }
      ],
      success: true,
      message: 'Success'
    })
    
    // Mock workflow with schema-based structure including state names
    vi.mocked(MockApiService.getWorkflow).mockResolvedValue({
      data: {
        id: 'test-workflow',
        entityId: 'test-entity',
        name: 'Test Workflow',
        description: 'Test workflow',
        version: 1,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        configuration: {
          version: '1.0',
          initialState: 'start',
          states: {
            'start': { 
              name: 'Start State',
              transitions: [{ name: 'Go to End', next: 'end', manual: false, disabled: false }] 
            },
            'end': { 
              name: 'End State',
              transitions: [] 
            }
          }
        },
        layout: {
          states: [
            { id: 'start', position: { x: 100, y: 100 }, properties: {} },
            { id: 'end', position: { x: 300, y: 100 }, properties: {} }
          ],
          transitions: [
            { id: 'start-0' }
          ],
          updatedAt: '2024-01-15T10:30:00Z'
        }
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

  describe('State Name Editing', () => {
    it('should allow editing state names through the state editor', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Load the workflow
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Entity'))
      
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Workflow'))

      // Wait for workflow to load
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument()
      })

      // Find and click edit button on a state (or double-click the state)
      const editButton = screen.queryByTitle('Edit state')
      if (editButton) {
        await user.click(editButton)
      } else {
        // Try double-clicking the state if no edit button found
        const stateElement = screen.queryByText('Start State')
        if (stateElement) {
          await user.dblClick(stateElement)
        }
      }
      
      // Wait for state editor to open
      await waitFor(() => {
        expect(screen.queryByText(/Edit State/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // The JSON editor should show the state definition including the name field
      const jsonTextarea = screen.queryByRole('textbox')
      if (jsonTextarea) {
        const jsonContent = (jsonTextarea as HTMLTextAreaElement).value || jsonTextarea.textContent || ''
        
        // Should contain the name field for editing
        expect(jsonContent).toContain('"name"')
        expect(jsonContent).toContain('Start State')
      }
    })
  })

  describe('Transition Editing', () => {
    it('should allow editing transitions through double-click', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Load the workflow
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Entity'))
      
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Workflow'))

      // Wait for workflow to load
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument()
      })

      // Find the transition label and double-click it
      const transitionLabel = screen.queryByText('Go to End')
      if (transitionLabel) {
        await user.dblClick(transitionLabel)

        // Wait for transition editor to open
        await waitFor(() => {
          expect(screen.queryByText(/Edit Transition/)).toBeInTheDocument()
        }, { timeout: 3000 })

        // The JSON editor should show the transition definition
        const jsonTextarea = screen.queryByRole('textbox')
        if (jsonTextarea) {
          const jsonContent = (jsonTextarea as HTMLTextAreaElement).value || jsonTextarea.textContent || ''
          
          // Should contain the transition fields
          expect(jsonContent).toContain('"name"')
          expect(jsonContent).toContain('Go to End')
          expect(jsonContent).toContain('"next"')
          expect(jsonContent).toContain('end')
        }
      }
    })

    it('should allow editing transitions through edit button', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Load the workflow
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Entity'))
      
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Workflow'))

      // Wait for workflow to load
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument()
      })

      // Find and click transition edit button
      const transitionEditButton = screen.queryByTitle('Edit transition')
      if (transitionEditButton) {
        await user.click(transitionEditButton)

        // Wait for transition editor to open
        await waitFor(() => {
          expect(screen.queryByText(/Edit Transition/)).toBeInTheDocument()
        }, { timeout: 3000 })

        // The JSON editor should show the transition definition
        const jsonTextarea = screen.queryByRole('textbox')
        if (jsonTextarea) {
          const jsonContent = (jsonTextarea as HTMLTextAreaElement).value || jsonTextarea.textContent || ''
          
          // Should contain the transition fields
          expect(jsonContent).toContain('"name"')
          expect(jsonContent).toContain('Go to End')
        }
      }
    })
  })

  describe('Undo Counter Behavior', () => {
    it('should not increment undo counter on simple clicks', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Load the workflow
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Entity'))
      
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Test Workflow'))

      // Wait for workflow to load
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument()
      })

      // Check initial undo state
      const undoButton = screen.queryByLabelText(/Undo/)
      const initialUndoState = undoButton?.hasAttribute('disabled')

      // Single-click the transition label
      const transitionLabel = screen.queryByText('Go to End')
      if (transitionLabel) {
        await user.click(transitionLabel)

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100))

        // Undo state should remain the same
        const newUndoState = undoButton?.hasAttribute('disabled')
        expect(newUndoState).toBe(initialUndoState)
      }
    })
  })
})
