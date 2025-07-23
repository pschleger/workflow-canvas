import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StateEditor } from '../components/Editors/StateEditor'
import { TransitionEditor } from '../components/Editors/TransitionEditor'
import type { StateDefinition, TransitionDefinition } from '../types/workflow'

// ABOUTME: This file tests the save functionality for state and transition editors
// to verify that changes are properly captured and saved when the save button is clicked.

describe('Save Functionality Tests', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('StateEditor Save Functionality', () => {
    const mockStateDefinition: StateDefinition = {
      name: 'Initial State',
      transitions: [
        { name: 'Go to Next', next: 'next-state', manual: false, disabled: false }
      ]
    }

    it('should save changes when save button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <StateEditor
          stateId="test-state"
          stateDefinition={mockStateDefinition}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      // Find the JSON textarea and modify it
      const jsonTextarea = screen.getByRole('textbox')
      expect(jsonTextarea).toBeInTheDocument()

      // Clear and enter new JSON using fireEvent for complex text
      const newStateDefinition = {
        name: 'Modified State',
        transitions: [
          { name: 'Modified Transition', next: 'modified-state', manual: true, disabled: false }
        ]
      }
      fireEvent.change(jsonTextarea, {
        target: { value: JSON.stringify(newStateDefinition, null, 2) }
      })

      // Click save button
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      // Verify onSave was called with the modified definition
      expect(mockOnSave).toHaveBeenCalledWith('test-state', newStateDefinition)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should preserve JSON changes when save button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <StateEditor
          stateId="test-state"
          stateDefinition={mockStateDefinition}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      // Find the JSON textarea and modify just the name field
      const jsonTextarea = screen.getByRole('textbox')
      const modifiedDefinition = {
        ...mockStateDefinition,
        name: 'JSON Modified Name'
      }
      fireEvent.change(jsonTextarea, {
        target: { value: JSON.stringify(modifiedDefinition, null, 2) }
      })

      // Click save button
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      // Verify onSave was called with the JSON-modified name, not the inline editor name
      expect(mockOnSave).toHaveBeenCalledWith('test-state', modifiedDefinition)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('TransitionEditor Save Functionality', () => {
    const mockTransitionDefinition: TransitionDefinition = {
      name: 'Submit for Review',
      next: 'review-state',
      manual: true,
      disabled: false
    }

    it('should save changes when save button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TransitionEditor
          transitionId="test-transition"
          transitionDefinition={mockTransitionDefinition}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      // Find the JSON textarea and modify it
      const jsonTextarea = screen.getByRole('textbox')
      expect(jsonTextarea).toBeInTheDocument()

      // Clear and enter new JSON using fireEvent for complex text
      const newTransitionDefinition = {
        name: 'Modified Transition',
        next: 'modified-target',
        manual: false,
        disabled: true
      }
      fireEvent.change(jsonTextarea, {
        target: { value: JSON.stringify(newTransitionDefinition, null, 2) }
      })

      // Click save button
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      // Verify onSave was called with the modified definition
      expect(mockOnSave).toHaveBeenCalledWith('test-transition', newTransitionDefinition)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should preserve JSON changes when save button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TransitionEditor
          transitionId="test-transition"
          transitionDefinition={mockTransitionDefinition}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      // Find the JSON textarea and modify just the name field
      const jsonTextarea = screen.getByRole('textbox')
      const modifiedDefinition = {
        ...mockTransitionDefinition,
        name: 'JSON Modified Transition Name'
      }
      fireEvent.change(jsonTextarea, {
        target: { value: JSON.stringify(modifiedDefinition, null, 2) }
      })

      // Click save button
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      // Verify onSave was called with the JSON-modified name, not the inline editor name
      expect(mockOnSave).toHaveBeenCalledWith('test-transition', modifiedDefinition)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Bug Fix Verification', () => {
    it('should save JSON changes and not lose them when save button is clicked (StateEditor)', async () => {
      const user = userEvent.setup()
      const mockStateDefinition: StateDefinition = {
        name: 'Original State',
        transitions: []
      }

      render(
        <StateEditor
          stateId="test-state"
          stateDefinition={mockStateDefinition}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      // User edits the JSON directly to change the name and add properties
      const jsonTextarea = screen.getByRole('textbox')
      const modifiedDefinition = {
        name: 'User Modified Name',
        transitions: [],
        customProperty: 'added by user'
      }
      fireEvent.change(jsonTextarea, {
        target: { value: JSON.stringify(modifiedDefinition, null, 2) }
      })

      // Click save button
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      // Verify that the changes from JSON are preserved, not overwritten
      expect(mockOnSave).toHaveBeenCalledWith('test-state', modifiedDefinition)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should save JSON changes and not lose them when save button is clicked (TransitionEditor)', async () => {
      const user = userEvent.setup()
      const mockTransitionDefinition: TransitionDefinition = {
        name: 'Original Transition',
        next: 'target',
        manual: false,
        disabled: false
      }

      render(
        <TransitionEditor
          transitionId="test-transition"
          transitionDefinition={mockTransitionDefinition}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      // User edits the JSON directly to change properties
      const jsonTextarea = screen.getByRole('textbox')
      const modifiedDefinition = {
        name: 'User Modified Transition Name',
        next: 'new-target',
        manual: true,
        disabled: true,
        customProperty: 'added by user'
      }
      fireEvent.change(jsonTextarea, {
        target: { value: JSON.stringify(modifiedDefinition, null, 2) }
      })

      // Click save button
      const saveButton = screen.getByText('Save')
      await user.click(saveButton)

      // Verify that the changes from JSON are preserved, not overwritten
      expect(mockOnSave).toHaveBeenCalledWith('test-transition', modifiedDefinition)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
