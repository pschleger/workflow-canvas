import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })


  it('renders the main layout with header and sidebar', async () => {
    render(<App />)
    
    // Check header elements
    expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument()
    expect(screen.getByText('Import')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
    
    // Check sidebar - it shows loading state initially, then entities load
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
  })

  it('loads and displays entities in the sidebar', async () => {
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument()
    })
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
      expect(screen.getByText('User Registration')).toBeInTheDocument()
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
      expect(screen.getByText('User Registration')).toBeInTheDocument()
    })
  })

  it('toggles dark mode when dark mode button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const darkModeButton = screen.getByLabelText('Toggle dark mode')
    await user.click(darkModeButton)
    
    // Check if dark class is applied to the main container
    const mainContainer = document.querySelector('.h-screen')
    expect(mainContainer).toHaveClass('dark')
  })

  it('shows export button and handles export click', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const exportButton = screen.getByText('Export')
    expect(exportButton).toBeInTheDocument()
    
    // Should not crash when clicked without a workflow
    await user.click(exportButton)
  })

  it('shows import button', () => {
    render(<App />)

    const importButton = screen.getByText('Import').closest('button')
    expect(importButton).toBeInTheDocument()
    expect(importButton).not.toBeDisabled()

    // Import button should be visible and enabled
    expect(importButton.tagName).toBe('BUTTON')
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
