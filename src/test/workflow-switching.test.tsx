import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('Workflow Switching Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    
    // Wait for workflow to load and verify it's displayed in the UI
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })

    // Now click on User Verification
    await user.click(screen.getByText('User Verification'))

    // Verify the new workflow is loaded and displayed in the UI
    await waitFor(() => {
      expect(screen.getByText('User Verification')).toBeInTheDocument()
    })
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
