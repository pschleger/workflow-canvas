// ABOUTME: Test to verify that the blank screen issue is fixed
// by ensuring the app loads without JavaScript errors.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock React Flow components to avoid complexities
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ children, nodes, edges, ...props }: any) => (
      <div
        data-testid="react-flow"
        data-nodes-count={nodes?.length || 0}
        data-edges-count={edges?.length || 0}
        {...props}
      >
        {children}
      </div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: ({ children }: { children: React.ReactNode }) => <div data-testid="controls">{children}</div>,
    ControlButton: ({ onClick, disabled, children, ...props }: any) => (
      <button data-testid="control-button" onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    ),
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
    useNodesState: () => [[], vi.fn(), vi.fn()],
    useEdgesState: () => [[], vi.fn(), vi.fn()],
    useReactFlow: () => ({
      screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 75, y: pos.y - 25 }))
    }),
    ConnectionMode: { Loose: 'loose' }
  }
})

describe('Blank Screen Fix', () => {
  it('should render app without blank screen (useStore import fix)', () => {
    // Spy on console.error to catch any JavaScript errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<App />)

    // Verify the main app elements are rendered (not blank screen)
    expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument()
    expect(screen.getByText('No Workflow Selected')).toBeInTheDocument()

    // Verify no useStore import errors occurred
    const useStoreErrors = consoleSpy.mock.calls.filter(call =>
      call.some(arg =>
        typeof arg === 'string' && (
          arg.includes('useStore') ||
          arg.includes('No "useStore" export')
        )
      )
    )

    expect(useStoreErrors).toHaveLength(0)

    // Verify no other critical JavaScript errors
    const criticalErrors = consoleSpy.mock.calls.filter(call =>
      call.some(arg =>
        typeof arg === 'string' && (
          arg.includes('Element type is invalid') ||
          arg.includes('export is defined') ||
          arg.includes('Cannot read properties')
        )
      )
    )

    expect(criticalErrors).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  it('should show loading state in sidebar (not blank screen)', () => {
    render(<App />)

    // The sidebar should show loading skeleton (not blank)
    // This proves the app is rendering and just loading data
    const sidebar = document.querySelector('aside')
    expect(sidebar).toBeInTheDocument()

    // Should have loading skeleton animation
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('should show proper empty state when no workflow is selected', () => {
    render(<App />)

    // Verify the empty state is shown correctly
    expect(screen.getByText('No Workflow Selected')).toBeInTheDocument()
    expect(screen.getByText('Select an entity and workflow from the sidebar to start editing')).toBeInTheDocument()
    
    // Verify the emoji is displayed (indicates proper rendering)
    expect(screen.getByText('🔄')).toBeInTheDocument()
  })

  it('should render all header buttons without errors', () => {
    render(<App />)

    // Verify all header buttons are rendered
    expect(screen.getByText('Undo')).toBeInTheDocument()
    expect(screen.getByText('Redo')).toBeInTheDocument()
    expect(screen.getByText('Import')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
    
    // Verify dark mode toggle button
    expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument()
  })
})
