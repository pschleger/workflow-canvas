// ABOUTME: This file contains tests to reproduce and fix the bug where transitions vanish
// after undoing all changes and then repositioning a recovered state.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { historyService } from '../services/historyService';
import { configService } from '../services/configService';
import type { UIWorkflowData } from '../types/workflow';

describe('Undo All + Reposition Bug Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    historyService.clearAllHistory();
    configService.resetToDefaults();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const createMockWorkflow = (
    states: Record<string, any> = {},
    layoutStates: any[] = [],
    layoutTransitions: any[] = []
  ): UIWorkflowData => ({
    id: 'test-workflow',
    entityId: 'test-entity',
    configuration: {
      version: '1.0',
      name: 'Test Workflow',
      initialState: 'state1',
      states
    },
    layout: {
      workflowId: 'test-workflow',
      version: 1,
      updatedAt: new Date().toISOString(),
      states: layoutStates,
      transitions: layoutTransitions
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  describe('Undo All + Reposition Scenario', () => {
    it('should reproduce the bug where transitions vanish after undo all + reposition', async () => {
      // Step 1: Create initial workflow with transitions
      const initialWorkflow = createMockWorkflow(
        {
          'pending': { transitions: [{ name: 'Complete', next: 'completed' }] },
          'completed': { transitions: [] }
        },
        [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'completed', position: { x: 300, y: 100 } }
        ],
        [
          { id: 'pending-to-completed' }
        ]
      );

      historyService.addEntry('test-workflow', initialWorkflow, 'Initial workflow');

      // Step 2: Delete a state (simulating user action)
      const workflowWithDeletedState = createMockWorkflow(
        {
          'pending': { transitions: [] } // Transition removed due to deleted target
        },
        [
          { id: 'pending', position: { x: 100, y: 100 } }
          // 'completed' state removed
        ],
        [
          // Transition removed due to deleted target state
        ]
      );

      historyService.addEntry('test-workflow', workflowWithDeletedState, 'Deleted completed state');

      // Step 3: Undo all the way back to initial state
      const undoResult = historyService.undo('test-workflow');
      expect(undoResult).not.toBeNull();
      expect(undoResult!.layout.transitions).toHaveLength(1);
      expect(undoResult!.configuration.states['pending'].transitions).toHaveLength(1);

      // Step 4: Simulate repositioning the recovered state (this triggers the bug)
      // When a state is repositioned, the workflow gets updated with new positions
      const repositionedWorkflow = createMockWorkflow(
        undoResult!.configuration.states, // Keep same configuration
        [
          { id: 'pending', position: { x: 150, y: 100 } }, // Moved position
          { id: 'completed', position: { x: 300, y: 100 } }
        ],
        undoResult!.layout.transitions // Should keep same transitions
      );

      // The bug: After this update, transitions might vanish due to cleanup logic
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(repositionedWorkflow);

      // This should pass but might fail due to the bug
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('pending-to-completed');
    });

    it('should handle complex state names in transition IDs', async () => {
      // Test the scenario with state names that contain hyphens
      const workflowWithComplexNames = createMockWorkflow(
        {
          'email-sent': { transitions: [{ name: 'Verify', next: 'email-verified' }] },
          'email-verified': { transitions: [] }
        },
        [
          { id: 'email-sent', position: { x: 100, y: 100 } },
          { id: 'email-verified', position: { x: 300, y: 100 } }
        ],
        [
          { id: 'email-sent-to-email-verified' }
        ]
      );

      historyService.addEntry('test-workflow', workflowWithComplexNames, 'Initial complex workflow');

      // Delete and then undo
      const workflowWithDeletedState = createMockWorkflow(
        {
          'email-sent': { transitions: [] }
        },
        [
          { id: 'email-sent', position: { x: 100, y: 100 } }
        ],
        []
      );

      historyService.addEntry('test-workflow', workflowWithDeletedState, 'Deleted email-verified state');

      // Undo to restore
      const undoResult = historyService.undo('test-workflow');
      expect(undoResult).not.toBeNull();

      // Reposition a state
      const repositionedWorkflow = createMockWorkflow(
        undoResult!.configuration.states,
        [
          { id: 'email-sent', position: { x: 150, y: 100 } }, // Moved
          { id: 'email-verified', position: { x: 300, y: 100 } }
        ],
        undoResult!.layout.transitions
      );

      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(repositionedWorkflow);

      // Should preserve the transition despite complex state names
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('email-sent-to-email-verified');
    });
  });

  describe('Improved Transition ID Strategy', () => {
    it('should handle escaped hyphens in state names', async () => {
      // Test the new transition ID strategy with escaped hyphens
      const stateWithHyphens = 'multi-word-state';
      const targetState = 'another-state';
      
      // The new strategy should escape hyphens in state names
      const expectedTransitionId = `multi\\-word\\-state-to-another\\-state`;
      
      // Test the new ID generation function (to be implemented)
      const { generateTransitionId } = await import('../utils/transitionUtils');
      const generatedId = generateTransitionId(stateWithHyphens, targetState);
      
      expect(generatedId).toBe(expectedTransitionId);
    });

    it('should parse escaped transition IDs correctly', async () => {
      // Test parsing the new escaped format
      const transitionId = 'multi\\-word\\-state-to-another\\-state';
      
      const { parseTransitionId } = await import('../utils/transitionUtils');
      const parsed = parseTransitionId(transitionId);
      const { sourceStateId, targetStateId } = parsed!;
      
      expect(sourceStateId).toBe('multi-word-state');
      expect(targetStateId).toBe('another-state');
    });

    it('should handle edge cases in the new ID format', async () => {
      const { generateTransitionId, parseTransitionId } = await import('../utils/transitionUtils');
      
      // Test with states that have no hyphens
      const simpleId = generateTransitionId('state1', 'state2');
      expect(simpleId).toBe('state1-to-state2');
      
      const { sourceStateId, targetStateId } = parseTransitionId(simpleId);
      expect(sourceStateId).toBe('state1');
      expect(targetStateId).toBe('state2');
      
      // Test with states that have multiple consecutive hyphens
      const complexId = generateTransitionId('state--with--double', 'target');
      const parsed = parseTransitionId(complexId);
      expect(parsed.sourceStateId).toBe('state--with--double');
      expect(parsed.targetStateId).toBe('target');
    });
  });

  describe('Workflow Update Integration', () => {
    it('should preserve transitions during workflow updates with new ID strategy', async () => {
      // This test ensures that the new transition ID strategy works with the cleanup function
      const workflowWithEscapedIds = createMockWorkflow(
        {
          'email-sent': { transitions: [{ name: 'Verify', next: 'email-verified' }] },
          'email-verified': { transitions: [] }
        },
        [
          { id: 'email-sent', position: { x: 100, y: 100 } },
          { id: 'email-verified', position: { x: 300, y: 100 } }
        ],
        [
          { id: 'email\\-sent-to-email\\-verified' } // New escaped format
        ]
      );

      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(workflowWithEscapedIds);

      // Should handle the new format correctly
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('email\\-sent-to-email\\-verified');
    });
  });

  describe('Real User Scenario Bug', () => {
    it('should preserve transitions after undo all + reposition with actual workflow update flow', async () => {
      // This test simulates the exact user scenario described:
      // 1. Start with workflow with transitions
      // 2. Make changes (delete states, etc.)
      // 3. Undo all the way back
      // 4. Reposition a recovered state
      // 5. Transitions should still be there

      // Step 1: Initial workflow with transitions
      const initialWorkflow = createMockWorkflow(
        {
          'pending': { transitions: [{ name: 'Complete', next: 'completed' }] },
          'completed': { transitions: [] }
        },
        [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'completed', position: { x: 300, y: 100 } }
        ],
        [
          { id: 'pending-to-completed' }
        ]
      );

      // Add to history
      historyService.addEntry('test-workflow', initialWorkflow, 'Initial workflow');

      // Step 2: User deletes the completed state
      const workflowAfterDeletion = createMockWorkflow(
        {
          'pending': { transitions: [] } // Transition removed due to deleted target
        },
        [
          { id: 'pending', position: { x: 100, y: 100 } }
        ],
        [] // No transitions
      );

      historyService.addEntry('test-workflow', workflowAfterDeletion, 'Deleted completed state');

      // Step 3: User undoes all the way back
      const undoResult = historyService.undo('test-workflow');
      expect(undoResult).not.toBeNull();
      expect(undoResult!.layout.transitions).toHaveLength(1);

      // Step 4: User repositions the recovered state (this triggers workflow update)
      // This is where the bug happens - the workflow update process might lose transitions
      const repositionedWorkflow = {
        ...undoResult!,
        layout: {
          ...undoResult!.layout,
          states: [
            { id: 'pending', position: { x: 150, y: 100 } }, // Moved position
            { id: 'completed', position: { x: 300, y: 100 } }
          ]
        }
      };

      // This simulates what happens when the workflow is updated after repositioning
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(repositionedWorkflow);

      // The bug: transitions disappear after this cleanup
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('pending-to-completed');
      expect(cleanedWorkflow.configuration.states['pending'].transitions).toHaveLength(1);
    });

    it('should handle the workflow update process correctly with history service integration', async () => {
      // This test simulates the complete flow including history service
      const initialWorkflow = createMockWorkflow(
        {
          'email-sent': { transitions: [{ name: 'Verify', next: 'email-verified' }] },
          'email-verified': { transitions: [] }
        },
        [
          { id: 'email-sent', position: { x: 100, y: 100 } },
          { id: 'email-verified', position: { x: 300, y: 100 } }
        ],
        [
          { id: 'email-sent-to-email-verified' }
        ]
      );

      // Simulate the complete workflow: add -> modify -> undo -> reposition
      historyService.addEntry('test-workflow', initialWorkflow, 'Initial');

      // Delete a state
      const modifiedWorkflow = createMockWorkflow(
        {
          'email-sent': { transitions: [] }
        },
        [
          { id: 'email-sent', position: { x: 100, y: 100 } }
        ],
        []
      );

      historyService.addEntry('test-workflow', modifiedWorkflow, 'Deleted email-verified');

      // Undo
      const undoResult = historyService.undo('test-workflow');
      expect(undoResult).not.toBeNull();

      // Reposition (this should preserve transitions)
      const repositioned = {
        ...undoResult!,
        layout: {
          ...undoResult!.layout,
          states: undoResult!.layout.states.map(state =>
            state.id === 'email-sent'
              ? { ...state, position: { x: 150, y: 100 } }
              : state
          )
        }
      };

      // Add the repositioned workflow to history (simulating what the app does)
      historyService.addEntry('test-workflow', repositioned, 'Repositioned email-sent');

      // Verify transitions are preserved
      expect(repositioned.layout.transitions).toHaveLength(1);
      expect(repositioned.configuration.states['email-sent'].transitions).toHaveLength(1);
    });

    it('should reproduce the exact bug: transitions vanish after undo all + reposition', async () => {
      // This test simulates the EXACT user workflow that causes the bug

      // Step 1: Start with a workflow that has transitions
      const originalWorkflow = createMockWorkflow(
        {
          'pending': { transitions: [{ name: 'Complete', next: 'completed' }] },
          'completed': { transitions: [] }
        },
        [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'completed', position: { x: 300, y: 100 } }
        ],
        [
          { id: 'pending-to-completed' }
        ]
      );

      // Step 2: Add to history (this is the initial state)
      historyService.addEntry('test-workflow', originalWorkflow, 'Initial workflow with transition');

      // Step 3: User makes some changes (e.g., deletes a state)
      const modifiedWorkflow = createMockWorkflow(
        {
          'pending': { transitions: [] } // Transition removed due to deleted target
        },
        [
          { id: 'pending', position: { x: 100, y: 100 } }
        ],
        [] // No transitions
      );

      historyService.addEntry('test-workflow', modifiedWorkflow, 'Deleted completed state');

      // Step 4: User undoes all the way back to original state
      const undoResult = historyService.undo('test-workflow');
      expect(undoResult).not.toBeNull();
      expect(undoResult!.layout.transitions).toHaveLength(1);
      expect(undoResult!.configuration.states['pending'].transitions).toHaveLength(1);

      // Step 5: User repositions a state (this is where the bug happens)
      // Simulate the onNodeDragStop workflow update process
      const repositionedWorkflow = {
        ...undoResult!,
        layout: {
          ...undoResult!.layout,
          states: undoResult!.layout.states.map(state =>
            state.id === 'pending'
              ? { ...state, position: { x: 150, y: 100 } } // Moved position
              : state
          ),
          transitions: undoResult!.layout.transitions, // This should be preserved
          updatedAt: new Date().toISOString()
        }
      };

      // Step 6: The workflow goes through cleanup (this is where transitions might be lost)
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(repositionedWorkflow);

      // Step 7: Verify transitions are still there (this is where the bug manifests)
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('pending-to-completed');
      expect(cleanedWorkflow.configuration.states['pending'].transitions).toHaveLength(1);
      expect(cleanedWorkflow.configuration.states['pending'].transitions[0].name).toBe('Complete');
    });
  });
});
