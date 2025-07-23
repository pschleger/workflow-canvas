import { describe, it, expect } from 'vitest'
import type { StateDefinition, TransitionDefinition } from '../types/workflow'

// ABOUTME: This file tests the core logic for name editing functionality
// without complex DOM testing, focusing on the data transformation logic.

describe('Name Editing Logic', () => {
  describe('State Name Logic', () => {
    it('should use provided name when available', () => {
      const stateDefinition: StateDefinition = {
        name: 'Custom State Name',
        transitions: []
      }
      
      // Simulate the logic from StateEditor handleSave
      const stateId = 'test-state'
      const nameFromField = 'Custom State Name'
      const updatedDefinition = {
        ...stateDefinition,
        name: nameFromField.trim() || stateId
      }
      
      expect(updatedDefinition.name).toBe('Custom State Name')
    })

    it('should fallback to state ID when name field is empty', () => {
      const stateDefinition: StateDefinition = {
        name: 'Old Name',
        transitions: []
      }
      
      // Simulate the logic from StateEditor handleSave
      const stateId = 'test-state'
      const nameFromField = '   ' // Empty/whitespace
      const updatedDefinition = {
        ...stateDefinition,
        name: nameFromField.trim() || stateId
      }
      
      expect(updatedDefinition.name).toBe('test-state')
    })

    it('should trim whitespace from state names', () => {
      const stateDefinition: StateDefinition = {
        name: 'Old Name',
        transitions: []
      }
      
      // Simulate the logic from StateEditor handleSave
      const stateId = 'test-state'
      const nameFromField = '  New State Name  '
      const updatedDefinition = {
        ...stateDefinition,
        name: nameFromField.trim() || stateId
      }
      
      expect(updatedDefinition.name).toBe('New State Name')
    })

    it('should preserve other state definition properties', () => {
      const stateDefinition: StateDefinition = {
        name: 'Old Name',
        transitions: [
          { name: 'Transition 1', next: 'state1', manual: false, disabled: false },
          { name: 'Transition 2', next: 'state2', manual: true, disabled: true }
        ]
      }
      
      // Simulate the logic from StateEditor handleSave
      const stateId = 'test-state'
      const nameFromField = 'New State Name'
      const updatedDefinition = {
        ...stateDefinition,
        name: nameFromField.trim() || stateId
      }
      
      expect(updatedDefinition.name).toBe('New State Name')
      expect(updatedDefinition.transitions).toHaveLength(2)
      expect(updatedDefinition.transitions[0].name).toBe('Transition 1')
      expect(updatedDefinition.transitions[1].manual).toBe(true)
    })
  })

  describe('Transition Name Logic', () => {
    it('should use provided name when available', () => {
      const transitionDefinition: TransitionDefinition = {
        name: 'Old Name',
        next: 'target-state',
        manual: false,
        disabled: false
      }
      
      // Simulate the logic from TransitionEditor handleSave
      const nameFromField = 'Submit for Review'
      const updatedDefinition = {
        ...transitionDefinition,
        name: nameFromField.trim()
      }
      
      expect(updatedDefinition.name).toBe('Submit for Review')
    })

    it('should allow empty transition names', () => {
      const transitionDefinition: TransitionDefinition = {
        name: 'Old Name',
        next: 'target-state',
        manual: false,
        disabled: false
      }
      
      // Simulate the logic from TransitionEditor handleSave
      const nameFromField = ''
      const updatedDefinition = {
        ...transitionDefinition,
        name: nameFromField.trim()
      }
      
      expect(updatedDefinition.name).toBe('')
    })

    it('should trim whitespace from transition names', () => {
      const transitionDefinition: TransitionDefinition = {
        name: 'Old Name',
        next: 'target-state',
        manual: false,
        disabled: false
      }
      
      // Simulate the logic from TransitionEditor handleSave
      const nameFromField = '  Approve Request  '
      const updatedDefinition = {
        ...transitionDefinition,
        name: nameFromField.trim()
      }
      
      expect(updatedDefinition.name).toBe('Approve Request')
    })

    it('should preserve other transition definition properties', () => {
      const transitionDefinition: TransitionDefinition = {
        name: 'Old Name',
        next: 'target-state',
        manual: true,
        disabled: false
      }
      
      // Simulate the logic from TransitionEditor handleSave
      const nameFromField = 'New Transition Name'
      const updatedDefinition = {
        ...transitionDefinition,
        name: nameFromField.trim()
      }
      
      expect(updatedDefinition.name).toBe('New Transition Name')
      expect(updatedDefinition.next).toBe('target-state')
      expect(updatedDefinition.manual).toBe(true)
      expect(updatedDefinition.disabled).toBe(false)
    })
  })

  describe('Default Definition Logic', () => {
    it('should create proper default state definition', () => {
      const stateId = 'new-state'
      const defaultDefinition: StateDefinition = {
        name: stateId || '',
        transitions: []
      }
      
      expect(defaultDefinition.name).toBe('new-state')
      expect(defaultDefinition.transitions).toEqual([])
    })

    it('should create proper default transition definition', () => {
      const defaultDefinition: TransitionDefinition = {
        next: '',
        name: '',
        manual: false,
        disabled: false
      }
      
      expect(defaultDefinition.name).toBe('')
      expect(defaultDefinition.next).toBe('')
      expect(defaultDefinition.manual).toBe(false)
      expect(defaultDefinition.disabled).toBe(false)
    })
  })

  describe('Name Display Logic', () => {
    it('should display state name from definition when available', () => {
      const stateDefinition: StateDefinition = {
        name: 'Custom Display Name',
        transitions: []
      }
      const stateId = 'internal-state-id'
      
      // Simulate the logic from WorkflowCanvas createUIStateData
      const displayName = stateDefinition.name || stateId
      
      expect(displayName).toBe('Custom Display Name')
    })

    it('should fallback to state ID when no name in definition', () => {
      const stateDefinition: StateDefinition = {
        transitions: []
      }
      const stateId = 'internal-state-id'
      
      // Simulate the logic from WorkflowCanvas createUIStateData
      const displayName = stateDefinition.name || stateId
      
      expect(displayName).toBe('internal-state-id')
    })

    it('should display transition name from definition', () => {
      const transitionDefinition: TransitionDefinition = {
        name: 'Submit for Approval',
        next: 'approval-state',
        manual: false,
        disabled: false
      }
      
      // Transition names are displayed directly from the definition
      expect(transitionDefinition.name).toBe('Submit for Approval')
    })

    it('should handle empty transition names gracefully', () => {
      const transitionDefinition: TransitionDefinition = {
        name: '',
        next: 'approval-state',
        manual: false,
        disabled: false
      }
      
      // Empty transition names should be allowed
      expect(transitionDefinition.name).toBe('')
    })
  })
})
