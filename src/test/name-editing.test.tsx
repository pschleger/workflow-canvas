import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StateEditor } from '../components/Editors/StateEditor'
import { TransitionEditor } from '../components/Editors/TransitionEditor'
import type { StateDefinition, TransitionDefinition } from '../types/workflow'

// ABOUTME: This file tests the enhanced name editing functionality in the state and transition editors,
// ensuring users can edit names through dedicated form fields above the JSON panels.

describe('Name Editing Functionality', () => {
  let mockOnSave: ReturnType<typeof vi.fn>
  let mockOnClose: ReturnType<typeof vi.fn>
  let mockOnDelete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave = vi.fn()
    mockOnClose = vi.fn()
    mockOnDelete = vi.fn()
  })

  describe('StateEditor Name Editing', () => {
    const mockStateDefinition: StateDefinition = {
      name: 'Initial State',
      transitions: [
        { name: 'Go to Next', next: 'next-state', manual: false, disabled: false }
      ]
    }

    it('should display the current state name in the name field', () => {
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

      const nameInput = screen.getByLabelText('State Name')
      expect(nameInput).toHaveValue('Initial State')
    })

    it('should allow editing the state name', async () => {
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

      const nameInput = screen.getByLabelText('State Name')
      
      // Clear and type new name
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated State Name')
      
      expect(nameInput).toHaveValue('Updated State Name')
    })

    it('should save the updated state name when save is clicked', async () => {
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

      const nameInput = screen.getByLabelText('State Name')
      const saveButton = screen.getByText('Save')
      
      // Update the name
      await user.clear(nameInput)
      await user.type(nameInput, 'New State Name')
      
      // Click save
      await user.click(saveButton)
      
      // Verify onSave was called with updated definition
      expect(mockOnSave).toHaveBeenCalledWith('test-state', {
        ...mockStateDefinition,
        name: 'New State Name'
      })
    })

    it('should use state ID as fallback when name is empty', async () => {
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

      const nameInput = screen.getByLabelText('State Name')
      const saveButton = screen.getByText('Save')
      
      // Clear the name field
      await user.clear(nameInput)
      
      // Click save
      await user.click(saveButton)
      
      // Verify onSave was called with state ID as name
      expect(mockOnSave).toHaveBeenCalledWith('test-state', {
        ...mockStateDefinition,
        name: 'test-state'
      })
    })

    it('should display placeholder text for the name field', () => {
      render(
        <StateEditor
          stateId="test-state"
          stateDefinition={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByLabelText('State Name')
      expect(nameInput).toHaveAttribute('placeholder', 'Enter state name (defaults to "test-state")')
    })
  })

  describe('TransitionEditor Name Editing', () => {
    const mockTransitionDefinition: TransitionDefinition = {
      name: 'Submit for Review',
      next: 'review-state',
      manual: true,
      disabled: false
    }

    it('should display the current transition name in the name field', () => {
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

      const nameInput = screen.getByLabelText('Transition Name')
      expect(nameInput).toHaveValue('Submit for Review')
    })

    it('should allow editing the transition name', async () => {
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

      const nameInput = screen.getByLabelText('Transition Name')
      
      // Clear and type new name
      await user.clear(nameInput)
      await user.type(nameInput, 'Approve Request')
      
      expect(nameInput).toHaveValue('Approve Request')
    })

    it('should save the updated transition name when save is clicked', async () => {
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

      const nameInput = screen.getByLabelText('Transition Name')
      const saveButton = screen.getByText('Save')
      
      // Update the name
      await user.clear(nameInput)
      await user.type(nameInput, 'Reject Request')
      
      // Click save
      await user.click(saveButton)
      
      // Verify onSave was called with updated definition
      expect(mockOnSave).toHaveBeenCalledWith('test-transition', {
        ...mockTransitionDefinition,
        name: 'Reject Request'
      })
    })

    it('should allow empty transition names', async () => {
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

      const nameInput = screen.getByLabelText('Transition Name')
      const saveButton = screen.getByText('Save')
      
      // Clear the name field
      await user.clear(nameInput)
      
      // Click save
      await user.click(saveButton)
      
      // Verify onSave was called with empty name
      expect(mockOnSave).toHaveBeenCalledWith('test-transition', {
        ...mockTransitionDefinition,
        name: ''
      })
    })

    it('should display helpful placeholder text for the name field', () => {
      render(
        <TransitionEditor
          transitionId="test-transition"
          transitionDefinition={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByLabelText('Transition Name')
      expect(nameInput).toHaveAttribute('placeholder', "Enter transition name (e.g., 'Submit for Review', 'Approve', 'Reject')")
    })
  })

  describe('JSON and Name Field Synchronization', () => {
    it('should update JSON when name field changes in StateEditor', async () => {
      const user = userEvent.setup()
      render(
        <StateEditor
          stateId="test-state"
          stateDefinition={{ name: 'Old Name', transitions: [] }}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByLabelText('State Name')
      const saveButton = screen.getByText('Save')
      
      // Update the name
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
      
      // Click save
      await user.click(saveButton)
      
      // The saved definition should have the updated name
      expect(mockOnSave).toHaveBeenCalledWith('test-state', {
        name: 'New Name',
        transitions: []
      })
    })

    it('should update JSON when name field changes in TransitionEditor', async () => {
      const user = userEvent.setup()
      render(
        <TransitionEditor
          transitionId="test-transition"
          transitionDefinition={{ name: 'Old Name', next: 'target', manual: false, disabled: false }}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const nameInput = screen.getByLabelText('Transition Name')
      const saveButton = screen.getByText('Save')
      
      // Update the name
      await user.clear(nameInput)
      await user.type(nameInput, 'New Transition Name')
      
      // Click save
      await user.click(saveButton)
      
      // The saved definition should have the updated name
      expect(mockOnSave).toHaveBeenCalledWith('test-transition', {
        name: 'New Transition Name',
        next: 'target',
        manual: false,
        disabled: false
      })
    })
  })
})
