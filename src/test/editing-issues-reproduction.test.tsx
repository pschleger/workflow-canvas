import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MockApiService } from '../services/mockApi'

// ABOUTME: This file reproduces the editing issues reported by the user:
// 1. State names cannot be edited (no name field in editor)
// 2. Double-clicking transitions does nothing
// 3. Single-clicking transitions flashes and increments undo counter incorrectly
// 4. Edit buttons on transitions do nothing

// Mock the API service
vi.mock('../services/mockApi', () => ({
  MockApiService: {
    getEntities: vi.fn(),
    getWorkflows: vi.fn(),
    getWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
  }
}))

describe('Editing Issues Reproduction', () => {
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
    
    // Mock workflow with schema-based structure
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

  describe('State Name Editing Issues', () => {
    it('should reproduce the issue: state editor does not show name field for editing', async () => {
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

      // Try to find and click edit button on a state
      const editButton = screen.queryByTitle('Edit state')
      if (editButton) {
        await user.click(editButton)
        
        // Wait for state editor to open
        await waitFor(() => {
          expect(screen.getByText(/Edit State/)).toBeInTheDocument()
        })

        // BUG: The state editor should show a name field, but it doesn't
        // The JSON should include a "name" field that can be edited
        const jsonTextarea = screen.getByRole('textbox')
        const jsonContent = jsonTextarea.value || jsonTextarea.textContent || ''
        
        // This should pass but currently fails - no name field visible for editing
        expect(jsonContent).toContain('"name"')
        expect(jsonContent).toContain('Start State')
      } else {
        // If no edit button found, try double-clicking the state
        const stateElement = screen.getByText('Start State')
        await user.dblClick(stateElement)
        
        await waitFor(() => {
          expect(screen.getByText(/Edit State/)).toBeInTheDocument()
        })

        const jsonTextarea = screen.getByRole('textbox')
        const jsonContent = jsonTextarea.value || jsonTextarea.textContent || ''
        
        expect(jsonContent).toContain('"name"')
        expect(jsonContent).toContain('Start State')
      }
    })
  })

  describe('Transition Editing Issues', () => {
    it('should reproduce the issue: double-clicking transitions does nothing', async () => {
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

      // Try to find the transition label
      const transitionLabel = screen.queryByText('Go to End')
      if (transitionLabel) {
        // Double-click the transition
        await user.dblClick(transitionLabel)

        // Wait a moment to see if editor opens
        await new Promise(resolve => setTimeout(resolve, 500))

        // BUG: The transition editor should open, but it doesn't
        expect(screen.queryByText(/Edit Transition/)).not.toBeInTheDocument()
      }
    })

    it('should reproduce the issue: single-clicking transitions increments undo counter incorrectly', async () => {
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
      const undoButton = screen.getByLabelText(/Undo/)
      const initialUndoState = undoButton.disabled

      // Try to find the transition label
      const transitionLabel = screen.queryByText('Go to End')
      if (transitionLabel) {
        // Single-click the transition
        await user.click(transitionLabel)

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100))

        // BUG: Undo counter should not change from a simple click that doesn't modify anything
        const newUndoState = undoButton.disabled
        expect(newUndoState).toBe(initialUndoState) // Should remain the same
      }
    })

    it('should reproduce the issue: transition edit buttons do nothing', async () => {
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

      // Try to find transition edit button
      const transitionEditButton = screen.queryByTitle('Edit transition')
      if (transitionEditButton) {
        await user.click(transitionEditButton)

        // Wait a moment to see if editor opens
        await new Promise(resolve => setTimeout(resolve, 500))

        // BUG: The transition editor should open, but it doesn't
        expect(screen.queryByText(/Edit Transition/)).not.toBeInTheDocument()
      }
    })
  })
})
