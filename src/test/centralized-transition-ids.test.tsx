import { describe, it, expect } from 'vitest'
import { 
  generateTransitionId, 
  parseTransitionId, 
  generateLayoutTransitionId,
  parseLayoutTransitionId,
  validateTransitionExists,
  getTransitionDefinition,
  findTransitionId,
  migrateLayoutTransitionId
} from '../utils/transitionUtils'

// ABOUTME: This file tests the centralized transition ID management system
// to ensure consistent ID generation, parsing, and validation throughout the app.

describe('Centralized Transition ID System', () => {
  const mockWorkflowStates = {
    'start': {
      transitions: [
        { name: 'Go to Processing', next: 'processing', manual: false, disabled: false },
        { name: 'Skip to End', next: 'end', manual: true, disabled: false }
      ]
    },
    'processing': {
      transitions: [
        { name: 'Complete', next: 'end', manual: false, disabled: false }
      ]
    },
    'end': {
      transitions: []
    },
    'email-sent': {
      transitions: [
        { name: 'Verify Email', next: 'email-verified', manual: false, disabled: false }
      ]
    },
    'email-verified': {
      transitions: []
    }
  }

  describe('ID Generation and Parsing', () => {
    it('should generate correct transition IDs', () => {
      expect(generateTransitionId('start', 0)).toBe('start-0')
      expect(generateTransitionId('start', 1)).toBe('start-1')
      expect(generateTransitionId('processing', 0)).toBe('processing-0')
      expect(generateTransitionId('email-sent', 0)).toBe('email-sent-0')
    })

    it('should parse transition IDs correctly', () => {
      expect(parseTransitionId('start-0')).toEqual({ sourceStateId: 'start', transitionIndex: 0 })
      expect(parseTransitionId('start-1')).toEqual({ sourceStateId: 'start', transitionIndex: 1 })
      expect(parseTransitionId('processing-0')).toEqual({ sourceStateId: 'processing', transitionIndex: 0 })
      expect(parseTransitionId('email-sent-0')).toEqual({ sourceStateId: 'email-sent', transitionIndex: 0 })
    })

    it('should handle invalid transition IDs', () => {
      expect(parseTransitionId('invalid')).toBeNull()
      expect(parseTransitionId('start-')).toBeNull()
      expect(parseTransitionId('start-abc')).toBeNull()
      expect(parseTransitionId('-0')).toBeNull()
    })

    it('should generate layout transition IDs for backward compatibility', () => {
      expect(generateLayoutTransitionId('start', 'processing')).toBe('start-to-processing')
      expect(generateLayoutTransitionId('email-sent', 'email-verified')).toBe('email-sent-to-email-verified')
    })

    it('should parse layout transition IDs', () => {
      expect(parseLayoutTransitionId('start-to-processing')).toEqual({ 
        sourceStateId: 'start', 
        targetStateId: 'processing' 
      })
      expect(parseLayoutTransitionId('email-sent-to-email-verified')).toEqual({ 
        sourceStateId: 'email-sent', 
        targetStateId: 'email-verified' 
      })
    })
  })

  describe('Transition Validation and Lookup', () => {
    it('should validate existing transitions', () => {
      expect(validateTransitionExists('start-0', mockWorkflowStates)).toBe(true)
      expect(validateTransitionExists('start-1', mockWorkflowStates)).toBe(true)
      expect(validateTransitionExists('processing-0', mockWorkflowStates)).toBe(true)
      expect(validateTransitionExists('email-sent-0', mockWorkflowStates)).toBe(true)
    })

    it('should reject invalid transitions', () => {
      expect(validateTransitionExists('start-2', mockWorkflowStates)).toBe(false) // Index out of bounds
      expect(validateTransitionExists('nonexistent-0', mockWorkflowStates)).toBe(false) // State doesn't exist
      expect(validateTransitionExists('end-0', mockWorkflowStates)).toBe(false) // No transitions
      expect(validateTransitionExists('invalid-id', mockWorkflowStates)).toBe(false) // Invalid format
    })

    it('should get transition definitions', () => {
      const transition = getTransitionDefinition('start-0', mockWorkflowStates)
      expect(transition).toEqual({
        name: 'Go to Processing',
        next: 'processing',
        manual: false,
        disabled: false
      })

      const transition2 = getTransitionDefinition('start-1', mockWorkflowStates)
      expect(transition2).toEqual({
        name: 'Skip to End',
        next: 'end',
        manual: true,
        disabled: false
      })

      expect(getTransitionDefinition('nonexistent-0', mockWorkflowStates)).toBeNull()
    })

    it('should find transition IDs by source and target', () => {
      expect(findTransitionId('start', 'processing', mockWorkflowStates)).toBe('start-0')
      expect(findTransitionId('start', 'end', mockWorkflowStates)).toBe('start-1')
      expect(findTransitionId('processing', 'end', mockWorkflowStates)).toBe('processing-0')
      expect(findTransitionId('email-sent', 'email-verified', mockWorkflowStates)).toBe('email-sent-0')
      
      // Non-existent transitions
      expect(findTransitionId('start', 'nonexistent', mockWorkflowStates)).toBeNull()
      expect(findTransitionId('nonexistent', 'end', mockWorkflowStates)).toBeNull()
    })

    it('should migrate layout transition IDs to canonical format', () => {
      expect(migrateLayoutTransitionId('start-to-processing', mockWorkflowStates)).toBe('start-0')
      expect(migrateLayoutTransitionId('start-to-end', mockWorkflowStates)).toBe('start-1')
      expect(migrateLayoutTransitionId('processing-to-end', mockWorkflowStates)).toBe('processing-0')
      expect(migrateLayoutTransitionId('email-sent-to-email-verified', mockWorkflowStates)).toBe('email-sent-0')
      
      // Non-existent transitions
      expect(migrateLayoutTransitionId('start-to-nonexistent', mockWorkflowStates)).toBeNull()
      expect(migrateLayoutTransitionId('invalid-format', mockWorkflowStates)).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle state names with hyphens correctly', () => {
      // The system should work with hyphenated state names by using the last hyphen as the delimiter
      const transitionId = generateTransitionId('email-sent', 0)
      expect(transitionId).toBe('email-sent-0')
      
      const parsed = parseTransitionId('email-sent-0')
      expect(parsed).toEqual({ sourceStateId: 'email-sent', transitionIndex: 0 })
    })

    it('should handle complex state names', () => {
      const complexStateId = 'user-registration-email-sent'
      const transitionId = generateTransitionId(complexStateId, 2)
      expect(transitionId).toBe('user-registration-email-sent-2')
      
      const parsed = parseTransitionId('user-registration-email-sent-2')
      expect(parsed).toEqual({ sourceStateId: 'user-registration-email-sent', transitionIndex: 2 })
    })
  })
})
