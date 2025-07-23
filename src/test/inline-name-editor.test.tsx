import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InlineNameEditor } from '../components/Editors/InlineNameEditor'

// ABOUTME: This file tests the InlineNameEditor component to ensure
// the pencil icon editing functionality works correctly.

describe('InlineNameEditor', () => {
  let mockOnSave: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSave = vi.fn()
  })

  describe('Display Mode', () => {
    it('should display the current value', () => {
      render(
        <InlineNameEditor
          value="Test Name"
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('Test Name')).toBeInTheDocument()
    })

    it('should display placeholder when value is empty', () => {
      render(
        <InlineNameEditor
          value=""
          placeholder="Enter name"
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('Enter name')).toBeInTheDocument()
    })

    it('should show pencil icon on hover', () => {
      render(
        <InlineNameEditor
          value="Test Name"
          onSave={mockOnSave}
        />
      )

      const editButton = screen.getByTitle('Edit name')
      expect(editButton).toBeInTheDocument()
    })

    it('should not show pencil icon when disabled', () => {
      render(
        <InlineNameEditor
          value="Test Name"
          onSave={mockOnSave}
          disabled={true}
        />
      )

      expect(screen.queryByTitle('Edit name')).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should enter edit mode when pencil icon is clicked', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Test Name"
          onSave={mockOnSave}
        />
      )

      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Should show input field
      expect(screen.getByDisplayValue('Test Name')).toBeInTheDocument()
      // Should show check and cancel buttons
      expect(screen.getByTitle('Save name')).toBeInTheDocument()
      expect(screen.getByTitle('Cancel editing')).toBeInTheDocument()
    })

    it('should not enter edit mode when disabled', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Test Name"
          onSave={mockOnSave}
          disabled={true}
        />
      )

      // No edit button should be present
      expect(screen.queryByTitle('Edit name')).not.toBeInTheDocument()
    })

    it('should focus and select text when entering edit mode', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Test Name"
          onSave={mockOnSave}
        />
      )

      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      const input = screen.getByDisplayValue('Test Name') as HTMLInputElement
      expect(input).toHaveFocus()
    })
  })

  describe('Save Functionality', () => {
    it('should save when check button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Old Name"
          onSave={mockOnSave}
        />
      )

      // Enter edit mode
      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Change the value
      const input = screen.getByDisplayValue('Old Name')
      await user.clear(input)
      await user.type(input, 'New Name')

      // Click save
      const saveButton = screen.getByTitle('Save name')
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith('New Name')
    })

    it('should save when Enter key is pressed', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Old Name"
          onSave={mockOnSave}
        />
      )

      // Enter edit mode
      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Change the value
      const input = screen.getByDisplayValue('Old Name')
      await user.clear(input)
      await user.type(input, 'New Name')

      // Press Enter
      await user.keyboard('{Enter}')

      expect(mockOnSave).toHaveBeenCalledWith('New Name')
    })

    it('should save when input loses focus', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <InlineNameEditor
            value="Old Name"
            onSave={mockOnSave}
          />
          <button>Other Element</button>
        </div>
      )

      // Enter edit mode
      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Change the value
      const input = screen.getByDisplayValue('Old Name')
      await user.clear(input)
      await user.type(input, 'New Name')

      // Click outside to blur
      const otherButton = screen.getByText('Other Element')
      await user.click(otherButton)

      expect(mockOnSave).toHaveBeenCalledWith('New Name')
    })

    it('should trim whitespace when saving', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Old Name"
          onSave={mockOnSave}
        />
      )

      // Enter edit mode
      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Change the value with whitespace
      const input = screen.getByDisplayValue('Old Name')
      await user.clear(input)
      await user.type(input, '  New Name  ')

      // Press Enter
      await user.keyboard('{Enter}')

      expect(mockOnSave).toHaveBeenCalledWith('New Name')
    })
  })

  describe('Cancel Functionality', () => {
    it('should cancel when X button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Original Name"
          onSave={mockOnSave}
        />
      )

      // Enter edit mode
      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Change the value
      const input = screen.getByDisplayValue('Original Name')
      await user.clear(input)
      await user.type(input, 'Changed Name')

      // Click cancel
      const cancelButton = screen.getByTitle('Cancel editing')
      await user.click(cancelButton)

      // Should not save and should return to display mode
      expect(mockOnSave).not.toHaveBeenCalled()
      expect(screen.getByText('Original Name')).toBeInTheDocument()
    })

    it('should cancel when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(
        <InlineNameEditor
          value="Original Name"
          onSave={mockOnSave}
        />
      )

      // Enter edit mode
      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Change the value
      const input = screen.getByDisplayValue('Original Name')
      await user.clear(input)
      await user.type(input, 'Changed Name')

      // Press Escape
      await user.keyboard('{Escape}')

      // Should not save and should return to display mode
      expect(mockOnSave).not.toHaveBeenCalled()
      expect(screen.getByText('Original Name')).toBeInTheDocument()
    })
  })

  describe('Value Updates', () => {
    it('should update display when value prop changes', () => {
      const { rerender } = render(
        <InlineNameEditor
          value="Initial Name"
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('Initial Name')).toBeInTheDocument()

      rerender(
        <InlineNameEditor
          value="Updated Name"
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('Updated Name')).toBeInTheDocument()
    })

    it('should reset edit value when value prop changes during editing', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <InlineNameEditor
          value="Initial Name"
          onSave={mockOnSave}
        />
      )

      // Enter edit mode
      const editButton = screen.getByTitle('Edit name')
      await user.click(editButton)

      // Change the input value
      const input = screen.getByDisplayValue('Initial Name')
      await user.clear(input)
      await user.type(input, 'User Changed')

      // Update the prop value
      rerender(
        <InlineNameEditor
          value="Prop Updated"
          onSave={mockOnSave}
        />
      )

      // The input should now show the prop value
      expect(screen.getByDisplayValue('Prop Updated')).toBeInTheDocument()
    })
  })
})
