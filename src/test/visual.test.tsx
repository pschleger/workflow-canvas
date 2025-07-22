import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('Visual Tests', () => {
  it('renders with proper CSS classes applied', () => {
    render(<App />)
    
    // Check that header exists
    const header = screen.getByText('State Machine Workflow Editor')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('text-xl', 'font-bold')
    
    // Check that buttons have proper classes
    const importButton = screen.getByText('Import')
    expect(importButton).toHaveClass('bg-blue-500', 'text-white', 'rounded-md')

    const exportButton = screen.getByText('Export')
    expect(exportButton).toHaveClass('bg-green-500', 'text-white', 'rounded-md')
    
    // Check that main layout structure exists
    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveClass('flex-1', 'bg-gray-100')
  })

  it('has proper sidebar structure', () => {
    render(<App />)

    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar).toHaveClass('w-80', 'bg-gray-50', 'border-r')
  })

  it('shows empty state with proper styling', () => {
    render(<App />)
    
    const emptyStateHeading = screen.getByText('No Workflow Selected')
    expect(emptyStateHeading).toBeInTheDocument()
    expect(emptyStateHeading).toHaveClass('text-xl', 'font-medium', 'mb-2')
    
    const emptyStateText = screen.getByText('Select an entity and workflow from the sidebar to start editing')
    expect(emptyStateText).toBeInTheDocument()
  })

  it('has dark mode toggle button', () => {
    render(<App />)
    
    const darkModeButton = screen.getByLabelText('Toggle dark mode')
    expect(darkModeButton).toBeInTheDocument()
    expect(darkModeButton).toHaveClass('p-2', 'transition-colors')
  })
})
