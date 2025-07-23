import { describe, it, expect } from 'vitest'
import { validateTransitionStates } from '../utils/transitionUtils'

// ABOUTME: This file tests that the validateTransitionStates function has been
// properly implemented to fix the "validateTransitionStates is not defined" error.

describe('validateTransitionStates Function Fix', () => {
  it('should exist and be a function', () => {
    expect(validateTransitionStates).toBeDefined()
    expect(typeof validateTransitionStates).toBe('function')
  })

  it('should validate layout transition IDs correctly', () => {
    const stateIds = new Set(['start', 'processing', 'end', 'failed'])

    // Valid layout transition IDs
    expect(validateTransitionStates('start-to-processing', stateIds)).toBe(true)
    expect(validateTransitionStates('processing-to-end', stateIds)).toBe(true)
    expect(validateTransitionStates('processing-to-failed', stateIds)).toBe(true)
    expect(validateTransitionStates('start-to-end', stateIds)).toBe(true)

    // Invalid layout transition IDs (non-existent states)
    expect(validateTransitionStates('start-to-nonexistent', stateIds)).toBe(false)
    expect(validateTransitionStates('nonexistent-to-end', stateIds)).toBe(false)
    expect(validateTransitionStates('nonexistent-to-nonexistent', stateIds)).toBe(false)

    // Invalid format
    expect(validateTransitionStates('invalid-format', stateIds)).toBe(false)
    expect(validateTransitionStates('start-processing', stateIds)).toBe(false) // Missing "-to-"
    expect(validateTransitionStates('', stateIds)).toBe(false)
    expect(validateTransitionStates('start-to-', stateIds)).toBe(false) // Empty target
    expect(validateTransitionStates('-to-end', stateIds)).toBe(false) // Empty source
  })

  it('should handle edge cases', () => {
    const stateIds = new Set(['state-with-hyphens', 'another-state'])

    // States with hyphens should work correctly
    expect(validateTransitionStates('state-with-hyphens-to-another-state', stateIds)).toBe(true)
    expect(validateTransitionStates('another-state-to-state-with-hyphens', stateIds)).toBe(true)

    // Empty state set
    const emptyStateIds = new Set<string>()
    expect(validateTransitionStates('start-to-end', emptyStateIds)).toBe(false)

    // Single state
    const singleStateIds = new Set(['only-state'])
    expect(validateTransitionStates('only-state-to-only-state', singleStateIds)).toBe(true)
    expect(validateTransitionStates('only-state-to-other', singleStateIds)).toBe(false)
  })

  it('should work with the same test cases that were failing', () => {
    // These are the exact test cases from the user-registration-bug.test.tsx
    // that were causing the "validateTransitionStates is not defined" error
    const stateIds = new Set(['pending', 'email-sent', 'verified', 'failed'])
    
    expect(validateTransitionStates('pending-to-failed', stateIds)).toBe(true)
    expect(validateTransitionStates('email-sent-to-failed', stateIds)).toBe(true)
    expect(validateTransitionStates('pending-to-email-sent', stateIds)).toBe(true)
    expect(validateTransitionStates('email-sent-to-verified', stateIds)).toBe(true)
  })
})
