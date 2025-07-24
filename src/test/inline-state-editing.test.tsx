import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { StateNode } from '../components/Canvas/StateNode'
import type { UIStateData } from '../types/workflow'

// ABOUTME: This file tests the new inline state name editing functionality
// that allows editing state names directly in the state nodes without popups.

describe('Inline State Name Editing', () => {
  it('should render StateNode with inline name editor', () => {
    const mockState: UIStateData = {
      id: 'test-state',
      name: 'Test State',
      position: { x: 100, y: 100 },
      properties: {},
      isInitial: false,
      isFinal: false,
      transitionIds: []
    }

    const mockOnEdit = vi.fn()
    const mockOnNameChange = vi.fn()

    const nodeProps = {
      id: 'test-state',
      type: 'stateNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test State',
        state: mockState,
        onEdit: mockOnEdit,
        onNameChange: mockOnNameChange
      },
      selected: false,
      isConnectable: true,
      zIndex: 1,
      xPos: 100,
      yPos: 100,
      dragging: false
    }

    render(<StateNode {...nodeProps} />)

    // Should show the state name
    expect(screen.getByText('Test State')).toBeInTheDocument()

    // Should have an edit name button
    expect(screen.getByTitle('Edit name')).toBeInTheDocument()

    // Should NOT have an edit state button (removed as requested)
    expect(screen.queryByTitle('Edit state')).not.toBeInTheDocument()
  })

  it('should call onNameChange when name is edited inline', async () => {
    const user = userEvent.setup()

    const mockState: UIStateData = {
      id: 'test-state',
      name: 'Test State',
      position: { x: 100, y: 100 },
      properties: {},
      isInitial: false,
      isFinal: false,
      transitionIds: []
    }

    const mockOnEdit = vi.fn()
    const mockOnNameChange = vi.fn()

    const nodeProps = {
      id: 'test-state',
      type: 'stateNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test State',
        state: mockState,
        onEdit: mockOnEdit,
        onNameChange: mockOnNameChange
      },
      selected: false,
      isConnectable: true,
      zIndex: 1,
      xPos: 100,
      yPos: 100,
      dragging: false
    }

    render(<StateNode {...nodeProps} />)

    // Click the edit name button
    const editNameButton = screen.getByTitle('Edit name')
    await user.click(editNameButton)

    // Should now see an input field
    const nameInput = screen.getByRole('textbox')
    expect(nameInput).toBeInTheDocument()

    // Change the name
    await user.clear(nameInput)
    await user.type(nameInput, 'New State Name')

    // Save by pressing Enter
    await user.keyboard('{Enter}')

    // Should call onNameChange with the new name
    expect(mockOnNameChange).toHaveBeenCalledWith('test-state', 'New State Name')
  })
})
