import { describe, it, expect } from 'vitest'
import { generateTransitionId, parseTransitionId, getTransitionDefinition } from '../utils/transitionUtils'

// ABOUTME: This file tests the integration between the centralized transition ID system
// and the editing functionality to ensure they work together correctly.

describe('Editing Integration Tests', () => {
  const mockWorkflowStates = {
    'start': {
      name: 'Start State',
      transitions: [
        { name: 'Go to Processing', next: 'processing', manual: false, disabled: false },
        { name: 'Skip to End', next: 'end', manual: true, disabled: false }
      ]
    },
    'processing': {
      name: 'Processing State',
      transitions: [
        { name: 'Complete', next: 'end', manual: false, disabled: false }
      ]
    },
    'end': {
      name: 'End State',
      transitions: []
    }
  }

  describe('State Editing Integration', () => {
    it('should properly handle state definitions with names', () => {
      // Test that state definitions include name fields for editing
      const startState = mockWorkflowStates['start']
      expect(startState.name).toBe('Start State')
      expect(startState.transitions).toHaveLength(2)

      const processingState = mockWorkflowStates['processing']
      expect(processingState.name).toBe('Processing State')
      expect(processingState.transitions).toHaveLength(1)

      const endState = mockWorkflowStates['end']
      expect(endState.name).toBe('End State')
      expect(endState.transitions).toHaveLength(0)
    })
  })

  describe('Transition Editing Integration', () => {
    it('should generate correct transition IDs for editing', () => {
      // Test the ID generation that would be used in WorkflowCanvas
      const transition1Id = generateTransitionId('start', 0)
      const transition2Id = generateTransitionId('start', 1)
      const transition3Id = generateTransitionId('processing', 0)

      expect(transition1Id).toBe('start-0')
      expect(transition2Id).toBe('start-1')
      expect(transition3Id).toBe('processing-0')
    })

    it('should parse transition IDs correctly for editing', () => {
      // Test the parsing that would be used in handleTransitionEdit
      const parsed1 = parseTransitionId('start-0')
      const parsed2 = parseTransitionId('start-1')
      const parsed3 = parseTransitionId('processing-0')

      expect(parsed1).toEqual({ sourceStateId: 'start', transitionIndex: 0 })
      expect(parsed2).toEqual({ sourceStateId: 'start', transitionIndex: 1 })
      expect(parsed3).toEqual({ sourceStateId: 'processing', transitionIndex: 0 })
    })

    it('should retrieve correct transition definitions for editing', () => {
      // Test the definition retrieval that would be used in handleTransitionEdit
      const def1 = getTransitionDefinition('start-0', mockWorkflowStates)
      const def2 = getTransitionDefinition('start-1', mockWorkflowStates)
      const def3 = getTransitionDefinition('processing-0', mockWorkflowStates)

      expect(def1).toEqual({
        name: 'Go to Processing',
        next: 'processing',
        manual: false,
        disabled: false
      })

      expect(def2).toEqual({
        name: 'Skip to End',
        next: 'end',
        manual: true,
        disabled: false
      })

      expect(def3).toEqual({
        name: 'Complete',
        next: 'end',
        manual: false,
        disabled: false
      })
    })

    it('should handle non-existent transitions gracefully', () => {
      // Test error handling
      expect(getTransitionDefinition('start-5', mockWorkflowStates)).toBeNull()
      expect(getTransitionDefinition('nonexistent-0', mockWorkflowStates)).toBeNull()
      expect(getTransitionDefinition('invalid-format', mockWorkflowStates)).toBeNull()
    })
  })

  describe('End-to-End ID Flow', () => {
    it('should maintain consistency through the complete ID lifecycle', () => {
      // Simulate the complete flow from WorkflowCanvas to handleTransitionEdit
      
      // 1. WorkflowCanvas generates transition ID
      const sourceStateId = 'start'
      const transitionIndex = 0
      const transitionId = generateTransitionId(sourceStateId, transitionIndex)
      expect(transitionId).toBe('start-0')

      // 2. User double-clicks transition, handleTransitionEdit is called
      const parsed = parseTransitionId(transitionId)
      expect(parsed).not.toBeNull()
      expect(parsed!.sourceStateId).toBe(sourceStateId)
      expect(parsed!.transitionIndex).toBe(transitionIndex)

      // 3. handleTransitionEdit retrieves the definition
      const definition = getTransitionDefinition(transitionId, mockWorkflowStates)
      expect(definition).not.toBeNull()
      expect(definition!.name).toBe('Go to Processing')
      expect(definition!.next).toBe('processing')

      // 4. The definition can be edited and saved back
      const updatedDefinition = {
        ...definition!,
        name: 'Updated Transition Name'
      }
      expect(updatedDefinition.name).toBe('Updated Transition Name')
      expect(updatedDefinition.next).toBe('processing') // Other fields preserved
    })

    it('should handle complex state names in the complete flow', () => {
      // Test with hyphenated state names
      const complexStates = {
        'email-verification-sent': {
          name: 'Email Verification Sent',
          transitions: [
            { name: 'User Verified', next: 'email-verified', manual: false, disabled: false }
          ]
        },
        'email-verified': {
          name: 'Email Verified',
          transitions: []
        }
      }

      // Generate ID
      const transitionId = generateTransitionId('email-verification-sent', 0)
      expect(transitionId).toBe('email-verification-sent-0')

      // Parse ID
      const parsed = parseTransitionId(transitionId)
      expect(parsed).toEqual({
        sourceStateId: 'email-verification-sent',
        transitionIndex: 0
      })

      // Get definition
      const definition = getTransitionDefinition(transitionId, complexStates)
      expect(definition).toEqual({
        name: 'User Verified',
        next: 'email-verified',
        manual: false,
        disabled: false
      })
    })
  })
})
